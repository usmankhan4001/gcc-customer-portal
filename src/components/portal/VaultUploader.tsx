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
    <div className="flex flex-col items-end gap-2">
      <div className="flex items-center gap-2">
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="text-sm border border-gray-300 rounded-md px-2 py-2 bg-white"
          disabled={uploading}
        >
          {CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
        <button
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-md hover:bg-primary-700 disabled:opacity-60 transition-colors font-bold text-sm shadow-sm"
        >
          {uploading ? <CircleNotch className="w-4 h-4 animate-spin" /> : <UploadSimple className="w-4 h-4" />}
          {uploading ? 'UPLOADING...' : 'UPLOAD'}
        </button>
        <input ref={inputRef} type="file" className="hidden" onChange={handleFileChange} />
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
