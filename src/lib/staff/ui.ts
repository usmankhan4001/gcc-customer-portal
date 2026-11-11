import { STAGE_LABEL, type AnyStage } from './stages';

/** Badge class for a company stage, using the badge classes the admin already has. */
export function stageBadgeClass(stage: string): string {
  if (stage === 'documents_delivered') return 'badge badge-success';
  if (stage === 'cancelled' || stage === 'refunded') return 'badge badge-danger';
  if (stage === 'order_confirmed') return 'badge badge-neutral';
  return 'badge badge-info';
}

export const stageLabel = (stage: string) => STAGE_LABEL[stage as AnyStage] ?? stage;

export const BANK_LABEL: Record<string, string> = {
  prepared: 'Prepared',
  submitted_to_provider: 'Submitted to provider',
  provider_kyc_required: 'Provider KYC required',
  approved: 'Approved',
  access_handed_over: 'Access handed over',
  rejected: 'Rejected',
};

export const WAITING_LABEL: Record<string, string> = { client: 'Client', us: 'Us', provider: 'Provider', registry: 'Registry' };

export const TIER_LABEL: Record<string, string> = {
  tier_1_self: 'Self as UBO',
  tier_2_nominee: 'Nominee',
  tier_3_shelf: 'Shelf company',
};

export function formatDate(d: Date | string | null | undefined): string {
  if (!d) return '–';
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' });
}

export function formatDateTime(d: Date | string | null | undefined): string {
  if (!d) return '–';
  return new Date(d).toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'UTC',
  }) + ' UTC';
}

/** "3 days" style age, for "waiting for" columns. */
export function ageDays(d: Date | string | null | undefined): string {
  if (!d) return '–';
  const days = Math.floor((Date.now() - new Date(d).getTime()) / 86_400_000);
  return days <= 0 ? 'today' : days === 1 ? '1 day' : `${days} days`;
}
