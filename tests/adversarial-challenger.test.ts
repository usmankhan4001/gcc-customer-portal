import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import {
  UBO_EXPOSURE_THRESHOLD,
  UBO_JURISDICTION_OPTIONS,
  UBO_JURISDICTION_PROFILES,
  checkExposure,
  classifyExposure,
  isConsistent,
  isLowExposure,
} from '@/lib/tools/ubo-privacy';
import {
  VAT_THRESHOLD_MANDATORY,
  VAT_THRESHOLD_VOLUNTARY,
  evaluateVat,
} from '@/lib/tools/vat-scorer';
import {
  MAX_VISA_COUNT,
  MIN_VISA_COUNT,
  VISA_FEE_SCHEDULE,
  estimateVisaCosts,
} from '@/lib/tools/visa-estimator';
import {
  QFZP_ACTIVITIES,
  evaluateQFZPEligibility,
} from '@/lib/tools/qfzp-eligibility';
import {
  BANK_BASE_ODDS,
  BANKING_INDUSTRY_OPTIONS,
  calculateBankingOddsForIndustry,
  clampOdds,
  computeBankOdds,
  getOddsCategory,
  getTurnoverBonus,
} from '@/lib/tools/banking-odds';
import {
  buildPayNowUrl,
  resolveOrderJurisdiction,
  type PayNowCompany,
  type PayNowOrder,
} from '@/lib/dashboard/pay-now';
import { generateToken } from '@/lib/auth';

// ---------------------------------------------------------------------------
// 1. UBO PRIVACY ADVERSARIAL STRESS SUITE
// ---------------------------------------------------------------------------
describe('Challenger: UBO Privacy Adversarial Stress Tests', () => {
  it('strictly validates score boundary transitions around threshold 40', () => {
    // Score <= 40 is LOW exposure (private)
    expect(isLowExposure(0)).toBe(true);
    expect(isLowExposure(39)).toBe(true);
    expect(isLowExposure(39.999)).toBe(true);
    expect(isLowExposure(40)).toBe(true);
    expect(isLowExposure(UBO_EXPOSURE_THRESHOLD)).toBe(true);

    // Score > 40 is HIGH exposure (public)
    expect(isLowExposure(40.001)).toBe(false);
    expect(isLowExposure(41)).toBe(false);
    expect(isLowExposure(100)).toBe(false);

    // Extremes
    expect(isLowExposure(-100)).toBe(true);
    expect(isLowExposure(1000)).toBe(false);
  });

  it('proves consistency invariant holds across full boundary spectrum', () => {
    // Low exposure invariants (must have private registry AND protected UBO)
    expect(isConsistent(0, false, true)).toBe(true);
    expect(isConsistent(39, false, true)).toBe(true);
    expect(isConsistent(40, false, true)).toBe(true);

    // If score <= 40 has public registry or disclosed UBO, it is inconsistent
    expect(isConsistent(40, true, true)).toBe(false);
    expect(isConsistent(40, false, false)).toBe(false);
    expect(isConsistent(40, true, false)).toBe(false);

    // High exposure invariants (must have public registry OR disclosed UBO)
    expect(isConsistent(41, true, false)).toBe(true);
    expect(isConsistent(41, true, true)).toBe(true);
    expect(isConsistent(41, false, false)).toBe(true);

    // If score > 40 has both private registry and protected UBO, it is inconsistent
    expect(isConsistent(41, false, true)).toBe(false);
    expect(isConsistent(95, false, true)).toBe(false);
    expect(isConsistent(100, false, true)).toBe(false);
  });

  it('handles adversarial inputs for jurisdiction keys gracefully with UAE fallback', () => {
    const adversarialKeys = [
      '',
      '   ',
      '\t\n',
      'non-existent-country',
      'mars',
      'singapore-mainland',
      'null',
      'undefined',
      '12345',
      '!@#$%^&*()',
    ];

    for (const key of adversarialKeys) {
      const res = checkExposure(key);
      expect(res.jurisdiction).toBe('UAE Free Zone');
      expect(res.exposureScore).toBe(20);
      expect(res.exposureLevel).toBe('low');
      expect(res.publicRegistry).toBe(false);
      expect(res.uboConfidential).toBe(true);
    }
  });

  it('proves complete case-insensitivity and whitespace resilience', () => {
    const variations: Array<[string, number]> = [
      ['UAE', 20],
      ['  uae  ', 20],
      ['BVI', 15],
      ['bVi', 15],
      ['  bvi\n', 15],
      ['UK', 95],
      ['uK', 95],
      ['US', 40],
      ['Us', 40],
      ['  uS  ', 40],
    ];

    for (const [input, expectedScore] of variations) {
      const res = checkExposure(input);
      expect(res.exposureScore).toBe(expectedScore);
      expect(res.exposureLevel).toBe(expectedScore <= 40 ? 'low' : 'high');
    }
  });
});

