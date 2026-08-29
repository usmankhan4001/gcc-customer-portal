import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

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

async function generateMagicToken(): Promise<string> {
  return crypto.randomUUID();
}

async function dispatchWhatsAppWelcome(
  phoneNumber: string,
  companyName: string,
  magicToken: string
): Promise<string | null> {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID!;
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN!;

  const portalUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/verify?token=${magicToken}`;

  const body = {
    messaging_product: 'whatsapp',
    to: phoneNumber,
    type: 'template',
    template: {
      name: 'payment_received_onboarding',
      language: { code: 'en' },
      components: [
        {
          type: 'body',
          parameters: [
            { type: 'text', text: companyName },
            { type: 'text', text: portalUrl },
          ],
        },
      ],
    },
  };

  // TODO: Uncomment when WhatsApp integration is live
  // const res = await fetch(
  //   `https://graph.facebook.com/v20.0/${phoneNumberId}/messages`,
  //   {
  //     method: 'POST',
  //     headers: {
  //       Authorization: `Bearer ${accessToken}`,
  //       'Content-Type': 'application/json',
  //     },
  //     body: JSON.stringify(body),
  //   }
  // );
  // const data = await res.json();
  // return data.messages?.[0]?.id ?? null;

  console.log('[webhooks/stripe] Mock WhatsApp welcome:', JSON.stringify(body));
  return `wamid.mock.${Date.now()}`;
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
      // TODO: Uncomment when database is connected
      // await query(
      //   `UPDATE orders SET status = 'paid', stripe_session_id = $1, paid_at = NOW() WHERE id = $2`,
      //   [session.id, orderId]
      // );

      console.log(`[webhooks/stripe] Mock DB: order ${orderId} → paid`);

      // 4. Transition company status from 'lead' to 'onboarding'
      // TODO: Uncomment when database is connected
      // await query(
      //   `UPDATE companies SET status = 'onboarding', updated_at = NOW() WHERE id = $1`,
      //   [companyId]
      // );

      console.log(`[webhooks/stripe] Mock DB: company ${companyId} → onboarding`);

      // 5. Generate magic login token
      const magicToken = await generateMagicToken();
      const tokenExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

      // TODO: Uncomment when database is connected
      // await query(
      //   `INSERT INTO magic_tokens (id, user_id, token, expires_at, created_at)
      //    VALUES ($1, (SELECT owner_id FROM companies WHERE id = $2), $3, $4, NOW())`,
      //   [crypto.randomUUID(), companyId, magicToken, tokenExpiry.toISOString()]
      // );

      console.log(`[webhooks/stripe] Mock DB: magic token stored for company ${companyId}`);

      // 6. Dispatch WhatsApp welcome message
      if (orderUpdate.customer_phone) {
        // TODO: Fetch company name from database
        const companyName = 'Your Company'; // Placeholder
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
