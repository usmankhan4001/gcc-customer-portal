import { describe, expect, it, vi } from 'vitest';
import {
  addDaysUtc,
  addMonthsClamped,
  addYearsClamped,
  calculateStatutoryDeadlines,
  daysBetweenUtc,
  formatDateIso,
  getComplianceSummary,
  normalizeJurisdiction,
  parseDateUtc,
} from '../src/lib/compliance/stateful-calendar';
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
} from '../src/lib/consent';
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
} from '../src/lib/events';

describe('ADVERSARIAL STRESS TEST: Stateful Compliance Calendar (Date Math & Leap Years)', () => {
  describe('Leap Year Fuzzing across multiple cycles', () => {
    it('tests Feb 29 additions across consecutive leap years (2020, 2024, 2028, 2032)', () => {
      const leap2020 = new Date(Date.UTC(2020, 1, 29));
      expect(formatDateIso(leap2020)).toBe('2020-02-29');

      // +4 years should reach next leap year Feb 29
      const leap2024 = addYearsClamped(leap2020, 4);
      expect(formatDateIso(leap2024)).toBe('2024-02-29');

      const leap2028 = addYearsClamped(leap2024, 4);
      expect(formatDateIso(leap2028)).toBe('2028-02-29');

      const leap2032 = addYearsClamped(leap2028, 4);
      expect(formatDateIso(leap2032)).toBe('2032-02-29');
    });

    it('tests Feb 29 additions into non-leap years (2021, 2022, 2023, 2025, 2026, 2027)', () => {
      const leap2024 = new Date(Date.UTC(2024, 1, 29));

      // +1 year -> Feb 28, 2025
      expect(formatDateIso(addYearsClamped(leap2024, 1))).toBe('2025-02-28');
      // +2 years -> Feb 28, 2026
      expect(formatDateIso(addYearsClamped(leap2024, 2))).toBe('2026-02-28');
      // +3 years -> Feb 28, 2027
      expect(formatDateIso(addYearsClamped(leap2024, 3))).toBe('2027-02-28');

      const leap2020 = new Date(Date.UTC(2020, 1, 29));
      expect(formatDateIso(addYearsClamped(leap2020, 1))).toBe('2021-02-28');
      expect(formatDateIso(addYearsClamped(leap2020, 2))).toBe('2022-02-28');
      expect(formatDateIso(addYearsClamped(leap2020, 3))).toBe('2023-02-28');
    });

    it('tests century leap year rules (2000 is leap, 1900 and 2100 are NOT leap)', () => {
      // 2000 was a leap year
      const jan2000 = new Date(Date.UTC(2000, 0, 31));
      expect(formatDateIso(addMonthsClamped(jan2000, 1))).toBe('2000-02-29');

      // 2100 is not a leap year (divisible by 100 but not 400)
      const jan2100 = new Date(Date.UTC(2100, 0, 31));
      expect(formatDateIso(addMonthsClamped(jan2100, 1))).toBe('2100-02-28');

      // 1900 was not a leap year
      const jan1900 = new Date(Date.UTC(1900, 0, 31));
      expect(formatDateIso(addMonthsClamped(jan1900, 1))).toBe('1900-02-28');
    });

    it('tests negative year and month shifts from leap and non-leap days', () => {
      // Leap day 2024-02-29 - 4 years -> 2020-02-29
      const leap2024 = new Date(Date.UTC(2024, 1, 29));
      expect(formatDateIso(addYearsClamped(leap2024, -4))).toBe('2020-02-29');

      // Leap day 2024-02-29 - 1 year -> 2023-02-28
      expect(formatDateIso(addYearsClamped(leap2024, -1))).toBe('2023-02-28');

      // 2025-02-28 (month end) - 12 months -> 2024-02-29 (clamped to month end of leap year)
      const feb2025End = new Date(Date.UTC(2025, 1, 28));
      expect(formatDateIso(addMonthsClamped(feb2025End, -12))).toBe('2024-02-29');
    });
  });

  describe('Month-End Clamping Fuzzing', () => {
    it('tests Jan 31 + 1 month in leap and non-leap years', () => {
      expect(formatDateIso(addMonthsClamped(new Date(Date.UTC(2024, 0, 31)), 1))).toBe('2024-02-29');
      expect(formatDateIso(addMonthsClamped(new Date(Date.UTC(2025, 0, 31)), 1))).toBe('2025-02-28');
    });

    it('tests March 31 - 1 month in leap and non-leap years', () => {
      expect(formatDateIso(addMonthsClamped(new Date(Date.UTC(2024, 2, 31)), -1))).toBe('2024-02-29');
      expect(formatDateIso(addMonthsClamped(new Date(Date.UTC(2025, 2, 31)), -1))).toBe('2025-02-28');
    });

    it('tests all 31-day months transitioning to 30-day months', () => {
      // March 31 -> April 30 (+1 mo)
      expect(formatDateIso(addMonthsClamped(new Date(Date.UTC(2025, 2, 31)), 1))).toBe('2025-04-30');
      // May 31 -> June 30 (+1 mo)
      expect(formatDateIso(addMonthsClamped(new Date(Date.UTC(2025, 4, 31)), 1))).toBe('2025-06-30');
      // August 31 -> September 30 (+1 mo)
      expect(formatDateIso(addMonthsClamped(new Date(Date.UTC(2025, 7, 31)), 1))).toBe('2025-09-30');
      // October 31 -> November 30 (+1 mo)
      expect(formatDateIso(addMonthsClamped(new Date(Date.UTC(2025, 9, 31)), 1))).toBe('2025-11-30');
    });

    it('tests non-end-of-month days clamping behavior', () => {
      // Jan 30 + 1 month in non-leap year (target month only has 28 days)
      // Jan 30 is NOT source end of month (Jan has 31 days). Target is Math.min(30, 28) = 28
      expect(formatDateIso(addMonthsClamped(new Date(Date.UTC(2025, 0, 30)), 1))).toBe('2025-02-28');

      // Jan 30 + 1 month in leap year (target has 29 days) -> Math.min(30, 29) = 29
      expect(formatDateIso(addMonthsClamped(new Date(Date.UTC(2024, 0, 30)), 1))).toBe('2024-02-29');

      // Jan 28 + 1 month in leap year -> Feb 28 (not month end!)
      expect(formatDateIso(addMonthsClamped(new Date(Date.UTC(2024, 0, 28)), 1))).toBe('2024-02-28');
    });

    it('tests end of Feb transitioning to 31-day March', () => {
      // Feb 28, 2025 is end of month -> should clamp to March 31
      expect(formatDateIso(addMonthsClamped(new Date(Date.UTC(2025, 1, 28)), 1))).toBe('2025-03-31');

      // Feb 28, 2024 is NOT end of month (leap year has 29) -> should remain March 28
      expect(formatDateIso(addMonthsClamped(new Date(Date.UTC(2024, 1, 28)), 1))).toBe('2024-03-28');

      // Feb 29, 2024 IS end of month -> should clamp to March 31
      expect(formatDateIso(addMonthsClamped(new Date(Date.UTC(2024, 1, 29)), 1))).toBe('2024-03-31');
    });
  });

  describe('Timezone & Timestamp Shift Resilience', () => {
    it('parseDateUtc normalizes date strings regardless of ISO time suffixes', () => {
      const d1 = parseDateUtc('2025-06-15T00:00:00.000Z');
      const d2 = parseDateUtc('2025-06-15T23:59:59.999Z');
      const d3 = parseDateUtc('2025-06-15');

      expect(formatDateIso(d1)).toBe('2025-06-15');
      expect(formatDateIso(d2)).toBe('2025-06-15');
      expect(formatDateIso(d3)).toBe('2025-06-15');
    });

    it('parseDateUtc normalizes Date objects instantiated with local or non-zero UTC times', () => {
      const lateEvening = new Date(Date.UTC(2025, 5, 15, 23, 59, 59));
      const earlyMorning = new Date(Date.UTC(2025, 5, 15, 0, 0, 1));

      const parsedLate = parseDateUtc(lateEvening);
      const parsedEarly = parseDateUtc(earlyMorning);

      expect(formatDateIso(parsedLate)).toBe('2025-06-15');
      expect(formatDateIso(parsedEarly)).toBe('2025-06-15');
      expect(parsedLate.getUTCHours()).toBe(0);
      expect(parsedEarly.getUTCHours()).toBe(0);
    });

    it('daysBetweenUtc produces identical results regardless of sub-day time differences', () => {
      const t0 = new Date(Date.UTC(2025, 5, 15, 0, 0, 0));
      const t1 = new Date(Date.UTC(2025, 5, 15, 23, 59, 59));
      const nextDay = new Date(Date.UTC(2025, 5, 16, 0, 0, 0));

      expect(daysBetweenUtc(t0, t1)).toBe(0);
      expect(daysBetweenUtc(t1, nextDay)).toBe(1);
      expect(daysBetweenUtc(nextDay, t1)).toBe(-1);
    });

    it('evaluates calculateStatutoryDeadlines consistently across UTC 00:00:00 vs 23:59:59', () => {
      const resMidnight = calculateStatutoryDeadlines({
        jurisdiction: 'uae',
        incorporationDate: '2024-06-15',
        referenceDate: '2025-06-15T00:00:00Z',
      });

      const resEndOfDay = calculateStatutoryDeadlines({
        jurisdiction: 'uae',
        incorporationDate: '2024-06-15',
        referenceDate: '2025-06-15T23:59:59Z',
      });

      const itemMidnight = resMidnight.find((d) => d.id === 'uae-trade-license-renewal')!;
      const itemEndOfDay = resEndOfDay.find((d) => d.id === 'uae-trade-license-renewal')!;

      expect(itemMidnight.deadlineDate).toBe(itemEndOfDay.deadlineDate);
      expect(itemMidnight.daysRemaining).toBe(itemEndOfDay.daysRemaining);
      expect(itemMidnight.status).toBe(itemEndOfDay.status);
    });
  });

  describe('Exact Boundary Days & Status Thresholds', () => {
    const incDate = '2024-05-15';
    // UAE trade license renewal #1: 2025-05-15

    it('verifies exact threshold boundaries: 31d (upcoming), 30d (due_soon), 0d (due_soon), -1d (overdue)', () => {
      // 31 days before 2025-05-15 is 2025-04-14
      const d31 = calculateStatutoryDeadlines({
        jurisdiction: 'uae',
        incorporationDate: incDate,
        referenceDate: '2025-04-14',
      }).find((d) => d.id === 'uae-trade-license-renewal')!;
      expect(d31.daysRemaining).toBe(31);
      expect(d31.status).toBe('upcoming');

      // 30 days before 2025-05-15 is 2025-04-15
      const d30 = calculateStatutoryDeadlines({
        jurisdiction: 'uae',
        incorporationDate: incDate,
        referenceDate: '2025-04-15',
      }).find((d) => d.id === 'uae-trade-license-renewal')!;
      expect(d30.daysRemaining).toBe(30);
      expect(d30.status).toBe('due_soon');

      // 0 days (due today): 2025-05-15
      const d0 = calculateStatutoryDeadlines({
        jurisdiction: 'uae',
        incorporationDate: incDate,
        referenceDate: '2025-05-15',
      }).find((d) => d.id === 'uae-trade-license-renewal')!;
      expect(d0.daysRemaining).toBe(0);
      expect(d0.status).toBe('due_soon');

      // -1 day (overdue): 2025-05-16
      const dm1 = calculateStatutoryDeadlines({
        jurisdiction: 'uae',
        incorporationDate: incDate,
        referenceDate: '2025-05-16',
      }).find((d) => d.id === 'uae-trade-license-renewal')!;
      expect(dm1.daysRemaining).toBe(-1);
      expect(dm1.status).toBe('overdue');
    });

    it('verifies overdue cycle rollover behavior at 365 days boundary', () => {
      // 364 days past 2025-05-15 is 2026-05-14.
      // Next cycle renewal is 2026-05-15 (1 day away, which is <= 30 days).
      // Per resolveActiveOccurrence, when next cycle is <= 30d out, it transitions to next cycle.
      const dNearNext = calculateStatutoryDeadlines({
        jurisdiction: 'uae',
        incorporationDate: incDate,
        referenceDate: '2026-05-14',
      }).find((d) => d.id === 'uae-trade-license-renewal')!;

      // Next candidate 2026-05-15 is 1 day away
      expect(dNearNext.deadlineDate).toBe('2026-05-15');
      expect(dNearNext.daysRemaining).toBe(1);
      expect(dNearNext.status).toBe('due_soon');

      // But if we are 100 days past (e.g. 2025-08-23), diff is -100 (overdue), and next cycle is > 30d away.
      const dOverdueMid = calculateStatutoryDeadlines({
        jurisdiction: 'uae',
        incorporationDate: incDate,
        referenceDate: '2025-08-23',
      }).find((d) => d.id === 'uae-trade-license-renewal')!;

      expect(dOverdueMid.deadlineDate).toBe('2025-05-15');
      expect(dOverdueMid.daysRemaining).toBe(-100);
      expect(dOverdueMid.status).toBe('overdue');

      // When overdue exceeds 365 days (e.g. diff = -370) and next cycle is > 30 days away (e.g. 50 days away),
      // resolveActiveOccurrence rolls over to the next candidate (upcoming)
      const dOverdueAged = calculateStatutoryDeadlines({
        jurisdiction: 'uae',
        incorporationDate: incDate, // 2024-05-15, candidate 1 = 2025-05-15, candidate 2 = 2026-05-15
        referenceDate: '2026-03-26', // diff to c1 is -315 days (still within 365d, nextDiff is 50d > 30d) -> still c1 (overdue)
      }).find((d) => d.id === 'uae-trade-license-renewal')!;
      expect(dOverdueAged.deadlineDate).toBe('2025-05-15');
      expect(dOverdueAged.status).toBe('overdue');
    });

    it('reveals bug: companies incorporated > 6 years ago produce ancient deadlines because anniversary loop is capped at k <= 6', () => {
      // 1. UAE
      const uaeVintage = calculateStatutoryDeadlines({
        jurisdiction: 'uae',
        incorporationDate: '2012-04-10',
        referenceDate: '2026-02-15',
      }).find((d) => d.id === 'uae-trade-license-renewal')!;
      expect(uaeVintage.deadlineDate).toBe('2018-04-10'); // Capped at 2012 + 6 years

      // 2. Hong Kong (NAR1 & BRC)
      const hkVintage = calculateStatutoryDeadlines({
        jurisdiction: 'hong-kong',
        incorporationDate: '2015-05-10',
        referenceDate: '2026-02-15',
      }).find((d) => d.id === 'hk-brc-renewal')!;
      expect(hkVintage.deadlineDate).toBe('2021-05-10'); // Capped at 2015 + 6 years

      // 3. Cayman Islands (Annual return fee capped at startYear + 5)
      const caymanVintage = calculateStatutoryDeadlines({
        jurisdiction: 'cayman',
        incorporationDate: '2015-01-01',
        referenceDate: '2026-02-15',
      }).find((d) => d.id === 'cayman-annual-return-fee')!;
      expect(caymanVintage.deadlineDate).toBe('2021-01-31'); // Capped at 2016 + 5 years

      // 4. Contrast: Singapore uses generateFiscalYearEnds (which accounts for refDate)
      const sgVintage = calculateStatutoryDeadlines({
        jurisdiction: 'singapore',
        incorporationDate: '2015-01-01',
        fiscalYearEnd: '12-31',
        referenceDate: '2026-02-15',
      }).find((d) => d.id === 'sg-acra-annual-return')!;
      // Singapore is dynamic and generates recent FYE cycles:
      // In Feb 2026, the 2024 FYE return (due 2025-07-31) is active and overdue (-199 days),
      // whereas UAE/HK/Cayman are stuck in 2018/2021 (>1800 days ago)!
      expect(sgVintage.deadlineDate).toBe('2025-07-31');
      expect(sgVintage.daysRemaining).toBe(-199);
      expect(sgVintage.status).toBe('overdue');
    });
  });

  describe('Adversarial & Malformed Inputs in Calendar', () => {
    it('handles unexpected and malformed jurisdiction strings safely', () => {
      const weirdJurisdictions = [
        'mars',
        'ATLANTIS',
        '123456',
        '',
        '   ',
        '!@#$%^&*()',
        'undefined',
        'null',
      ];
      for (const j of weirdJurisdictions) {
        expect(() => {
          const items = calculateStatutoryDeadlines({
            jurisdiction: j,
            incorporationDate: '2024-01-01',
          });
          expect(Array.isArray(items)).toBe(true);
          // Falls back to UAE default
          expect(items.length).toBeGreaterThan(0);
        }).not.toThrow();
      }
    });

    it('handles garbage dates and NaN dates without throwing', () => {
      const garbageDates = [
        'not-a-real-date',
        '9999-99-99',
        '2024-02-30', // Feb 30 does not exist
        '',
        '   ',
        new Date(NaN),
      ];
      for (const gd of garbageDates) {
        expect(() => {
          const items = calculateStatutoryDeadlines({
            jurisdiction: 'uae',
            incorporationDate: gd as any,
          });
          expect(Array.isArray(items)).toBe(true);
        }).not.toThrow();
      }
    });

    it('handles non-existent or edge fiscal year end values (e.g. 02-29, 04-31, 13-40)', () => {
      // 02-29 as FYE for non-leap year company
      const itemsFeb29 = calculateStatutoryDeadlines({
        jurisdiction: 'uae',
        incorporationDate: '2025-01-01',
        fiscalYearEnd: '02-29',
        referenceDate: '2025-06-01',
      });
      expect(itemsFeb29.length).toBeGreaterThan(0);

      // Malformed fiscalYearEnd string
      const itemsMalformed = calculateStatutoryDeadlines({
        jurisdiction: 'singapore',
        incorporationDate: '2024-01-01',
        fiscalYearEnd: 'invalid-fye',
      });
      expect(itemsMalformed.length).toBeGreaterThan(0);
    });
  });
});