// ---------------------------------------------------------------------------
// 2. VAT SCORER ADVERSARIAL STRESS SUITE
// ---------------------------------------------------------------------------
describe('Challenger: VAT Scorer Adversarial Stress Tests', () => {
  it('adversarially probes exact boundary revenues with micro-fractions', () => {
    // Exactly at zero
    const resZero = evaluateVat(0);
    expect(resZero.success).toBe(true);
    if (resZero.success) expect(resZero.status).toBe('below');

    // Fractional micro-cents below voluntary (187,499.999)
    const resVolBelow = evaluateVat(187499.999);
    expect(resVolBelow.success).toBe(true);
    if (resVolBelow.success) expect(resVolBelow.status).toBe('below');

    // Exact voluntary threshold (187,500)
    const resVolExact = evaluateVat(187500);
    expect(resVolExact.success).toBe(true);
    if (resVolExact.success) expect(resVolExact.status).toBe('voluntary');

    // Micro-cents above voluntary (187,500.001)
    const resVolAbove = evaluateVat(187500.001);
    expect(resVolAbove.success).toBe(true);
    if (resVolAbove.success) expect(resVolAbove.status).toBe('voluntary');

    // Micro-cents below mandatory (374,999.999)
    const resManBelow = evaluateVat(374999.999);
    expect(resManBelow.success).toBe(true);
    if (resManBelow.success) expect(resManBelow.status).toBe('voluntary');

    // Exact mandatory threshold (375,000)
    const resManExact = evaluateVat(375000);
    expect(resManExact.success).toBe(true);
    if (resManExact.success) expect(resManExact.status).toBe('mandatory');

    // Micro-cents above mandatory (375,000.001)
    const resManAbove = evaluateVat(375000.001);
    expect(resManAbove.success).toBe(true);
    if (resManAbove.success) expect(resManAbove.status).toBe('mandatory');

    // Extreme high turnover (10 Billion AED)
    const resExtreme = evaluateVat(10_000_000_000);
    expect(resExtreme.success).toBe(true);
    if (resExtreme.success) {
      expect(resExtreme.status).toBe('mandatory');
      expect(resExtreme.isMandatory).toBe(true);
    }
  });

  it.each([
    [-0.00001, 'negative small float'],
    [-1, 'negative int'],
    [-1000000, 'large negative int'],
    ['-0.01', 'negative string decimal'],
    ['-100', 'negative string int'],
    ['abc', 'alpha string'],
    ['375k', 'shorthand k string'],
    ['AED 375,000', 'currency prefixed string'],
    ['$1000', 'dollar prefixed string'],
    ['1,000,000', 'comma formatted string'],
    [NaN, 'NaN'],
    [Infinity, 'Infinity'],
    [-Infinity, '-Infinity'],
    ['', 'empty string'],
    ['   ', 'whitespace string'],
    [null, 'null'],
    [undefined, 'undefined'],
    [{}, 'empty object'],
    [true, 'boolean true'],
    [false, 'boolean false'],
  ])('rejects bad input: %s (%s)', (input, _desc) => {
    const res = evaluateVat(input);
    expect(res.success).toBe(false);
  });

  it('empirically reveals array coercion quirk: empty array [] coerces to 0', () => {
    // Adversarial finding: evaluateVat allows arrays because String([]) is "" and Number("") is 0
    const resEmptyArray = evaluateVat([]);
    expect(resEmptyArray.success).toBe(true);
    if (resEmptyArray.success) {
      expect(resEmptyArray.amount).toBe(0);
      expect(resEmptyArray.status).toBe('below');
    }

    // Array with single number coerces to that number
    const resArrayNum = evaluateVat([400000]);
    expect(resArrayNum.success).toBe(true);
    if (resArrayNum.success) {
      expect(resArrayNum.amount).toBe(400000);
      expect(resArrayNum.status).toBe('mandatory');
    }
  });
});

