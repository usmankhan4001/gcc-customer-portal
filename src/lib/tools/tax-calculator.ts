// Shared by /tools/tax-calculator and /api/calculator/evaluate so option values cannot drift.
// Rates are mock placeholders that still need a tax review (see docs/ai/features/tool-tax-calculator.md).

export const HOME_TAX_RATES: Record<string, number> = {
  NL: 0.495,
  DE: 0.475,
  FR: 0.45,
  GB: 0.45,
  US: 0.37,
  CA: 0.33,
  AU: 0.325,
  AE: 0.0,
  SG: 0.17,
  HK: 0.165,
  IE: 0.33,
  ES: 0.47,
  IT: 0.43,
  PT: 0.48,
  SE: 0.52,
  BE: 0.5,
  JP: 0.45,
  IN: 0.3,
  BR: 0.34,
  MX: 0.35,
};

export const JURISDICTION_TAX_RATES: Record<string, number> = {
  hong_kong: 0.0825,
  singapore: 0.17,
  uae: 0.0,
  delaware_usa: 0.0,
  uk_limited: 0.19,
  estonia_e_residency: 0.0,
  georgia: 0.01,
  cyprus: 0.125,
  malta: 0.05,
  bvi: 0.0,
  cayman: 0.0,
  labuan: 0.03,
};

// Every code here must exist in the server tables above (enforced by the test).
export const CALCULATOR_COUNTRIES = [
  { code: 'US', name: 'United States' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'DE', name: 'Germany' },
  { code: 'FR', name: 'France' },
  { code: 'CA', name: 'Canada' },
  { code: 'AU', name: 'Australia' },
  { code: 'IN', name: 'India' },
];

export const CALCULATOR_TARGETS = [
  { code: 'uae', name: 'UAE' },
  { code: 'hong_kong', name: 'Hong Kong' },
  { code: 'singapore', name: 'Singapore' },
  { code: 'bvi', name: 'BVI / Offshore Holding' },
];

export interface CalculatorResult {
  savings: number;
  currentTax: number;
  targetTax: number;
}

/** Maps the /api/calculator/evaluate body to what the page shows; null if the shape is wrong. */
export function mapCalculatorResponse(data: unknown): CalculatorResult | null {
  const d = data as Record<string, unknown> | null;
  const savings = d?.net_annual_savings;
  const currentTax = d?.home_tax_amount;
  const targetTax = d?.optimized_tax_amount;
  if (![savings, currentTax, targetTax].every((n) => typeof n === 'number' && Number.isFinite(n))) {
    return null;
  }
  return { savings: savings as number, currentTax: currentTax as number, targetTax: targetTax as number };
}
