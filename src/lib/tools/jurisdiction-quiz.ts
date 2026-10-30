// Shared by /tools/jurisdiction-quiz and /api/quiz/evaluate so option values cannot drift.
// Tax-rate strings and setup days are unsourced marketing numbers (see docs/ai/features/tool-jurisdiction-quiz.md).

export type Goal = 'tax_optimization' | 'banking_access' | 'relocation' | 'privacy' | 'exploring';
export type Timeline = 'asap' | 'few_months' | 'no_rush';
export type JurisdictionId = 'uae' | 'hong-kong' | 'singapore' | 'bahrain' | 'ireland' | 'bvi';

export const JURISDICTION_ATTRIBUTES: Record<
  JurisdictionId,
  { name: string; taxRate: string; setupDays: number; bankingDifficulty: 'easy' | 'medium' | 'hard'; residencyPathway: boolean }
> = {
  uae: { name: 'UAE', taxRate: '0-9%', setupDays: 30, bankingDifficulty: 'medium', residencyPathway: true },
  'hong-kong': { name: 'Hong Kong', taxRate: '0% on foreign income', setupDays: 18, bankingDifficulty: 'hard', residencyPathway: false },
  singapore: { name: 'Singapore', taxRate: '5-17%', setupDays: 18, bankingDifficulty: 'medium', residencyPathway: true },
  bahrain: { name: 'Bahrain', taxRate: '0%', setupDays: 30, bankingDifficulty: 'medium', residencyPathway: true },
  ireland: { name: 'Ireland', taxRate: '12.5%', setupDays: 3, bankingDifficulty: 'easy', residencyPathway: true },
  bvi: { name: 'BVI & Cayman', taxRate: '0%', setupDays: 45, bankingDifficulty: 'hard', residencyPathway: false },
};

// Values the server scores; the page options must be a subset (enforced by the test).
export const QUIZ_GOALS: Goal[] = ['tax_optimization', 'banking_access', 'relocation', 'privacy', 'exploring'];
export const QUIZ_TIMELINES: Timeline[] = ['asap', 'few_months', 'no_rush'];

export const QUIZ_GOAL_OPTIONS: { value: Goal; label: string }[] = [
  { value: 'tax_optimization', label: 'Tax Optimization (0% – 9% rate)' },
  { value: 'banking_access', label: 'Tier-1 International Banking Access' },
  { value: 'relocation', label: 'Physical Relocation & Golden Visas' },
  { value: 'privacy', label: 'Maximum Privacy & Asset Protection' },
];

export const QUIZ_TIMELINE_OPTIONS: { value: Timeline; label: string }[] = [
  { value: 'asap', label: 'Immediately (within 1-2 weeks)' },
  { value: 'few_months', label: 'In the next 1–3 months' },
  { value: 'no_rush', label: 'In 3–6 months or later' },
];

export interface QuizRecommendation {
  jurisdiction: string;
  name: string;
  matchScore: number;
  whyFit: string;
  corporateTaxRate: string;
  timelineDays: string;
  serviceHref: string;
}

/** Maps the /api/quiz/evaluate body to page cards; null if the shape is wrong or empty. */
export function mapQuizResponse(data: unknown): QuizRecommendation[] | null {
  const list = (data as { recommendations?: unknown } | null)?.recommendations;
  if (!Array.isArray(list)) return null;
  const cards: QuizRecommendation[] = [];
  for (const r of list) {
    const attrs = JURISDICTION_ATTRIBUTES[r?.jurisdiction as JurisdictionId];
    if (!attrs || typeof r.score !== 'number' || typeof r.rationale !== 'string') return null;
    cards.push({
      jurisdiction: r.jurisdiction,
      name: r.name ?? attrs.name,
      matchScore: r.score,
      whyFit: r.rationale,
      corporateTaxRate: attrs.taxRate,
      timelineDays: `~${attrs.setupDays} days`,
      serviceHref: '/services',
    });
  }
  return cards.length ? cards : null;
}
