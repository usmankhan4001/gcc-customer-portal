import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { quotes } from '@/lib/db/schema';
import { loadCatalog } from '@/lib/catalog/load';
import { priceQuote, type Selection } from '@/lib/catalog/quote';
import { clientIp, rateLimit } from '@/lib/rate-limit';

const QUOTE_DAYS = 14;

/**
 * POST /api/quotes  { jurisdiction, packageKey, addons: [{ key, quantity?, option? }] }
 * No account needed. The price is worked out here from the catalog; whatever the browser thinks it costs is ignored.
 */
export async function POST(request: NextRequest) {
  if (!rateLimit(`quote:${clientIp(request)}`, 30, 10 * 60 * 1000)) {
    return NextResponse.json({ error: 'Too many requests. Try again in a few minutes.' }, { status: 429 });
  }

  let body: Partial<Selection>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
  if (typeof body.jurisdiction !== 'string' || typeof body.packageKey !== 'string' || !Array.isArray(body.addons) || body.addons.length > 20) {
    return NextResponse.json({ error: 'Choose a package first.' }, { status: 400 });
  }
  const addons = body.addons
    .filter((a) => a && typeof a.key === 'string')
    .map((a) => ({ key: a.key, quantity: typeof a.quantity === 'number' ? a.quantity : 1, ...(typeof a.option === 'string' ? { option: a.option } : {}) }));

  const catalog = await loadCatalog(body.jurisdiction);
  const result = priceQuote({ jurisdiction: body.jurisdiction, packageKey: body.packageKey, addons }, catalog.packages, catalog.addons);
  if (!result.ok) return NextResponse.json({ error: result.message, code: result.code }, { status: 422 });

  const [row] = await db
    .insert(quotes)
    .values({
      jurisdiction: body.jurisdiction,
      package_key: body.packageKey,
      addons,
      total_cents: result.totalCents,
      currency: result.currency,
      expires_at: new Date(Date.now() + QUOTE_DAYS * 24 * 60 * 60 * 1000),
    })
    .returning({ id: quotes.id });

  return NextResponse.json({ id: row.id, lines: result.lines, totalCents: result.totalCents, currency: result.currency });
}
