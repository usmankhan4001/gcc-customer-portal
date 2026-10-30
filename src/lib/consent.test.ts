import { describe, expect, it, vi } from 'vitest';
import {
  formatConsentAuditLine,
  getUserConsents,
  hasActiveConsent,
  isConsentActive,
  recordConsent,
  recordConsentInputSchema,
  STANDARD_CONSENT_TYPES,
  validateConsentInput,
  type ConsentDbClient,
} from './consent';
import type { UserConsent } from './db/schema';

describe('consent: input validation & schema', () => {
  const validUserUuid = '11111111-2222-4333-8444-555555555555';
  const validLeadUuid = 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee';

  it('accepts valid input with camelCase userId', () => {
    const res = recordConsentInputSchema.safeParse({
      userId: validUserUuid,
      consentType: 'marketing_whatsapp_email',
      consentText: 'I agree to receive updates via WhatsApp and Email',
    });
    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.data.userId).toBe(validUserUuid);
      expect(res.data.leadId).toBeNull();
      expect(res.data.consentType).toBe('marketing_whatsapp_email');
      expect(res.data.granted).toBe(true);
    }
  });

  it('accepts valid input with snake_case fields and lead_id', () => {
    const res = recordConsentInputSchema.safeParse({
      lead_id: validLeadUuid,
      consent_type: 'terms_of_service',
      consent_text: 'I accept terms v1.2',
      ip_address: '192.168.1.1',
      user_agent: 'Mozilla/5.0 TestBrowser',
      granted: false,
    });
    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.data.leadId).toBe(validLeadUuid);
      expect(res.data.userId).toBeNull();
      expect(res.data.consentType).toBe('terms_of_service');
      expect(res.data.consentText).toBe('I accept terms v1.2');
      expect(res.data.ipAddress).toBe('192.168.1.1');
      expect(res.data.userAgent).toBe('Mozilla/5.0 TestBrowser');
      expect(res.data.granted).toBe(false);
    }
  });

  it('accepts input with both userId and leadId present', () => {
    const res = recordConsentInputSchema.safeParse({
      userId: validUserUuid,
      leadId: validLeadUuid,
      consentType: 'privacy_policy',
      consentText: 'I consent to privacy policy',
    });
    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.data.userId).toBe(validUserUuid);
      expect(res.data.leadId).toBe(validLeadUuid);
    }
  });

  it('rejects input when neither userId nor leadId is provided', () => {
    const res = recordConsentInputSchema.safeParse({
      consentType: 'privacy_policy',
      consentText: 'I consent to privacy policy',
    });
    expect(res.success).toBe(false);
  });

  it('rejects invalid UUID formats for userId and leadId', () => {
    const res1 = recordConsentInputSchema.safeParse({
      userId: 'not-a-uuid',
      consentType: 'privacy_policy',
      consentText: 'I consent to privacy policy',
    });
    expect(res1.success).toBe(false);

    const res2 = recordConsentInputSchema.safeParse({
      leadId: '123-abc',
      consentType: 'privacy_policy',
      consentText: 'I consent to privacy policy',
    });
    expect(res2.success).toBe(false);
  });

  it('rejects empty consentType or consentText', () => {
    const emptyType = recordConsentInputSchema.safeParse({
      userId: validUserUuid,
      consentType: '   ',
      consentText: 'Valid text',
    });
    expect(emptyType.success).toBe(false);

    const emptyText = recordConsentInputSchema.safeParse({
      userId: validUserUuid,
      consentType: 'privacy_policy',
      consentText: '',
    });
    expect(emptyText.success).toBe(false);
  });

  it('validateConsentInput parses valid data and throws on invalid data', () => {
    const valid = validateConsentInput({
      userId: validUserUuid,
      consentType: 'kyc_declaration',
      consentText: 'Truthful statements confirmed',
    });
    expect(valid.consentType).toBe('kyc_declaration');

    expect(() => validateConsentInput({})).toThrow();
  });

  it('exposes STANDARD_CONSENT_TYPES containing standard legal declarations', () => {
    expect(STANDARD_CONSENT_TYPES).toContain('marketing_whatsapp_email');
    expect(STANDARD_CONSENT_TYPES).toContain('terms_of_service');
    expect(STANDARD_CONSENT_TYPES).toContain('privacy_policy');
    expect(STANDARD_CONSENT_TYPES).toContain('data_processing_cross_border');
    expect(STANDARD_CONSENT_TYPES).toContain('kyc_declaration');
  });
});

