'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { REQUIREMENT_CATEGORIES } from '@/lib/catalog/admin';

export interface PackageRow { id: string; jurisdiction: string; key: string; name: string; summary: string | null; price: string; timeline_min_days: number | null; timeline_max_days: number | null; timeline_note: string | null; recommended: boolean; active: boolean }
export interface AddonRow { id: string; key: string; name: string; summary: string | null; price: string; max_quantity: number; options: string; jurisdictions: string; package_keys: string; active: boolean }
export interface RequirementRow { id: string; jurisdiction: string; package_key: string | null; key: string; label: string; help: string | null; category: string; required: boolean; active: boolean; sort: number }
type Country = { id: string; name: string };

const TIERS = [['tier_1_self', 'Client holds the shares'], ['tier_2_nominee', 'Nominee holds the shares'], ['tier_3_shelf', 'Ready-made company']] as const;

/** Prices, packages, add-ons and the document checklist. Nothing is deleted: switch an item off. */
export function CatalogManager({ countries, packages, addons, requirements }: { countries: Country[]; packages: PackageRow[]; addons: AddonRow[]; requirements: RequirementRow[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const [country, setCountry] = useState(countries.find((c) => packages.some((p) => p.jurisdiction === c.id))?.id ?? countries[0].id);

  async function save(id: string, body: Record<string, unknown>): Promise<boolean> {
    setBusy(id);
    setError(null);
    setSaved(null);
    const res = await fetch('/api/admin/catalog', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const data = await res.json().catch(() => null);
    setBusy(null);
    if (!res.ok) { setError(data?.error ?? 'Something went wrong. Nothing was saved.'); return false; }
    setSaved('Saved.');
    router.refresh();
    return true;
  }

  const pkgs = packages.filter((p) => p.jurisdiction === country);
  const reqs = requirements.filter((r) => r.jurisdiction === country);

  return (
    <div className="admin-card-stack" style={{ alignItems: 'stretch' }}>
      {error && <p className="admin-text-error" role="alert">{error}</p>}
      {saved && <p role="status">{saved}</p>}

      <label>
        Country{' '}
        <select value={country} onChange={(e) => setCountry(e.target.value)}>
          {countries.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </label>

      <h2>Packages</h2>
      <p>A package is only shown to clients when it is switched on and has a price. Prices are in US dollars.</p>
      {pkgs.map((p) => <PackageForm key={`${p.id}-${p.price}-${p.active}`} row={p} busy={busy === p.id} onSave={(d) => save(p.id, { action: 'package.update', id: p.id, ...d })} />)}
      {pkgs.length === 0 && <p>No packages for this country yet.</p>}
      <details>
        <summary>Add a package</summary>
        <PackageForm
          row={{ id: '', jurisdiction: country, key: '', name: '', summary: '', price: '', timeline_min_days: null, timeline_max_days: null, timeline_note: '', recommended: false, active: false }}
          isNew busy={busy === 'new-package'}
          onSave={(d) => save('new-package', { action: 'package.create', jurisdiction: country, ...d })}
        />
      </details>

      <h2>Add-ons</h2>
      <p>Add-ons can be offered everywhere or only for the countries and packages you list (codes, comma separated; empty means all).</p>
      {addons.map((a) => <AddonForm key={`${a.id}-${a.price}-${a.active}`} row={a} busy={busy === a.id} onSave={(d) => save(a.id, { action: 'addon.update', id: a.id, ...d })} />)}
      <details>
        <summary>Add an add-on</summary>
        <AddonForm
          row={{ id: '', key: '', name: '', summary: '', price: '', max_quantity: 1, options: '', jurisdictions: '', package_keys: '', active: false }}
          isNew busy={busy === 'new-addon'}
          onSave={(d) => save('new-addon', { action: 'addon.create', ...d })}
        />
      </details>

      <h2>Documents the client must provide</h2>
      <p>These drive the checklist on the client dashboard. A document set for one package replaces the all-packages document with the same code.</p>
      <div className="admin-table-card"><div className="admin-table-wrap">
        <table className="admin-table">
          <thead><tr><th>Document</th><th>Type</th><th>Applies to</th><th>Required</th><th>On</th><th>Order</th><th /></tr></thead>
          <tbody>{reqs.map((r) => <RequirementRowForm key={`${r.id}-${r.active}-${r.required}`} row={r} busy={busy === r.id} onSave={(d) => save(r.id, { action: 'requirement.update', id: r.id, ...d })} />)}</tbody>
        </table>
      </div></div>
      <details>
        <summary>Add a document</summary>
        <NewRequirement packages={pkgs} busy={busy === 'new-req'} onSave={(d) => save('new-req', { action: 'requirement.create', jurisdiction: country, ...d })} />
      </details>
    </div>
  );
}

function Check({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return <label style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}><input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />{label}</label>;
}

function PackageForm({ row, busy, onSave, isNew }: { row: PackageRow; busy: boolean; onSave: (d: Record<string, unknown>) => void; isNew?: boolean }) {
  const [d, setD] = useState({ ...row, tier: 'tier_1_self' });
  const set = (k: string, v: unknown) => setD((x) => ({ ...x, [k]: v }));
  return (
    <form className="admin-form-stack" onSubmit={(e) => { e.preventDefault(); onSave({ ...d, key: isNew ? d.key : undefined }); }}>
      <strong>{isNew ? 'New package' : `${row.name} (${row.key})`}</strong>
      {isNew && <label>Code <input value={d.key} onChange={(e) => set('key', e.target.value)} placeholder="self_ubo" /></label>}
      {isNew && <label>Who holds the shares <select value={d.tier} onChange={(e) => set('tier', e.target.value)}>{TIERS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></label>}
      <label>Name <input value={d.name} onChange={(e) => set('name', e.target.value)} /></label>
      <label>Short description <input value={d.summary ?? ''} onChange={(e) => set('summary', e.target.value)} /></label>
      <label>Price (USD) <input inputMode="decimal" value={d.price} onChange={(e) => set('price', e.target.value)} placeholder="Not priced" /></label>
      <label>Fastest (days) <input inputMode="numeric" value={d.timeline_min_days ?? ''} onChange={(e) => set('timeline_min_days', e.target.value)} /></label>
      <label>Slowest (days) <input inputMode="numeric" value={d.timeline_max_days ?? ''} onChange={(e) => set('timeline_max_days', e.target.value)} /></label>
      <label>What the timeline depends on <input value={d.timeline_note ?? ''} onChange={(e) => set('timeline_note', e.target.value)} /></label>
      <Check label="Recommended" checked={d.recommended} onChange={(v) => set('recommended', v)} />
      <Check label="Offered to clients" checked={d.active} onChange={(v) => set('active', v)} />
      <button type="submit" className="btn" disabled={busy}>{busy ? 'Saving…' : isNew ? 'Add package' : 'Save'}</button>
    </form>
  );
}

function AddonForm({ row, busy, onSave, isNew }: { row: AddonRow; busy: boolean; onSave: (d: Record<string, unknown>) => void; isNew?: boolean }) {
  const [d, setD] = useState(row);
  const set = (k: string, v: unknown) => setD((x) => ({ ...x, [k]: v }));
  return (
    <form className="admin-form-stack" onSubmit={(e) => { e.preventDefault(); onSave({ ...d, key: isNew ? d.key : undefined }); }}>
      <strong>{isNew ? 'New add-on' : `${row.name} (${row.key})`}</strong>
      {isNew && <label>Code <input value={d.key} onChange={(e) => set('key', e.target.value)} placeholder="bank_account" /></label>}
      <label>Name <input value={d.name} onChange={(e) => set('name', e.target.value)} /></label>
      <label>Short description <input value={d.summary ?? ''} onChange={(e) => set('summary', e.target.value)} /></label>
      <label>Price each (USD) <input inputMode="decimal" value={d.price} onChange={(e) => set('price', e.target.value)} placeholder="Not priced" /></label>
      <label>Most a client can order <input inputMode="numeric" value={d.max_quantity} onChange={(e) => set('max_quantity', e.target.value)} /></label>
      <label>Choices (comma separated, optional) <input value={d.options} onChange={(e) => set('options', e.target.value)} placeholder="Airwallex, Wise, Aspire" /></label>
      <label>Only in these countries (codes) <input value={d.jurisdictions} onChange={(e) => set('jurisdictions', e.target.value)} placeholder="hong-kong" /></label>
      <label>Only with these packages (codes) <input value={d.package_keys} onChange={(e) => set('package_keys', e.target.value)} /></label>
      <Check label="Offered to clients" checked={d.active} onChange={(v) => set('active', v)} />
      <button type="submit" className="btn" disabled={busy}>{busy ? 'Saving…' : isNew ? 'Add add-on' : 'Save'}</button>
    </form>
  );
}

const categoryOptions = REQUIREMENT_CATEGORIES.map((c) => <option key={c} value={c}>{c.replace(/_/g, ' ')}</option>);

function RequirementRowForm({ row, busy, onSave }: { row: RequirementRow; busy: boolean; onSave: (d: object) => void }) {
  const [d, setD] = useState(row);
  const set = (k: string, v: unknown) => setD((x) => ({ ...x, [k]: v }));
  return (
    <tr style={d.active ? undefined : { opacity: 0.55 }}>
      <td>
        <input aria-label={`Name of ${row.key}`} value={d.label} onChange={(e) => set('label', e.target.value)} />
        <input aria-label={`Help text for ${row.key}`} value={d.help ?? ''} onChange={(e) => set('help', e.target.value)} placeholder="Help text for the client" />
      </td>
      <td><select aria-label={`Type of ${row.key}`} value={d.category} onChange={(e) => set('category', e.target.value)}>{categoryOptions}</select></td>
      <td>{row.package_key ?? 'All packages'}</td>
      <td><input type="checkbox" aria-label={`${row.key} required`} checked={d.required} onChange={(e) => set('required', e.target.checked)} /></td>
      <td><input type="checkbox" aria-label={`${row.key} on`} checked={d.active} onChange={(e) => set('active', e.target.checked)} /></td>
      <td><input aria-label={`Order of ${row.key}`} inputMode="numeric" style={{ width: 64 }} value={d.sort} onChange={(e) => set('sort', e.target.value)} /></td>
      <td><button type="button" className="btn" disabled={busy} onClick={() => onSave(d)}>{busy ? 'Saving…' : 'Save'}</button></td>
    </tr>
  );
}

function NewRequirement({ packages, busy, onSave }: { packages: PackageRow[]; busy: boolean; onSave: (d: Record<string, unknown>) => void }) {
  const [d, setD] = useState({ key: '', label: '', help: '', category: 'other', package_key: '', required: true, active: true, sort: 10 });
  const set = (k: string, v: unknown) => setD((x) => ({ ...x, [k]: v }));
  return (
    <form className="admin-form-stack" onSubmit={(e) => { e.preventDefault(); onSave(d); }}>
      <label>Code <input value={d.key} onChange={(e) => set('key', e.target.value)} placeholder="passport_copy" /></label>
      <label>Name <input value={d.label} onChange={(e) => set('label', e.target.value)} /></label>
      <label>Help text <input value={d.help} onChange={(e) => set('help', e.target.value)} /></label>
      <label>Type <select value={d.category} onChange={(e) => set('category', e.target.value)}>{categoryOptions}</select></label>
      <label>Applies to <select value={d.package_key} onChange={(e) => set('package_key', e.target.value)}><option value="">All packages</option>{packages.map((p) => <option key={p.key} value={p.key}>{p.name}</option>)}</select></label>
      <Check label="Required" checked={d.required} onChange={(v) => set('required', v)} />
      <label>Order <input inputMode="numeric" value={d.sort} onChange={(e) => set('sort', e.target.value)} /></label>
      <button type="submit" className="btn" disabled={busy}>{busy ? 'Saving…' : 'Add document'}</button>
    </form>
  );
}
