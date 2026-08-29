'use client';

import React from 'react';

export default function Loading() {
  return (
    <div
      style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: '20px 0' }}
      aria-busy="true"
      aria-live="polite"
    >
      <div className="card card-padded" style={{ height: 120 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingTop: 8 }}>
          <div
            style={{
              width: '40%',
              height: 16,
              borderRadius: 6,
              background: 'var(--color-surface-alt)',
              animation: 'fadeIn 1s infinite alternate',
            }}
          />
          <div
            style={{
              width: '80%',
              height: 12,
              borderRadius: 6,
              background: 'var(--color-surface-alt)',
              animation: 'fadeIn 1s infinite alternate',
              animationDelay: '0.1s',
            }}
          />
        </div>
      </div>

      <div className="card card-padded" style={{ height: 120 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingTop: 8 }}>
          <div
            style={{
              width: '55%',
              height: 16,
              borderRadius: 6,
              background: 'var(--color-surface-alt)',
              animation: 'fadeIn 1s infinite alternate',
              animationDelay: '0.15s',
            }}
          />
          <div
            style={{
              width: '70%',
              height: 12,
              borderRadius: 6,
              background: 'var(--color-surface-alt)',
              animation: 'fadeIn 1s infinite alternate',
              animationDelay: '0.2s',
            }}
          />
        </div>
      </div>

      <div className="card card-padded" style={{ height: 120 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingTop: 8 }}>
          <div
            style={{
              width: '35%',
              height: 16,
              borderRadius: 6,
              background: 'var(--color-surface-alt)',
              animation: 'fadeIn 1s infinite alternate',
              animationDelay: '0.25s',
            }}
          />
          <div
            style={{
              width: '65%',
              height: 12,
              borderRadius: 6,
              background: 'var(--color-surface-alt)',
              animation: 'fadeIn 1s infinite alternate',
              animationDelay: '0.3s',
            }}
          />
        </div>
      </div>
    </div>
  );
}
