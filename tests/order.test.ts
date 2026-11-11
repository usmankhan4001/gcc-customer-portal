import { describe, expect, it } from 'vitest';
import { parseOrderDetails } from '../src/lib/catalog/order';
import { pickLeastLoaded } from '../src/lib/orders/assign';

const ok = { companyNames: ['Acme Trading Ltd', 'Acme Global Ltd'], businessActivity: 'Consulting for online retailers', inRestrictedIndustry: false, acceptedTerms: true };

describe('parseOrderDetails', () => {
  it('accepts a complete order and tidies the names', () => {
    const r = parseOrderDetails({ ...ok, companyNames: ['  Acme   Trading Ltd ', '', 'Acme Global Ltd'] });
    expect(r).toMatchObject({ ok: true, details: { companyNames: ['Acme Trading Ltd', 'Acme Global Ltd'] } });
  });
  it.each([
    ['no name', { ...ok, companyNames: ['', ' '] }],
    ['four names', { ...ok, companyNames: ['A1', 'B2', 'C3', 'D4'] }],
    ['the same name twice, different case', { ...ok, companyNames: ['Acme Ltd', 'ACME LTD'] }],
    ['a name that is too long', { ...ok, companyNames: ['x'.repeat(121)] }],
    ['a too-short description', { ...ok, businessActivity: 'shop' }],
    ['a too-long description', { ...ok, businessActivity: 'x'.repeat(501) }],
    ['restricted question left unanswered', { ...ok, inRestrictedIndustry: undefined }],
    ['restricted answered as a string', { ...ok, inRestrictedIndustry: 'no' }],
    ['terms not accepted', { ...ok, acceptedTerms: false }],
    ['terms sent as a string', { ...ok, acceptedTerms: 'true' }],
    ['nothing at all', null],
  ])('refuses %s', (_label, input) => {
    expect(parseOrderDetails(input)).toMatchObject({ ok: false });
  });
});

describe('pickLeastLoaded', () => {
  it('chooses the person with the fewest open applications', () => {
    expect(pickLeastLoaded([{ id: 'a', open: 5 }, { id: 'b', open: 2 }, { id: 'c', open: 9 }])).toBe('b');
  });
  it('breaks a tie by list order, so the choice is stable', () => {
    expect(pickLeastLoaded([{ id: 'a', open: 1 }, { id: 'b', open: 1 }])).toBe('a');
  });
  it('returns null when there is no one to assign to', () => {
    expect(pickLeastLoaded([])).toBeNull();
  });
});
