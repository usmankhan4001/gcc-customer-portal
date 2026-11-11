/**
 * Quote engine. The client sends only keys and quantities; every price comes from the catalog rows passed in,
 * so the browser can never set what it pays. Pure: no database, no clock.
 */

export interface PackageRow {
  jurisdiction: string;
  key: string;
  name: string;
  price_cents: number | null;
  currency: string;
  active: boolean;
}

export interface AddonRow {
  key: string;
  name: string;
  price_cents: number | null;
  currency: string;
  max_quantity: number;
  jurisdictions: string[] | null;
  package_keys: string[] | null;
  options: unknown; // string[] of allowed choices (bank providers), or null
  active: boolean;
}

export interface Selection {
  jurisdiction: string;
  packageKey: string;
  addons: { key: string; quantity?: number; option?: string }[];
}

export interface QuoteLine {
  kind: 'package' | 'addon';
  key: string;
  name: string;
  quantity: number;
  unitCents: number;
  totalCents: number;
  option?: string;
}

export type QuoteResult =
  | { ok: true; lines: QuoteLine[]; totalCents: number; currency: string }
  | { ok: false; code: 'no_package' | 'not_offered' | 'bad_addon' | 'bad_quantity' | 'bad_option' | 'duplicate' | 'currency'; message: string };

const fail = (code: Extract<QuoteResult, { ok: false }>['code'], message: string): QuoteResult => ({ ok: false, code, message });

const optionList = (options: unknown): string[] | null =>
  Array.isArray(options) && options.every((o) => typeof o === 'string') ? (options as string[]) : null;

export function priceQuote(sel: Selection, packages: PackageRow[], addons: AddonRow[]): QuoteResult {
  const pkg = packages.find((p) => p.jurisdiction === sel.jurisdiction && p.key === sel.packageKey);
  if (!pkg) return fail('no_package', 'That package does not exist.');
  if (!pkg.active || pkg.price_cents === null) return fail('not_offered', `${pkg.name} is not available to order yet.`);

  const lines: QuoteLine[] = [
    { kind: 'package', key: pkg.key, name: pkg.name, quantity: 1, unitCents: pkg.price_cents, totalCents: pkg.price_cents },
  ];

  const seen = new Set<string>();
  for (const pick of sel.addons) {
    if (seen.has(pick.key)) return fail('duplicate', 'An add-on was chosen twice. Change its quantity instead.');
    seen.add(pick.key);

    const addon = addons.find((a) => a.key === pick.key);
    const valid =
      addon &&
      addon.active &&
      addon.price_cents !== null &&
      (!addon.jurisdictions || addon.jurisdictions.includes(sel.jurisdiction)) &&
      (!addon.package_keys || addon.package_keys.includes(sel.packageKey));
    if (!addon || !valid) return fail('bad_addon', 'One of the add-ons is not available with this package.');

    const quantity = pick.quantity ?? 1;
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > addon.max_quantity) {
      return fail('bad_quantity', `${addon.name}: choose between 1 and ${addon.max_quantity}.`);
    }
    const choices = optionList(addon.options);
    if (pick.option !== undefined && (!choices || !choices.includes(pick.option))) {
      return fail('bad_option', `${addon.name}: that choice is not available.`);
    }
    if (addon.currency !== pkg.currency) return fail('currency', 'Every item in one order must use the same currency.');

    const unit = addon.price_cents!;
    lines.push({
      kind: 'addon',
      key: addon.key,
      name: addon.name,
      quantity,
      unitCents: unit,
      totalCents: unit * quantity,
      ...(pick.option ? { option: pick.option } : {}),
    });
  }

  return { ok: true, lines, totalCents: lines.reduce((sum, l) => sum + l.totalCents, 0), currency: pkg.currency };
}

/** "$1,500" / "USD 1,500.50" style display. Always shows the currency, as the requirements ask. */
export function formatMoney(cents: number, currency: string): string {
  const amount = cents / 100;
  const text = amount.toLocaleString('en-US', { minimumFractionDigits: Number.isInteger(amount) ? 0 : 2, maximumFractionDigits: 2 });
  return `${currency.toUpperCase()} ${text}`;
}

/** "17 to 25 days" / "about 30 days" / null when nothing is set. */
export function formatTimeline(min: number | null, max: number | null): string | null {
  if (min && max && min !== max) return `${min} to ${max} days`;
  const one = max ?? min;
  return one ? `about ${one} days` : null;
}
