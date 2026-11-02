import { Bell, Compass, FolderOpen, LayoutDashboard, UserRound, type LucideIcon } from 'lucide-react';

/** The client portal's navigation, defined once: the sidebar and the phone bottom bar both read it. */
export type ClientNavItem = { label: string; href: string; icon: LucideIcon; tab: string };

export const CLIENT_NAV: readonly ClientNavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, tab: 'Home' },
  { label: 'Document vault', href: '/vault', icon: FolderOpen, tab: 'Documents' },
  { label: 'Services & add-ons', href: '/services', icon: Compass, tab: 'Services' },
  { label: 'Profile & settings', href: '/profile', icon: UserRound, tab: 'Profile' },
];

/** Not in the bottom bar (the header bell reaches it), but it still needs a title. */
const EXTRA_TITLES: Record<string, { label: string; icon: LucideIcon }> = {
  '/notifications': { label: 'Notifications', icon: Bell },
  '/support': { label: 'Support', icon: Bell },
};

export function activeClientNav(pathname: string | null | undefined): ClientNavItem | null {
  if (!pathname) return null;
  return CLIENT_NAV.find((i) => pathname === i.href || pathname.startsWith(`${i.href}/`)) ?? null;
}

export function clientTitle(pathname: string | null | undefined): string {
  if (pathname && EXTRA_TITLES[pathname]) return EXTRA_TITLES[pathname].label;
  return activeClientNav(pathname)?.label ?? 'GCCStartup';
}

/** Detail pages (/services/uae) go back to their section; section roots have no back button. */
export function clientBackTarget(pathname: string | null | undefined): string | null {
  const item = activeClientNav(pathname);
  if (item && pathname !== item.href) return item.href;
  if (pathname && EXTRA_TITLES[pathname]) return '/dashboard';
  return null;
}
