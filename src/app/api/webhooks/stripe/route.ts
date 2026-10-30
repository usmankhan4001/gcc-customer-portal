import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { and, eq, ne } from 'drizzle-orm';
import { db } from '@/lib/db';
import { companies, notifications, orders, users } from '@/lib/db/schema';
import { sendWhatsAppMessage } from '@/lib/whatsapp';
import { sendPushToUser } from '@/lib/push';
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

  // Never move a case backwards: only a company still at 'lead' becomes 'onboarding'.
  await db
    .update(companies)
    .set({ status: 'onboarding', updated_at: new Date() })
    .where(and(eq(companies.id, companyId), eq(companies.status, 'lead')));

  const [company] = await db.select().from(companies).where(eq(companies.id, companyId)).limit(1);
  if (!company) {
    console.error(`[webhooks/stripe] company ${companyId} not found for order ${orderId}`);
    return;
  }

  const [user] = await db.select().from(users).where(eq(users.id, company.user_id)).limit(1);
  if (!user) return;

  await sendWhatsAppMessage(user.whatsapp_number, 'order_confirmed', 'en', [
    { type: 'text', text: user.full_name || 'there' },
    { type: 'text', text: company.company_name },
  ]);

  const notifTitle = 'Payment Confirmed';
  const notifMessage = `Your payment for ${company.company_name} is confirmed. We're now processing your incorporation.`;

  await db.insert(notifications).values({
    user_id: user.id,
    title: notifTitle,
    message: notifMessage,
    type: 'success',
    category: 'payment',
    link_url: '/dashboard',
    whatsapp_status: 'sent',
  });

  await sendPushToUser(user.id, { title: notifTitle, body: notifMessage, url: '/dashboard' });

  captureServerEvent(user.id, 'checkout_completed', {
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
