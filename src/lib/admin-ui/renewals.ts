export type RenewalStatus = 'Upcoming' | 'Overdue';

export interface Renewal {
  id: number;
  company: string;
  expiryDate: string;
  status: RenewalStatus;
  amount: number;
  plan: string;
}

export const mockRenewals: Renewal[] = [
  { id: 1, company: 'Tech Innovators LLC', expiryDate: '2026-09-15', status: 'Upcoming', amount: 5000, plan: 'Enterprise' },
  { id: 2, company: 'Global Traders Inc.', expiryDate: '2026-08-25', status: 'Overdue', amount: 2500, plan: 'Pro' },
  { id: 3, company: 'NextGen Solutions', expiryDate: '2026-09-28', status: 'Upcoming', amount: 1500, plan: 'Basic' },
  { id: 4, company: 'Alpha Group', expiryDate: '2026-08-10', status: 'Overdue', amount: 8000, plan: 'Enterprise' },
];

// The page's headline figures are still static sample data, unchanged from before the restyle.
export const SUMMARY_FIGURES = { upcoming: '12', overdue: '3', revenue: '$45,000' };

export function renewalBadgeClass(status: string): string {
  return status === 'Upcoming' ? 'badge badge-info' : 'badge badge-danger';
}

export function formatAmount(amount: number): string {
  return `$${amount.toLocaleString()}`;
}

export function summarizeRenewals(rows: Renewal[]) {
  return {
    upcoming: rows.filter((r) => r.status === 'Upcoming').length,
    overdue: rows.filter((r) => r.status === 'Overdue').length,
    revenue: rows.reduce((sum, r) => sum + r.amount, 0),
  };
}
