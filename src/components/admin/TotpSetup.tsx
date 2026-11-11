'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function TotpSetup({ enabled }: { enabled: boolean }) {
  const router = useRouter();
  const [setup, setSetup] = useState<{ secret: string; uri: string } | null>(null);
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function call(body: unknown) {
    setBusy(true);
    setError(null);
    const res = await fetch('/api/staff/totp', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    setBusy(false);
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      setError(data?.error ?? 'Something went wrong.');
      return null;
    }
    return data;
  }

  if (enabled) {
    return <div className="admin-callout"><p>Two-factor sign-in is on. You will be asked for a code from your authenticator app each time you sign in.</p></div>;
  }

  return (
    <div className="admin-card-stack" style={{ alignItems: 'stretch' }}>
      {error && <p className="admin-text-error" role="alert">{error}</p>}
      {!setup ? (
        <>
          <p>Use an authenticator app (Google Authenticator, Microsoft Authenticator, 1Password or Authy).</p>
          <button type="button" className="btn btn-primary" disabled={busy} onClick={async () => { const d = await call({ action: 'start' }); if (d) setSetup(d); }}>
            Set up two-factor sign-in
          </button>
        </>
      ) : (
        <form
          className="admin-form-stack"
          onSubmit={async (e) => {
            e.preventDefault();
            if (await call({ action: 'confirm', code })) router.refresh();
          }}
        >
          <p>In your app choose <strong>Add account</strong> then <strong>Enter a setup key</strong>, and type this key (time-based):</p>
          <code className="admin-code-block" style={{ userSelect: 'all', wordBreak: 'break-all' }}>{setup.secret}</code>
          <label className="field">
            <span>Now enter the 6-digit code the app shows</span>
            <input type="text" inputMode="numeric" autoComplete="one-time-code" pattern="\d{6}" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} required />
          </label>
          <button type="submit" className="btn btn-primary" disabled={busy || code.length !== 6}>Turn on two-factor</button>
        </form>
      )}
    </div>
  );
}
