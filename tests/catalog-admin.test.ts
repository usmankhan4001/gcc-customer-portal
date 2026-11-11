import { describe, expect, it } from 'vitest';
import { parseAddonPatch, parseList, parseNewKey, parsePackagePatch, parsePriceToCents, parseRequirementPatch } from '../src/lib/catalog/admin';

describe('parsePriceToCents', () => {
  it.each([
    ['1250', 125000],
    ['$1,250.50', 125050],
    [0, 0],
    ['', null],
    [null, null],
  ])('reads %s', (input, cents) => expect(parsePriceToCents(input)).toEqual({ ok: true, value: cents }));
  it.each(['abc', '-5', '2000000', NaN])('refuses %s', (input) => expect(parsePriceToCents(input)).toMatchObject({ ok: false }));
});

describe('parsePackagePatch', () => {
  const ok = { name: 'Self UBO', price: '1250', timeline_min_days: 5, timeline_max_days: 10, active: true };
  it('stores the price in cents', () => expect(parsePackagePatch(ok)).toMatchObject({ ok: true, value: { price_cents: 125000, active: true } }));
  it('will not switch on a package with no price', () => expect(parsePackagePatch({ ...ok, price: '' })).toMatchObject({ ok: false }));
  it('lets an unpriced package stay off', () => expect(parsePackagePatch({ ...ok, price: '', active: false })).toMatchObject({ ok: true, value: { price_cents: null, active: false } }));
  it('refuses a timeline that runs backwards', () => expect(parsePackagePatch({ ...ok, timeline_min_days: 12 })).toMatchObject({ ok: false }));
  it('refuses a missing name', () => expect(parsePackagePatch({ ...ok, name: ' ' })).toMatchObject({ ok: false }));
});

describe('parseAddonPatch', () => {
  it('reads options and limits as lists, empty meaning every one', () => {
    expect(parseAddonPatch({ name: 'Bank account', price: '300', max_quantity: 3, options: 'Wise, Aspire,Wise', jurisdictions: '', active: true })).toMatchObject({
      ok: true,
      value: { price_cents: 30000, max_quantity: 3, options: ['Wise', 'Aspire'], jurisdictions: null },
    });
  });
  it.each([0, 21, 1.5])('refuses quantity %s', (max_quantity) => expect(parseAddonPatch({ name: 'x1', price: '1', max_quantity })).toMatchObject({ ok: false }));
  it('will not switch on an unpriced add-on', () => expect(parseAddonPatch({ name: 'Hire a UBO', price: '', active: true })).toMatchObject({ ok: false }));
});

describe('parseRequirementPatch', () => {
  it('defaults to required and active', () => expect(parseRequirementPatch({ label: 'Passport copy', category: 'passport' })).toMatchObject({ ok: true, value: { required: true, active: true, sort: 0 } }));
  it('refuses an unknown document type', () => expect(parseRequirementPatch({ label: 'Thing', category: 'selfie' })).toMatchObject({ ok: false }));
});

describe('parseNewKey / parseList', () => {
  it('accepts a tidy code and refuses spaces or capitals-only junk', () => {
    expect(parseNewKey(' Passport_Copy ')).toEqual({ ok: true, value: 'passport_copy' });
    expect(parseNewKey('has space')).toMatchObject({ ok: false });
    expect(parseNewKey('')).toMatchObject({ ok: false });
  });
  it('parseList drops blanks and duplicates', () => expect(parseList('a, ,b,a')).toEqual(['a', 'b']));
});
