import { industryRiskTier, type IndustryRiskTier } from '@/lib/persona';

export type BankCategory = 'high' | 'moderate' | 'special';

export interface BankOddsResult {
  bank: string;
  odds: number;
  category: BankCategory;
  label: string;
}

export interface BankingIndustryOption {
  value: string;
  label: string;
}

export const BANKING_INDUSTRY_OPTIONS: readonly BankingIndustryOption[] = [
  { value: 'Consulting', label: 'Consulting / Agency' },
  { value: 'Technology', label: 'Software / SaaS / Tech' },
  { value: 'E-commerce', label: 'E-commerce / Retail' },
  { value: 'Marketing', label: 'Media & Marketing' },
  { value: 'Crypto', label: 'Crypto / Web3' },
  { value: 'Real Estate', label: 'Real Estate' },
  { value: 'Other', label: 'Other Business Activity' },
];

export const BANK_BASE_ODDS: Record<IndustryRiskTier, { wio: number; enbd: number }> = {
  low: { wio: 95, enbd: 85 },
  medium: { wio: 75, enbd: 60 },
  high: { wio: 40, enbd: 20 },
};

/**
 * Calculates turnover bonus based on annual turnover in USD.
 * >= 500,000 -> +5%
 * < 50,000 -> -10%
 * 50,000 to 499,999 -> 0%
 */
export function getTurnoverBonus(turnover: number): number {
  if (turnover >= 500000) return 5;
  if (turnover < 50000) return -10;
  return 0;
}

/**
 * Clamps odds between 5% and 99%.
 */
export function clampOdds(odds: number): number {
  return Math.max(5, Math.min(99, odds));
}

/**
 * Maps odds to descriptive category and UI label.
 * > 80 -> High Likelihood
 * > 50 -> Moderate Odds
 * <= 50 -> Special Approval Needed
 */
export function getOddsCategory(odds: number): { category: BankCategory; label: string } {
  if (odds > 80) {
    return { category: 'high', label: 'High Likelihood' };
  }
  if (odds > 50) {
    return { category: 'moderate', label: 'Moderate Odds' };
  }
  return { category: 'special', label: 'Special Approval Needed' };
}

/**
 * Pure calculation engine for UAE bank approval odds.
 * Evaluates four UAE business banks based on industry risk tier and annual turnover.
 * Note: Nationality is intentionally not used in this computation.
 */
export function computeBankOdds(risk: IndustryRiskTier, turnover: number): BankOddsResult[] {
  const bonus = getTurnoverBonus(turnover);
  const base = BANK_BASE_ODDS[risk];

  const bankConfigs = [
    { bank: 'Wio Bank', raw: base.wio + bonus },
    { bank: 'Emirates NBD', raw: base.enbd + bonus },
    { bank: 'Mashreq NeoBiz', raw: base.wio - 5 + bonus },
    { bank: 'ADCB Commercial', raw: base.enbd - 10 + bonus },
  ];

  return bankConfigs.map(({ bank, raw }) => {
    const odds = clampOdds(raw);
    const { category, label } = getOddsCategory(odds);
    return {
      bank,
      odds,
      category,
      label,
    };
  });
}

/**
 * Convenience helper computing odds from an industry string (mapping to risk tier) and turnover.
 */
export function calculateBankingOddsForIndustry(
  industry: string,
  turnover: number
): BankOddsResult[] {
  const risk = industryRiskTier(industry) ?? 'medium';
  return computeBankOdds(risk, turnover);
}
