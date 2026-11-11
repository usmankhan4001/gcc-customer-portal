import { notFound, redirect } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { quotes } from '@/lib/db/schema';
import { getServerSession } from '@/lib/session';
import { formatMoney } from '@/lib/catalog/quote';
import { loadCatalog } from '@/lib/catalog/load';
import { priceQuote, type Selection } from '@/lib/catalog/quote';
import { JURISDICTIONS } from '@/lib/jurisdictions';
import { OrderForm } from '@/components/start/OrderForm';

export const dynamic = 'force-dynamic';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Step after sign-in: company names, what it will do, the restricted-industries question, terms, then payment. */
export default async function OrderPage({
  params,
  searchParams,
}: {
  params: Promise<{ jurisdiction: string }>;
  searchParams: Promise<{ quote?: string }>;
}) {
  const { jurisdiction } = await params;
  const quoteId = (await searchParams).quote;
  const info = JURISDICTIONS.find((j) => j.id === jurisdiction);
  if (!info) notFound();
  const session = await getServerSession();
  if (!session) redirect(`/auth?redirect=${encodeURIComponent(`/start/${jurisdiction}/order?quote=${quoteId ?? ''}`)}`);
  if (!quoteId || !UUID.test(quoteId)) redirect(`/start/${jurisdiction}`);

  const [quote] = await db.select().from(quotes).where(eq(quotes.id, quoteId)).limit(1);
  if (!quote || quote.jurisdiction !== jurisdiction || quote.expires_at < new Date() || (quote.user_id && quote.user_id !== session.userId)) {
    redirect(`/start/${jurisdiction}`);
  }

  // Show today's price from the catalog, not the number saved in the quote.
  const catalog = await loadCatalog(jurisdiction);
  const priced = priceQuote({ jurisdiction, packageKey: quote.package_key, addons: quote.addons as Selection['addons'] }, catalog.packages, catalog.addons);
  if (!priced.ok) redirect(`/start/${jurisdiction}`);

  const termsUrl = process.env.NEXT_PUBLIC_TERMS_URL || 'https://gccstartup.com/terms';

  return (
    <main id="main-content" className="wrap" style={{ maxWidth: 720, padding: '32px 16px 96px' }}>
      <p style={{ color: 'var(--text-tertiary)', margin: 0 }}>Step 2 of 2</p>
      <h1 style={{ margin: '4px 0 16px' }}>Your {info.name} company details</h1>
      <OrderForm
        quoteId={quote.id}
        jurisdiction={jurisdiction}
        termsUrl={termsUrl}
        currency={priced.currency}
        total={{ cents: priced.totalCents, label: formatMoney(priced.totalCents, priced.currency) }}
        lines={priced.lines.map((l) => ({ key: l.key, label: `${l.name}${l.quantity > 1 ? ` × ${l.quantity}` : ''}${l.option ? ` (${l.option})` : ''}`, amount: formatMoney(l.totalCents, priced.currency) }))}
      />
    </main>
  );
}
