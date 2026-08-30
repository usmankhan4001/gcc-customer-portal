import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_mock', {
  apiVersion: '2023-10-16' as any,
});

export async function POST(request: Request) {
  try {
    const { tier, companyName, jurisdiction } = await request.json();
    
    const price = tier === 'basic' ? 150000 : 350000; // in cents
    const origin = request.headers.get('origin') || 'http://localhost:3005';
    
    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Company Formation (${tier === 'basic' ? 'Basic' : 'Nominee UBO'})`,
              description: `${companyName || 'New Company'} in ${jurisdiction || 'selected jurisdiction'}`,
            },
            unit_amount: price,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${origin}/dashboard?success=true`,
      cancel_url: `${origin}/checkout/uae`,
    });
    
    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
