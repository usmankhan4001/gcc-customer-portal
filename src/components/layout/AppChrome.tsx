'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import TopBar from '@/components/design-system/TopBar';
import BottomTabBar from '@/components/design-system/BottomTabBar';
import ServiceWorkerRegistration from './ServiceWorkerRegistration';
import Providers from './Providers';

const FULL_SCREEN_ROUTES = ['/setup', '/checkout'];

export default function AppChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isFullScreen = FULL_SCREEN_ROUTES.some((r) => pathname.startsWith(r));
  const isHome = pathname === '/';

  return (
    <Providers>
      <ServiceWorkerRegistration />
      <div className="app-shell">
        {!isFullScreen && <TopBar isHome={isHome} pathname={pathname} />}
        <main
          id="main-content"
          className="app-page-content"
          style={{ paddingTop: isFullScreen ? 0 : undefined }}
        >
          {children}
        </main>
        {!isFullScreen && <BottomTabBar />}
      </div>
    </Providers>
  );
}
