'use client';

import React from 'react';

interface SkeletonProps {
  variant: 'text' | 'title' | 'card' | 'avatar' | 'image';
  width?: string;
  height?: string;
  className?: string;
}

const BASE: React.CSSProperties = {
  borderRadius: 'var(--radius-sm)',
  background: 'linear-gradient(90deg, var(--color-border) 25%, var(--color-surface-alt) 50%, var(--color-border) 75%)',
  backgroundSize: '200% 100%',
  animation: 'skeletonShimmer 1.5s ease-in-out infinite',
};

function dimensions(variant: SkeletonProps['variant'], w?: string, h?: string): React.CSSProperties {
  switch (variant) {
    case 'text':
      return { width: w ?? '100%', height: h ?? '14px' };
    case 'title':
      return { width: w ?? '60%', height: h ?? '20px' };
    case 'card':
      return { width: w ?? '100%', height: h ?? '120px', borderRadius: 'var(--radius-lg)' };
    case 'avatar':
      return { width: w ?? '40px', height: h ?? '40px', borderRadius: '50%' };
    case 'image':
      return { width: w ?? '100%', height: h ?? '180px', borderRadius: 'var(--radius-md)' };
  }
}

export default function Skeleton({ variant, width, height, className = '' }: SkeletonProps) {
  return (
    <>
      <style>{`
        @keyframes skeletonShimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
      <div
        className={className}
        style={{ ...BASE, ...dimensions(variant, width, height) }}
        aria-hidden="true"
      />
    </>
  );
}
