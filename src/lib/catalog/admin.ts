/**
 * Validation for edits made in /admin/catalog. Pure: takes what the browser sent, returns the row fields to
 * write or a message for the person editing. Prices arrive in dollars (what people type) and are stored in cents.
 */

export type Parsed<T> = { ok: true; value: T } | { ok: false; error: string };

const fail = <T>(error: string): Parsed<T> => ({ ok: false, error });
const KEY = /^[a-z0-9][a-z0-9_]{1,40}$/;

export const REQUIREMENT_CATEGORIES = [
  'passport',
  'proof_of_address',
  'bank_document',
  'trade_license',
  'moa_aoa',
  'share_certificate',
  'tax_certificate',
  'nominee_poa',
  'certificate_of_incorporation',
  'other',
] as const;

function text(v: unknown, max: number): string | null {
  return typeof v === 'string' && v.trim() ? v.trim().slice(0, max) : null;
}

/** Empty = not priced yet (the item is then not offered). Otherwise dollars with up to 2 decimals. */
export function parsePriceToCents(v: unknown): Parsed<number | null> {
  if (v === null || v === undefined || (typeof v === 'string' && !v.trim())) return { ok: true, value: null };
  const n = typeof v === 'number' ? v : Number(String(v).replace(/[$,\s]/g, ''));
  if (!Number.isFinite(n) || n < 0 || n > 1_000_000) return fail('Enter a price in dollars, for example 1250 or 1250.50.');
  return { ok: true, value: Math.round(n * 100) };
}

function days(v: unknown): Parsed<number | null> {
  if (v === null || v === undefined || v === '') return { ok: true, value: null };
  const n = Number(v);
  return Number.isInteger(n) && n >= 0 && n <= 730 ? { ok: true, value: n } : fail('Timeline days must be a whole number from 0 to 730.');
}

export interface PackagePatch {
  name: string;
  summary: string | null;
  price_cents: number | null;
  timeline_min_days: number | null;
  timeline_max_days: number | null;
  timeline_note: string | null;
  recommended: boolean;
  active: boolean;
}

export function parsePackagePatch(b: Record<string, unknown>): Parsed<PackagePatch> {
  const name = text(b.name, 80);
  if (!name) return fail('Give the package a name.');
  const price = parsePriceToCents(b.price);
  if (!price.ok) return price;
  const min = days(b.timeline_min_days);
  const max = days(b.timeline_max_days);
  if (!min.ok) return min;
  if (!max.ok) return max;
  if (min.value !== null && max.value !== null && min.value > max.value) return fail('The shortest timeline is longer than the longest.');
  const active = b.active === true;
  if (active && price.value === null) return fail('Set a price before switching a package on. A package without a price is never offered.');
  return {
    ok: true,
    value: {
      name,
      summary: text(b.summary, 300),
      price_cents: price.value,
      timeline_min_days: min.value,
      timeline_max_days: max.value,
      timeline_note: text(b.timeline_note, 200),
      recommended: b.recommended === true,
      active,
    },
  };
}

export interface AddonPatch {
  name: string;
  summary: string | null;
  price_cents: number | null;
  max_quantity: number;
  options: string[] | null;
  jurisdictions: string[] | null;
  package_keys: string[] | null;
  active: boolean;
}

/** "a, b , c" -> ['a','b','c']; empty -> null (null means every one). */
export function parseList(v: unknown): string[] | null {
  const items = (typeof v === 'string' ? v.split(',') : Array.isArray(v) ? v : []).map((x) => String(x).trim()).filter(Boolean);
  return items.length ? [...new Set(items)] : null;
}

export function parseAddonPatch(b: Record<string, unknown>): Parsed<AddonPatch> {
  const name = text(b.name, 80);
  if (!name) return fail('Give the add-on a name.');
  const price = parsePriceToCents(b.price);
  if (!price.ok) return price;
  const qty = Number(b.max_quantity ?? 1);
  if (!Number.isInteger(qty) || qty < 1 || qty > 20) return fail('Maximum quantity must be a whole number from 1 to 20.');
  const active = b.active === true;
  if (active && price.value === null) return fail('Set a price before switching an add-on on.');
  return {
    ok: true,
    value: {
      name,
      summary: text(b.summary, 300),
      price_cents: price.value,
      max_quantity: qty,
      options: parseList(b.options),
      jurisdictions: parseList(b.jurisdictions),
      package_keys: parseList(b.package_keys),
      active,
    },
  };
}

export interface RequirementPatch {
  label: string;
  help: string | null;
  category: (typeof REQUIREMENT_CATEGORIES)[number];
  required: boolean;
  active: boolean;
  sort: number;
}

export function parseRequirementPatch(b: Record<string, unknown>): Parsed<RequirementPatch> {
  const label = text(b.label, 120);
  if (!label) return fail('Name the document, for example "Passport copy".');
  const category = String(b.category ?? 'other');
  if (!(REQUIREMENT_CATEGORIES as readonly string[]).includes(category)) return fail('Choose a document type.');
  const sort = Number(b.sort ?? 0);
  if (!Number.isInteger(sort) || sort < 0 || sort > 1000) return fail('Order must be a whole number from 0 to 1000.');
  return {
    ok: true,
    value: {
      label,
      help: text(b.help, 300),
      category: category as RequirementPatch['category'],
      required: b.required !== false,
      active: b.active !== false,
      sort,
    },
  };
}

export function parseNewKey(v: unknown): Parsed<string> {
  const key = typeof v === 'string' ? v.trim().toLowerCase() : '';
  return KEY.test(key) ? { ok: true, value: key } : fail('The code is 2 to 41 characters: lowercase letters, digits and underscores, for example passport_copy.');
}
