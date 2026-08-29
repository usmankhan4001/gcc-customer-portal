'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Portal Runtime Error:', error);
  }, [error]);

  return (
    <div
      style={{
        minHeight: '50vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 0',
      }}
    >
      <div className="card card-padded" style={{ maxWidth: 480, width: '100%', textAlign: 'center' }}>
        <div className="empty-state" style={{ padding: '24px 0' }}>
          <div className="empty-state-icon" style={{ background: 'var(--color-error-light)', color: 'var(--color-error)' }}>
            <AlertTriangle size={32} />
          </div>
          <h2 className="empty-state-title">Something Went Wrong</h2>
          <p className="empty-state-desc">
            {error.message || 'An unexpected error occurred. Please try again.'}
          </p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
            <button onClick={() => reset()} className="btn btn-primary btn-sm">
              <RefreshCw size={14} />
              <span>Try Again</span>
            </button>
            <Link href="/" className="btn btn-secondary btn-sm" style={{ textDecoration: 'none' }}>
              <Home size={14} />
              <span>Go Home</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
