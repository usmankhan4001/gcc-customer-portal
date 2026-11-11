import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { and, eq, ne } from 'drizzle-orm';
import { db } from '@/lib/db';
import { companies, orders } from '@/lib/db/schema';
import { sendPushToUser } from '@/lib/push';
import { recordAudit, SYSTEM_ACTOR } from '@/lib/staff/audit';
import { pickAssignee } from '@/lib/orders/assign';
import { stageMessage } from '@/lib/notify/events';
import { deliverClientMessage, queueClientMessage } from '@/lib/notify/send';
import { captureServerEvent } from '@/lib/posthog-server';
import { claimWebhookEvent, releaseWebhookEvent } from '@/lib/webhook-dedupe';

let _stripe: Stripe | null = null;
function getStripe(): Stripe {
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2026-08-26.dahlia',
    });
  }
  return _stripe;
}

function getWebhookSecret(): string {
  return process.env.STRIPE_WEBHOOK_SECRET!;
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session): Promise<void> {
  const orderId = session.metadata?.order_id;
  const companyId = session.metadata?.company_id;

  if (!orderId || !companyId) {
    console.error('[webhooks/stripe] Missing order_id or company_id in session metadata');
    return;
  }

  // Only the first transition to "paid" returns a row; a repeat for a paid order does nothing.
  const [order] = await db
    .update(orders)
    .set({
      payment_status: 'paid',
      stripe_session_id: session.id,
      stripe_payment_intent_id:
        typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id,
      paid_at: new Date(),
    })
    .where(and(eq(orders.id, orderId), ne(orders.payment_status, 'paid')))
    .returning();

  if (!order) {
    console.log(`[webhooks/stripe] Order ${orderId} already paid or not found - no side effects`);
    return;
  }

  // Payment makes the application: only a company still at 'lead' (unpaid) moves on, so this can never move a case
  // backwards. It starts at Order confirmed and goes to the Incorporation VA with the least open work.
  const now = new Date();
  const assignee = await pickAssignee();
  const [company] = await db
    .update(companies)
    .set({
      status: 'onboarding',
      stage: 'order_confirmed',
      stage_changed_at: now,
      updated_at: now,
      ...(assignee ? { assigned_to: assignee } : {}),
    })
    .where(and(eq(companies.id, companyId), eq(companies.status, 'lead')))
    .returning();
  if (!company) {
    console.log(`[webhooks/stripe] Company ${companyId} already past lead - nothing to start`);
    return;
  }

  await recordAudit(db, SYSTEM_ACTOR, {
    action: 'order.paid',
    entityType: 'order',
    entityId: orderId,
    companyId,
    details: { amount: order.amount_total, currency: order.currency, assignedTo: assignee },
  });
  await recordAudit(db, SYSTEM_ACTOR, {
    action: 'stage.changed',
    entityType: 'company',
    entityId: companyId,
    companyId,
    details: { to: 'order_confirmed', via: 'payment' },
  });

  // The client is told once: the key is the same if Stripe retries, so a repeat inserts nothing.
  const message = stageMessage('order_confirmed', { id: company.id, name: company.company_name }, now);
  const delivery = message ? await queueClientMessage(db, company.user_id, message) : null;
  if (delivery) {
    await deliverClientMessage(delivery);
    await sendPushToUser(company.user_id, { title: delivery.message.title, body: delivery.message.message, url: '/dashboard' }).catch(() => undefined);
  }

  captureServerEvent(company.user_id, 'checkout_completed', {
    company_id: company.id,
    jurisdiction: company.jurisdiction,
    amount_usd: order.amount_total / 100,
  });

  console.log(`[webhooks/stripe] Order ${orderId} processed successfully`);
}

// Abandoned or failed checkouts: mark the still-unpaid order; never touch a paid one.
async function handleCheckoutFailed(session: Stripe.Checkout.Session): Promise<void> {
  const orderId = session.metadata?.order_id;
  if (!orderId) return;
  await db
    .update(orders)
    .set({ payment_status: 'failed' })
    .where(and(eq(orders.id, orderId), ne(orders.payment_status, 'paid')));
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.text();
    const signature = request.headers.get('Stripe-Signature');

    if (!signature) {
      return NextResponse.json({ error: 'Missing Stripe-Signature header' }, { status: 400 });
    }

    let event: Stripe.Event;
    try {
      event = getStripe().webhooks.constructEvent(body, signature, getWebhookSecret());
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Webhook verification failed';
      console.error('[webhooks/stripe] Signature verification failed:', message);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    // Stripe retries and duplicates: process each event id once.
    if (!(await claimWebhookEvent('stripe', event.id))) {
      return NextResponse.json({ received: true, duplicate: true }, { status: 200 });
    }

    try {
      if (event.type === 'checkout.session.completed') {
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
      } else if (event.type === 'checkout.session.expired' || event.type === 'checkout.session.async_payment_failed') {
        await handleCheckoutFailed(event.data.object as Stripe.Checkout.Session);
      }
    } catch (error) {
      // Let Stripe's retry through: the claim must not make it look like a duplicate.
      await releaseWebhookEvent('stripe', event.id);
      throw error;
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error('[webhooks/stripe] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
