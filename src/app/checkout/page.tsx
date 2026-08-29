'use client';

import React, { Suspense } from 'react';
import CheckoutForm from '@/components/checkout/CheckoutForm';

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="text-center py-20 text-muted">Securing Checkout Engine...</div>}>
      <CheckoutForm />
    </Suspense>
  );
}
