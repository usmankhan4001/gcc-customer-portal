'use client';

import React from 'react';

interface SkeletonCardProps {
  height?: number | string;
  className?: string;
}

export default function SkeletonCard({ height = 140, className = '' }: SkeletonCardProps) {
  return (
    <div
      className={`card ${className}`}
      style={{
        height,
        background: 'var(--card-bg)',
        border: '1px solid var(--border)',
        padding: 18,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        gap: 12,
      }}
      aria-busy="true"
      aria-live="polite"
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div
          style={{
            width: 38,
            height: 38,
            borderRadius: 10,
            background: 'var(--surface-alt)',
            animation: 'fadeIn 1s infinite alternate',
          }}
        />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div
            style={{
              width: '50%',
              height: 14,
              borderRadius: 6,
              background: 'var(--surface-alt)',
              animation: 'fadeIn 1s infinite alternate',
            }}
          />
          <div
            style={{
              width: '80%',
              height: 10,
              borderRadius: 6,
              background: 'var(--surface-alt)',
              animation: 'fadeIn 1s infinite alternate',
            }}
          />
        </div>
      </div>

      <div
        style={{
          width: '100%',
          height: 38,
          borderRadius: 8,
          background: 'var(--surface-alt)',
          animation: 'fadeIn 1s infinite alternate',
        }}
      />
    </div>
  );
}
