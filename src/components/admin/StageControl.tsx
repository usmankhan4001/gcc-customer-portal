'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { COMPANY_STAGES, STAGE_FIELDS, STAGE_LABEL, WAITING_ON, type CompanyStage, type StageInput } from '@/lib/staff/stages';
import { WAITING_LABEL } from '@/lib/staff/ui';

interface Props {
  companyId: string;
  stage: string;
  onHold: boolean;
  waitingOn: string | null;
  holdReason: string | null;
  /** What this person may do, worked out on the server from their role. */
  canMoveForward: boolean;
  canMoveBack: boolean;
  canHold: boolean;
  canCancel: boolean;
}

async function post(companyId: string, body: unknown): Promise<string | null> {
  const res = await fetch(`/api/admin/companies/${companyId}/stage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (res.ok) return null;
  return (await res.json().catch(() => null))?.error ?? 'Something went wrong. Please try again.';
}

export function StageControl(p: Props) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [input, setInput] = useState<StageInput>({});
  const [backTo, setBackTo] = useState('');
  const [reason, setReason] = useState('');
  const [waitingOn, setWaitingOn] = useState<string>('client');
  const [holdWhy, setHoldWhy] = useState('');
  const [cancelTo, setCancelTo] = useState<'cancelled' | 'refunded'>('cancelled');
  const [confirmCancel, setConfirmCancel] = useState(false);

  const index = COMPANY_STAGES.indexOf(p.stage as CompanyStage);
  const closed = index < 0; // cancelled or refunded
  const next = !closed ? COMPANY_STAGES[index + 1] : undefined;
  const earlier = !closed ? COMPANY_STAGES.slice(0, index) : [];
  const fields = next ? STAGE_FIELDS[next] ?? [] : [];

  async function run(body: unknown, done?: () => void) {
    setBusy(true);
    setError(null);
    const err = await post(p.companyId, body);
    setBusy(false);
    if (err) return setError(err);
    done?.();
    router.refresh();
  }

  if (closed) {
    return <div className="admin-callout"><p>This company is {STAGE_LABEL[p.stage as keyof typeof STAGE_LABEL]?.toLowerCase()}. It can no longer be moved.</p></div>;
  }

  return (
    <div className="admin-card-stack" style={{ alignItems: 'stretch', width: '100%' }}>
      {error && <p className="admin-text-error" role="alert">{error}</p>}

      {next && p.canMoveForward && (
        <form
          className="admin-form-stack"
          onSubmit={(e) => {
            e.preventDefault();
            run({ action: 'move', to: next, input }, () => setInput({}));
          }}
        >
          <div className="admin-card-stack-title">Move to {STAGE_LABEL[next]}</div>
          {fields.map((f) => (
            <label key={f.key} className="field">
              <span>{f.label}</span>
              <input
                type={f.type ?? 'text'}
                value={input[f.key] ?? ''}
                onChange={(e) => setInput({ ...input, [f.key]: e.target.value })}
                required
              />
            </label>
          ))}
          <button type="submit" className="btn btn-primary" disabled={busy}>
            {busy ? 'Saving...' : `Move to ${STAGE_LABEL[next]}`}
          </button>
        </form>
      )}
      {!next && <p className="admin-text-muted">This company is at the final stage.</p>}

      {earlier.length > 0 && p.canMoveBack && (
        <form
          className="admin-form-stack"
          onSubmit={(e) => {
            e.preventDefault();
            run({ action: 'move', to: backTo, input: { reason } }, () => setReason(''));
          }}
        >
          <div className="admin-card-stack-title">Move back (needs a reason)</div>
          <select value={backTo} onChange={(e) => setBackTo(e.target.value)} aria-label="Stage to move back to" required>
            <option value="">Choose a stage</option>
            {earlier.map((s) => <option key={s} value={s}>{STAGE_LABEL[s]}</option>)}
          </select>
          <input type="text" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Why is it going back?" required minLength={5} />
          <button type="submit" className="btn" disabled={busy}>Move back</button>
        </form>
      )}

      {p.canHold && (
        <div className="admin-form-stack">
          <div className="admin-card-stack-title">On hold</div>
          {p.onHold ? (
            <>
              <p>Waiting on <strong>{WAITING_LABEL[p.waitingOn ?? ''] ?? p.waitingOn}</strong>: {p.holdReason}</p>
              <button type="button" className="btn" disabled={busy} onClick={() => run({ action: 'hold', on: false })}>Release hold</button>
            </>
          ) : (
            <form
              className="admin-form-stack"
              onSubmit={(e) => {
                e.preventDefault();
                run({ action: 'hold', on: true, waitingOn, reason: holdWhy }, () => setHoldWhy(''));
              }}
            >
              <select value={waitingOn} onChange={(e) => setWaitingOn(e.target.value)} aria-label="Waiting on">
                {WAITING_ON.map((w) => <option key={w} value={w}>Waiting on {WAITING_LABEL[w].toLowerCase()}</option>)}
              </select>
              <input type="text" value={holdWhy} onChange={(e) => setHoldWhy(e.target.value)} placeholder="Why is it on hold?" required />
              <button type="submit" className="btn" disabled={busy}>Put on hold</button>
            </form>
          )}
        </div>
      )}

      {p.canCancel && (
        <div className="admin-form-stack">
          <div className="admin-card-stack-title">Cancel or refund (Super Admin only, final)</div>
          <select value={cancelTo} onChange={(e) => { setCancelTo(e.target.value as 'cancelled' | 'refunded'); setConfirmCancel(false); }} aria-label="Cancel or refund">
            <option value="cancelled">Cancelled</option>
            <option value="refunded">Refunded</option>
          </select>
          <input type="text" value={reason} onChange={(e) => { setReason(e.target.value); setConfirmCancel(false); }} placeholder="Reason" />
          {!confirmCancel ? (
            <button type="button" className="btn" disabled={busy || reason.trim().length < 5} onClick={() => setConfirmCancel(true)}>
              Set {cancelTo}
            </button>
          ) : (
            <button type="button" className="btn btn-primary" disabled={busy} onClick={() => run({ action: 'move', to: cancelTo, input: { reason } })}>
              Confirm: this cannot be undone
            </button>
          )}
        </div>
      )}
    </div>
  );
}
