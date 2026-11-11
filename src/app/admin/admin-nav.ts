import {
  Contact2,
  DollarSign,
  FileCheck2,
  Home,
  LayoutDashboard,
  RefreshCcw,
  ScrollText,
  UserCog,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { can, type Capability } from '@/lib/staff/roles';

/**
 * The admin's navigation, defined once (same model as the gccstartup-cms admin).
 *
 * "Day to day" is what staff open every morning; "Technical" is setup, collapsed until
 * asked for. The phone's bottom tab bar is the entries that have a `tab` label plus a
 * More button, so the bar and the sidebar cannot drift apart.
 *
 * Each item names the capability that unlocks it (src/lib/staff/roles.ts), so every role sees only the
 * groups it may use. Hiding a link is not security: pages and API routes check the same capability.
 */

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  group: 'day' | 'technical';
  /** Label for the phone bottom bar; present only on the destinations that get a tab. */
  tab?: string;
  /** Needed to see this item. Omitted = every staff role. */
  capability?: Capability;
};

export const NAV_ITEMS: readonly NavItem[] = [
  { label: 'Dashboard', href: '/admin/dashboard', icon: Home, group: 'day', tab: 'Home' },
  { label: 'Pipeline', href: '/admin', icon: LayoutDashboard, group: 'day', capability: 'clients.view' },
  { label: 'Clients & Companies', href: '/admin/companies', icon: Users, group: 'day', tab: 'Clients', capability: 'clients.view' },
  { label: 'Documents', href: '/admin/documents', icon: FileCheck2, group: 'day', tab: 'Documents', capability: 'documents.review' },
  { label: 'Leads', href: '/admin/leads', icon: Contact2, group: 'day', tab: 'Leads', capability: 'reports.view' },
  { label: 'Renewals & Billing', href: '/admin/renewals', icon: RefreshCcw, group: 'day', capability: 'clients.view' },
  { label: 'Pricing', href: '/admin/pricing', icon: DollarSign, group: 'technical', capability: 'prices.edit' },
  { label: 'Staff accounts', href: '/admin/staff', icon: UserCog, group: 'technical', capability: 'staff.manage' },
  { label: 'Audit log', href: '/admin/audit', icon: ScrollText, group: 'technical', capability: 'audit.view' },
];

/** The items this DB role may see. */
export function itemsFor(dbRole: string): NavItem[] {
  return NAV_ITEMS.filter((item) => !item.capability || can(dbRole, item.capability));
}

export const dayItems = (items: readonly NavItem[]) => items.filter((item) => item.group === 'day');
export const technicalItems = (items: readonly NavItem[]) => items.filter((item) => item.group === 'technical');
export const tabItems = (items: readonly NavItem[]) => items.filter((item) => item.tab);

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
