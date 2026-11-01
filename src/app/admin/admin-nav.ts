import { Contact2, DollarSign, LayoutDashboard, RefreshCcw, Users, type LucideIcon } from 'lucide-react';

/**
 * The admin's navigation, defined once (same model as the gccstartup-cms admin).
 *
 * "Day to day" is what staff open every morning; "Technical" is setup, collapsed until
 * asked for. The phone's bottom tab bar is the entries that have a `tab` label plus a
 * More button, so the bar and the sidebar cannot drift apart.
 */

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  group: 'day' | 'technical';
  /** Label for the phone bottom bar; present only on the destinations that get a tab. */
  tab?: string;
};

export const NAV_ITEMS: readonly NavItem[] = [
  { label: 'Pipeline', href: '/admin', icon: LayoutDashboard, group: 'day', tab: 'Pipeline' },
  { label: 'Clients & KYC', href: '/admin/clients', icon: Users, group: 'day', tab: 'Clients' },
  { label: 'Leads', href: '/admin/leads', icon: Contact2, group: 'day', tab: 'Leads' },
  { label: 'Renewals & Billing', href: '/admin/renewals', icon: RefreshCcw, group: 'day', tab: 'Renewals' },
  { label: 'Pricing', href: '/admin/pricing', icon: DollarSign, group: 'technical' },
];

export const DAY_ITEMS = NAV_ITEMS.filter((item) => item.group === 'day');
export const TECHNICAL_ITEMS = NAV_ITEMS.filter((item) => item.group === 'technical');
export const TAB_ITEMS = NAV_ITEMS.filter((item) => item.tab);

/** The nav entry that owns this URL: the longest href that is the path itself or a parent
 *  of it. `/admin` only owns itself, otherwise it would own everything. */
export function activeNavItem(pathname: string | null | undefined): NavItem | null {
  if (!pathname) return null;
  let best: NavItem | null = null;
  for (const item of NAV_ITEMS) {
    const owns = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(`${item.href}/`));
    if (owns && (!best || item.href.length > best.href.length)) best = item;
  }
  return best;
}

export function isTechnicalPath(pathname: string | null | undefined) {
  return activeNavItem(pathname)?.group === 'technical';
}

/** Title for the phone header. Falls back to "Admin" for routes outside the menu. */
export function titleForPath(pathname: string | null | undefined): string {
  return activeNavItem(pathname)?.label ?? 'Admin';
}

/** Where the header's back button goes on a detail page, or null on a top-level one. */
export function backTarget(pathname: string | null | undefined): string | null {
  if (!pathname) return null;
  const item = activeNavItem(pathname);
  return !item || pathname === item.href ? null : item.href;
}
