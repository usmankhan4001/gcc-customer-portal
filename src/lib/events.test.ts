import { describe, expect, it, vi } from 'vitest';
import type { Event } from './db/schema';
import {
  filterEventsInMemory,
  formatEventLogLine,
  isEventPayloadWithinLimit,
  logEventInputSchema,
  logSystemEvent,
  MAX_EVENT_PAYLOAD_BYTES,
  queryEvents,
  STANDARD_EVENT_TYPES,
  SYSTEM_EVENT_NAMESPACES,
  validateEventInput,
  type EventDbClient,
} from './events';

describe('events: input validation & schema', () => {
  const validUserUuid = '11111111-2222-4333-8444-555555555555';
  const validLeadUuid = 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee';

  it('accepts valid input with camelCase eventType and userId', () => {
    const res = logEventInputSchema.safeParse({
      eventType: 'auth.login',
      userId: validUserUuid,
      payload: { method: 'otp' },
    });
    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.data.eventType).toBe('auth.login');
      expect(res.data.userId).toBe(validUserUuid);
      expect(res.data.leadId).toBeNull();
      expect(res.data.payload).toEqual({ method: 'otp' });
    }
  });

  it('accepts valid input with snake_case event_type and lead_id', () => {
    const res = logEventInputSchema.safeParse({
      event_type: 'lead.captured',
      lead_id: validLeadUuid,
      payload: { tool: 'tax_calculator', jurisdiction: 'uae' },
      ip_address: '192.168.1.100',
      user_agent: 'Chrome/120',
    });
    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.data.eventType).toBe('lead.captured');
      expect(res.data.leadId).toBe(validLeadUuid);
      expect(res.data.userId).toBeNull();
      expect(res.data.ipAddress).toBe('192.168.1.100');
      expect(res.data.userAgent).toBe('Chrome/120');
    }
  });

  it('accepts system-level event without userId or leadId', () => {
    const res = logEventInputSchema.safeParse({
      eventType: 'system.alert',
      payload: { code: 'HEALTH_CHECK_OK' },
    });
    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.data.userId).toBeNull();
      expect(res.data.leadId).toBeNull();
      expect(res.data.eventType).toBe('system.alert');
    }
  });

  it('defaults payload to empty object when omitted', () => {
    const res = logEventInputSchema.safeParse({
      eventType: 'milestone.completed',
      userId: validUserUuid,
    });
    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.data.payload).toEqual({});
    }
  });

  it('rejects empty or whitespace-only eventType', () => {
    const resEmpty = logEventInputSchema.safeParse({
      eventType: '',
    });
    expect(resEmpty.success).toBe(false);

    const resWhitespace = logEventInputSchema.safeParse({
      eventType: '   ',
    });
    expect(resWhitespace.success).toBe(false);

    const resMissing = logEventInputSchema.safeParse({});
    expect(resMissing.success).toBe(false);
  });

  it('rejects invalid UUID strings for userId or leadId', () => {
    const res1 = logEventInputSchema.safeParse({
      eventType: 'auth.login',
      userId: 'not-a-uuid',
    });
    expect(res1.success).toBe(false);

    const res2 = logEventInputSchema.safeParse({
      eventType: 'lead.captured',
      leadId: 'not-a-uuid',
    });
    expect(res2.success).toBe(false);
  });

  it('rejects payload exceeding maximum size limit (50KB)', () => {
    const hugePayload = {
      blob: 'X'.repeat(MAX_EVENT_PAYLOAD_BYTES + 1024),
    };
    const res = logEventInputSchema.safeParse({
      eventType: 'tool.executed',
      payload: hugePayload,
    });
    expect(res.success).toBe(false);
  });

  it('validateEventInput parses valid data and throws on invalid data', () => {
    const valid = validateEventInput({
      eventType: 'document.uploaded',
      userId: validUserUuid,
      payload: { documentId: 'doc-123' },
    });
    expect(valid.eventType).toBe('document.uploaded');

    expect(() => validateEventInput({ eventType: '' })).toThrow();
  });

  it('exposes taxonomies for standard namespaces and event types', () => {
    expect(SYSTEM_EVENT_NAMESPACES).toContain('auth');
    expect(SYSTEM_EVENT_NAMESPACES).toContain('lead');
    expect(SYSTEM_EVENT_NAMESPACES).toContain('tool');
    expect(SYSTEM_EVENT_NAMESPACES).toContain('consent');
    expect(SYSTEM_EVENT_NAMESPACES).toContain('compliance');

    expect(STANDARD_EVENT_TYPES).toContain('auth.login');
    expect(STANDARD_EVENT_TYPES).toContain('lead.captured');
    expect(STANDARD_EVENT_TYPES).toContain('order.paid');
    expect(STANDARD_EVENT_TYPES).toContain('consent.granted');
  });

  it('isEventPayloadWithinLimit correctly evaluates arbitrary payloads', () => {
    expect(isEventPayloadWithinLimit(null)).toBe(true);
    expect(isEventPayloadWithinLimit(undefined)).toBe(true);
    expect(isEventPayloadWithinLimit({ small: 'data' }, 100)).toBe(true);
    expect(isEventPayloadWithinLimit({ big: 'A'.repeat(200) }, 100)).toBe(false);

    const circular: Record<string, unknown> = {};
    circular.self = circular;
    expect(isEventPayloadWithinLimit(circular)).toBe(false);
  });
});

