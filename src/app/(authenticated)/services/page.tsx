import Link from 'next/link';
import BannerHeader from '@/components/portal/BannerHeader';
import ServiceTile from '@/components/portal/ServiceTile';

const jurisdictions = [
  {
    id: 'uae',
    name: 'United Arab Emirates',
    flagUrl: 'https://flagcdn.com/ae.svg',
    price: '$1,500',
    tax: '9% / 0% Foreign',
    timeline: '~30 days',
    popular: true,
  },
  {
    id: 'bahrain',
    name: 'Bahrain',
    flagUrl: 'https://flagcdn.com/bh.svg',
    price: '$1,500',
    tax: '0% Corporate',
    timeline: '~30 days',
    popular: false,
  },
  {
    id: 'hong-kong',
    name: 'Hong Kong',
    flagUrl: 'https://flagcdn.com/hk.svg',
    price: '$2,000',
    tax: '0% on Foreign',
    timeline: '17–18 days',
    popular: false,
  },
  {
    id: 'singapore',
    name: 'Singapore',
    flagUrl: 'https://flagcdn.com/sg.svg',
    price: '$2,000',
    tax: '5% Corporate',
    timeline: '17–18 days',
    popular: false,
  },
  {
    id: 'ireland',
    name: 'Ireland',
    flagUrl: 'https://flagcdn.com/ie.svg',
    price: '$1,500',
    tax: '12.5% Corporate',
    timeline: '2–3 days',
    popular: false,
  },
  {
    id: 'bvi',
    name: 'BVI & Cayman',
    flagUrl: 'https://flagcdn.com/ky.svg',
    price: 'Custom quote',
    tax: '0% Corporate',
    timeline: 'Varies',
    popular: false,
  },
];

export default function ServicesCatalog() {
  return (
    <div className="pb-24">
      <BannerHeader title="COMPANY REGISTRATION" />

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 p-4">
        {jurisdictions.map((j) => (
          <ServiceTile
            key={j.id}
            title={j.name}
            icon={<img src={j.flagUrl} alt={`${j.name} flag`} className="w-8 h-8 rounded-full object-cover" />}
            href={`/services/${j.id}`}
          />
        ))}
      </div>
    </div>
  );
}
