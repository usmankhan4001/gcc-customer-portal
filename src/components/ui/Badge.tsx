'use client';

import React from 'react';

type BadgeVariant = 'orange' | 'navy' | 'success' | 'error' | 'warning' | 'info';

interface BadgeProps {
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
  children: React.ReactNode;
  className?: string;
}

export default function Badge({ variant = 'navy', size = 'md', children, className = '' }: BadgeProps) {
  const sizeClass = size === 'sm' ? 'badge-sm' : '';
  return (
    <span className={`badge badge-${variant} ${sizeClass} ${className}`}>
      {children}
    </span>
  );
}

export { Badge };
