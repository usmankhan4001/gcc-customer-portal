'use client';

import React, { Suspense } from 'react';
import CheckoutForm from '@/components/checkout/CheckoutForm';

function CheckoutSpinner() {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100dvh',
      width: '100%',
    }}>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 16,
      }}>
        <div className="spinner" />
        <p className="text-secondary" style={{ fontSize: 14, fontWeight: 500 }}>
          Securing checkout…
        </p>
        <style>{`
          .spinner {
            width: 32px;
            height: 32px;
            border: 3px solid var(--border);
            border-top-color: var(--color-orange);
            border-radius: 50%;
            animation: spin 0.7s linear infinite;
          }
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<CheckoutSpinner />}>
      <CheckoutForm />
    </Suspense>
  );
}
