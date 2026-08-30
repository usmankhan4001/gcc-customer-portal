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
      onClick={handleShare}
      disabled={loading}
      className="p-1.5 text-gray-400 hover:text-primary hover:bg-primary-50 rounded-md transition-colors"
      title="Create shareable link (copies to clipboard, expires in 7 days)"
    >
      {loading ? (
        <CircleNotch className="w-4 h-4 animate-spin" />
      ) : copied ? (
        <Check className="w-4 h-4 text-success" />
      ) : (
        <LinkIcon className="w-4 h-4" />
      )}
    </button>
  );
}
