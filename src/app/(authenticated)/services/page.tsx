import Link from 'next/link';
import BannerHeader from '@/components/portal/BannerHeader';
import CountryFlag from '@/components/ui/CountryFlag';
import { JURISDICTIONS } from '@/lib/jurisdictions';

export default function ServicesCatalog() {
  return (
    <div className="wrap admin-page pb-24">
      <BannerHeader title="Company registration" subtitle="Choose a jurisdiction to see what is included and start your incorporation." />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 'var(--space-4)' }}>
        {JURISDICTIONS.map((j) => (
          <Link
            key={j.id}
            href={`/services/${j.id}`}
            className="card"
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 'var(--space-3)',
              padding: 'var(--space-5) var(--space-4)',
              textAlign: 'center',
              textDecoration: 'none',
              color: 'var(--text-primary)',
              minHeight: 44,
            }}
          >
            <CountryFlag country={j.flagCode} size="md" />
            <span style={{ fontWeight: 700, fontSize: 15, lineHeight: 1.3 }}>{j.name}</span>
            <span style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>From {j.price}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
