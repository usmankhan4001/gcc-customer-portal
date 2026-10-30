import { describe, expect, it } from 'vitest';
import { buildPayNowUrl, resolveOrderJurisdiction, type PayNowCompany, type PayNowOrder } from './pay-now';

describe('buildPayNowUrl (AC1)', () => {
  const sampleOrder: PayNowOrder = {
    id: 'f81d4fae-7dec-11d0-a765-00a0c91e6bf6',
    company_id: 'c-hk-1',
  };

  const hkCompany: PayNowCompany = {
    id: 'c-hk-1',
    jurisdiction: 'hong-kong',
  };

  it('builds Pay Now URL from the company jurisdiction', () => {
    const url = buildPayNowUrl(sampleOrder, hkCompany);
    expect(url).toBe('/checkout/hong-kong');
  });

  it('strictly proves the URL uses the jurisdiction id and NEVER the order UUID', () => {
    const orderUuid = 'c03264c1-90a6-4b20-8e12-b187425f9999';
    const order: PayNowOrder = { id: orderUuid, company_id: 'c-sg-1' };
    const company: PayNowCompany = { id: 'c-sg-1', jurisdiction: 'singapore' };

    const url = buildPayNowUrl(order, company);

    // Verifies jurisdiction slug is present
    expect(url).toBe('/checkout/singapore');
    // Verifies order UUID is completely absent
    expect(url).not.toContain(orderUuid);
    expect(url).not.toContain(order.id);
    expect(url).not.toMatch(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
  });

  it.each([
    ['uae', '/checkout/uae'],
    ['hong-kong', '/checkout/hong-kong'],
    ['singapore', '/checkout/singapore'],
    ['bahrain', '/checkout/bahrain'],
    ['ireland', '/checkout/ireland'],
    ['bvi-cayman', '/checkout/bvi-cayman'],
  ])('maps jurisdiction %s to %s', (jurisdiction, expectedUrl) => {
    const order: PayNowOrder = { id: 'order-12345', company_id: 'comp-1' };
    const company: PayNowCompany = { id: 'comp-1', jurisdiction };

    expect(buildPayNowUrl(order, company)).toBe(expectedUrl);
  });

  it('normalizes uppercase jurisdiction to lowercase', () => {
    const order: PayNowOrder = { id: 'order-1', company_id: 'comp-1' };
    const company: PayNowCompany = { id: 'comp-1', jurisdiction: 'HONG-KONG' };

    expect(buildPayNowUrl(order, company)).toBe('/checkout/hong-kong');
  });

  it('resolves correct company from an array of user companies by order.company_id', () => {
    const order: PayNowOrder = { id: 'order-target', company_id: 'c-ireland' };
    const userCompanies: PayNowCompany[] = [
      { id: 'c-uae', jurisdiction: 'uae' },
      { id: 'c-ireland', jurisdiction: 'ireland' },
      { id: 'c-sg', jurisdiction: 'singapore' },
    ];

    expect(buildPayNowUrl(order, userCompanies)).toBe('/checkout/ireland');
  });

  it('falls back to the first available company jurisdiction when order.company_id does not match', () => {
    const order: PayNowOrder = { id: 'order-unknown', company_id: 'c-missing' };
    const userCompanies: PayNowCompany[] = [
      { id: 'c-bahrain', jurisdiction: 'bahrain' },
    ];

    expect(buildPayNowUrl(order, userCompanies)).toBe('/checkout/bahrain');
  });

  it('falls back to uae default when company is null or has no jurisdiction', () => {
    const order: PayNowOrder = { id: 'order-fallback', company_id: null };
    expect(buildPayNowUrl(order, null)).toBe('/checkout/uae');
    expect(buildPayNowUrl(order, undefined)).toBe('/checkout/uae');
    expect(buildPayNowUrl(order, { id: 'c-none', jurisdiction: null })).toBe('/checkout/uae');
    expect(buildPayNowUrl(order, [])).toBe('/checkout/uae');
  });
});
