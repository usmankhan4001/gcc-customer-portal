'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Props {
  companyId: string;
  assignedTo: string | null;
  staff: Array<{ id: string; name: string }>;
}

export function AssignControl({ companyId, assignedTo, staff }: Props) {
  const router = useRouter();
  const [value, setValue] = useState(assignedTo ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/admin/companies/${companyId}/assign`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: value || null }),
    });
    setBusy(false);
    if (!res.ok) return setError((await res.json().catch(() => null))?.error ?? 'Could not assign.');
    router.refresh();
  }

  return (
    <span className="admin-inline-form">
      <select value={value} onChange={(e) => setValue(e.target.value)} aria-label="Assigned to">
        <option value="">Unassigned</option>
        {staff.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
      </select>
      <button type="button" className="btn" disabled={busy || value === (assignedTo ?? '')} onClick={save}>Assign</button>
      {error && <span className="admin-text-error" role="alert">{error}</span>}
    </span>
  );
}