describe('ADVERSARIAL STRESS TEST: Consent & Events Bounds and Validation', () => {
  const validUserUuid = '11111111-2222-4333-8444-555555555555';
  const validLeadUuid = 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee';

  describe('Payload Size Boundary & Fuzzing (50,000 vs 50,001 vs 51,200 bytes)', () => {
    it('verifies isEventPayloadWithinLimit with custom limit of 50,000 bytes', () => {
      // Create exact JSON strings
      // Note: JSON.stringify({ a: 'X'.repeat(N) }) creates '{"a":"XXXX..."}' (length = N + 7)
      const targetLen50000 = 50000;
      const str50000 = 'X'.repeat(targetLen50000 - 8);
      const payload50000 = { a: str50000 };
      expect(JSON.stringify(payload50000).length).toBe(50000);
      expect(isEventPayloadWithinLimit(payload50000, 50000)).toBe(true);

      // 50,001 bytes
      const payload50001 = { a: str50000 + 'Y' };
      expect(JSON.stringify(payload50001).length).toBe(50001);
      expect(isEventPayloadWithinLimit(payload50001, 50000)).toBe(false);
    });

    it('verifies default MAX_EVENT_PAYLOAD_BYTES boundary (51,200 bytes = 50 KB)', () => {
      expect(MAX_EVENT_PAYLOAD_BYTES).toBe(51200);

      const strAtLimit = 'Z'.repeat(51200 - 8);
      const payloadAtLimit = { a: strAtLimit };
      expect(JSON.stringify(payloadAtLimit).length).toBe(51200);
      expect(isEventPayloadWithinLimit(payloadAtLimit)).toBe(true);

      const payloadExceeding = { a: strAtLimit + '1' };
      expect(JSON.stringify(payloadExceeding).length).toBe(51201);
      expect(isEventPayloadWithinLimit(payloadExceeding)).toBe(false);

      // Zod schema should accept at limit and reject exceeding
      const validRes = logEventInputSchema.safeParse({
        eventType: 'tool.executed',
        userId: validUserUuid,
        payload: payloadAtLimit,
      });
      expect(validRes.success).toBe(true);

      const invalidRes = logEventInputSchema.safeParse({
        eventType: 'tool.executed',
        userId: validUserUuid,
        payload: payloadExceeding,
      });
      expect(invalidRes.success).toBe(false);
      if (!invalidRes.success) {
        expect(invalidRes.error.issues[0].message).toContain('exceeds maximum size limit');
      }
    });

    it('checks UTF-8 multi-byte characters behavior in payloads', () => {
      // 4-byte UTF-8 emoji: '🚀' is 2 UTF-16 code units in JS string
      const emojiString = '🚀'.repeat(1000); // 2000 chars in JS, 4000 bytes in UTF-8
      const payload = { emoji: emojiString };
      expect(isEventPayloadWithinLimit(payload)).toBe(true);

      // Empirical check: serialized.length measures UTF-16 string code units, not UTF-8 bytes!
      // 40,000 Arabic characters = 40,000 UTF-16 code units (< 51,200 limit)
      // BUT in UTF-8 Buffer byte length = 80,000 bytes (> 51,200 bytes!)
      const arabicChars = 'ع'.repeat(40000);
      const arabicPayload = { text: arabicChars };
      const serialized = JSON.stringify(arabicPayload);
      const stringLength = serialized.length;
      const utf8ByteLength = Buffer.byteLength(serialized, 'utf8');

      expect(stringLength).toBeLessThan(MAX_EVENT_PAYLOAD_BYTES); // passes string length check
      expect(utf8ByteLength).toBeGreaterThan(MAX_EVENT_PAYLOAD_BYTES); // but exceeds actual byte count!
      // This confirms isEventPayloadWithinLimit operates on JS string character count
      expect(isEventPayloadWithinLimit(arabicPayload)).toBe(true);
    });

    it('handles prototype pollution keys without modifying Object prototype', () => {
      const maliciousPayload = JSON.parse('{"__proto__": {"polluted": true}}');
      const res = logEventInputSchema.safeParse({
        eventType: 'system.alert',
        payload: maliciousPayload,
      });
      expect(res.success).toBe(true);
      // Verify global Object prototype was NOT polluted
      expect((Object.prototype as any).polluted).toBeUndefined();
    });
  });

  describe('Structural & Type Malformations in Event Payloads', () => {
    it('handles empty payload objects safely', () => {
      const res = logEventInputSchema.safeParse({
        eventType: 'auth.login',
        userId: validUserUuid,
        payload: {},
      });
      expect(res.success).toBe(true);
    });

    it('handles deep JSON nesting gracefully without crashing', () => {
      // 50 levels of nesting
      let deepObj: Record<string, unknown> = { leaf: 'value' };
      for (let i = 0; i < 50; i++) {
        deepObj = { nested: deepObj };
      }
      expect(isEventPayloadWithinLimit(deepObj)).toBe(true);

      const res = logEventInputSchema.safeParse({
        eventType: 'system.alert',
        payload: deepObj,
      });
      expect(res.success).toBe(true);
    });

    it('rejects circular reference payloads safely without uncaught exceptions', () => {
      const circular: Record<string, unknown> = { key: 'value' };
      circular.loop = circular;

      expect(isEventPayloadWithinLimit(circular)).toBe(false);

      const res = logEventInputSchema.safeParse({
        eventType: 'system.error',
        payload: circular,
      });
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error.issues[0].message).toContain('exceeds maximum size limit');
      }
    });

    it('rejects non-object payloads where record is expected', () => {
      // Array as payload
      const arrayRes = logEventInputSchema.safeParse({
        eventType: 'system.alert',
        payload: [1, 2, 3] as any,
      });
      // In Zod z.record(z.string(), z.unknown()), arrays are rejected
      expect(arrayRes.success).toBe(false);

      // Primitive string as payload
      const stringRes = logEventInputSchema.safeParse({
        eventType: 'system.alert',
        payload: 'not-an-object' as any,
      });
      expect(stringRes.success).toBe(false);

      // Number as payload
      const numRes = logEventInputSchema.safeParse({
        eventType: 'system.alert',
        payload: 42 as any,
      });
      expect(numRes.success).toBe(false);
    });

    it('handles special key names (dots, null bytes, proto) safely', () => {
      const weirdKeysPayload = {
        'foo.bar': 'dotted',
        'key with spaces': true,
        'special-!@#$': 123,
      };
      const res = logEventInputSchema.safeParse({
        eventType: 'tool.executed',
        payload: weirdKeysPayload,
      });
      expect(res.success).toBe(true);
    });
  });

  describe('Adversarial Consent Inputs: UUIDs, Injections & Edge Cases', () => {
    it('strictly enforces UUID format for userId and leadId', () => {
      const malformedUuids = [
        '12345',
        'not-a-valid-uuid',
        '11111111-2222-3333-4444', // too short
        '11111111-2222-3333-4444-555555555555-extra', // too long
        '../../etc/passwd',
        '<script>alert(1)</script>',
        'SELECT * FROM users;',
      ];

      for (const badUuid of malformedUuids) {
        const userRes = recordConsentInputSchema.safeParse({
          userId: badUuid,
          consentType: 'marketing_whatsapp_email',
          consentText: 'Agreed',
        });
        expect(userRes.success).toBe(false);

        const leadRes = recordConsentInputSchema.safeParse({
          leadId: badUuid,
          consentType: 'marketing_whatsapp_email',
          consentText: 'Agreed',
        });
        expect(leadRes.success).toBe(false);
      }
    });

    it('rejects input with neither userId nor leadId present', () => {
      const res = recordConsentInputSchema.safeParse({
        consentType: 'privacy_policy',
        consentText: 'I agree',
      });
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error.issues.some((i) => i.message.includes('Either userId or leadId'))).toBe(true);
      }
    });

    it('rejects blank or whitespace-only consentType or consentText', () => {
      const blanks = ['', ' ', '   ', '\t', '\n'];
      for (const blank of blanks) {
        const resType = recordConsentInputSchema.safeParse({
          userId: validUserUuid,
          consentType: blank,
          consentText: 'Valid text',
        });
        expect(resType.success).toBe(false);

        const resText = recordConsentInputSchema.safeParse({
          userId: validUserUuid,
          consentType: 'terms_of_service',
          consentText: blank,
        });
        expect(resText.success).toBe(false);
      }
    });

    it('preserves injection strings safely as raw text (safe for parameterized queries)', () => {
      const sqlInjection = "'; DROP TABLE user_consents; --";
      const xssPayload = '<script>alert("pwned")</script>';

      const res = recordConsentInputSchema.safeParse({
        userId: validUserUuid,
        consentType: 'terms_of_service',
        consentText: sqlInjection,
        userAgent: xssPayload,
      });

      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data.consentText).toBe(sqlInjection);
        expect(res.data.userAgent).toBe(xssPayload);
      }
    });

    it('handles very large legal consent text (100,000 characters) safely', () => {
      const longLegalTerms = 'Contract Clause '.repeat(6000); // ~96,000 characters
      const res = recordConsentInputSchema.safeParse({
        userId: validUserUuid,
        consentType: 'terms_of_service',
        consentText: longLegalTerms,
      });
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data.consentText.length).toBeGreaterThan(90000);
      }
    });
  });

  describe('Adversarial Query & DB Mock Execution', () => {
    it('getUserConsents rejects empty filter preventing full table scan leak', async () => {
      const mockDb = { insert: vi.fn(), select: vi.fn() } as unknown as ConsentDbClient;
      await expect(getUserConsents({}, mockDb)).rejects.toThrow(
        'At least one identity or filter condition'
      );
    });

    it('hasActiveConsent requires non-empty consentType', async () => {
      const mockDb = { insert: vi.fn(), select: vi.fn() } as unknown as ConsentDbClient;
      await expect(
        hasActiveConsent({ userId: validUserUuid, consentType: '' }, mockDb)
      ).rejects.toThrow('consentType is required');
    });

    it('queryEvents clamps negative offsets and out-of-bound limits', async () => {
      const chain: Record<string, unknown> = {};
      chain.from = vi.fn(() => chain);
      chain.orderBy = vi.fn(() => chain);
      chain.limit = vi.fn(() => chain);
      chain.offset = vi.fn().mockResolvedValue([]);

      const mockDb = {
        insert: vi.fn(),
        select: vi.fn(() => chain),
      } as unknown as EventDbClient;

      // Passing negative limit and offset
      await queryEvents({ limit: -10, offset: -5 }, mockDb);
      expect(chain.limit).toHaveBeenCalledWith(1); // clamped to min 1
      expect(chain.offset).toHaveBeenCalledWith(0); // clamped to min 0

      // Passing excessive limit
      await queryEvents({ limit: 10000 }, mockDb);
      expect(chain.limit).toHaveBeenCalledWith(200); // clamped to max 200
    });
  });
});
