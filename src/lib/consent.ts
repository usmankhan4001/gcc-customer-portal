import { and, desc, eq } from 'drizzle-orm';
import { z } from 'zod';
import { db as defaultDb } from '@/lib/db';
import { userConsents, type UserConsent } from '@/lib/db/schema';

export const STANDARD_CONSENT_TYPES = [
  'marketing_whatsapp_email',
  'terms_of_service',
  'privacy_policy',
  'data_processing_cross_border',
  'kyc_declaration',
  'cookies_analytics',
] as const;

export type StandardConsentType = (typeof STANDARD_CONSENT_TYPES)[number];

const optionalUuid = z.string().trim().uuid().optional().nullable();

export const recordConsentInputSchema = z
  .object({
    userId: optionalUuid,
    user_id: optionalUuid,
    leadId: optionalUuid,
    lead_id: optionalUuid,
    consentType: z.string().trim().min(1).optional(),
    consent_type: z.string().trim().min(1).optional(),
    consentText: z.string().trim().min(1).optional(),
    consent_text: z.string().trim().min(1).optional(),
    granted: z.boolean().default(true),
    ipAddress: z.string().trim().optional().nullable(),
    ip_address: z.string().trim().optional().nullable(),
    userAgent: z.string().trim().optional().nullable(),
    user_agent: z.string().trim().optional().nullable(),
  })
  .superRefine((data, ctx) => {
    const userId = data.userId ?? data.user_id ?? null;
    const leadId = data.leadId ?? data.lead_id ?? null;
    const consentType = data.consentType ?? data.consent_type;
    const consentText = data.consentText ?? data.consent_text;

    if (!consentType || consentType.trim() === '') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'consent_type or consentType is required',
        path: ['consentType'],
      });
    }
    if (!consentText || consentText.trim() === '') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'consent_text or consentText is required',
        path: ['consentText'],
      });
    }
    if (!userId && !leadId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Either userId or leadId must be provided to record consent audit entry',
        path: ['userId'],
      });
    }
  })
  .transform((data) => ({
    userId: data.userId ?? data.user_id ?? null,
    leadId: data.leadId ?? data.lead_id ?? null,
    consentType: (data.consentType ?? data.consent_type)!,
    consentText: (data.consentText ?? data.consent_text)!,
    granted: data.granted,
    ipAddress: data.ipAddress ?? data.ip_address ?? null,
    userAgent: data.userAgent ?? data.user_agent ?? null,
  }));

export type RecordConsentInput = z.input<typeof recordConsentInputSchema>;
export type ValidatedConsentInput = z.output<typeof recordConsentInputSchema>;

export type ConsentDbClient = Pick<typeof defaultDb, 'insert' | 'select'>;

/**
 * Validates raw consent input against GDPR / UAE PDPL audit constraints.
 */
export function validateConsentInput(input: unknown): ValidatedConsentInput {
  return recordConsentInputSchema.parse(input);
}

/**
 * Records an immutable consent audit trail entry in PostgreSQL.
 */
export async function recordConsent(
  rawInput: RecordConsentInput,
  dbClient: ConsentDbClient = defaultDb
): Promise<UserConsent> {
  const input = validateConsentInput(rawInput);
  const rows = await dbClient
    .insert(userConsents)
    .values({
      user_id: input.userId,
      lead_id: input.leadId,
      consent_type: input.consentType,
      consent_text: input.consentText,
      granted: input.granted,
      ip_address: input.ipAddress,
      user_agent: input.userAgent,
    })
    .returning();

  return rows[0];
}

export interface QueryConsentsFilter {
  userId?: string | null;
  user_id?: string | null;
  leadId?: string | null;
  lead_id?: string | null;
  consentType?: string | null;
  consent_type?: string | null;
  limit?: number;
}

/**
 * Retrieves audit consent entries matching identity and consent type, sorted newest first.
 */
export async function getUserConsents(
  filter: QueryConsentsFilter,
  dbClient: ConsentDbClient = defaultDb
): Promise<UserConsent[]> {
  const userId = filter.userId ?? filter.user_id ?? null;
  const leadId = filter.leadId ?? filter.lead_id ?? null;
  const consentType = filter.consentType ?? filter.consent_type ?? null;
  const limit = Math.min(Math.max(filter.limit ?? 50, 1), 200);

  const conditions = [];
  if (userId) conditions.push(eq(userConsents.user_id, userId));
  if (leadId) conditions.push(eq(userConsents.lead_id, leadId));
  if (consentType) conditions.push(eq(userConsents.consent_type, consentType));

  if (conditions.length === 0) {
    throw new Error('At least one identity or filter condition (userId, leadId, or consentType) must be specified');
  }

  return await dbClient
    .select()
    .from(userConsents)
    .where(and(...conditions))
    .orderBy(desc(userConsents.created_at))
    .limit(limit);
}

export interface HasActiveConsentQuery {
  userId?: string | null;
  user_id?: string | null;
  leadId?: string | null;
  lead_id?: string | null;
  consentType?: string | null;
  consent_type?: string | null;
}

/**
 * Checks whether the most recent audit entry for the target identity and consent type is currently granted.
 * Supports consent withdrawal (if latest audit entry has granted: false, returns false).
 */
export async function hasActiveConsent(
  query: HasActiveConsentQuery,
  dbClient: ConsentDbClient = defaultDb
): Promise<boolean> {
  const consentType = query.consentType ?? query.consent_type;
  if (!consentType) {
    throw new Error('consentType is required to check active consent');
  }

  const consents = await getUserConsents(
    {
      userId: query.userId ?? query.user_id,
      leadId: query.leadId ?? query.lead_id,
      consentType,
      limit: 1,
    },
    dbClient
  );

  if (!consents || consents.length === 0) {
    return false;
  }

  return consents[0].granted === true;
}

/**
 * Pure helper: checks active consent state from an existing in-memory array of consent records.
 */
export function isConsentActive(consents: UserConsent[], consentType: string): boolean {
  if (!consents || consents.length === 0) return false;

  const matching = consents
    .filter((c) => c.consent_type === consentType)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  if (matching.length === 0) return false;
  return matching[0].granted === true;
}

/**
 * Pure helper: formats a single-line audit log entry.
 */
export function formatConsentAuditLine(consent: UserConsent): string {
  const status = consent.granted ? 'GRANTED' : 'REVOKED';
  const target = consent.user_id
    ? `user:${consent.user_id}`
    : consent.lead_id
      ? `lead:${consent.lead_id}`
      : 'anonymous';
  const ip = consent.ip_address ? ` [ip: ${consent.ip_address}]` : '';
  const date = consent.created_at ? new Date(consent.created_at).toISOString() : new Date().toISOString();
  return `[${date}] Consent '${consent.consent_type}' ${status} for ${target}${ip}`;
}
