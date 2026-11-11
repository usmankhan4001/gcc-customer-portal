'use client';

import { useState } from 'react';
import { formatMoney } from '@/lib/catalog/quote';

interface Props {
  quoteId: string;
  jurisdiction: string;
  termsUrl: string;
  currency: string;
  total: { cents: number; label: string };
  lines: { key: string; label: string; amount: string }[];
}

export function OrderForm({ quoteId, jurisdiction, termsUrl, currency, total, lines }: Props) {
  const [names, setNames] = useState(['', '', '']);
  const [activity, setActivity] = useState('');
  const [restricted, setRestricted] = useState<'yes' | 'no' | ''>('');
  const [terms, setTerms] = useState(false);
  const [expected, setExpected] = useState(total);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [blocked, setBlocked] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        quoteId,
        expectedTotalCents: expected.cents,
        companyNames: names,
        businessActivity: activity,
        inRestrictedIndustry: restricted === 'yes',
        acceptedTerms: terms,
      }),
    });
    const data = await res.json().catch(() => null);
    if (res.ok && data?.url) return window.location.assign(data.url);
    setBusy(false);
    if (data?.restricted) setBlocked(true);
    if (data?.changed) setExpected({ cents: data.totalCents, label: formatMoney(data.totalCents, currency) });
    setError(data?.error ?? 'Something went wrong. Please try again.');
  }

  if (blocked) {
    return (
      <div className="card" role="status" style={{ padding: 24 }}>
        <p style={{ margin: 0 }}>{error}</p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} style={{ display: 'grid', gap: 20 }}>
      <fieldset style={{ border: 0, padding: 0, margin: 0, display: 'grid', gap: 12 }}>
        <legend style={{ fontWeight: 700, marginBottom: 8 }}>Company name options</legend>
        <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
          Give up to three names in order of preference. The registry checks availability; we will tell you which one is approved.
        </p>
        {names.map((n, i) => (
          <label key={i} className="field">
            <span>{i === 0 ? 'First choice' : i === 1 ? 'Second choice (optional)' : 'Third choice (optional)'}</span>
            <input value={n} maxLength={120} required={i === 0} onChange={(e) => setNames(names.map((v, j) => (j === i ? e.target.value : v)))} />
          </label>
        ))}
      </fieldset>

      <label className="field">
        <span>What will the company do?</span>
        <textarea value={activity} onChange={(e) => setActivity(e.target.value)} rows={3} maxLength={500} required />
      </label>

      <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
        <legend style={{ fontWeight: 700, marginBottom: 8 }}>Restricted industries</legend>
        <p style={{ margin: '0 0 8px', color: 'var(--text-secondary)' }}>
          Will the company operate in gambling, adult content, weapons, cryptocurrency exchange, money services, or another regulated or sanctioned activity?
        </p>
        <label style={{ marginRight: 16 }}><input type="radio" name="restricted" checked={restricted === 'no'} onChange={() => setRestricted('no')} required /> No</label>
        <label><input type="radio" name="restricted" checked={restricted === 'yes'} onChange={() => setRestricted('yes')} /> Yes or not sure</label>
      </fieldset>

      <section className="card" style={{ padding: 16 }} aria-label="Order summary">
        <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 8px' }}>
          {lines.map((l) => (
            <li key={l.key} style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}><span>{l.label}</span><span>{l.amount}</span></li>
          ))}
        </ul>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}><span>Total</span><span>{expected.label}</span></div>
      </section>

      <label style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
        <input type="checkbox" checked={terms} onChange={(e) => setTerms(e.target.checked)} required style={{ marginTop: 4 }} />
        <span>
          I accept the <a href={termsUrl} target="_blank" rel="noreferrer">terms and engagement agreement</a>. I understand the bank or registry decides on its own applications.
        </span>
      </label>

      {error && <p role="alert" style={{ color: 'var(--danger, #b91c1c)', margin: 0 }}>{error}</p>}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <a className="btn btn-outline" href={`/start/${jurisdiction}`}>Change my order</a>
        <button type="submit" className="btn btn-primary" disabled={busy || !restricted || !terms}>{busy ? 'Opening payment…' : `Pay ${expected.label} by card`}</button>
      </div>
    </form>
  );
}
