'use client';

import { useState } from 'react';
import { LinkSimple as LinkIcon, CircleNotch, Check } from '@phosphor-icons/react';

export default function ShareButton({ documentId }: { documentId: string }) {
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    setLoading(true);
    setCopied(false);
    try {
      const res = await fetch('/api/vault/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ document_id: documentId }),
      });
      const data = await res.json();
      if (data.url) {
        await navigator.clipboard.writeText(data.url).catch(() => {});
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleShare}
      disabled={loading}
      className="cl-icon-btn"
      aria-label={copied ? 'Link copied' : 'Copy shareable link (expires in 7 days)'}
      title="Create shareable link (copies to clipboard, expires in 7 days)"
    >
      {loading ? (
        <CircleNotch size={18} className="animate-spin" aria-hidden="true" />
      ) : copied ? (
        <Check size={18} style={{ color: 'var(--green-dk)' }} aria-hidden="true" />
      ) : (
        <LinkIcon size={18} aria-hidden="true" />
      )}
    </button>
  );
}
