'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { X } from '@phosphor-icons/react';
import s from './dash.module.css';

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
    <div className={s.promo}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p className={s.promoTitle}>{banner.title}</p>
        <p className={s.promoBody}>{banner.body}</p>
      </div>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          handleDismiss();
        }}
        className={s.promoClose}
        aria-label="Dismiss"
      >
        <X size={18} />
      </button>
    </div>
  );

  return banner.link_url ? (
    <Link href={banner.link_url} style={{ display: 'block', textDecoration: 'none' }}>
      {content}
    </Link>
  ) : (
    content
  );
}