describe('events: DB query wrappers', () => {
  const validUserUuid = '11111111-2222-4333-8444-555555555555';
  const validLeadUuid = 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee';

  it('logSystemEvent inserts event row and returns inserted Event', async () => {
    let capturedValues: Record<string, unknown> | null = null;
    const mockRow: Event = {
      id: 'event-uuid-001',
      event_type: 'order.paid',
      user_id: validUserUuid,
      lead_id: null,
      payload: { orderId: 'ord-1', amount: 150000 },
      ip_address: '10.0.0.5',
      user_agent: 'StripeWebhook/1.0',
      created_at: new Date('2026-10-30T15:00:00Z'),
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
    } as unknown as EventDbClient;

    const result = await logSystemEvent(
      {
        eventType: 'order.paid',
        userId: validUserUuid,
        payload: { orderId: 'ord-1', amount: 150000 },
        ipAddress: '10.0.0.5',
        userAgent: 'StripeWebhook/1.0',
      },
      mockDb
    );

    expect(result).toEqual(mockRow);
    expect(capturedValues).toMatchObject({
      event_type: 'order.paid',
      user_id: validUserUuid,
      lead_id: null,
      payload: { orderId: 'ord-1', amount: 150000 },
      ip_address: '10.0.0.5',
      user_agent: 'StripeWebhook/1.0',
    });
  });

  it('queryEvents builds chained query with filters and pagination', async () => {
    const mockEvents: Event[] = [
      {
        id: 'ev-1',
        event_type: 'tool.executed',
        user_id: null,
        lead_id: validLeadUuid,
        payload: { tool: 'tax_calculator' },
        ip_address: null,
        user_agent: null,
        created_at: new Date('2026-10-30T14:00:00Z'),
      },
    ];

    const chain: Record<string, unknown> = {};
    chain.from = vi.fn(() => chain);
    chain.where = vi.fn(() => chain);
    chain.orderBy = vi.fn(() => chain);
    chain.limit = vi.fn(() => chain);
    chain.offset = vi.fn().mockResolvedValue(mockEvents);

    const mockDb = {
      insert: vi.fn(),
      select: vi.fn(() => chain),
    } as unknown as EventDbClient;

    const sinceDate = new Date('2026-10-01T00:00:00Z');
    const untilDate = new Date('2026-10-31T23:59:59Z');

    const result = await queryEvents(
      {
        leadId: validLeadUuid,
        eventType: 'tool.executed',
        since: sinceDate,
        until: untilDate,
        limit: 25,
        offset: 5,
      },
      mockDb
    );

    expect(result).toEqual(mockEvents);
    expect(mockDb.select).toHaveBeenCalled();
    expect(chain.from).toHaveBeenCalled();
    expect(chain.where).toHaveBeenCalled();
    expect(chain.orderBy).toHaveBeenCalled();
    expect(chain.limit).toHaveBeenCalledWith(25);
    expect(chain.offset).toHaveBeenCalledWith(5);
  });

  it('queryEvents functions without conditions and applies default limits', async () => {
    const chain: Record<string, unknown> = {};
    chain.from = vi.fn(() => chain);
    chain.orderBy = vi.fn(() => chain);
    chain.limit = vi.fn(() => chain);
    chain.offset = vi.fn().mockResolvedValue([]);

    const mockDb = {
      insert: vi.fn(),
      select: vi.fn(() => chain),
    } as unknown as EventDbClient;

    const result = await queryEvents({}, mockDb);
    expect(result).toEqual([]);
    expect(chain.limit).toHaveBeenCalledWith(50);
    expect(chain.offset).toHaveBeenCalledWith(0);
  });
});

describe('events: pure helpers', () => {
  const sampleEvent: Event = {
    id: 'ev-test',
    event_type: 'auth.login',
    user_id: 'user-789',
    lead_id: null,
    payload: { provider: 'whatsapp' },
    ip_address: '192.168.0.1',
    user_agent: 'MobileSafari',
    created_at: new Date('2026-10-30T10:00:00Z'),
  };

  it('formatEventLogLine formats user, lead and system events', () => {
    const lineUser = formatEventLogLine(sampleEvent);
    expect(lineUser).toContain('[auth.login] by user:user-789 [ip: 192.168.0.1]');
    expect(lineUser).toContain('payload={"provider":"whatsapp"}');

    const leadEvent: Event = {
      ...sampleEvent,
      user_id: null,
      lead_id: 'lead-321',
      ip_address: null,
      payload: {},
    };
    const lineLead = formatEventLogLine(leadEvent);
    expect(lineLead).toContain('[auth.login] by lead:lead-321');
    expect(lineLead).not.toContain('payload=');

    const systemEvent: Event = {
      ...sampleEvent,
      user_id: null,
      lead_id: null,
      ip_address: null,
    };
    const lineSystem = formatEventLogLine(systemEvent);
    expect(lineSystem).toContain('[auth.login] by system');
  });

  it('filterEventsInMemory accurately filters an event stream', () => {
    const ev1: Event = { ...sampleEvent, id: '1', event_type: 'auth.login', user_id: 'u1' };
    const ev2: Event = { ...sampleEvent, id: '2', event_type: 'tool.executed', user_id: 'u1' };
    const ev3: Event = {
      ...sampleEvent,
      id: '3',
      event_type: 'tool.executed',
      user_id: null,
      lead_id: 'l1',
    };

    const stream = [ev1, ev2, ev3];

    expect(filterEventsInMemory(stream, { eventType: 'tool.executed' })).toEqual([ev2, ev3]);
    expect(filterEventsInMemory(stream, { userId: 'u1' })).toEqual([ev1, ev2]);
    expect(filterEventsInMemory(stream, { leadId: 'l1' })).toEqual([ev3]);
    expect(filterEventsInMemory(stream, { eventType: 'tool.executed', userId: 'u1' })).toEqual([ev2]);
  });
});
