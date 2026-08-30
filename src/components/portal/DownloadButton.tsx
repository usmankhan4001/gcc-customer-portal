'use client';

import { useState } from 'react';
import { DownloadSimple, CircleNotch } from '@phosphor-icons/react';

export default function DownloadButton({ documentId }: { documentId: string }) {
  const [loading, setLoading] = useState(false);

  const handleDownload = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/vault/${documentId}/download`);
      const data = await res.json();
      if (data.url) window.open(data.url, '_blank');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleDownload}
      disabled={loading}
      className="p-1.5 text-gray-400 hover:text-gray-900 hover:bg-gray-200 rounded-md transition-colors"
      title="Download"
    >
      {loading ? <CircleNotch className="w-4 h-4 animate-spin" /> : <DownloadSimple className="w-4 h-4" />}
    </button>
  );
}
