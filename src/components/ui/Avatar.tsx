'use client';

import React from 'react';

const COLORS = [
  'var(--color-orange)',
  'var(--color-navy)',
  'var(--color-info)',
  'var(--color-success)',
];

const SIZES = {
  sm: 32,
  md: 40,
  lg: 56,
} as const;

function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

interface AvatarProps {
  name: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function Avatar({ name, size = 'md', className = '' }: AvatarProps) {
  const px = SIZES[size];
  const color = COLORS[hashCode(name) % COLORS.length];
  const fontSize = size === 'sm' ? 11 : size === 'md' ? 13 : 18;

  return (
    <div
      className={className}
      style={{
        width: px,
        height: px,
        minWidth: px,
        borderRadius: '50%',
        background: color,
        color: '#FFFFFF',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 700,
        fontSize,
        fontFamily: 'var(--font-heading)',
        lineHeight: 1,
        userSelect: 'none',
      }}
      aria-label={name}
      title={name}
    >
      {getInitials(name)}
    </div>
  );
}
