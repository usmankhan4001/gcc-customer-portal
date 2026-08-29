'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import TopBar from '@/components/design-system/TopBar';
import BottomTabBar from '@/components/design-system/BottomTabBar';
import ServiceWorkerRegistration from './ServiceWorkerRegistration';
import Providers from './Providers';

const hideTopBarPages = ['/'];

export default function AppChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isHome = pathname === '/';

  // Pages that hide top bar (full-bleed home)
  const showTopBar = !hideTopBarPages.includes(pathname);

  // Pages that hide bottom nav (setup wizard, checkout, admin)
  const showBottomNav = !pathname.startsWith('/setup') && !pathname.startsWith('/checkout') && !pathname.startsWith('/admin');

  return (
    <Providers>
      <ServiceWorkerRegistration />
      <div className="app-shell">
        {showTopBar && <TopBar showBack={!isHome && !pathname.startsWith('/tools') && !pathname.startsWith('/portal')} />}
        <main
          className="app-page-content"
          style={{
            paddingTop: showTopBar ? 16 : 0,
          }}
        >
          {children}
        </main>
        {showBottomNav && <BottomTabBar />}
      </div>
    </Providers>
  );
}
