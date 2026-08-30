'use client';

import React from 'react';
import { Toaster } from '@/components/ui/sonner';
import PostHogInit from '@/components/layout/PostHogInit';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <>
      <PostHogInit />
      <Toaster />
      {children}
    </>
  );
}
