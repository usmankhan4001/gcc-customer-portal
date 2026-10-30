export interface PayNowOrder {
  id: string;
  company_id?: string | null;
}

export interface PayNowCompany {
  id: string;
  jurisdiction?: string | null;
}

/**
 * Resolves the jurisdiction slug for an order.
 * - If an array of companies is provided, matches the company by order.company_id.
 * - If not matched or array is empty, falls back to the first company with a jurisdiction or single company.
 * - If no jurisdiction is found, falls back to default 'uae'.
 * - Guarantees that order IDs (UUIDs) are never treated as jurisdictions.
 */
export function resolveOrderJurisdiction(
  order: PayNowOrder,
  companyOrList?: PayNowCompany | PayNowCompany[] | null
): string {
  if (!companyOrList) return 'uae';

  if (Array.isArray(companyOrList)) {
    const match = companyOrList.find((c) => c && c.id === order.company_id);
    if (match?.jurisdiction && match.jurisdiction.trim()) {
      return match.jurisdiction.trim();
    }
    const fallback = companyOrList.find((c) => Boolean(c?.jurisdiction && c.jurisdiction.trim()));
    return fallback?.jurisdiction ? fallback.jurisdiction.trim() : 'uae';
  }

  if (companyOrList.jurisdiction && companyOrList.jurisdiction.trim()) {
    return companyOrList.jurisdiction.trim();
  }

  return 'uae';
}

/**
 * Builds the Pay Now checkout URL for an unpaid order.
 * Uses the jurisdiction identifier (e.g. 'uae', 'hong-kong', 'singapore')
 * and returns `/checkout/${jurisdiction}`.
 * The order ID is never used in the checkout URL.
 */
export function buildPayNowUrl(
  order: PayNowOrder,
  companyOrList?: PayNowCompany | PayNowCompany[] | null
): string {
  const jurisdiction = resolveOrderJurisdiction(order, companyOrList);
  return `/checkout/${encodeURIComponent(jurisdiction.toLowerCase())}`;
}
