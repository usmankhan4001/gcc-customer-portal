'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import s from './dash.module.css';
import { CHECKLIST_LABEL, UPLOAD_MIME_TYPES, type ChecklistItem, type ChecklistStatus } from '@/lib/catalog/checklist';

const BADGE: Record<ChecklistStatus, string> = {
  not_uploaded: 'badge-neutral',
  uploaded: 'badge-info',
  under_review: 'badge-info',
  accepted: 'badge-success',
  rejected: 'badge-danger',
};

const MAX_BYTES = 25 * 1024 * 1024;

/** One row per required document; the client uploads straight to storage with a short-lived link. */
export default function DocumentChecklist({ companyId, items }: { companyId: string; items: ChecklistItem[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function upload(item: ChecklistItem, file: File) {
    setError(null);
    if (file.size > MAX_BYTES) return setError('That file is over 25 MB. Please send a smaller one.');
    if (!(UPLOAD_MIME_TYPES as readonly string[]).includes(file.type)) return setError('Please upload a PDF, JPG, PNG, WebP or HEIC file.');
    setBusy(item.key);
    try {
      const res = await fetch('/api/vault/presign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ company_id: companyId, requirement_key: item.key, file_name: file.name, file_size: file.size, mime_type: file.type }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');
      const put = await fetch(data.upload_url, { method: 'PUT', headers: { 'Content-Type': file.type }, body: file });
      if (!put.ok) throw new Error('The file could not be saved. Please try again.');
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed');
    } finally {
      setBusy(null);
    }
  }

  return (
    <>
      {error && <p role="alert" style={{ color: 'var(--danger, #b42318)', margin: '0 0 12px' }}>{error}</p>}
      <ul className={s.list}>
        {items.map((item) => (
          <li key={item.key} className={s.row}>
            <div className={s.rowText}>
              <p className={s.rowTitle}>
                {item.label}
                {!item.required && <span style={{ fontWeight: 400 }}> (optional)</span>}
              </p>
              {item.reason ? (
                <p className={s.rowMeta}>Rejected: {item.reason}</p>
              ) : item.help ? (
                <p className={s.rowMeta}>{item.help}</p>
              ) : null}
            </div>
            <span className={`badge ${BADGE[item.status]}`}>{CHECKLIST_LABEL[item.status]}</span>
            {item.status !== 'accepted' && item.status !== 'under_review' && (
              <label className="btn" style={{ cursor: busy ? 'wait' : 'pointer' }}>
                {busy === item.key ? 'Uploading…' : item.status === 'not_uploaded' ? 'Upload' : 'Upload again'}
                <input
                  type="file"
                  hidden
                  disabled={busy !== null}
                  accept={UPLOAD_MIME_TYPES.join(',')}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    e.target.value = '';
                    if (f) void upload(item, f);
                  }}
                />
              </label>
            )}
          </li>
        ))}
      </ul>
    </>
  );
}
