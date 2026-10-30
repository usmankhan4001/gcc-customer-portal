import { and, desc, eq, gte, lte } from 'drizzle-orm';
import { z } from 'zod';
import { db as defaultDb } from '@/lib/db';
import { events, type Event } from '@/lib/db/schema';

export const SYSTEM_EVENT_NAMESPACES = [
  'auth',
  'lead',
  'tool',
  'company',
  'milestone',
  'order',
  'document',
  'consent',
  'compliance',
  'system',
] as const;

export const STANDARD_EVENT_TYPES = [
  'auth.login',
  'auth.logout',
  'auth.otp_sent',
  'auth.otp_verified',
  'lead.captured',
  'lead.converted',
  'tool.executed',
  'pdf.generated',
  'company.created',
  'milestone.completed',
  'order.checkout_created',
  'order.paid',
  'document.uploaded',
  'document.viewed',
  'document.downloaded',
  'consent.granted',
  'consent.revoked',
  'system.alert',
  'system.error',
] as const;

export type StandardEventType = (typeof STANDARD_EVENT_TYPES)[number];

export const MAX_EVENT_PAYLOAD_BYTES = 50 * 1024; // 50 KB

/**
 * Validates that an arbitrary JSON-serializable structure is within the allowed byte size.
 */
export function isEventPayloadWithinLimit(payload: unknown, limit = MAX_EVENT_PAYLOAD_BYTES): boolean {
  if (payload === undefined || payload === null) return true;
  try {
    const serialized = JSON.stringify(payload);
    return typeof serialized === 'string' && serialized.length <= limit;
  } catch {
    return false;
  }
}

const optionalUuid = z.string().trim().uuid().optional().nullable();

export const logEventInputSchema = z
  .object({
    eventType: z.string().trim().min(1).optional(),
    event_type: z.string().trim().min(1).optional(),
    userId: optionalUuid,
    user_id: optionalUuid,
    leadId: optionalUuid,
    lead_id: optionalUuid,
    payload: z.record(z.string(), z.unknown()).default({}),
    ipAddress: z.string().trim().optional().nullable(),
    ip_address: z.string().trim().optional().nullable(),
    userAgent: z.string().trim().optional().nullable(),
    user_agent: z.string().trim().optional().nullable(),
  })
  .superRefine((data, ctx) => {
    const eventType = data.eventType ?? data.event_type;
    if (!eventType || eventType.trim() === '') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'event_type or eventType is required',
        path: ['eventType'],
      });
    }
    if (!isEventPayloadWithinLimit(data.payload)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Event payload exceeds maximum size limit of ${MAX_EVENT_PAYLOAD_BYTES} bytes`,
        path: ['payload'],
      });
    }
  })
  .transform((data) => ({
    eventType: (data.eventType ?? data.event_type)!,
    userId: data.userId ?? data.user_id ?? null,
    leadId: data.leadId ?? data.lead_id ?? null,
    payload: data.payload ?? {},
    ipAddress: data.ipAddress ?? data.ip_address ?? null,
    userAgent: data.userAgent ?? data.user_agent ?? null,
  }));

export type LogEventInput = z.input<typeof logEventInputSchema>;
export type ValidatedLogEventInput = z.output<typeof logEventInputSchema>;

export type EventDbClient = Pick<typeof defaultDb, 'insert' | 'select'>;

/**
 * Validates raw event input.
 */
export function validateEventInput(input: unknown): ValidatedLogEventInput {
  return logEventInputSchema.parse(input);
}

/**
 * Logs a system or lifecycle event to the immutable events table.
 */
export async function logSystemEvent(
  rawInput: LogEventInput,
  dbClient: EventDbClient = defaultDb
): Promise<Event> {
  const input = validateEventInput(rawInput);
  const rows = await dbClient
    .insert(events)
    .values({
      event_type: input.eventType,
      user_id: input.userId,
      lead_id: input.leadId,
      payload: input.payload,
      ip_address: input.ipAddress,
      user_agent: input.userAgent,
    })
    .returning();

  return rows[0];
}

export interface QueryEventsFilter {
  userId?: string | null;
  user_id?: string | null;
  leadId?: string | null;
  lead_id?: string | null;
  eventType?: string | null;
  event_type?: string | null;
  since?: Date | string | null;
  until?: Date | string | null;
  limit?: number;
  offset?: number;
}

/**
 * Queries events by identity, type, and time bounds, sorted newest first.
 */
export async function queryEvents(
  filter: QueryEventsFilter = {},
  dbClient: EventDbClient = defaultDb
): Promise<Event[]> {
  const userId = filter.userId ?? filter.user_id ?? null;
  const leadId = filter.leadId ?? filter.lead_id ?? null;
  const eventType = filter.eventType ?? filter.event_type ?? null;
  const limit = Math.min(Math.max(filter.limit ?? 50, 1), 200);
  const offset = Math.max(filter.offset ?? 0, 0);

  const conditions = [];
  if (userId) conditions.push(eq(events.user_id, userId));
  if (leadId) conditions.push(eq(events.lead_id, leadId));
  if (eventType) conditions.push(eq(events.event_type, eventType));

  if (filter.since) {
    const sinceDate = typeof filter.since === 'string' ? new Date(filter.since) : filter.since;
    conditions.push(gte(events.created_at, sinceDate));
  }
  if (filter.until) {
    const untilDate = typeof filter.until === 'string' ? new Date(filter.until) : filter.until;
    conditions.push(lte(events.created_at, untilDate));
  }

  const query = dbClient.select().from(events);
  const filteredQuery = conditions.length > 0 ? (query as any).where(and(...conditions)) : query;

  return await (filteredQuery as any)
    .orderBy(desc(events.created_at))
    .limit(limit)
    .offset(offset);
}

/**
 * Formats a single-line audit log representation of an event.
 */
export function formatEventLogLine(event: Event): string {
  const target = event.user_id
    ? `user:${event.user_id}`
    : event.lead_id
      ? `lead:${event.lead_id}`
      : 'system';
  const date = event.created_at ? new Date(event.created_at).toISOString() : new Date().toISOString();
  const payloadObj = (event.payload as Record<string, unknown>) || {};
  const payloadEntries = Object.entries(payloadObj);
  const payloadSummary = payloadEntries.length > 0 ? ` payload=${JSON.stringify(event.payload)}` : '';
  const ip = event.ip_address ? ` [ip: ${event.ip_address}]` : '';

  return `[${date}] [${event.event_type}] by ${target}${ip}${payloadSummary}`;
}

export interface MemoryEventFilter {
  eventType?: string;
  userId?: string;
  leadId?: string;
}

/**
 * Pure helper: filters an in-memory array of events by eventType, userId, or leadId.
 */
export function filterEventsInMemory(eventsList: Event[], filter: MemoryEventFilter): Event[] {
  return eventsList.filter((ev) => {
    if (filter.eventType && ev.event_type !== filter.eventType) return false;
    if (filter.userId && ev.user_id !== filter.userId) return false;
    if (filter.leadId && ev.lead_id !== filter.leadId) return false;
    return true;
  });
}
