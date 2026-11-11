import { notFound } from 'next/navigation';
import { loadPublicCatalog } from '@/lib/catalog/load';
import { JURISDICTIONS } from '@/lib/jurisdictions';
import { StartFlow } from '@/components/start/StartFlow';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ jurisdiction: string }> }) {
  const { jurisdiction } = await params;
  const name = JURISDICTIONS.find((j) => j.id === jurisdiction)?.name;
  return { title: name ? `Start a ${name} company | GCC Startup` : 'Start a company | GCC Startup' };
}

/** Quote-first: the price, timeline and document list are on screen before any account exists. */
export default async function StartPage({ params }: { params: Promise<{ jurisdiction: string }> }) {
  const { jurisdiction } = await params;
  const info = JURISDICTIONS.find((j) => j.id === jurisdiction);
  if (!info) notFound();

  const catalog = await loadPublicCatalog(jurisdiction);

  return (
    <main id="main-content" className="wrap" style={{ maxWidth: 880, padding: '32px 16px 96px' }}>
      <p style={{ color: 'var(--orange-text)', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', fontSize: 13, margin: 0 }}>
        Company registration
      </p>
      <h1 style={{ margin: '4px 0 8px' }}>Start your {info.name} company</h1>
      <p style={{ color: 'var(--text-secondary)', margin: '0 0 24px' }}>
        See the price, the timeline and the documents you need first. You create an account only when you are ready to continue.
      </p>

      {catalog.packages.length === 0 ? (
        <div className="card" role="status" style={{ padding: 24 }}>
          <p style={{ margin: 0 }}>
            Online ordering for {info.name} is not open yet. Message us on WhatsApp or use the contact form and we will take it from there.
          </p>
        </div>
      ) : (
        <StartFlow
          jurisdiction={jurisdiction}
          jurisdictionName={info.name}
          packages={catalog.packages.map((p) => ({
            jurisdiction: p.jurisdiction,
            key: p.key,
            name: p.name,
            summary: p.summary,
            price_cents: p.price_cents,
            currency: p.currency,
            timeline_min_days: p.timeline_min_days,
            timeline_max_days: p.timeline_max_days,
            timeline_note: p.timeline_note,
            recommended: p.recommended,
            active: p.active,
          }))}
          addons={catalog.addons.map((a) => ({
            key: a.key,
            name: a.name,
            summary: a.summary,
            price_cents: a.price_cents,
            currency: a.currency,
            max_quantity: a.max_quantity,
            jurisdictions: a.jurisdictions,
            package_keys: a.package_keys,
            options: a.options,
            active: a.active,
          }))}
          requirements={catalog.requirements.map((r) => ({ key: r.key, label: r.label, help: r.help, required: r.required, package_key: r.package_key, sort: r.sort }))}
        />
      )}
    </main>
  );
}
