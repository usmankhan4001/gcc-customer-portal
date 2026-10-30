import { describe, expect, it } from 'vitest';
import { addMonths, computeDeadlines } from './compliance-calendar';

const iso = (d: Date) => d.toISOString().slice(0, 10);

describe('addMonths (AC1, AC2, AC4)', () => {
  it.each([
    ['2026-01-31', 1, '2026-02-28'], // clamp to Feb end
    ['2024-01-31', 1, '2024-02-29'], // clamp to leap Feb end
    ['2026-08-31', 1, '2026-09-30'], // 30-day month
    ['2026-03-31', 3, '2026-06-30'],
    ['2026-12-15', 3, '2027-03-15'], // year rollover
    ['2026-11-30', 3, '2027-02-28'], // rollover and clamp
    ['2028-02-29', 12, '2029-02-28'], // leap day to non-leap year
    ['2026-03-15', 12, '2027-03-15'],
    ['2026-03-15', 0, '2026-03-15'],
    ['2026-03-28', 21, '2027-12-28'],
  ])('%s + %i months = %s', (start, months, expected) => {
    expect(iso(addMonths(new Date(start), months))).toBe(expected);
  });

  it('does not throw on an invalid date and returns an invalid date', () => {
    expect(() => addMonths(new Date('not-a-date'), 1)).not.toThrow();
    expect(Number.isNaN(addMonths(new Date('not-a-date'), 1).getTime())).toBe(true);
  });
});

describe('computeDeadlines (AC3, AC4)', () => {
  const rows = computeDeadlines(new Date('2026-03-15'));

  it('keeps the same six rows, order and statuses', () => {
    expect(rows.map((r) => r.status)).toEqual(['Upcoming', 'Action Required', 'Pending', 'Pending', 'Pending', 'Upcoming']);
    expect(rows[0].requirement).toBe('Mandatory/Voluntary VAT Registration');
    expect(rows[5].requirement).toBe('Trade License & Establishment Card Annual Renewal');
  });

  it('keeps the +1/+3/+12/FYE+9/FYE+12 offsets in every row label', () => {
    const formation = new Date('2026-03-15');
    const fmt = (d: Date) => d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    const fye = addMonths(formation, 12);
    expect(rows.map((r) => r.deadlineLabel)).toEqual([
      fmt(addMonths(formation, 1)),
      fmt(addMonths(formation, 3)),
      fmt(fye),
      fmt(addMonths(fye, 9)),
      fmt(addMonths(fye, 12)),
      fmt(fye),
    ]);
  });

  it('licence renewal matches first financial year end', () => {
    expect(rows[5].deadlineLabel).toBe(rows[2].deadlineLabel);
  });

  it('does not throw on an invalid date', () => {
    expect(() => computeDeadlines(new Date('not-a-date'))).not.toThrow();
  });
});