// ---------------------------------------------------------------------------
// 3. VISA ESTIMATOR ADVERSARIAL STRESS SUITE
// ---------------------------------------------------------------------------
describe('Challenger: Visa Estimator Adversarial Stress Tests', () => {
  it('strictly validates boundary counts: 0, 1, 50, 51', () => {
    // 0 is rejected
    const res0 = estimateVisaCosts('FreeZone', 0);
    expect(res0.success).toBe(false);

    // 1 is accepted (min boundary)
    const res1 = estimateVisaCosts('FreeZone', 1);
    expect(res1.success).toBe(true);
    if (res1.success) {
      expect(res1.count).toBe(1);
      expect(res1.fees.grandTotal).toBe(3480);
    }

    // 50 is accepted (max boundary)
    const res50 = estimateVisaCosts('FreeZone', 50);
    expect(res50.success).toBe(true);
    if (res50.success) {
      expect(res50.count).toBe(50);
      expect(res50.fees.grandTotal).toBe(3480 * 50);
    }

    // 51 is rejected
    const res51 = estimateVisaCosts('FreeZone', 51);
    expect(res51.success).toBe(false);
  });

  it('strictly rejects non-integers and decimals', () => {
    const decimals = [1.5, 0.99, 2.00001, 49.99, 50.01, -1.5, '1.5', '2.1'];
    for (const d of decimals) {
      const res = estimateVisaCosts('FreeZone', d);
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error).toMatch(/whole number|between 1 and 50/);
      }
    }
  });

  it('strictly rejects invalid types, negatives, and non-numerics', () => {
    const badInputs = [-1, -50, 'two', '5 visas', '', '   ', null, undefined, NaN, Infinity, -Infinity];
    for (const input of badInputs) {
      const res = estimateVisaCosts('FreeZone', input);
      expect(res.success).toBe(false);
    }
  });

  it('verifies itemized fee breakdown math invariants across all valid counts 1..50', () => {
    for (const jurisdiction of ['FreeZone', 'Mainland'] as const) {
      const sched = VISA_FEE_SCHEDULE[jurisdiction];
      // Check component sum equals perVisaTotal
      expect(sched.entryPermit + sched.medicalFitness + sched.emiratesId + sched.visaStamping).toBe(sched.perVisaTotal);

      // Check random sampling of counts
      for (const count of [1, 5, 25, 50]) {
        const res = estimateVisaCosts(jurisdiction, count);
        expect(res.success).toBe(true);
        if (res.success) {
          expect(res.fees.entryPermit).toBe(sched.entryPermit * count);
          expect(res.fees.medicalFitness).toBe(sched.medicalFitness * count);
          expect(res.fees.emiratesId).toBe(sched.emiratesId * count);
          expect(res.fees.visaStamping).toBe(sched.visaStamping * count);
          expect(res.fees.grandTotal).toBe(sched.perVisaTotal * count);
        }
      }
    }
  });
});