describe('consent: DB query wrappers', () => {
  const validUserUuid = '11111111-2222-4333-8444-555555555555';
  const validLeadUuid = 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee';

  it('recordConsent inserts row and returns inserted UserConsent', async () => {
    let capturedValues: Record<string, unknown> | null = null;
    const mockRow: UserConsent = {
      id: 'consent-row-uuid-001',
      user_id: validUserUuid,
      lead_id: null,
      consent_type: 'marketing_whatsapp_email',
      consent_text: 'I agree',
      granted: true,
      ip_address: '1.2.3.4',
      user_agent: 'AgentX',
      created_at: new Date('2026-10-30T10:00:00Z'),
    };

    const mockDb = {
      insert: vi.fn(() => ({
        values: vi.fn((vals: Record<string, unknown>) => {
          capturedValues = vals;
          return {
            returning: vi.fn().mockResolvedValue([mockRow]),
          };
        }),
      })),
      select: vi.fn(),
    } as unknown as ConsentDbClient;

    const result = await recordConsent(
      {
        userId: validUserUuid,
        consentType: 'marketing_whatsapp_email',
        consentText: 'I agree',
        ipAddress: '1.2.3.4',
        userAgent: 'AgentX',
      },
      mockDb
    );

    expect(result).toEqual(mockRow);
    expect(capturedValues).toMatchObject({
      user_id: validUserUuid,
      lead_id: null,
      consent_type: 'marketing_whatsapp_email',
      consent_text: 'I agree',
      granted: true,
      ip_address: '1.2.3.4',
      user_agent: 'AgentX',
    });
  });

  it('getUserConsents queries records with filters and limit', async () => {
    const mockRows: UserConsent[] = [
      {
        id: 'c1',
        user_id: validUserUuid,
        lead_id: null,
        consent_type: 'marketing_whatsapp_email',
        consent_text: 'Copy 1',
        granted: true,
        ip_address: null,
        user_agent: null,
        created_at: new Date('2026-10-30T12:00:00Z'),
      },
    ];

    const chain: Record<string, unknown> = {};
    chain.from = vi.fn(() => chain);
    chain.where = vi.fn(() => chain);
    chain.orderBy = vi.fn(() => chain);
    chain.limit = vi.fn().mockResolvedValue(mockRows);

    const mockDb = {
      insert: vi.fn(),
      select: vi.fn(() => chain),
    } as unknown as ConsentDbClient;

    const results = await getUserConsents(
      {
        userId: validUserUuid,
        consentType: 'marketing_whatsapp_email',
        limit: 10,
      },
      mockDb
    );

    expect(results).toEqual(mockRows);
    expect(mockDb.select).toHaveBeenCalled();
    expect(chain.from).toHaveBeenCalled();
    expect(chain.where).toHaveBeenCalled();
    expect(chain.orderBy).toHaveBeenCalled();
    expect(chain.limit).toHaveBeenCalledWith(10);
  });

  it('getUserConsents throws if no filter condition is provided', async () => {
    const mockDb = { insert: vi.fn(), select: vi.fn() } as unknown as ConsentDbClient;
    await expect(getUserConsents({}, mockDb)).rejects.toThrow(
      'At least one identity or filter condition'
    );
  });

  it('hasActiveConsent returns true when latest audit record is granted', async () => {
    const activeRow: UserConsent = {
      id: 'c1',
      user_id: validUserUuid,
      lead_id: null,
      consent_type: 'marketing_whatsapp_email',
      consent_text: 'Agreed',
      granted: true,
      ip_address: null,
      user_agent: null,
      created_at: new Date('2026-10-30T12:00:00Z'),
    };

    const chain: Record<string, unknown> = {};
    chain.from = vi.fn(() => chain);
    chain.where = vi.fn(() => chain);
    chain.orderBy = vi.fn(() => chain);
    chain.limit = vi.fn().mockResolvedValue([activeRow]);

    const mockDb = {
      insert: vi.fn(),
      select: vi.fn(() => chain),
    } as unknown as ConsentDbClient;

    const isActive = await hasActiveConsent(
      { userId: validUserUuid, consentType: 'marketing_whatsapp_email' },
      mockDb
    );
    expect(isActive).toBe(true);
  });

  it('hasActiveConsent returns false when latest record indicates revocation (granted: false)', async () => {
    const revokedRow: UserConsent = {
      id: 'c2',
      user_id: validUserUuid,
      lead_id: null,
      consent_type: 'marketing_whatsapp_email',
      consent_text: 'Revoked by user settings',
      granted: false,
      ip_address: null,
      user_agent: null,
      created_at: new Date('2026-10-30T14:00:00Z'),
    };

    const chain: Record<string, unknown> = {};
    chain.from = vi.fn(() => chain);
    chain.where = vi.fn(() => chain);
    chain.orderBy = vi.fn(() => chain);
    chain.limit = vi.fn().mockResolvedValue([revokedRow]);

    const mockDb = {
      insert: vi.fn(),
      select: vi.fn(() => chain),
    } as unknown as ConsentDbClient;

    const isActive = await hasActiveConsent(
      { userId: validUserUuid, consentType: 'marketing_whatsapp_email' },
      mockDb
    );
    expect(isActive).toBe(false);
  });

  it('hasActiveConsent returns false when no records exist', async () => {
    const chain: Record<string, unknown> = {};
    chain.from = vi.fn(() => chain);
    chain.where = vi.fn(() => chain);
    chain.orderBy = vi.fn(() => chain);
    chain.limit = vi.fn().mockResolvedValue([]);

    const mockDb = {
      insert: vi.fn(),
      select: vi.fn(() => chain),
    } as unknown as ConsentDbClient;

    const isActive = await hasActiveConsent(
      { leadId: validLeadUuid, consentType: 'marketing_whatsapp_email' },
      mockDb
    );
    expect(isActive).toBe(false);
  });

  it('hasActiveConsent throws if consentType is missing', async () => {
    const mockDb = { insert: vi.fn(), select: vi.fn() } as unknown as ConsentDbClient;
    await expect(
      hasActiveConsent({ userId: validUserUuid, consentType: '' }, mockDb)
    ).rejects.toThrow('consentType is required');
  });
});

