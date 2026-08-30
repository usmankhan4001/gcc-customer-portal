import Stripe from 'stripe';

let _stripe: Stripe | null = null;

function getStripe(): Stripe {
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2026-08-26.dahlia',
    });
  }
  return _stripe;
}

export async function createCheckoutSession(params: {
  orderId: string;
  companyId: string;
  amount: number;
  currency: string;
  customerEmail: string;
  companyName: string;
  successUrl: string;
  cancelUrl: string;
}): Promise<Stripe.Checkout.Session> {
  try {
    const session = await getStripe().checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: params.currency,
            product_data: {
              name: `GCC Startup — ${params.companyName}`,
            },
            unit_amount: params.amount,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      customer_email: params.customerEmail,
      success_url: params.successUrl,
      cancel_url: params.cancelUrl,
      // snake_case to match what api/webhooks/stripe/route.ts reads —
      // this was the checkout<->webhook mismatch that silently dropped
      // every completed payment.
      metadata: { order_id: params.orderId, company_id: params.companyId },
    });
    return session;
  } catch (error) {
    console.error('Failed to create checkout session:', error);
    throw error;
  }
}

export function constructWebhookEvent(
  payload: Buffer,
  signature: string
): Stripe.Event {
  try {
    return getStripe().webhooks.constructEvent(
      payload,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (error) {
    console.error('Webhook signature verification failed:', error);
    throw error;
  }
}

export async function getPaymentStatus(
  sessionId: string
): Promise<Stripe.Checkout.Session> {
  try {
    const session = await getStripe().checkout.sessions.retrieve(sessionId);
    return session;
  } catch (error) {
    console.error('Failed to retrieve payment status:', error);
    throw error;
  }
}
