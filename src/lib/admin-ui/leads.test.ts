import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  formatCaptured,
  formatInterest,
  leadCountLabel,
  personaBadge,
  sourceBadge,
  trackBadge,
} from './leads';

describe('sourceBadge', () => {
  it.each([
    ['tax_calculator', 'Tax Calculator'],
    ['jurisdiction_quiz', 'Jurisdiction Fit Quiz'],
    ['qfzp_eligibility', 'QFZP Eligibility'],
    ['brand_new_tool', 'brand_new_tool'],
  ])('%s -> %s', (tool, label) => {
    expect(sourceBadge(tool)).toEqual({ label, className: 'badge badge-info' });
  });
});

describe('personaBadge', () => {
  it.each([
    [null, null],
    ['', null],
    ['founder', { label: 'founder', className: 'badge' }],
  ])('%s', (tag, expected) => {
    expect(personaBadge(tag)).toEqual(expected);
  });
});

describe('trackBadge', () => {
  it.each([
    [null, null],
    ['consultation_led', { label: 'Consultation', className: 'badge badge-accent' }],
    ['self_serve', { label: 'Self-serve', className: 'badge badge-info' }],
  ])('%s', (track, expected) => {
    expect(trackBadge(track)).toEqual(expected);
  });
});

describe('formatInterest', () => {
  it.each([
    [null, '—'],
    ['uae', 'Uae'],
    ['hong-kong', 'Hong Kong'],
  ])('%s -> %s', (j, out) => {
    expect(formatInterest(j)).toBe(out);
  });
});

describe('formatCaptured', () => {
  it('matches toLocaleString', () => {
    const iso = '2026-10-30T12:00:00.000Z';
    expect(formatCaptured(iso)).toBe(new Date(iso).toLocaleString());
  });
});

describe('leadCountLabel', () => {
  it.each([
    [0, '0 leads'],
    [1, '1 lead'],
    [200, '200 leads'],
  ])('%i -> %s', (n, out) => {
    expect(leadCountLabel(n)).toBe(out);
  });
});

describe('leads page source (AC1-AC3, AC6)', () => {
  const src = readFileSync(join(process.cwd(), 'src/app/admin/leads/page.tsx'), 'utf8');

  it('uses the page skeleton with one h1 via PageHeader', () => {
    expect(src).toContain('<div className="wrap admin-page">');
    expect(src).toContain('<PageHeader');
    expect(src.match(/<h1/g) ?? []).toHaveLength(0);
  });

  it('has no Tailwind colour/layout utilities or hex colours', () => {
    for (const bad of ['bg-gray-', 'text-gray-', 'h-screen', 'overflow-hidden', /#[0-9a-fA-F]{3,8}\b/]) {
      expect(typeof bad === 'string' ? src.includes(bad) : bad.test(src)).toBe(false);
    }
  });

  it('uses the CMS state patterns and empty copy', () => {
    expect(src).toContain('admin-state');
    expect(src).toContain('cl-empty is-error');
    expect(src).toContain('className="cl-empty"');
    expect(src).toContain('No leads have been captured yet.');
  });
});
