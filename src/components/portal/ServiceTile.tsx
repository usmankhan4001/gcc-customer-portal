import React from 'react';
import Link from 'next/link';

interface ServiceTileProps {
  title: string;
  icon: React.ReactNode;
  href: string;
}

export default function ServiceTile({ title, icon, href }: ServiceTileProps) {
  return (
    <Link
      href={href}
      className="card"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 'var(--space-3)',
        minHeight: 112,
        padding: 'var(--space-4)',
        textAlign: 'center',
        textDecoration: 'none',
        color: 'var(--text-primary)',
      }}
    >
      <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--orange)' }}>{icon}</span>
      <span style={{ fontSize: 14, fontWeight: 700, lineHeight: 1.3 }}>{title}</span>
    </Link>
  );
}
