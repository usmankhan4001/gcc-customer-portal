export interface Badge {
  label: string;
  className: string;
}

const SOURCE_LABELS: Record<string, string> = {
  tax_calculator: 'Tax Calculator',
  banking_odds: 'Banking Odds',
  nda_generator: 'NDA Generator',
  jurisdiction_quiz: 'Jurisdiction Fit Quiz',
  vat_scorer: 'VAT Scorer',
  ubo_privacy: 'UBO Privacy',
  compliance_calendar: 'Compliance Calendar',
  visa_estimator: 'Visa Estimator',
  name_checker: 'Name Checker',
  qfzp_eligibility: 'QFZP Eligibility',
};

export function sourceBadge(tool: string): Badge {
  return { label: SOURCE_LABELS[tool] ?? tool, className: 'badge badge-info' };
}

export function personaBadge(tag: string | null): Badge | null {
  return tag ? { label: tag, className: 'badge' } : null;
}

export function trackBadge(track: string | null): Badge | null {
  if (!track) return null;
  return track === 'consultation_led'
    ? { label: 'Consultation', className: 'badge badge-accent' }
    : { label: 'Self-serve', className: 'badge badge-info' };
}

export function formatInterest(jurisdiction: string | null): string {
  // Matches the old `capitalize` class: first letter of each word upper-cased.
  return jurisdiction ? jurisdiction.replace('-', ' ').replace(/\b\w/g, (c) => c.toUpperCase()) : '—';
}

export function formatCaptured(iso: string): string {
  return new Date(iso).toLocaleString();
}

export function leadCountLabel(n: number): string {
  return `${n} lead${n === 1 ? '' : 's'}`;
}
