'use client';

import React, { Suspense } from 'react';
import OnboardingWizard from '@/components/onboarding/OnboardingWizard';

export default function SetupPage() {
  return (
    <Suspense fallback={<div className="text-center py-20 text-muted">Loading Formation Configurator...</div>}>
      <OnboardingWizard />
    </Suspense>
  );
}
