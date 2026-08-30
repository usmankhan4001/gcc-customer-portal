import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { and, eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { companies, jurisdictionPricing, orders, users } from '@/lib/db/schema';
import { verifyToken } from '@/lib/auth';
import { createCheckoutSession } from '@/lib/stripe';

// UI tier labels ('basic'/'standard') -> canonical schema tier enum.
const TIER_MAP: Record<string, 'tier_1_self' | 'tier_2_nominee'> = {
  basic: 'tier_1_self',
  standard: 'tier_2_nominee',
};

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('gcc_session')?.value;
    const session = sessionToken ? await verifyToken(sessionToken) : null;

    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { tier, companyName, jurisdiction } = await request.json();

    const mappedTier = TIER_MAP[tier];
    if (!mappedTier || !companyName || !jurisdiction) {
      return NextResponse.json({ error: 'Missing or invalid tier, companyName, or jurisdiction' }, { status: 400 });
    }

    const [pricing] = await db
      .select()
      .from(jurisdictionPricing)
      .where(and(eq(jurisdictionPricing.jurisdiction, jurisdiction), eq(jurisdictionPricing.tier, mappedTier)))
      .limit(1);

    if (!pricing) {
      return NextResponse.json(
        { error: `No price configured for ${jurisdiction} / ${mappedTier}. An admin needs to set it at /admin/pricing.` },
        { status: 400 }
      );
    }

    const [user] = await db.select().from(users).where(eq(users.id, session.userId)).limit(1);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const [company] = await db
      .insert(companies)
      .values({
        user_id: user.id,
        company_name: companyName,
        jurisdiction,
        tier: mappedTier,
        status: 'lead',
      })
      .returning();

    const [order] = await db
      .insert(orders)
      .values({
        user_id: user.id,
        company_id: company.id,
        order_type: 'new_formation',
        amount_total: pricing.price_usd,
        currency: 'usd',
        payment_status: 'unpaid',
      })
      .returning();

    const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3005';

    const stripeSession = await createCheckoutSession({
      orderId: order.id,
      companyId: company.id,
      amount: pricing.price_usd,
      currency: 'usd',
      customerEmail: user.email || '',
      companyName,
      successUrl: `${origin}/dashboard?success=true`,
      cancelUrl: `${origin}/checkout/${jurisdiction}`,
    });

    await db
      .update(orders)
      .set({ stripe_session_id: stripeSession.id })
      .where(eq(orders.id, order.id));

    return NextResponse.json({ url: stripeSession.url });
  } catch (error: any) {
    console.error('[api/checkout] Error:', error);
    return NextResponse.json({ error: error.message ?? 'Internal server error' }, { status: 500 });
  }
}
