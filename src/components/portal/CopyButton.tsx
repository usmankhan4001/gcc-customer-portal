'use client';

import React, { useState } from 'react';
import { Copy, Check } from '@phosphor-icons/react';

interface CopyButtonProps {
  text: string;
  className?: string;
}

export default function CopyButton({ text, className }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch (err) {
      console.error('Failed to copy to clipboard', err);
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={
        className ??
        'flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary-600 transition-colors px-2 py-1 rounded hover:bg-primary-50'
      }
      aria-label={copied ? 'Copied referral link' : 'Copy referral link'}
    >
      {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
      {copied ? 'Copied' : 'Copy'}
    </button>
  );
}
