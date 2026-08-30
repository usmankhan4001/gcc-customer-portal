'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { X } from '@phosphor-icons/react';

interface PromoBannerData {
  id: string;
  title: string;
  body: string;
  link_url: string | null;
}

export default function PromoBanner({ banner }: { banner: PromoBannerData }) {
  const [dismissed, setDismissed] = useState(true); // start hidden to avoid SSR/CSR flash

  useEffect(() => {
    try {
      const dismissedIds: string[] = JSON.parse(localStorage.getItem('dismissed_promo_banners') || '[]');
      setDismissed(dismissedIds.includes(banner.id));
    } catch {
      setDismissed(false);
    }
  }, [banner.id]);

  const handleDismiss = () => {
    setDismissed(true);
    try {
      const dismissedIds: string[] = JSON.parse(localStorage.getItem('dismissed_promo_banners') || '[]');
      localStorage.setItem('dismissed_promo_banners', JSON.stringify([...dismissedIds, banner.id]));
    } catch {
      // localStorage unavailable — banner will just reappear next load, non-critical
    }
  };

  if (dismissed) return null;

  const content = (
    <div className="bg-primary/10 border border-primary/20 rounded-md p-3 flex items-start gap-3">
      <div className="flex-1">
        <p className="text-sm font-bold text-gray-900">{banner.title}</p>
        <p className="text-xs text-gray-600 mt-0.5">{banner.body}</p>
      </div>
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          handleDismiss();
        }}
        className="text-gray-400 hover:text-gray-600 shrink-0"
        aria-label="Dismiss"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );

  return banner.link_url ? (
    <Link href={banner.link_url} className="block">
      {content}
    </Link>
  ) : (
    content
  );
}
