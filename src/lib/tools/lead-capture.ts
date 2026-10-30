import { z } from 'zod';
import {
  bandFromAnnualProfit,
  industryRiskTier,
  type IndustryRiskTier,
  type Jurisdiction,
  type PersonaSignals,
  type RevenueBand,
} from '@/lib/persona';

export const SOURCE_TOOLS = [
  'tax_calculator',
  'banking_odds',
  'nda_generator',
  'jurisdiction_quiz',
  'vat_scorer',
  'ubo_privacy',
  'compliance_calendar',
  'visa_estimator',
  'name_checker',
  'qfzp_eligibility',
] as const;

export type SourceTool = (typeof SOURCE_TOOLS)[number];

export const CONSENT_TEXT =
  'I agree to receive my detailed report and consultation updates via WhatsApp and Email';

export const MAX_PAYLOAD_SIZE_BYTES = 50 * 1024; // 50 KB

/**
 * Validates that an arbitrary JSON-serializable structure is within the allowed byte size.
 */
export function isWithinSizeLimit(data: unknown, limit = MAX_PAYLOAD_SIZE_BYTES): boolean {
  if (data === undefined) return true;
  try {
    const json = JSON.stringify(data);
    return typeof json === 'string' && json.length <= limit;
  } catch {
    return false;
  }
}

/**
 * Attaches explicit consent flags and wording to a tool's input payload.
 */
export function attachConsent(
  toolInput: Record<string, unknown>,
  consent = true
): Record<string, unknown> {
  return {
    ...toolInput,
    consent,
    consent_text: CONSENT_TEXT,
  };
}

export const boundedJsonRecordSchema = z
  .record(z.string(), z.unknown())
  .refine((val) => isWithinSizeLimit(val), {
    message: `Payload exceeds maximum size limit of ${MAX_PAYLOAD_SIZE_BYTES} bytes`,
  });

export const personaSignalsSchema = z.object({
  revenueBand: z.enum(['under_50k', '50k_150k', '150k_500k', 'over_500k']).optional(),
  industryRiskTier: z.enum(['low', 'medium', 'high']).optional(),
  primaryInterestJurisdiction: z
    .enum(['uae', 'hong-kong', 'singapore', 'bahrain', 'ireland', 'bvi'])
    .optional(),
  trackType: z.enum(['remote', 'gulf']).optional(),
  wantsRelocation: z.boolean().optional(),
});

const optionalEmail = z.preprocess(
  (v) => (typeof v === 'string' && v.trim() === '' ? undefined : v),
  z.string().trim().email('Invalid email address').optional()
);

const optionalPhone = z.preprocess(
  (v) => (typeof v === 'string' && v.trim() === '' ? undefined : v),
  z.string().trim().min(1, 'Phone number cannot be empty').optional()
);

const sourceToolSchema = z.preprocess(
  (v) => (typeof v === 'string' ? v.replace(/-/g, '_') : v),
  z.enum(SOURCE_TOOLS)
);

export const captureRequestSchema = z
  .object({
    source_tool: sourceToolSchema,
    email: optionalEmail,
    whatsapp_number: optionalPhone,
    tool_input: boundedJsonRecordSchema.default({}),
    tool_result: boundedJsonRecordSchema.default({}),
    signals: personaSignalsSchema.optional(),
  })
  .refine(
    (data) => Boolean(data.email || data.whatsapp_number),
    {
      message: 'source_tool and at least one of email/whatsapp_number are required',
      path: ['email'],
    }
  );

export type CaptureRequestInput = z.infer<typeof captureRequestSchema>;

/**
 * Extracts and maps persona classification signals for each of the 10 micro-tools.
 */
