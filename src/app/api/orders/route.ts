import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { and, eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { companies, orders, quotes, users } from '@/lib/db/schema';
import { verifyToken } from '@/lib/auth';
import { createCheckoutSession } from '@/lib/stripe';
import { captureServerEvent } from '@/lib/posthog-server';
import { loadCatalog } from '@/lib/catalog/load';
import { priceQuote, type Selection } from '@/lib/catalog/quote';
import { parseOrderDetails, TERMS_VERSION } from '@/lib/catalog/order';
import { recordAudit } from '@/lib/staff/audit';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * POST /api/orders  { quoteId, expectedTotalCents, companyNames[], businessActivity, inRestrictedIndustry, acceptedTerms }
 * Turns a quote into an unpaid order and a Stripe checkout. The price is worked out again from the catalog here,
 * so what the browser sends is never trusted. Calling it again for the same quote reuses the same order.
 */
export async function POST(request: NextRequest) {
  const token = (await cookies()).get('gcc_session')?.value;
  const session = token ? await verifyToken(token) : null;
  if (!session) return NextResponse.json({ error: 'Please sign in to continue.' }, { status: 401 });

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
  const quoteId = typeof body.quoteId === 'string' ? body.quoteId : '';
  if (!UUID.test(quoteId)) return NextResponse.json({ error: 'That quote was not found. Please choose your package again.' }, { status: 404 });

  const parsed = parseOrderDetails(body);
  if (!parsed.ok) return NextResponse.json({ error: parsed.message }, { status: 400 });
  const { details } = parsed;

  const [quote] = await db.select().from(quotes).where(eq(quotes.id, quoteId)).limit(1);
  if (!quote || quote.expires_at < new Date() || (quote.user_id && quote.user_id !== session.userId)) {
    return NextResponse.json({ error: 'That quote has expired. Please choose your package again.' }, { status: 404 });
  }

  const [user] = await db.select().from(users).where(eq(users.id, session.userId)).limit(1);
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  // A restricted industry stops the order here and goes to staff; nothing is charged or created.
  if (details.inRestrictedIndustry) {
    await recordAudit(
      db,
      { userId: user.id, name: user.full_name, role: 'client' },
      { action: 'order.restricted_industry', entityType: 'order', entityId: quote.id, details: { jurisdiction: quote.jurisdiction, activity: details.businessActivity } },
    );
    return NextResponse.json(
      { error: 'Your business type needs a manual review first. Our team will contact you. You have not been charged.', restricted: true },
      { status: 409 },
    );
  }

  const catalog = await loadCatalog(quote.jurisdiction);
  const priced = priceQuote(
    { jurisdiction: quote.jurisdiction, packageKey: quote.package_key, addons: quote.addons as Selection['addons'] },
    catalog.packages,
    catalog.addons,
  );
  if (!priced.ok) return NextResponse.json({ error: priced.message }, { status: 422 });
  if (typeof body.expectedTotalCents === 'number' && body.expectedTotalCents !== priced.totalCents) {
    return NextResponse.json({ error: 'The price has changed since you chose. Please check the new total.', totalCents: priced.totalCents, changed: true }, { status: 409 });
  }

  const pkg = catalog.packages.find((p) => p.key === quote.package_key)!;
  const lineItems = {
    lines: priced.lines,
    details: { ...details, acceptedAt: new Date().toISOString(), termsVersion: TERMS_VERSION },
  };

  // Same quote, same order: a second attempt after a cancelled payment reuses the first company and order.
  const existing = quote.order_id ? (await db.select().from(orders).where(eq(orders.id, quote.order_id)).limit(1))[0] : undefined;
  if (existing?.payment_status === 'paid') return NextResponse.json({ error: 'This order has already been paid.' }, { status: 409 });

  const { order, company } = await db.transaction(async (tx) => {
    if (existing) {
      const [c] = await tx.update(companies).set({ company_name: details.companyNames[0], updated_at: new Date() }).where(eq(companies.id, existing.company_id)).returning();
      const [o] = await tx
        .update(orders)
        .set({ amount_total: priced.totalCents, currency: priced.currency, line_items: lineItems, payment_status: 'unpaid' })
        .where(eq(orders.id, existing.id))
        .returning();
      return { order: o, company: c };
    }
    const [c] = await tx
      .insert(companies)
      .values({ user_id: user.id, company_name: details.companyNames[0], jurisdiction: quote.jurisdiction as typeof companies.$inferInsert.jurisdiction, tier: pkg.tier, package_key: pkg.key, status: 'lead' })
      .returning();
    const [o] = await tx
      .insert(orders)
      .values({ user_id: user.id, company_id: c.id, order_type: 'new_formation', amount_total: priced.totalCents, currency: priced.currency, payment_status: 'unpaid', line_items: lineItems })
      .returning();
    await tx.update(quotes).set({ user_id: user.id, order_id: o.id }).where(and(eq(quotes.id, quote.id)));
    return { order: o, company: c };
  });

  const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3005';
  const stripeSession = await createCheckoutSession({
    orderId: order.id,
    companyId: company.id,
    amount: priced.totalCents,
    currency: priced.currency,
    customerEmail: user.email || '',
    companyName: company.company_name,
    lines: priced.lines.map((l) => ({ name: l.option ? `${l.name} (${l.option})` : l.name, unitAmount: l.unitCents, quantity: l.quantity })),
    successUrl: `${origin}/dashboard?success=true`,
    cancelUrl: `${origin}/start/${quote.jurisdiction}/order?quote=${quote.id}`,
  });
  await db.update(orders).set({ stripe_session_id: stripeSession.id }).where(eq(orders.id, order.id));

  captureServerEvent(user.id, 'checkout_started', { jurisdiction: quote.jurisdiction, package: quote.package_key, amount: priced.totalCents / 100 });
  return NextResponse.json({ url: stripeSession.url });
}
