import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { query, queryOne } from '@/lib/db';
import { sendWhatsAppMessage } from '@/lib/whatsapp';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface OrderUpdate {
  order_id: string;
  company_id: string;
  status: string;
  customer_email: string;
  customer_phone?: string;
  amount_total: number;
  currency: string;
}

// ---------------------------------------------------------------------------
// Stripe client
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function dispatchWhatsAppWelcome(
  phoneNumber: string,
  companyName: string,
  magicToken: string
): Promise<string | null> {
  const portalUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/verify?token=${magicToken}`;

  try {
    const result = await sendWhatsAppMessage(phoneNumber, 'payment_received_onboarding', 'en', [
      { type: 'text', text: companyName },
      { type: 'text', text: portalUrl },
    ]);
    return result.messageId ?? null;
  } catch (error) {
    console.error('[webhooks/stripe] WhatsApp welcome dispatch failed:', error);
    return null;
  }
}

// ---------------------------------------------------------------------------
// POST /api/webhooks/stripe
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.text();
    const signature = request.headers.get('Stripe-Signature');

    if (!signature) {
      return NextResponse.json({ error: 'Missing Stripe-Signature header' }, { status: 400 });
    }

    // 1. Verify webhook signature
    let event: Stripe.Event;
    try {
      event = getStripe().webhooks.constructEvent(body, signature, getWebhookSecret());
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Webhook verification failed';
      console.error('[webhooks/stripe] Signature verification failed:', message);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    // 2. Handle checkout.session.completed
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;

      const orderId = session.metadata?.order_id;
      const companyId = session.metadata?.company_id;

      if (!orderId || !companyId) {
        console.error('[webhooks/stripe] Missing order_id or company_id in session metadata');
        return NextResponse.json({ received: true });
      }

      const orderUpdate: OrderUpdate = {
        order_id: orderId,
        company_id: companyId,
        status: 'paid',
        customer_email: session.customer_details?.email ?? '',
        customer_phone: session.customer_details?.phone ?? undefined,
        amount_total: session.amount_total ?? 0,
        currency: session.currency ?? 'usd',
      };

      // 3. Update order status to 'paid'
      await query(
        `UPDATE orders SET payment_status = 'paid', stripe_session_id = $1, paid_at = NOW() WHERE id = $2`,
        [session.id, orderId]
      );

      // 4. Transition company status from 'lead' to 'onboarding'
      await query(
        `UPDATE companies SET status = 'onboarding', updated_at = NOW() WHERE id = $1`,
        [companyId]
      );

      // 5. Generate magic login token and store on user
      const magicToken = crypto.randomUUID();
      const tokenExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

      await query(
        `UPDATE users SET magic_token = $1, magic_token_expires_at = $2
         WHERE id = (SELECT user_id FROM companies WHERE id = $3)`,
        [magicToken, tokenExpiry.toISOString(), companyId]
      );

      // 6. Dispatch WhatsApp welcome message
      if (orderUpdate.customer_phone) {
        const company = await queryOne<{ company_name: string }>(
          `SELECT company_name FROM companies WHERE id = $1`,
          [companyId]
        );
        const companyName = company?.company_name ?? 'Your Company';
        await dispatchWhatsAppWelcome(orderUpdate.customer_phone, companyName, magicToken);
      }

      console.log(`[webhooks/stripe] Order ${orderId} processed successfully`);
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error('[webhooks/stripe] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
