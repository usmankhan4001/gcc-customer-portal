'use client';

import React from 'react';
import { PortalProvider } from '@/lib/store';

export default function Providers({ children }: { children: React.ReactNode }) {
  return <PortalProvider>{children}</PortalProvider>;
}
