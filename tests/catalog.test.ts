import { describe, expect, it } from 'vitest';
import { formatMoney, formatTimeline, priceQuote, type AddonRow, type PackageRow } from '../src/lib/catalog/quote';
import { buildChecklist, nextClientAction, readyForFiling, type RequirementRow, type UploadRow } from '../src/lib/catalog/checklist';
import { bankMessage, documentRejectedMessage, stageMessage } from '../src/lib/notify/events';

const pkgs: PackageRow[] = [
  { jurisdiction: 'hong-kong', key: 'self_ubo', name: 'Self as UBO', price_cents: 150000, currency: 'usd', active: true },
  { jurisdiction: 'hong-kong', key: 'nominee_director', name: 'Nominee Director', price_cents: 350000, currency: 'usd', active: true },
  { jurisdiction: 'hong-kong', key: 'hire_ubo', name: 'Hire a UBO', price_cents: null, currency: 'usd', active: true }, // not priced yet
];
const addons: AddonRow[] = [
  { key: 'bank_account', name: 'Bank account', price_cents: 50000, currency: 'usd', max_quantity: 3, jurisdictions: ['hong-kong'], package_keys: null, options: ['Airwallex', 'Wise'], active: true },
  { key: 'bookkeeping', name: 'Yearly bookkeeping, audit and tax returns', price_cents: 75000, currency: 'usd', max_quantity: 1, jurisdictions: null, package_keys: null, options: null, active: true },
  { key: 'uae_only', name: 'UAE only', price_cents: 100, currency: 'usd', max_quantity: 1, jurisdictions: ['uae'], package_keys: null, options: null, active: true },
];
const sel = (over: Partial<Parameters<typeof priceQuote>[0]> = {}) => ({ jurisdiction: 'hong-kong', packageKey: 'self_ubo', addons: [], ...over });

describe('priceQuote', () => {
  it('prices a package alone from the catalog', () => {
    const q = priceQuote(sel(), pkgs, addons);
    expect(q).toMatchObject({ ok: true, totalCents: 150000, currency: 'usd' });
  });
  it('adds add-ons with quantity (two bank accounts)', () => {
    const q = priceQuote(sel({ addons: [{ key: 'bank_account', quantity: 2, option: 'Wise' }, { key: 'bookkeeping' }] }), pkgs, addons);
    expect(q).toMatchObject({ ok: true, totalCents: 150000 + 100000 + 75000 });
  });
  it('refuses a package with no price yet', () => {
    expect(priceQuote(sel({ packageKey: 'hire_ubo' }), pkgs, addons)).toMatchObject({ ok: false, code: 'not_offered' });
  });
  it('refuses an unknown package', () => {
    expect(priceQuote(sel({ packageKey: 'nope' }), pkgs, addons)).toMatchObject({ ok: false, code: 'no_package' });
  });
  it('refuses an add-on from another jurisdiction', () => {
    expect(priceQuote(sel({ addons: [{ key: 'uae_only' }] }), pkgs, addons)).toMatchObject({ ok: false, code: 'bad_addon' });
  });
  it.each([0, 4, 1.5, -1])('refuses quantity %s', (quantity) => {
    expect(priceQuote(sel({ addons: [{ key: 'bank_account', quantity }] }), pkgs, addons)).toMatchObject({ ok: false, code: 'bad_quantity' });
  });
  it('refuses a provider that is not on the list', () => {
    expect(priceQuote(sel({ addons: [{ key: 'bank_account', option: 'Nowhere Bank' }] }), pkgs, addons)).toMatchObject({ ok: false, code: 'bad_option' });
  });
  it('refuses the same add-on twice', () => {
    expect(priceQuote(sel({ addons: [{ key: 'bookkeeping' }, { key: 'bookkeeping' }] }), pkgs, addons)).toMatchObject({ ok: false, code: 'duplicate' });
  });
  it('ignores any price the client might send', () => {
    const q = priceQuote({ ...sel(), addons: [{ key: 'bookkeeping', price_cents: 1 } as never] }, pkgs, addons);
    expect(q).toMatchObject({ ok: true, totalCents: 225000 });
  });
});

describe('formatting', () => {
  it('shows the currency on every price', () => {
    expect(formatMoney(150000, 'usd')).toBe('USD 1,500');
    expect(formatMoney(150050, 'usd')).toBe('USD 1,500.50');
  });
  it('gives a range, not a promise', () => {
    expect(formatTimeline(17, 25)).toBe('17 to 25 days');
    expect(formatTimeline(null, 30)).toBe('about 30 days');
    expect(formatTimeline(null, null)).toBeNull();
  });
});

const reqs: RequirementRow[] = [
  { key: 'passport', label: 'Passport copy', help: null, required: true, package_key: null, sort: 1 },
  { key: 'address', label: 'Proof of address', help: 'Bank statement or utility bill', required: true, package_key: null, sort: 2 },
  { key: 'address', label: 'Proof of address (UBO)', help: null, required: true, package_key: 'hire_ubo', sort: 2 },
  { key: 'extra', label: 'Optional extra', help: null, required: false, package_key: null, sort: 3 },
];
const up = (key: string, status: UploadRow['review_status'], at: number, reason: string | null = null): UploadRow => ({
  id: `${key}-${at}`, requirement_key: key, review_status: status, rejection_reason: reason, created_at: new Date(at),
});

