export const TIER_LABELS: Record<string, string> = {
  tier_1_self: 'Self UBO (Basic)',
  tier_2_nominee: 'Nominee UBO',
  tier_3_shelf: 'Shelf Company',
};

export function tierLabel(tier: string): string {
  return TIER_LABELS[tier] ?? tier;
}

// 'hong-kong' -> 'hong kong' (CSS capitalizes it, as before)
export function jurisdictionLabel(jurisdiction: string): string {
  return jurisdiction.replace('-', ' ');
}

// Dollar string typed by the admin -> integer cents, or null when it is not a non-negative number.
export function parsePriceToCents(draft: string): number | null {
  const cents = Math.round(parseFloat(draft) * 100);
  return Number.isFinite(cents) && cents >= 0 ? cents : null;
}

export function formatCents(cents: number): string {
  return (cents / 100).toFixed(2);
}

export function bannerBadgeTone(active: boolean): 'badge-success' | 'badge-info' {
  return active ? 'badge-success' : 'badge-info';
}

export function bannerStatusLabel(active: boolean): 'Active' | 'Inactive' {
  return active ? 'Active' : 'Inactive';
}
