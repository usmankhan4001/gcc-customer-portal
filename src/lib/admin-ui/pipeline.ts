// Pure logic for the admin operations pipeline page (src/app/admin/page.tsx).

export interface PipelineItem {
  id: string;
  company_name: string;
  jurisdiction: string;
  status: string;
  client_name: string | null;
  client_email: string | null;
  client_phone: string | null;
  order: { amount_total: number; payment_status: string } | null;
}

export type Tone = '' | 'badge-accent' | 'badge-info' | 'badge-success' | 'badge-danger';

export const JURISDICTION_CONFIG: Record<string, { label: string; flag: string }> = {
  uae: { label: 'UAE Freezone', flag: '🇦🇪' },
  'hong-kong': { label: 'Hong Kong', flag: '🇭🇰' },
  singapore: { label: 'Singapore', flag: '🇸🇬' },
  bahrain: { label: 'Bahrain', flag: '🇧🇭' },
  ireland: { label: 'Ireland', flag: '🇮🇪' },
  bvi: { label: 'BVI / Cayman', flag: '🇻🇬' },
};

export const TIER_LABELS: Record<string, string> = {
  tier_1_self: 'Self UBO',
  tier_2_nominee: 'Nominee UBO',
  tier_3_shelf: 'Shelf Entity',
};

export const STAGE_ORDER: Record<string, string> = {
  lead: 'official_kyc_pending',
  onboarding: 'official_kyc_pending',
  official_kyc_pending: 'filing_in_progress',
  filing_in_progress: 'bank_opening',
  bank_opening: 'active',
  active: 'active',
};

export const STATUS_SELECT_OPTIONS = [
  { value: 'lead', label: '1. New Lead' },
  { value: 'onboarding', label: '2. Onboarding' },
  { value: 'official_kyc_pending', label: '3. KYC Review' },
  { value: 'filing_in_progress', label: '4. Govt Filing' },
  { value: 'bank_opening', label: '5. Bank Setup' },
  { value: 'active', label: '6. Active & Complete' },
];

export const STAGE_COLUMNS: { key: string; title: string; tone: Tone; statuses: string[] }[] = [
  { key: 'intake', title: '1. New Leads & Intake', tone: 'badge-accent', statuses: ['lead', 'onboarding'] },
  { key: 'kyc', title: '2. KYC Review', tone: 'badge-info', statuses: ['official_kyc_pending'] },
  { key: 'filing', title: '3. Filing & Bank Opening', tone: 'badge-info', statuses: ['filing_in_progress', 'bank_opening'] },
  { key: 'active', title: '4. Active & Complete', tone: 'badge-success', statuses: ['active', 'renewal_due', 'suspended', 'archived'] },
];

export function jurisdictionInfo(jurisdiction: string) {
  return JURISDICTION_CONFIG[jurisdiction] || { label: jurisdiction.toUpperCase(), flag: '🌐' };
}

export function tierLabel(tier: string) {
  return TIER_LABELS[tier] || tier;
}

// Next stage for the Advance button, or null when there is none (unknown status or already final).
export function nextStage(status: string): string | null {
  const next = STAGE_ORDER[status];
  return next && next !== status ? next : null;
}

export function filterItems<T extends PipelineItem>(items: T[], jurisdiction: string, query: string): T[] {
  const q = query.toLowerCase().trim();
  return items.filter((item) => {
    if (jurisdiction !== 'all' && item.jurisdiction !== jurisdiction) return false;
    return (
      !q ||
      item.company_name.toLowerCase().includes(q) ||
      !!item.client_name?.toLowerCase().includes(q) ||
      !!item.client_email?.toLowerCase().includes(q) ||
      !!item.client_phone?.includes(q)
    );
  });
}

// Groups cases into the board columns and counts them; chips and column headers both read this.
export function groupByStage<T extends { status: string }>(items: T[]) {
  return STAGE_COLUMNS.map((col) => {
    const cases = items.filter((i) => col.statuses.includes(i.status));
    return { ...col, items: cases, count: cases.length };
  });
}

export function slaBadge(slaStatus: string, daysInStage: number): { label: string; tone: Tone } {
  if (slaStatus === 'red') return { label: `${daysInStage}d (SLA Overdue)`, tone: 'badge-danger' };
  if (slaStatus === 'yellow') return { label: `${daysInStage}d in stage`, tone: 'badge-accent' };
  return { label: `${daysInStage}d in stage`, tone: '' };
}

export function paymentTone(paymentStatus: string): Tone {
  return paymentStatus === 'paid' ? 'badge-success' : 'badge-accent';
}

// Amounts are stored in cents.
export function formatAmount(cents: number): string {
  return `$${(cents / 100).toLocaleString()}`;
}

export function totalPipelineValue(items: { order: { amount_total: number } | null }[]): number {
  return items.reduce((acc, curr) => acc + (curr.order?.amount_total || 0), 0);
}

export function isTempPhone(phone: string | null): boolean {
  return !phone || phone.startsWith('temp_');
}
