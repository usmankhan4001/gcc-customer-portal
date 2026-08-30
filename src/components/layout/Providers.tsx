'use client';

import React from 'react';
import { PortalProvider } from '@/lib/store';
import { Toaster } from '@/components/ui/sonner';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Toaster />
      <PortalProvider>{children}</PortalProvider>
    </>
  );
}
