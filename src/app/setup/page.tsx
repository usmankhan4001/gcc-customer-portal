'use client';

import React, { Suspense } from 'react';
import OnboardingWizard from '@/components/onboarding/OnboardingWizard';

export default function SetupPage() {
  return (
    <Suspense fallback={
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100dvh' }}>
        <span className="text-muted" style={{ fontSize: 14 }}>Loading...</span>
      </div>
    }>
      <OnboardingWizard />
    </Suspense>
  );
}
