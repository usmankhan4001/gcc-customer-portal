'use client';

import { useMemo, useState } from 'react';
import { buildChecklist, type RequirementRow } from '@/lib/catalog/checklist';
import { formatMoney, formatTimeline, priceQuote, type AddonRow, type PackageRow } from '@/lib/catalog/quote';

type Pkg = PackageRow & {
  summary: string | null;
  timeline_min_days: number | null;
  timeline_max_days: number | null;
  timeline_note: string | null;
  recommended: boolean;
};
type Addon = AddonRow & { summary: string | null };
interface Props {
  jurisdiction: string;
  jurisdictionName: string;
  packages: Pkg[];
  addons: Addon[];
  requirements: RequirementRow[];
}

/** Choose package and add-ons, see the real total and the document list, then continue to sign in and pay. */
export function StartFlow({ jurisdiction, jurisdictionName, packages, addons, requirements }: Props) {
  const initial = packages.find((p) => p.recommended) ?? packages[0];
  const [packageKey, setPackageKey] = useState(initial.key);
  const [picked, setPicked] = useState<Record<string, { quantity: number; option?: string }>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const available = addons.filter((a) => !a.package_keys || a.package_keys.includes(packageKey));
  const selection = useMemo(
    () => ({
      jurisdiction,
      packageKey,
      addons: available.filter((a) => picked[a.key]).map((a) => ({ key: a.key, quantity: picked[a.key].quantity, option: picked[a.key].option })),
    }),
    [jurisdiction, packageKey, available, picked],
  );
  // Display only: the server prices the quote again from the catalog.
  const quote = priceQuote(selection, packages, addons);
  const pkg = packages.find((p) => p.key === packageKey)!;
  const documents = buildChecklist(packageKey, requirements, []);

  async function proceed() {
    setBusy(true);
    setError(null);
    const res = await fetch('/api/quotes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(selection) });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      setBusy(false);
      return setError(data?.error ?? 'Something went wrong. Please try again.');
    }
    const next = `/start/${jurisdiction}/order?quote=${data.id}`;
    window.location.assign(`/auth?redirect=${encodeURIComponent(next)}`);
  }

  return (
    <div style={{ display: 'grid', gap: 32 }}>
      <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
        <legend style={{ fontWeight: 700, fontSize: 18, marginBottom: 12 }}>1. Choose a package</legend>
        <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
          {packages.map((p) => {
            const timeline = formatTimeline(p.timeline_min_days, p.timeline_max_days);
            const selected = p.key === packageKey;
            return (
              <label
                key={p.key}
                className="card"
                style={{ padding: 16, cursor: 'pointer', display: 'block', outline: selected ? '2px solid var(--blue)' : '1px solid var(--border)' }}
              >
                <input type="radio" name="package" value={p.key} checked={selected} onChange={() => setPackageKey(p.key)} style={{ marginRight: 8 }} />
                <strong>{p.name}</strong>
                {p.recommended && <span className="badge badge-accent" style={{ marginLeft: 8 }}>Recommended</span>}
                <div style={{ fontSize: 22, fontWeight: 700, margin: '8px 0' }}>{formatMoney(p.price_cents!, p.currency)}</div>
                {p.summary && <p style={{ margin: '0 0 8px', color: 'var(--text-secondary)' }}>{p.summary}</p>}
                {timeline && (
                  <p style={{ margin: 0, color: 'var(--text-tertiary)', fontSize: 14 }}>
                    Typical time: {timeline}
                    {p.timeline_note ? `, depending on ${p.timeline_note}` : ''}
                  </p>
                )}
              </label>
            );
          })}
        </div>
      </fieldset>

      {available.length > 0 && (
        <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
          <legend style={{ fontWeight: 700, fontSize: 18, marginBottom: 12 }}>2. Add-ons (optional)</legend>
          <div style={{ display: 'grid', gap: 12 }}>
            {available.map((a) => {
              const on = !!picked[a.key];
              const choices = Array.isArray(a.options) ? (a.options as string[]) : [];
              return (
                <div key={a.key} className="card" style={{ padding: 16 }}>
                  <label style={{ display: 'flex', gap: 8, alignItems: 'flex-start', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={on}
                      onChange={(e) => {
                        const next = { ...picked };
                        if (e.target.checked) next[a.key] = { quantity: 1 };
                        else delete next[a.key];
                        setPicked(next);
                      }}
                      style={{ marginTop: 4 }}
                    />
                    <span>
                      <strong>{a.name}</strong> <span style={{ color: 'var(--text-secondary)' }}>{formatMoney(a.price_cents!, a.currency)}{a.max_quantity > 1 ? ' each' : ''}</span>
                      {a.summary && <span style={{ display: 'block', color: 'var(--text-tertiary)', fontSize: 14 }}>{a.summary}</span>}
                    </span>
                  </label>
                  {on && (a.max_quantity > 1 || choices.length > 0) && (
                    <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 12, marginLeft: 28 }}>
                      {a.max_quantity > 1 && (
                        <label className="field">
                          <span>How many</span>
                          <select value={picked[a.key].quantity} onChange={(e) => setPicked({ ...picked, [a.key]: { ...picked[a.key], quantity: Number(e.target.value) } })}>
                            {Array.from({ length: a.max_quantity }, (_, i) => i + 1).map((n) => <option key={n} value={n}>{n}</option>)}
                          </select>
                        </label>
                      )}
                      {choices.length > 0 && (
                        <label className="field">
                          <span>Provider (the provider decides whether to approve)</span>
                          <select value={picked[a.key].option ?? ''} onChange={(e) => setPicked({ ...picked, [a.key]: { ...picked[a.key], option: e.target.value || undefined } })}>
                            <option value="">Decide later</option>
                            {choices.map((c) => <option key={c} value={c}>{c}</option>)}
                          </select>
                        </label>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </fieldset>
      )}

      {documents.length > 0 && (
        <section aria-labelledby="docs-head">
          <h2 id="docs-head" style={{ fontSize: 18, margin: '0 0 8px' }}>Documents you will need for {pkg.name}</h2>
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            {documents.map((d) => (
              <li key={d.key}>
                {d.label}{!d.required && ' (optional)'}
                {d.help && <span style={{ color: 'var(--text-tertiary)' }}> – {d.help}</span>}
              </li>
            ))}
          </ul>
          <p style={{ color: 'var(--text-tertiary)', fontSize: 14, marginTop: 8 }}>You can upload them now or after you pay. We start filing once they are accepted.</p>
        </section>
      )}

      <section className="card" style={{ padding: 20, position: 'sticky', bottom: 12 }} aria-live="polite">
        {quote.ok ? (
          <>
            <h2 style={{ fontSize: 18, margin: '0 0 8px' }}>Your {jurisdictionName} order</h2>
            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 12px' }}>
              {quote.lines.map((l) => (
                <li key={l.key} style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                  <span>{l.name}{l.quantity > 1 ? ` × ${l.quantity}` : ''}{l.option ? ` (${l.option})` : ''}</span>
                  <span>{formatMoney(l.totalCents, quote.currency)}</span>
                </li>
              ))}
            </ul>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: 18, marginBottom: 12 }}>
              <span>Total</span>
              <span>{formatMoney(quote.totalCents, quote.currency)}</span>
            </div>
          </>
        ) : (
          <p role="alert" style={{ margin: '0 0 12px' }}>{quote.message}</p>
        )}
        {error && <p role="alert" style={{ color: 'var(--danger, #b91c1c)' }}>{error}</p>}
        <button type="button" className="btn btn-primary" disabled={busy || !quote.ok} onClick={proceed}>
          {busy ? 'Saving…' : 'Continue to your details'}
        </button>
        <p style={{ color: 'var(--text-tertiary)', fontSize: 13, margin: '8px 0 0' }}>
          Prices are fixed by us, not by this page. You pay securely by card on the last step.
        </p>
      </section>
    </div>
  );
}
