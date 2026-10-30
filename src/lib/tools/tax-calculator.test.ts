import { describe, expect, it } from 'vitest';
import {
  CALCULATOR_COUNTRIES,
  CALCULATOR_TARGETS,
  HOME_TAX_RATES,
  JURISDICTION_TAX_RATES,
  mapCalculatorResponse,
} from './tax-calculator';

describe('tax calculator options (AC1)', () => {
  it.each(CALCULATOR_COUNTRIES)('country $code is accepted by the server', ({ code }) => {
    expect(HOME_TAX_RATES[code.toUpperCase()]).toBeDefined();
  });

  it.each(CALCULATOR_TARGETS)('target $code is accepted by the server', ({ code }) => {
    expect(JURISDICTION_TAX_RATES[code]).toBeDefined();
  });
});

describe('mapCalculatorResponse (AC2, AC3)', () => {
  it('reads the real API field names (previously rendered $0)', () => {
    const api = {
      home_tax_rate: 0.37,
      home_tax_amount: 92500,
      optimized_tax_rate: 0,
      optimized_tax_amount: 0,
      net_annual_savings: 92500,
      recommended_tier: 'tier_1_fdi',
      recommended_package_usd: 2500,
    };
    expect(mapCalculatorResponse(api)).toEqual({ savings: 92500, currentTax: 92500, targetTax: 0 });
  });

  it('keeps a 0% jurisdiction at 0 tax', () => {
    expect(JURISDICTION_TAX_RATES.bvi).toBe(0);
    const r = mapCalculatorResponse({ net_annual_savings: 45000, home_tax_amount: 45000, optimized_tax_amount: 0 });
    expect(r?.targetTax).toBe(0);
  });

  it('returns null for error bodies or wrong shapes (AC5)', () => {
    expect(mapCalculatorResponse({ error: 'Unsupported country code: UK' })).toBeNull();
    expect(mapCalculatorResponse({ savings: 1, current_tax: 2, target_tax: 3 })).toBeNull();
    expect(mapCalculatorResponse(null)).toBeNull();
  });
});
