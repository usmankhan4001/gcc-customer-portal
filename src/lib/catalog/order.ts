/** Checks on what the client types in at the "Your details" step. Pure, so the rules are tested without a server. */

export interface OrderDetails {
  companyNames: string[]; // up to three options, first is the preferred one
  businessActivity: string;
  inRestrictedIndustry: boolean;
  acceptedTerms: boolean;
}

export type DetailsResult = { ok: true; details: OrderDetails } | { ok: false; message: string };

/** Bump when the engagement terms text changes; stored with each order so we know what was agreed. */
export const TERMS_VERSION = 'draft-2026-11';

export function parseOrderDetails(input: unknown): DetailsResult {
  const raw = (input && typeof input === 'object' ? input : {}) as Record<string, unknown>;

  const names = (Array.isArray(raw.companyNames) ? raw.companyNames : [])
    .filter((n): n is string => typeof n === 'string')
    .map((n) => n.trim().replace(/\s+/g, ' '))
    .filter(Boolean);
  if (names.length < 1) return { ok: false, message: 'Give at least one company name.' };
  if (names.length > 3) return { ok: false, message: 'Give no more than three company names.' };
  if (names.some((n) => n.length > 120)) return { ok: false, message: 'A company name is too long.' };
  if (new Set(names.map((n) => n.toLowerCase())).size !== names.length) return { ok: false, message: 'The company names must be different from each other.' };

  const activity = typeof raw.businessActivity === 'string' ? raw.businessActivity.trim() : '';
  if (activity.length < 10) return { ok: false, message: 'Describe what the company will do, in a sentence or two.' };
  if (activity.length > 500) return { ok: false, message: 'The business description is too long (500 characters at most).' };

  // The declaration must be answered either way; leaving it out is not "no".
  if (typeof raw.inRestrictedIndustry !== 'boolean') return { ok: false, message: 'Answer the restricted industries question.' };
  if (raw.acceptedTerms !== true) return { ok: false, message: 'Accept the terms and the engagement agreement to continue.' };

  return {
    ok: true,
    details: { companyNames: names, businessActivity: activity, inRestrictedIndustry: raw.inRestrictedIndustry, acceptedTerms: true },
  };
}
