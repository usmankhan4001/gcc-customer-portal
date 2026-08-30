import BannerHeader from '@/components/portal/BannerHeader';
import ServiceTile from '@/components/portal/ServiceTile';
import CountryFlag from '@/components/ui/CountryFlag';
import { JURISDICTIONS } from '@/lib/jurisdictions';

export default function ServicesCatalog() {
  return (
    <div className="pb-24">
      <BannerHeader title="COMPANY REGISTRATION" />

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 p-4">
        {JURISDICTIONS.map((j) => (
          <ServiceTile
            key={j.id}
            title={j.name}
            icon={<CountryFlag country={j.flagCode} size="md" />}
            href={`/services/${j.id}`}
          />
        ))}
      </div>
    </div>
  );
}