describe('document checklist', () => {
  it('starts with everything not uploaded', () => {
    const items = buildChecklist('self_ubo', reqs, []);
    expect(items.map((i) => i.status)).toEqual(['not_uploaded', 'not_uploaded', 'not_uploaded']);
    expect(readyForFiling(items)).toBe(false);
  });
  it('a package-specific row replaces the generic row with the same key', () => {
    const items = buildChecklist('hire_ubo', reqs, []);
    expect(items.find((i) => i.key === 'address')?.label).toBe('Proof of address (UBO)');
    expect(items).toHaveLength(3);
  });
  it('the newest upload decides the status, and a rejection carries its reason', () => {
    const items = buildChecklist('self_ubo', reqs, [up('passport', 'rejected', 1, 'blurry'), up('passport', 'under_review', 2), up('address', 'rejected', 1, 'expired')]);
    expect(items[0]).toMatchObject({ key: 'passport', status: 'under_review', reason: null });
    expect(items[1]).toMatchObject({ key: 'address', status: 'rejected', reason: 'expired' });
  });
  it('is ready for filing only when every required item is accepted', () => {
    const accepted = buildChecklist('self_ubo', reqs, [up('passport', 'accepted', 1), up('address', 'accepted', 1)]);
    expect(readyForFiling(accepted)).toBe(true);
    const one = buildChecklist('self_ubo', reqs, [up('passport', 'accepted', 1), up('address', 'uploaded', 1)]);
    expect(readyForFiling(one)).toBe(false);
  });
  it('an empty checklist is never ready', () => expect(readyForFiling([])).toBe(false));
  it('next action: fix a rejection first, then upload what is missing', () => {
    const items = buildChecklist('self_ubo', reqs, [up('passport', 'accepted', 1), up('address', 'rejected', 1, 'expired')]);
    expect(nextClientAction(items)?.key).toBe('address');
    const missing = buildChecklist('self_ubo', reqs, [up('passport', 'accepted', 1)]);
    expect(nextClientAction(missing)?.key).toBe('address');
    expect(nextClientAction(buildChecklist('self_ubo', reqs, [up('passport', 'accepted', 1), up('address', 'accepted', 1)]))).toBeNull();
  });
});

describe('notifications', () => {
  const company = { id: 'c1', name: 'Acme Ltd' };
  const at = new Date('2026-11-11T10:00:00Z');
  it.each(['order_confirmed', 'documents_under_review', 'kyc_pending', 'name_approved', 'signatures_pending', 'filed_with_registry', 'incorporated', 'documents_delivered', 'cancelled', 'refunded'])(
    'stage %s has a message that tells the client where to go',
    (stage) => {
      const m = stageMessage(stage, company, at)!;
      expect(m).toBeTruthy();
      expect(m.channels).toContain(stage === 'refunded' || stage === 'cancelled' ? 'email' : m.channels[0]);
      expect(m.link.startsWith('/')).toBe(true);
      expect(m.message).toContain('Acme Ltd');
    },
  );
  it('follows the channel table in the requirements', () => {
    expect(stageMessage('order_confirmed', company, at)!.channels).toEqual(['email', 'in_portal']);
    expect(stageMessage('kyc_pending', company, at)!.channels).toEqual(['email', 'whatsapp', 'in_portal']);
    expect(stageMessage('documents_under_review', company, at)!.channels).toEqual(['in_portal']);
  });
  it('the same move gives the same key, a later move a new one', () => {
    expect(stageMessage('incorporated', company, at)!.dedupeKey).toBe(stageMessage('incorporated', company, at)!.dedupeKey);
    expect(stageMessage('incorporated', company, new Date(at.getTime() + 1))!.dedupeKey).not.toBe(stageMessage('incorporated', company, at)!.dedupeKey);
  });
  it('makes no guarantee about outcomes', () => {
    for (const s of ['order_confirmed', 'filed_with_registry', 'incorporated']) {
      expect(stageMessage(s, company, at)!.message.toLowerCase()).not.toMatch(/guarantee|100%|always approved/);
    }
  });
  it('a rejected document gives the reason and a re-upload link', () => {
    const m = documentRejectedMessage(company, 'Passport copy', 'the photo is blurry', 'd1', at);
    expect(m.message).toContain('the photo is blurry');
    expect(m.channels).toEqual(['email', 'whatsapp', 'in_portal']);
    expect(m.link).toContain('#documents');
  });
  it('bank track only messages on the events in the table', () => {
    expect(bankMessage('submitted_to_provider', company, at)!.channels).toEqual(['in_portal']);
    expect(bankMessage('access_handed_over', company, at)!.channels).toEqual(['email', 'whatsapp', 'in_portal']);
    expect(bankMessage('prepared', company, at)).toBeNull();
  });
});
