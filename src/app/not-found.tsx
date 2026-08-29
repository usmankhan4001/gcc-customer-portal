'use client';

import React from 'react';
import Link from 'next/link';
import { MapPinOff } from 'lucide-react';

export default function NotFound() {
  return (
    <div
      style={{
        minHeight: '60vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
      }}
    >
      <div className="card card-padded" style={{ maxWidth: 480, width: '100%', textAlign: 'center' }}>
        <div className="empty-state">
          <div className="empty-state-icon">
            <MapPinOff size={32} />
          </div>
          <h1 className="empty-state-title">Page Not Found</h1>
          <p className="empty-state-desc">
            The page you&apos;re looking for doesn&apos;t exist or has been moved.
          </p>
          <Link href="/" className="btn btn-primary">
            Go Home
          </Link>
        </div>
      </div>
    </div>
  );
}
