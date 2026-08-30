import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { companies, orders, users } from '@/lib/db/schema';
import { sendWhatsAppMessage } from '@/lib/whatsapp';

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

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;

      const orderId = session.metadata?.order_id;
      const companyId = session.metadata?.company_id;

      if (!orderId || !companyId) {
        console.error('[webhooks/stripe] Missing order_id or company_id in session metadata');
        return NextResponse.json({ received: true });
      }

      const [order] = await db
        .update(orders)
        .set({
          payment_status: 'paid',
          stripe_session_id: session.id,
          stripe_payment_intent_id:
            typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id,
          paid_at: new Date(),
        })
        .where(eq(orders.id, orderId))
        .returning();

      const [company] = await db
        .update(companies)
        .set({ status: 'onboarding', updated_at: new Date() })
        .where(eq(companies.id, companyId))
        .returning();

      if (order && company) {
        const [user] = await db.select().from(users).where(eq(users.id, company.user_id)).limit(1);
        if (user) {
          await sendWhatsAppMessage(user.whatsapp_number, 'order_confirmed', 'en', [
            { type: 'text', text: user.full_name || 'there' },
            { type: 'text', text: company.company_name },
          ]);
        }
      } else {
        console.error(`[webhooks/stripe] order ${orderId} or company ${companyId} not found`);
      }

      console.log(`[webhooks/stripe] Order ${orderId} processed successfully`);
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error('[webhooks/stripe] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
