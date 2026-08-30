'use client';

import { useState } from 'react';
import { Link as LinkIcon, Loader2, Check } from 'lucide-react';

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
      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
      title="Create shareable link (copies to clipboard, expires in 7 days)"
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : copied ? (
        <Check className="w-4 h-4 text-green-600" />
      ) : (
        <LinkIcon className="w-4 h-4" />
      )}
    </button>
  );
}
