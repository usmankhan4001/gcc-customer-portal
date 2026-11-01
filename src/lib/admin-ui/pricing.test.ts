import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  bannerBadgeTone,
  bannerStatusLabel,
  formatCents,
  jurisdictionLabel,
  parsePriceToCents,
  tierLabel,
} from './pricing';

describe('parsePriceToCents', () => {
  it.each([
    ['1500', 150000],
    ['1500.00', 150000],
    ['19.99', 1999],
    ['0', 0],
    ['0.005', 1],
    ['-1', null],
    ['-0.01', null],
    ['', null],
    ['abc', null],
    ['Infinity', null],
  ])('%j -> %j', (input, expected) => {
    expect(parsePriceToCents(input)).toBe(expected);
  });
});

describe('formatCents', () => {
  it.each([
    [150000, '1500.00'],
    [1999, '19.99'],
    [0, '0.00'],
    [5, '0.05'],
  ])('%d -> %s', (cents, expected) => {
    expect(formatCents(cents)).toBe(expected);
  });

  it('round-trips with parsePriceToCents', () => {
    expect(parsePriceToCents(formatCents(123456))).toBe(123456);
  });
});

describe('labels', () => {
  it.each([
    ['tier_1_self', 'Self UBO (Basic)'],
    ['tier_2_nominee', 'Nominee UBO'],
    ['tier_3_shelf', 'Shelf Company'],
    ['unknown_tier', 'unknown_tier'],
  ])('tierLabel(%s)', (tier, expected) => {
    expect(tierLabel(tier)).toBe(expected);
  });

  it.each([
    ['hong-kong', 'hong kong'],
    ['uae', 'uae'],
  ])('jurisdictionLabel(%s)', (j, expected) => {
    expect(jurisdictionLabel(j)).toBe(expected);
  });
});

describe('banner status', () => {
  it.each([
    [true, 'badge-success', 'Active'],
    [false, 'badge-info', 'Inactive'],
  ])('active=%s', (active, tone, label) => {
    expect(bannerBadgeTone(active)).toBe(tone);
    expect(bannerStatusLabel(active)).toBe(label);
  });
});

describe('admin pricing page source (AC1-AC3)', () => {
  const src = readFileSync(join(process.cwd(), 'src/app/admin/pricing/page.tsx'), 'utf8');

  it('uses the CMS page skeleton with exactly one h1 (via PageHeader)', () => {
    expect(src).toContain('className="wrap admin-page"');
    expect(src).toContain('<PageHeader');
    expect(src).toMatch(/title="[^"]+"/);
    expect(src).toMatch(/subtitle=/);
    expect(src.match(/<h1/g)).toBeNull();
  });

  it('has no hard-coded colours or legacy layout utilities', () => {
    for (const banned of ['bg-gray-', 'text-gray-', 'h-screen', 'overflow-hidden']) {
      expect(src).not.toContain(banned);
    }
    expect(src).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
  });

  it('uses the CMS state patterns', () => {
    expect(src).toContain('admin-state');
    expect(src).toContain('cl-empty is-error');
    expect(src).toContain('cl-empty');
  });
});
