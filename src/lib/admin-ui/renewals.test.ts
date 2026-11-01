import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { formatAmount, mockRenewals, renewalBadgeClass, summarizeRenewals } from './renewals';

const page = readFileSync(join(process.cwd(), 'src/app/admin/renewals/page.tsx'), 'utf8');

describe('renewalBadgeClass (AC6)', () => {
  it.each([
    ['Upcoming', 'badge badge-info'],
    ['Overdue', 'badge badge-danger'],
    ['Unknown', 'badge badge-danger'],
  ])('%s -> %s', (status, cls) => expect(renewalBadgeClass(status)).toBe(cls));
});

describe('formatAmount', () => {
  it.each([
    [0, '$0'],
    [999, '$999'],
    [1500, '$1,500'],
    [45000, '$45,000'],
  ])('%d -> %s', (n, out) => expect(formatAmount(n)).toBe(out));
});

describe('summarizeRenewals (AC6)', () => {
  it.each([
    [[], { upcoming: 0, overdue: 0, revenue: 0 }],
    [mockRenewals, { upcoming: 2, overdue: 2, revenue: 17000 }],
    [mockRenewals.slice(0, 1), { upcoming: 1, overdue: 0, revenue: 5000 }],
  ])('totals %#', (rows, out) => expect(summarizeRenewals(rows)).toEqual(out));
});

describe('renewals page source (AC1-AC3)', () => {
  it('uses the page skeleton with one h1 via PageHeader', () => {
    expect(page).toContain('<div className="wrap admin-page">');
    expect(page).toContain('<PageHeader');
    expect(page).not.toContain('<h1');
  });
  it.each(['bg-gray-', 'text-gray-', 'h-screen', 'overflow-hidden'])('has no %s', (s) =>
    expect(page).not.toContain(s),
  );
  it('has no hex colours', () => expect(page).not.toMatch(/#[0-9a-fA-F]{3,8}\b/));
  it('uses the CMS empty state and table classes', () => {
    expect(page).toContain('cl-empty');
    expect(page).toContain('admin-table');
    expect(page).toContain('admin-metrics-grid');
  });
});
