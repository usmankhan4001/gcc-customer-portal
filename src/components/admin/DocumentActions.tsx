'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { REJECTION_PRESETS } from '@/lib/staff/documents';

interface Props {
  documentId: string;
  reviewStatus: string;
  canReview: boolean;
  canView: boolean;
}

const CUSTOM = '__custom';

export function DocumentActions({ documentId, reviewStatus, canReview, canView }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState(false);
  const [preset, setPreset] = useState<string>(REJECTION_PRESETS[0]);
  const [custom, setCustom] = useState('');

  async function view() {
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/admin/documents/${documentId}/view`);
    setBusy(false);
    const data = await res.json().catch(() => null);
    if (!res.ok || !data?.url) return setError(data?.error ?? 'Could not open the document.');
    // The link works for one minute. View only: no download button, and each open is logged.
    window.open(data.url, '_blank', 'noopener,noreferrer');
  }

  async function review(decision: 'accept' | 'reject') {
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/admin/documents/${documentId}/review`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ decision, reason: preset === CUSTOM ? custom : preset }),
    });
    setBusy(false);
    if (!res.ok) return setError((await res.json().catch(() => null))?.error ?? 'Could not save the review.');
    setRejecting(false);
    router.refresh();
  }

  return (
    <div className="admin-actions">
      {error && <span className="admin-text-error" role="alert">{error}</span>}
      {canView && <button type="button" className="btn" disabled={busy} onClick={view}>View</button>}
      {canReview && !rejecting && (
        <>
          {reviewStatus !== 'accepted' && <button type="button" className="btn btn-primary" disabled={busy} onClick={() => review('accept')}>Accept</button>}
          {reviewStatus !== 'rejected' && <button type="button" className="btn" disabled={busy} onClick={() => setRejecting(true)}>Reject</button>}
        </>
      )}
      {canReview && rejecting && (
        <span className="admin-inline-form">
          <select value={preset} onChange={(e) => setPreset(e.target.value)} aria-label="Rejection reason">
            {REJECTION_PRESETS.map((r) => <option key={r} value={r}>{r}</option>)}
            <option value={CUSTOM}>Other reason...</option>
          </select>
          {preset === CUSTOM && <input type="text" value={custom} onChange={(e) => setCustom(e.target.value)} placeholder="Reason" aria-label="Custom reason" />}
          <button type="button" className="btn btn-primary" disabled={busy || (preset === CUSTOM && custom.trim().length < 3)} onClick={() => review('reject')}>Send rejection</button>
          <button type="button" className="btn" onClick={() => setRejecting(false)}>Cancel</button>
        </span>
      )}
    </div>
  );
}
