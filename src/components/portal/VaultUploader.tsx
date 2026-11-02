'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { UploadSimple, CircleNotch } from '@phosphor-icons/react';

const CATEGORIES = [
  { value: 'trade_license', label: 'Trade License' },
  { value: 'moa_aoa', label: 'MOA / AOA' },
  { value: 'share_certificate', label: 'Share Certificate' },
  { value: 'tax_certificate', label: 'Tax Certificate' },
  { value: 'nominee_poa', label: 'Nominee POA' },
  { value: 'bank_document', label: 'Bank Document' },
  { value: 'other', label: 'Other' },
];

export default function VaultUploader() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [category, setCategory] = useState('other');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');
    setUploading(true);
    try {
      const presignRes = await fetch('/api/vault/presign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category,
          file_name: file.name,
          file_size: file.size,
          mime_type: file.type || 'application/octet-stream',
        }),
      });
      const presignData = await presignRes.json();
      if (!presignRes.ok) {
        setError(presignData.error ?? 'Could not prepare upload.');
        return;
      }

      const putRes = await fetch(presignData.upload_url, {
        method: 'PUT',
        headers: { 'Content-Type': file.type || 'application/octet-stream' },
        body: file,
      });
      if (!putRes.ok) {
        setError('Upload to storage failed.');
        return;
      }

      router.refresh();
    } catch {
      setError('Something went wrong uploading your file.');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div style={{ display: 'grid', gap: 'var(--space-2)' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
        <select
          aria-label="Document category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="cl-select"
          style={{ flex: '1 1 160px' }}
          disabled={uploading}
        >
          {CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="btn btn-primary"
          style={{ flex: '1 1 140px', minHeight: 'var(--touch-target)' }}
        >
          {uploading ? (
            <CircleNotch className="animate-spin" aria-hidden="true" />
          ) : (
            <UploadSimple aria-hidden="true" />
          )}
          {uploading ? 'Uploading…' : 'Upload document'}
        </button>
        <input ref={inputRef} type="file" hidden onChange={handleFileChange} />
      </div>
      {error && (
        <p role="alert" style={{ margin: 0, fontSize: 14, color: 'var(--danger)' }}>
          {error}
        </p>
      )}
    </div>
  );
}
