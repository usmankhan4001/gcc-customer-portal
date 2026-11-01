import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { filterClients, formatClientId, statusBadgeClass, type ClientRow, type StatusFilter } from './clients';

const rows: ClientRow[] = [
  { id: 1, name: 'Ali Al-Farsi', phone: '+971 50 123 4567', company: 'Gulf Tech Solutions', status: 'Verified' },
  { id: 2, name: 'Sarah Ahmed', phone: '+971 55 987 6543', company: 'Desert Sands LLC', status: 'Pending' },
  { id: 3, name: 'Omar Farooq', phone: '+971 54 111 2222', company: 'Falcon Logistics', status: 'Pending' },
  { id: 4, name: 'Fatima Al-Zahra', phone: '+971 50 555 6666', company: 'Crescent Trading', status: 'Rejected' },
];

describe('filterClients', () => {
  const cases: [string, string, StatusFilter, number[]][] = [
    ['empty search, All', '', 'All', [1, 2, 3, 4]],
    ['name, case-insensitive', 'sARAH', 'All', [2]],
    ['company, case-insensitive', 'falcon', 'All', [3]],
    ['phone substring', '987 6543', 'All', [2]],
    ['status only', '', 'Pending', [2, 3]],
    ['search and status combined', 'al-', 'Rejected', [4]],
    ['search matches but status does not', 'ali', 'Rejected', []],
    ['no match', 'zzz', 'All', []],
  ];
  it.each(cases)('%s', (_n, q, status, ids) => {
    expect(filterClients(rows, q, status).map((c) => c.id)).toEqual(ids);
  });
});

describe('statusBadgeClass', () => {
  it.each([
    ['Verified', 'badge badge-success'],
    ['Pending', 'badge badge-accent'],
    ['Rejected', 'badge badge-danger'],
  ] as const)('%s', (s, cls) => expect(statusBadgeClass(s)).toBe(cls));
});

describe('formatClientId', () => {
  it.each([
    [1, 'ID: #0001'],
    [42, 'ID: #0042'],
    [12345, 'ID: #12345'],
  ])('%i', (id, out) => expect(formatClientId(id)).toBe(out));
});

describe('clients page source (AC1-AC3, AC5)', () => {
  const src = readFileSync(join(__dirname, '../../app/admin/clients/page.tsx'), 'utf8');
  it('uses the page skeleton with one PageHeader and one h1', () => {
    expect(src).toContain('<div className="wrap admin-page">');
    expect(src).toContain('<PageHeader');
    expect(src.match(/<h1/g)).toBeNull(); // h1 comes from PageHeader
  });
  it('has no hard-coded colours or Tailwind colour/layout utilities', () => {
    for (const bad of ['bg-gray-', 'text-gray-', 'h-screen', 'overflow-hidden']) expect(src).not.toContain(bad);
    expect(src).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
  });
  it('uses CMS empty state and table/toolbar classes', () => {
    for (const cls of ['cl-empty', 'cl-toolbar', 'cl-search', 'admin-table', 'hide-phone', 'cl-cell-menu']) {
      expect(src).toContain(cls);
    }
  });
  it('keeps real, named controls', () => {
    expect(src).toContain('aria-label="Search clients"');
    expect(src).toContain('aria-label="Filter by KYC status"');
    expect(src).toContain('Verify');
    expect(src).toContain('Reject');
  });
});
