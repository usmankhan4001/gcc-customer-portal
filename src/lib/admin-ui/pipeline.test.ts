import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  filterItems,
  formatAmount,
  groupByStage,
  isTempPhone,
  jurisdictionInfo,
  nextStage,
  paymentTone,
  slaBadge,
  tierLabel,
  totalPipelineValue,
  type PipelineItem,
} from './pipeline';

const item = (over: Partial<PipelineItem>): PipelineItem => ({
  id: 'x',
  company_name: 'Apex FZE',
  jurisdiction: 'uae',
  status: 'lead',
  client_name: 'Tariq Mansoor',
  client_email: 'tariq@example.com',
  client_phone: '+971501234567',
  order: null,
  ...over,
});

describe('groupByStage (AC6)', () => {
  it.each([
    ['lead', 'intake'],
    ['onboarding', 'intake'],
    ['official_kyc_pending', 'kyc'],
    ['filing_in_progress', 'filing'],
    ['bank_opening', 'filing'],
    ['active', 'active'],
    ['renewal_due', 'active'],
    ['suspended', 'active'],
    ['archived', 'active'],
  ])('puts %s in %s', (status, key) => {
    const col = groupByStage([item({ status })]).find((c) => c.key === key)!;
    expect(col.count).toBe(1);
    expect(groupByStage([item({ status })]).reduce((n, c) => n + c.count, 0)).toBe(1);
  });

  it('counts match item lengths and keep column order', () => {
    const cols = groupByStage([item({ status: 'lead' }), item({ status: 'onboarding' }), item({ status: 'active' })]);
    expect(cols.map((c) => c.key)).toEqual(['intake', 'kyc', 'filing', 'active']);
    expect(cols.map((c) => c.count)).toEqual([2, 0, 0, 1]);
    cols.forEach((c) => expect(c.count).toBe(c.items.length));
  });
});

describe('filterItems', () => {
  const items = [
    item({ id: '1', company_name: 'Apex FZE' }),
    item({ id: '2', company_name: 'Lion Ltd', jurisdiction: 'singapore', client_name: null, client_email: null, client_phone: null }),
  ];
  it.each([
    ['all', '', ['1', '2']],
    ['singapore', '', ['2']],
    ['all', 'APEX', ['1']],
    ['all', 'tariq@', ['1']],
    ['all', '+97150', ['1']],
    ['all', 'mansoor', ['1']],
    ['uae', 'lion', []],
    ['all', '  ', ['1', '2']],
  ])('jurisdiction %s query %j', (j, q, ids) => {
    expect(filterItems(items, j, q).map((i) => i.id)).toEqual(ids);
  });
});

describe('mappings', () => {
  it.each([
    ['lead', 'official_kyc_pending'],
    ['onboarding', 'official_kyc_pending'],
    ['official_kyc_pending', 'filing_in_progress'],
    ['bank_opening', 'active'],
    ['active', null],
    ['suspended', null],
  ])('nextStage(%s) = %s', (s, n) => expect(nextStage(s)).toBe(n));

  it.each([
    ['red', 9, 'badge-danger', '9d (SLA Overdue)'],
    ['yellow', 5, 'badge-accent', '5d in stage'],
    ['green', 1, '', '1d in stage'],
  ])('slaBadge(%s)', (s, d, tone, label) => expect(slaBadge(s, d)).toEqual({ label, tone }));

  it('payment tone, labels, amounts, temp phones', () => {
    expect(paymentTone('paid')).toBe('badge-success');
    expect(paymentTone('pending')).toBe('badge-accent');
    expect(jurisdictionInfo('bvi').label).toBe('BVI / Cayman');
    expect(jurisdictionInfo('mars')).toEqual({ label: 'MARS', flag: '🌐' });
    expect(tierLabel('tier_2_nominee')).toBe('Nominee UBO');
    expect(tierLabel('other')).toBe('other');
    expect(formatAmount(150000)).toBe('$1,500');
    expect(isTempPhone('temp_123')).toBe(true);
    expect(isTempPhone(null)).toBe(true);
    expect(isTempPhone('+1')).toBe(false);
    expect(totalPipelineValue([{ order: { amount_total: 100 } }, { order: null }])).toBe(100);
  });
});

describe('page source (AC1 to AC3)', () => {
  const src = readFileSync(join(process.cwd(), 'src/app/admin/page.tsx'), 'utf8');

  it('AC1: wrap admin-page, PageHeader, one h1', () => {
    expect(src).toContain('<div className="wrap admin-page">');
    expect(src).toContain('<PageHeader');
    expect(src).not.toMatch(/<h1/);
  });

  it('AC2: no hex colours or Tailwind colour/layout utilities', () => {
    expect(src).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    for (const bad of ['bg-gray-', 'text-gray-', 'bg-slate-', 'text-slate-', 'h-screen', 'overflow-hidden']) {
      expect(src).not.toContain(bad);
    }
  });

  it('AC3: CMS state patterns', () => {
    expect(src).toContain('admin-state');
    expect(src).toContain('cl-empty is-error');
    expect(src).toContain('"cl-empty"');
  });
});