export function buildToolPersonaSignals(
  tool: SourceTool,
  input: Record<string, unknown>,
  result?: Record<string, unknown> | null
): PersonaSignals {
  switch (tool) {
    case 'tax_calculator': {
      const rawProfit = input.annualProfit ?? input.annual_profit;
      const profitNum = typeof rawProfit === 'number' ? rawProfit : Number(rawProfit);
      const rawTarget = (input.targetJurisdiction ?? input.target_jurisdiction) as string | undefined;
      const targetJur =
        rawTarget === 'uae' ||
        rawTarget === 'hong-kong' ||
        rawTarget === 'singapore' ||
        rawTarget === 'bahrain' ||
        rawTarget === 'ireland' ||
        rawTarget === 'bvi'
          ? (rawTarget as Jurisdiction)
          : 'uae';

      return {
        revenueBand: bandFromAnnualProfit(Number.isFinite(profitNum) ? profitNum : null),
        primaryInterestJurisdiction: targetJur,
        trackType: 'gulf',
      };
    }

    case 'banking_odds': {
      const rawTurnover = input.turnover;
      const turnoverNum = typeof rawTurnover === 'number' ? rawTurnover : Number(rawTurnover);
      const industry = typeof input.industry === 'string' ? input.industry : undefined;
      return {
        revenueBand: bandFromAnnualProfit(Number.isFinite(turnoverNum) ? turnoverNum : null),
        industryRiskTier: industryRiskTier(industry),
        primaryInterestJurisdiction: 'uae',
      };
    }

    case 'nda_generator': {
      const choice = String(input.jurisdictionChoice ?? '').toLowerCase();
      const jur: Jurisdiction = choice.includes('singapore') ? 'singapore' : 'uae';
      return {
        primaryInterestJurisdiction: jur,
      };
    }

    case 'jurisdiction_quiz': {
      const budgetBand = input.budget_band as RevenueBand | undefined;
      const wantsRelocation = Boolean(input.wants_relocation);
      let topJur: Jurisdiction | undefined;

      const recs = (result?.recommendations ?? result?.results) as Array<{ jurisdiction?: string }> | undefined;
      if (Array.isArray(recs) && recs.length > 0 && recs[0].jurisdiction) {
        const j = recs[0].jurisdiction.toLowerCase();
        if (
          j === 'uae' ||
          j === 'hong-kong' ||
          j === 'singapore' ||
          j === 'bahrain' ||
          j === 'ireland' ||
          j === 'bvi'
        ) {
          topJur = j as Jurisdiction;
        }
      }

      return {
        revenueBand: budgetBand,
        wantsRelocation,
        primaryInterestJurisdiction: topJur ?? 'uae',
      };
    }

    case 'vat_scorer': {
      const rawRev = input.revenue;
      const revNum = typeof rawRev === 'number' ? rawRev : Number(rawRev);
      return {
        revenueBand: bandFromAnnualProfit(Number.isFinite(revNum) ? revNum : null),
        primaryInterestJurisdiction: 'uae',
      };
    }

    case 'ubo_privacy': {
      const jurStr = String(input.jurisdiction ?? '').toLowerCase();
      const jur: Jurisdiction =
        jurStr === 'bvi'
          ? 'bvi'
          : jurStr === 'singapore'
          ? 'singapore'
          : jurStr === 'hong-kong'
          ? 'hong-kong'
          : 'uae';

      return {
        primaryInterestJurisdiction: jur,
      };
    }

    case 'compliance_calendar': {
      return {
        primaryInterestJurisdiction: 'uae',
      };
    }

    case 'visa_estimator': {
      return {
        primaryInterestJurisdiction: 'uae',
        wantsRelocation: true,
        trackType: 'gulf',
      };
    }

    case 'name_checker': {
      return {
        primaryInterestJurisdiction: 'uae',
      };
    }

    case 'qfzp_eligibility': {
      const activity = typeof input.activity === 'string' ? input.activity : undefined;
      return {
        industryRiskTier: industryRiskTier(activity),
        primaryInterestJurisdiction: 'uae',
      };
    }

    default:
      return {};
  }
}