describe('consent: pure in-memory helpers', () => {
  const rowGranted: UserConsent = {
    id: '1',
    user_id: 'user-1',
    lead_id: null,
    consent_type: 'terms_of_service',
    consent_text: 'Terms v1',
    granted: true,
    ip_address: '10.0.0.1',
    user_agent: 'Chrome',
    created_at: new Date('2026-01-01T00:00:00Z'),
  };

  const rowRevoked: UserConsent = {
    id: '2',
    user_id: 'user-1',
    lead_id: null,
    consent_type: 'terms_of_service',
    consent_text: 'Withdrawn',
    granted: false,
    ip_address: '10.0.0.1',
    user_agent: 'Chrome',
    created_at: new Date('2026-02-01T00:00:00Z'),
  };

  it('isConsentActive handles empty arrays or nonexistent types', () => {
    expect(isConsentActive([], 'terms_of_service')).toBe(false);
    expect(isConsentActive([rowGranted], 'privacy_policy')).toBe(false);
  });

  it('isConsentActive correctly honors the newest timestamp', () => {
    // Array passed in non-chronological order
    expect(isConsentActive([rowGranted, rowRevoked], 'terms_of_service')).toBe(false);
    expect(isConsentActive([rowRevoked, rowGranted], 'terms_of_service')).toBe(false);

    const reGranted: UserConsent = {
      ...rowGranted,
      id: '3',
      created_at: new Date('2026-03-01T00:00:00Z'),
    };
    expect(isConsentActive([rowGranted, rowRevoked, reGranted], 'terms_of_service')).toBe(true);
  });

  it('formatConsentAuditLine formats granted and revoked messages', () => {
    const line1 = formatConsentAuditLine(rowGranted);
    expect(line1).toContain("Consent 'terms_of_service' GRANTED for user:user-1 [ip: 10.0.0.1]");

    const line2 = formatConsentAuditLine(rowRevoked);
    expect(line2).toContain("Consent 'terms_of_service' REVOKED for user:user-1 [ip: 10.0.0.1]");

    const leadConsent: UserConsent = {
      ...rowGranted,
      user_id: null,
      lead_id: 'lead-99',
      ip_address: null,
    };
    const line3 = formatConsentAuditLine(leadConsent);
    expect(line3).toContain("Consent 'terms_of_service' GRANTED for lead:lead-99");
    expect(line3).not.toContain('[ip:');
  });
});
