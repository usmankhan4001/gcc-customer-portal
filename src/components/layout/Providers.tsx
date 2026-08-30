'use client';

import React from 'react';
import { ThemeProvider as NextThemesProvider } from 'next-themes';
import { PortalProvider } from '@/lib/store';
import { ToastProvider } from '@/components/ui/Toast';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Toaster } from '@/components/ui/sonner';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <TooltipProvider>
        <ToastProvider>
          <PortalProvider>{children}</PortalProvider>
        </ToastProvider>
        <Toaster position="top-center" />
      </TooltipProvider>
    </NextThemesProvider>
  );
}
