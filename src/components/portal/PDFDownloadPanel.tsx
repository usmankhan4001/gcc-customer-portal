'use client';

import { useState } from 'react';
import { Download, Mail, Loader2 } from 'lucide-react';
import type { PDFRow } from '@/lib/pdf';

interface PDFDownloadPanelProps {
  leadId: string;
  title: string;
  subtitle?: string;
  rows: PDFRow[];
  hasEmail: boolean;
}

export default function PDFDownloadPanel({ leadId, title, subtitle, rows, hasEmail }: PDFDownloadPanelProps) {
  const [loading, setLoading] = useState<'download' | 'email' | null>(null);
  const [emailed, setEmailed] = useState(false);

  const generate = async (emailIt: boolean) => {
    setLoading(emailIt ? 'email' : 'download');
    try {
      const res = await fetch('/api/pdf/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lead_id: leadId, title, subtitle, rows, email_it: emailIt }),
      });
      const data = await res.json();
      if (emailIt) {
        setEmailed(true);
      } else if (data.url) {
        window.open(data.url, '_blank');
      }
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      <button
        onClick={() => generate(false)}
        disabled={loading !== null}
        className="flex items-center gap-1.5 bg-white border border-gray-300 hover:bg-gray-50 disabled:opacity-60 text-gray-700 text-xs font-semibold px-3 py-2 rounded-md transition-colors"
      >
        {loading === 'download' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
        Download PDF
      </button>
      {hasEmail && (
        <button
          onClick={() => generate(true)}
          disabled={loading !== null || emailed}
          className="flex items-center gap-1.5 bg-white border border-gray-300 hover:bg-gray-50 disabled:opacity-60 text-gray-700 text-xs font-semibold px-3 py-2 rounded-md transition-colors"
        >
          {loading === 'email' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Mail className="w-3.5 h-3.5" />}
          {emailed ? 'Emailed' : 'Email me this'}
        </button>
      )}
    </div>
  );
}
