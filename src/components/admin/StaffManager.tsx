'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export interface StaffRow {
  id: string;
  name: string | null;
  email: string | null;
  role: string; // staff role key
  disabled: boolean;
  totp: boolean;
  lastLogin: string | null;
  isMe: boolean;
}

export function StaffManager({ rows, roles }: { rows: StaffRow[]; roles: { value: string; label: string }[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [form, setForm] = useState({ fullName: '', email: '', whatsapp: '', role: 'incorporation_va' });

  async function call(body: Record<string, unknown>, confirmText?: string) {
    if (confirmText && !window.confirm(confirmText)) return;
    setBusy(true);
    setError(null);
    setSecret(null);
    const res = await fetch('/api/admin/staff', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const data = await res.json().catch(() => null);
    setBusy(false);
    if (!res.ok) return setError(data?.error ?? 'Something went wrong.');
    if (data?.tempPassword) setSecret(data.tempPassword);
    router.refresh();
    return data;
  }

  return (
    <div className="admin-card-stack" style={{ alignItems: 'stretch' }}>
      {error && <p className="admin-text-error" role="alert">{error}</p>}
      {secret && (
        <div className="admin-callout" role="status">
          <p>Temporary password (shown once, send it privately): <code style={{ userSelect: 'all' }}>{secret}</code></p>
        </div>
      )}

      <div className="admin-table-card">
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead><tr><th>Person</th><th>Role</th><th className="hide-phone">2FA</th><th className="hide-phone">Last sign-in</th><th className="is-right">Actions</th></tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} style={r.disabled ? { opacity: 0.55 } : undefined}>
                  <td><strong>{r.name ?? '(no name)'}</strong>{r.isMe && ' (you)'}{r.disabled && ' · disabled'}<div>{r.email}</div></td>
                  <td>
                    <select value={r.role} disabled={busy} onChange={(e) => call({ action: 'role', userId: r.id, role: e.target.value })} aria-label={`Role for ${r.name ?? r.email}`}>
                      {roles.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </td>
                  <td className="hide-phone">{r.totp ? 'On' : 'Not set up'}</td>
                  <td className="hide-phone">{r.lastLogin ?? 'Never'}</td>
                  <td className="is-right">
                    <button type="button" className="btn" disabled={busy} onClick={() => call({ action: 'reset_password', userId: r.id }, 'Create a new temporary password? Their current password stops working.')}>New password</button>{' '}
                    {r.totp && <button type="button" className="btn" disabled={busy} onClick={() => call({ action: 'reset_2fa', userId: r.id }, 'Remove their authenticator so they can set up again?')}>Reset 2FA</button>}{' '}
                    {r.disabled
                      ? <button type="button" className="btn" disabled={busy} onClick={() => call({ action: 'enable', userId: r.id })}>Enable</button>
                      : !r.isMe && <button type="button" className="btn" disabled={busy} onClick={() => call({ action: 'disable', userId: r.id }, 'Disable this account? They are signed out of new sessions immediately.')}>Disable</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <form
        className="admin-form-stack"
        onSubmit={async (e) => {
          e.preventDefault();
          const d = await call({ action: 'create', ...form });
          if (d) setForm({ fullName: '', email: '', whatsapp: '', role: form.role });
        }}
      >
        <h2 className="admin-section-head">Add a staff member</h2>
        <label className="field"><span>Full name</span><input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} required /></label>
        <label className="field"><span>Email</span><input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required /></label>
        <label className="field"><span>WhatsApp number (with country code)</span><input inputMode="tel" value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} required /></label>
        <label className="field">
          <span>Role</span>
          <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
            {roles.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </label>
        <button type="submit" className="btn btn-primary" disabled={busy}>Create account</button>
      </form>
    </div>
  );
}
