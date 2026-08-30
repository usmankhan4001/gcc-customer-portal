export type JurisdictionId = 'uae' | 'hong-kong' | 'singapore' | 'bahrain' | 'ireland' | 'bvi';

export interface JurisdictionInfo {
  id: JurisdictionId;
  name: string;
  flagCode: string; // CountryFlag component code
  price: string; // display "starting from" price
  tax: string;
  timeline: string;
  popular?: boolean;
  description: string;
  features: string[];
}

// Single source of truth for jurisdiction catalog + detail content — was
// previously duplicated (and diverging) across services/page.tsx and
// services/[id]/page.tsx, with only uae/hong-kong having real copy.
export const JURISDICTIONS: JurisdictionInfo[] = [
  {
    id: 'uae',
    name: 'United Arab Emirates',
    flagCode: 'uae',
    price: '$1,500',
    tax: '9% / 0% Foreign',
    timeline: '~30 days',
    popular: true,
    description: 'Emirates ID, full tax residency, top-tier local banking, and a cosmopolitan lifestyle base.',
    features: [
      '0% tax on foreign-sourced income',
      'Local credible banking (Emirates NBD, FAB)',
      'Emirates ID & Tax Residency included',
      '100% foreign ownership',
    ],
  },
  {
    id: 'hong-kong',
    name: 'Hong Kong',
    flagCode: 'hong-kong',
    price: '$2,000',
    tax: '0% on Foreign',
    timeline: '17–18 days',
    description: '100% remote. Fintech banking via Airwallex & Wise. The preferred structure for digital income earners.',
    features: [
      '100% fully remote setup',
      '0% tax on all foreign-sourced income',
      'Instant fintech banking (Airwallex)',
      'Highly reputable global jurisdiction',
    ],
  },
  {
    id: 'bahrain',
    name: 'Bahrain',
    flagCode: 'bahrain',
    price: '$1,500',
    tax: '0% Corporate',
    timeline: '~30 days',
    description: 'No corporate income tax, GCC market access, and a straightforward path to a local bank account.',
    features: [
      '0% corporate tax for most activities',
      'GCC-wide market access',
      'Local bank account eligibility',
      '100% foreign ownership in most sectors',
    ],
  },
  {
    id: 'singapore',
    name: 'Singapore',
    flagCode: 'singapore',
    price: '$2,000',
    tax: '5% Corporate',
    timeline: '17–18 days',
    description: 'A top-tier global financial hub with strong banking relationships and a reputation that opens doors.',
    features: [
      'Effective rate as low as 5% on qualifying profit',
      'World-class banking reputation',
      'Fast, fully remote incorporation',
      'Extensive double-tax treaty network',
    ],
  },
  {
    id: 'ireland',
    name: 'Ireland',
    flagCode: 'ireland',
    price: '$1,500',
    tax: '12.5% Corporate',
    timeline: '2–3 days',
    description: 'The fastest setup on our list, an EU-regulated jurisdiction, and a well-known 12.5% headline rate.',
    features: [
      'Fastest incorporation timeline available',
      'Full EU market access',
      '12.5% headline corporate tax rate',
      'Strong double-tax treaty network',
    ],
  },
  {
    id: 'bvi',
    name: 'BVI & Cayman',
    flagCode: 'bvi',
    price: 'Custom quote',
    tax: '0% Corporate',
    timeline: 'Varies',
    description: 'Maximum privacy and asset protection — the classic choice for holding structures and investment vehicles.',
    features: [
      '0% corporate and capital gains tax',
      'Strong asset protection and privacy',
      'No minimum capital requirement',
      'Widely recognized for holding structures',
    ],
  },
];

export function getJurisdiction(id: string): JurisdictionInfo | undefined {
  return JURISDICTIONS.find((j) => j.id === id);
}
