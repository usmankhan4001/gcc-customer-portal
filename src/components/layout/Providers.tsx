'use client';

import React from 'react';
import { PortalProvider } from '@/lib/store';
import { ToastProvider } from '@/components/ui/Toast';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <PortalProvider>{children}</PortalProvider>
    </ToastProvider>
  );
}
