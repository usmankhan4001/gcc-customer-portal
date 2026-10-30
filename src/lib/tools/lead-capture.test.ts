import { describe, expect, it } from 'vitest';
import {
  attachConsent,
  buildToolPersonaSignals,
  captureRequestSchema,
  CONSENT_TEXT,
  isWithinSizeLimit,
  MAX_PAYLOAD_SIZE_BYTES,
  SOURCE_TOOLS,
  type SourceTool,
} from './lead-capture';

describe('lead-capture: schema validation (AC1)', () => {
  it('accepts all 10 valid source_tool enums', () => {
    for (const tool of SOURCE_TOOLS) {
      const res = captureRequestSchema.safeParse({
        source_tool: tool,
        email: 'founder@example.com',
      });
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data.source_tool).toBe(tool);
      }
    }
  });

  it('rejects unrecognized or missing source_tool', () => {
    const missing = captureRequestSchema.safeParse({
      email: 'founder@example.com',
    });
    expect(missing.success).toBe(false);

    const invalid = captureRequestSchema.safeParse({
      source_tool: 'crypto_gambling_tool',
      email: 'founder@example.com',
    });
    expect(invalid.success).toBe(false);
  });

  it('accepts valid email with no phone', () => {
    const res = captureRequestSchema.safeParse({
      source_tool: 'tax_calculator',
      email: 'valid.user@startup.ae',
    });
    expect(res.success).toBe(true);
  });

  it('accepts valid phone with no email', () => {
    const res = captureRequestSchema.safeParse({
      source_tool: 'visa_estimator',
      whatsapp_number: '+971501234567',
    });
    expect(res.success).toBe(true);
  });

  it('accepts both email and phone provided together', () => {
    const res = captureRequestSchema.safeParse({
      source_tool: 'banking_odds',
      email: 'cxo@holding.com',
      whatsapp_number: '+971559876543',
    });
    expect(res.success).toBe(true);
  });

  it('rejects when neither email nor phone is provided', () => {
    const res = captureRequestSchema.safeParse({
      source_tool: 'tax_calculator',
      tool_input: {},
    });
    expect(res.success).toBe(false);
  });

  it('rejects empty strings for both email and phone', () => {
    const res = captureRequestSchema.safeParse({
      source_tool: 'tax_calculator',
      email: '   ',
      whatsapp_number: '   ',
    });
    expect(res.success).toBe(false);
  });

  it('rejects malformed email address format', () => {
    const res = captureRequestSchema.safeParse({
      source_tool: 'tax_calculator',
      email: 'not-a-valid-email',
    });
    expect(res.success).toBe(false);
  });

  it('rejects tool_input that exceeds 50KB limit', () => {
    const hugeString = 'x'.repeat(55 * 1024);
    const res = captureRequestSchema.safeParse({
      source_tool: 'tax_calculator',
      email: 'founder@example.com',
      tool_input: { payload: hugeString },
    });
    expect(res.success).toBe(false);
  });

  it('rejects tool_result that exceeds 50KB limit', () => {
    const hugeString = 'y'.repeat(55 * 1024);
    const res = captureRequestSchema.safeParse({
      source_tool: 'tax_calculator',
      email: 'founder@example.com',
      tool_result: { payload: hugeString },
    });
    expect(res.success).toBe(false);
  });

  it('accepts bounded payload near but below limit', () => {
    const safeString = 'z'.repeat(10 * 1024);
    const res = captureRequestSchema.safeParse({
      source_tool: 'tax_calculator',
      email: 'founder@example.com',
      tool_input: { payload: safeString },
      tool_result: { payload: safeString },
    });
    expect(res.success).toBe(true);
  });

  it('isWithinSizeLimit correctly evaluates payload sizes', () => {
    expect(isWithinSizeLimit({})).toBe(true);
    expect(isWithinSizeLimit(undefined)).toBe(true);
    expect(isWithinSizeLimit({ a: 'small' }, 100)).toBe(true);
    expect(isWithinSizeLimit({ a: 'a'.repeat(200) }, 100)).toBe(false);
  });
});

describe('lead-capture: consent storage (AC4)', () => {
  it('attaches exact consent copy and flag to tool input', () => {
    const initialInput = { revenue: 500000, industry: 'tech' };
    const modified = attachConsent(initialInput, true);

    expect(modified).toEqual({
      revenue: 500000,
      industry: 'tech',
      consent: true,
      consent_text: 'I agree to receive my detailed report and consultation updates via WhatsApp and Email',
    });
    expect(CONSENT_TEXT).toBe(
      'I agree to receive my detailed report and consultation updates via WhatsApp and Email'
    );
  });
});

describe('lead-capture: tool to persona signal mappings for all 10 tools (AC2)', () => {
  interface TestCase {
    tool: SourceTool;
    input: Record<string, unknown>;
    result?: Record<string, unknown> | null;
    expected: Record<string, unknown>;
  }

  const testCases: TestCase[] = [
    {
      tool: 'tax_calculator',
      input: { annualProfit: 300000, targetJurisdiction: 'uae' },
      expected: {
        revenueBand: '150k_500k',
        primaryInterestJurisdiction: 'uae',
        trackType: 'gulf',
      },
    },
    {
      tool: 'banking_odds',
      input: { turnover: 600000, industry: 'crypto' },
      expected: {
        revenueBand: 'over_500k',
        industryRiskTier: 'high',
        primaryInterestJurisdiction: 'uae',
      },
    },
    {
      tool: 'nda_generator',
      input: { yourCompany: 'Acme LLC', otherParty: 'Beta Inc', jurisdictionChoice: 'Singapore Law' },
      expected: {
        primaryInterestJurisdiction: 'singapore',
      },
    },
    {
      tool: 'jurisdiction_quiz',
      input: { budget_band: '50k_150k', wants_relocation: true },
      result: { recommendations: [{ jurisdiction: 'singapore' }] },
      expected: {
        revenueBand: '50k_150k',
        wantsRelocation: true,
        primaryInterestJurisdiction: 'singapore',
      },
    },
    {
      tool: 'vat_scorer',
      input: { revenue: 400000, businessType: 'B2B_Foreign' },
      expected: {
        revenueBand: '150k_500k',
        primaryInterestJurisdiction: 'uae',
      },
    },
    {
      tool: 'ubo_privacy',
      input: { jurisdiction: 'bvi' },
      expected: {
        primaryInterestJurisdiction: 'bvi',
      },
    },
    {
      tool: 'compliance_calendar',
      input: { formationDate: '2025-01-15' },
      expected: {
        primaryInterestJurisdiction: 'uae',
      },
    },
    {
      tool: 'visa_estimator',
      input: { jurisdiction: 'FreeZone', employees: 5 },
      expected: {
        primaryInterestJurisdiction: 'uae',
        wantsRelocation: true,
        trackType: 'gulf',
      },
    },
    {
      tool: 'name_checker',
      input: { name: 'Apex Frontier LLC' },
      expected: {
        primaryInterestJurisdiction: 'uae',
      },
    },
    {
      tool: 'qfzp_eligibility',
      input: { activity: 'Trading', hasSubstance: true },
      expected: {
        industryRiskTier: 'high',
        primaryInterestJurisdiction: 'uae',
      },
    },
  ];

  it.each(testCases)('correctly maps persona signals for $tool', ({ tool, input, result, expected }) => {
    const signals = buildToolPersonaSignals(tool, input, result);
    expect(signals).toMatchObject(expected);
  });
});
