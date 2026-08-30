'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { House, FolderOpen, Compass, ChatCircleDots, User } from '@phosphor-icons/react';
import ConnectSheet from '@/components/portal/ConnectSheet';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Home', icon: House },
  { href: '/vault', label: 'Vault', icon: FolderOpen },
  { href: '/services', label: 'Services', icon: Compass },
  { href: '/profile', label: 'Profile', icon: User },
] as const;

// Sub-pages like services/[id] have their own fixed bottom CTA that would
// visually collide with the tab bar — only show it on root screens, same
// restriction the previous layout had.
const BOTTOM_NAV_ROOTS = ['/dashboard', '/vault', '/services', '/support', '/profile', '/notifications'];

/**
 * Shared nav item list driving both the mobile bottom tab bar and the
 * desktop sidebar (Decision 23) — one source of truth for active-state
 * highlighting and one shared ConnectSheet instance, rather than two
 * separately maintained/mounted nav components. Visibility of each is
 * pure CSS (`lg:hidden` / `hidden lg:flex`), not conditional rendering,
 * so there's no hydration mismatch between server and client.
 */
export default function NavLinks() {
  const pathname = usePathname();
  const [connectOpen, setConnectOpen] = useState(false);
  const showBottomNav = BOTTOM_NAV_ROOTS.includes(pathname);

  return (
    <>
      {/* Mobile bottom tab bar */}
      <nav
        className={`fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 justify-around items-center h-20 px-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-40 lg:hidden ${showBottomNav ? 'flex' : 'hidden'}`}
      >
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-1 transition-colors group ${active ? 'text-primary' : 'text-gray-500 hover:text-primary'}`}
            >
              <item.icon size={24} weight={active ? 'fill' : 'regular'} className="group-hover:scale-110 transition-transform" />
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          );
        })}
        <button
          onClick={() => setConnectOpen(true)}
          className="flex flex-col items-center gap-1 transition-colors group text-gray-500 hover:text-primary"
        >
          <ChatCircleDots size={24} className="group-hover:scale-110 transition-transform" />
          <span className="text-xs font-medium">Support</span>
        </button>
      </nav>

      {/* Desktop sidebar */}
      <nav className="hidden lg:flex lg:flex-col lg:gap-1 lg:w-56 lg:shrink-0 lg:py-6 lg:px-3 lg:border-r lg:border-gray-200 lg:bg-white">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                active ? 'bg-primary-50 text-primary-600' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <item.icon size={20} weight={active ? 'fill' : 'regular'} />
              {item.label}
            </Link>
          );
        })}
        <button
          onClick={() => setConnectOpen(true)}
          className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors text-left"
        >
          <ChatCircleDots size={20} />
          Support
        </button>
      </nav>

      <ConnectSheet open={connectOpen} onOpenChange={setConnectOpen} />
    </>
  );
}