// ---------------------------------------------------------------------------
// 4. QFZP ELIGIBILITY ADVERSARIAL STRESS SUITE
// ---------------------------------------------------------------------------
describe('Challenger: QFZP Eligibility Adversarial Stress Tests', () => {
  it('verifies complete matrix of activities and substance', () => {
    const expectedMap: Record<string, boolean> = {
      'Tech:true': true,
      'Tech:false': false,
      'Trading:true': true,
      'Trading:false': false,
      'Holding:true': true,
      'Holding:false': false,
      'Logistics:true': false,
      'Logistics:false': false,
      'Excluded:true': false,
      'Excluded:false': false,
    };

    for (const [key, expected] of Object.entries(expectedMap)) {
      const [activity, substanceStr] = key.split(':');
      const res = evaluateQFZPEligibility({
        activity: activity as any,
        hasSubstance: substanceStr === 'true',
      });
      expect(res.isLikelyEligible).toBe(expected);
      if (expected) {
        expect(res.headline).toContain('0% UAE Corporate Tax');
      } else {
        expect(res.headline).toContain('Standard 9% Rate Applies');
      }
    }
  });

  it('rejects legacy "Consulting" activity and unknown strings as non-qualifying', () => {
    // "Consulting" is legacy and was replaced by "Holding"
    const legacyRes = evaluateQFZPEligibility({
      activity: 'Consulting' as any,
      hasSubstance: true,
    });
    expect(legacyRes.isLikelyEligible).toBe(false);

    // Unknown random activity
    const unknownRes = evaluateQFZPEligibility({
      activity: 'CryptoMining' as any,
      hasSubstance: true,
    });
    expect(unknownRes.isLikelyEligible).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// 5. BANKING ODDS ADVERSARIAL STRESS SUITE
// ---------------------------------------------------------------------------
describe('Challenger: Banking Odds Adversarial Stress Tests', () => {
  it('proves turnover bonus boundary intervals', () => {
    expect(getTurnoverBonus(-100)).toBe(-10);
    expect(getTurnoverBonus(0)).toBe(-10);
    expect(getTurnoverBonus(49999.99)).toBe(-10);
    expect(getTurnoverBonus(50000)).toBe(0);
    expect(getTurnoverBonus(100000)).toBe(0);
    expect(getTurnoverBonus(499999.99)).toBe(0);
    expect(getTurnoverBonus(500000)).toBe(5);
    expect(getTurnoverBonus(1000000)).toBe(5);
    expect(getTurnoverBonus(100_000_000)).toBe(5);
  });

  it('verifies clampOdds strictly enforces [5, 99] for all numerical values', () => {
    expect(clampOdds(-1000)).toBe(5);
    expect(clampOdds(0)).toBe(5);
    expect(clampOdds(4.99)).toBe(5);
    expect(clampOdds(5)).toBe(5);
    expect(clampOdds(50)).toBe(50);
    expect(clampOdds(99)).toBe(99);
    expect(clampOdds(99.01)).toBe(99);
    expect(clampOdds(100)).toBe(99);
    expect(clampOdds(1000)).toBe(99);
  });

  it('adversarially sweeps combinations: all odds must stay within [5, 99]', () => {
    const turnovers = [-1000, 0, 10000, 50000, 100000, 500000, 1000000, 50000000];
    const tiers = ['low', 'medium', 'high'] as const;

    for (const tier of tiers) {
      for (const to of turnovers) {
        const results = computeBankOdds(tier, to);
        expect(results).toHaveLength(4);
        for (const item of results) {
          expect(item.odds).toBeGreaterThanOrEqual(5);
          expect(item.odds).toBeLessThanOrEqual(99);
          if (item.odds > 80) {
            expect(item.category).toBe('high');
            expect(item.label).toBe('High Likelihood');
          } else if (item.odds > 50) {
            expect(item.category).toBe('moderate');
            expect(item.label).toBe('Moderate Odds');
          } else {
            expect(item.category).toBe('special');
            expect(item.label).toBe('Special Approval Needed');
          }
        }
      }
    }
  });

  it('handles unknown industry strings by falling back safely to medium risk', () => {
    const res = calculateBankingOddsForIndustry('Space Tourism', 100000);
    expect(res).toHaveLength(4);
    const wio = res.find((r) => r.bank === 'Wio Bank');
    // medium risk base for Wio is 75 + bonus 0 = 75
    expect(wio?.odds).toBe(75);
  });
});

// ---------------------------------------------------------------------------
// 6. PAY NOW URL ADVERSARIAL STRESS SUITE
// ---------------------------------------------------------------------------
describe('Challenger: Pay Now URL Adversarial Stress Tests', () => {
  const sampleOrder: PayNowOrder = {
    id: 'f81d4fae-7dec-11d0-a765-00a0c91e6bf6',
    company_id: 'c-match',
  };

  it('guarantees order UUID is NEVER present in the resulting Pay Now URL', () => {
    const urls = [
      buildPayNowUrl(sampleOrder, { id: 'c-match', jurisdiction: 'uae' }),
      buildPayNowUrl(sampleOrder, [{ id: 'c-match', jurisdiction: 'hong-kong' }]),
      buildPayNowUrl(sampleOrder, null),
      buildPayNowUrl(sampleOrder, []),
      buildPayNowUrl({ id: '11111111-2222-3333-4444-555555555555', company_id: null }, []),
    ];

    for (const u of urls) {
      expect(u).not.toMatch(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
      expect(u.startsWith('/checkout/')).toBe(true);
    }
  });

  it('correctly resolves multiple companies matching order.company_id', () => {
    const companies: PayNowCompany[] = [
      { id: 'c-1', jurisdiction: 'singapore' },
      { id: 'c-match', jurisdiction: 'ireland' },
      { id: 'c-3', jurisdiction: 'bvi' },
    ];
    const url = buildPayNowUrl(sampleOrder, companies);
    expect(url).toBe('/checkout/ireland');
  });

  it('falls back to first company with jurisdiction when order.company_id does not match', () => {
    const orderNoMatch: PayNowOrder = { id: 'some-order', company_id: 'c-nonexistent' };
    const companies: PayNowCompany[] = [
      { id: 'c-1', jurisdiction: null },
      { id: 'c-2', jurisdiction: 'bahrain' },
      { id: 'c-3', jurisdiction: 'singapore' },
    ];
    const url = buildPayNowUrl(orderNoMatch, companies);
    expect(url).toBe('/checkout/bahrain');
  });

  it('handles spaces and special characters with URI encoding', () => {
    const order: PayNowOrder = { id: 'o-1', company_id: 'c-special' };
    const company: PayNowCompany = { id: 'c-special', jurisdiction: 'BVI & Cayman' };
    const url = buildPayNowUrl(order, company);
    expect(url).toBe('/checkout/bvi%20%26%20cayman');
  });

  it('falls back to default "uae" when all companies lack jurisdiction or list is empty/null', () => {
    expect(buildPayNowUrl(sampleOrder, null)).toBe('/checkout/uae');
    expect(buildPayNowUrl(sampleOrder, undefined)).toBe('/checkout/uae');
    expect(buildPayNowUrl(sampleOrder, [])).toBe('/checkout/uae');
    expect(buildPayNowUrl(sampleOrder, [{ id: 'c-1', jurisdiction: '' }])).toBe('/checkout/uae');
    expect(buildPayNowUrl(sampleOrder, [{ id: 'c-1', jurisdiction: '   ' }])).toBe('/checkout/uae');
  });
});

// ---------------------------------------------------------------------------
// 7. REVENUE ESTIMATE PATCH ROUTE ADVERSARIAL STRESS SUITE
// ---------------------------------------------------------------------------
const { cookieJar, ops, setMockCompany, chain } = vi.hoisted(() => {
  let mockCompany: Record<string, unknown> | null = null;
  const cookieJar: Record<string, string> = {};
  const ops: Array<{ kind: string; values?: Record<string, unknown> }> = [];

  function chain(kind: string) {
    const op = { kind, values: undefined as Record<string, unknown> | undefined };
    const c: Record<string, unknown> = {};
    c.from = () => c;
    c.where = () => c;
    c.orderBy = () => c;
    c.limit = () => c;
    c.set = (v: Record<string, unknown>) => ((op.values = v), c);
    c.returning = () => c;
    c.then = (resolve: (v: unknown) => unknown) => {
      ops.push(op);
      if (kind === 'select') return resolve(mockCompany ? [mockCompany] : []);
      if (kind === 'update') {
        const updated = { ...(mockCompany || {}), ...(op.values || {}) };
        return resolve([updated]);
      }
      return resolve([]);
    };
    return c;
  }

  return {
    cookieJar,
    ops,
    setMockCompany: (val: Record<string, unknown> | null) => {
      mockCompany = val;
    },
    chain,
  };
});

vi.mock('next/headers', () => ({
  cookies: async () => ({
    get: (name: string) => (cookieJar[name] ? { value: cookieJar[name] } : undefined),
    set: vi.fn(),
  }),
}));

vi.mock('@/lib/db', () => ({
  db: {
    select: () => chain('select'),
    update: () => chain('update'),
  },
}));

describe('Challenger: Revenue Estimate PATCH Route Adversarial Stress Tests', () => {
  beforeEach(async () => {
    ops.length = 0;
    setMockCompany({
      id: 'c-100',
      user_id: 'u-user',
      company_name: 'Adversarial Test Corp',
      status: 'active',
      annual_revenue_estimate: 200000,
      fiscal_year_end: '12-31',
    });
    const token = await generateToken({ userId: 'u-user', email: 'challenger@example.com', role: 'client' });
    cookieJar['gcc_session'] = token;
  });

  const patchReq = (body: unknown) =>
    new Request('http://localhost/api/companies/revenue-estimate', {
      method: 'PATCH',
      body: JSON.stringify(body),
      headers: { 'content-type': 'application/json' },
    });

  it('accurately rounds half-up decimal boundaries', async () => {
    const { PATCH } = await import('@/app/api/companies/revenue-estimate/route');

    // 100.49 -> rounds to 100
    const res1 = await PATCH(patchReq({ annual_revenue_estimate: 100.49 }));
    expect(res1.status).toBe(200);
    const body1 = await res1.json();
    expect(body1.company.annual_revenue_estimate).toBe(100);

    // 100.50 -> rounds to 101
    const res2 = await PATCH(patchReq({ annual_revenue_estimate: 100.5 }));
    expect(res2.status).toBe(200);
    const body2 = await res2.json();
    expect(body2.company.annual_revenue_estimate).toBe(101);
  });

  it('strictly rejects negative values, strings, booleans, and null/undefined', async () => {
    const { PATCH } = await import('@/app/api/companies/revenue-estimate/route');

    const invalidBodies = [
      { annual_revenue_estimate: -1 },
      { annual_revenue_estimate: -0.01 },
      { annual_revenue_estimate: '100000' },
      { annual_revenue_estimate: 'abc' },
      { annual_revenue_estimate: true },
      { annual_revenue_estimate: false },
      { annual_revenue_estimate: null },
      { annual_revenue_estimate: undefined },
      { annual_revenue_estimate: [100] },
      { annual_revenue_estimate: {} },
    ];

    for (const body of invalidBodies) {
      const res = await PATCH(patchReq(body));
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toMatch(/non-negative number/i);
    }
  });

  it('rejects malformed raw JSON body with 400', async () => {
    const { PATCH } = await import('@/app/api/companies/revenue-estimate/route');
    const malformedReq = new Request('http://localhost/api/companies/revenue-estimate', {
      method: 'PATCH',
      body: 'this is { not valid json }',
      headers: { 'content-type': 'application/json' },
    });
    const res = await PATCH(malformedReq);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toMatch(/Invalid JSON body/i);
  });
});
