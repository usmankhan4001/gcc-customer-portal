import { describe, expect, it } from 'vitest';
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
