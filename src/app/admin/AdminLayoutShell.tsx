'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ArrowLeft, ChevronDown, LogOut, MoreHorizontal, ShieldCheck, X } from 'lucide-react';
import {
  activeNavItem,
  backTarget,
  dayItems,
  isTechnicalPath,
  itemsFor,
  tabItems,
  technicalItems,
  titleForPath,
  type NavItem,
} from './admin-nav';

// Port of the gccstartup-cms admin shell (src/app/admin/AdminLayoutShell.tsx): desktop sidebar
// with grouped menu, phone header with back/title, bottom tab bar plus a "More" sheet.
// Left out on purpose: the CMS's command search, install prompts and toast provider.
export function AdminLayoutShell({
  children,
  dbRole,
  person,
}: {
  children: React.ReactNode;
  /** The signed-in person's role; the menu is built from what that role may use. */
  dbRole: string;
  person: { name: string; roleLabel: string };
}) {
  const items = itemsFor(dbRole);
  const technical = technicalItems(items);
  const pathname = usePathname();
  const router = useRouter();
  const [moreOpen, setMoreOpen] = useState(false);
  // Technical stays collapsed unless you are standing on one of its pages.
  const [technicalOpen, setTechnicalOpen] = useState(() => isTechnicalPath(pathname));

  useEffect(() => {
    setMoreOpen(false);
    if (isTechnicalPath(pathname)) setTechnicalOpen(true);
  }, [pathname]);

  useEffect(() => {
    if (!moreOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMoreOpen(false);
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [moreOpen]);

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
    router.push('/auth');
    router.refresh();
  }

  const current = activeNavItem(pathname);
  const back = backTarget(pathname);

  function renderItem(item: NavItem) {
    const isActive = current?.href === item.href;
    return (
      <Link
        key={item.href}
        href={item.href}
        className={`admin-nav-item ${isActive ? 'active' : ''}`}
        aria-current={isActive ? 'page' : undefined}
        data-in-bottom-nav={item.tab ? 'true' : undefined}
        onClick={() => setMoreOpen(false)}
      >
        <item.icon size={18} />
        {item.label}
      </Link>
    );
  }

  return (
    <div className="admin-shell">
      {/* Phone header: a back button on detail pages, the page's own title. */}
      <div className="admin-mobile-header">
        {back ? (
          <Link href={back} className="admin-header-back" aria-label="Back">
            <ArrowLeft size={22} />
          </Link>
        ) : (
          <span className="admin-brand" aria-hidden="true" style={{ margin: '0 8px' }}>
            GCC
          </span>
        )}
        <div className="admin-header-title">{titleForPath(pathname)}</div>
      </div>

      {/* Sidebar on desktop; the "More" sheet on phones. */}
      <aside id="admin-overflow-nav" className={`admin-sidebar ${moreOpen ? 'open' : ''}`}>
        <div className="admin-sidebar-header">
          <div className="admin-brand">
            GCC <span>Admin</span>
          </div>
          <button type="button" className="admin-sheet-close" onClick={() => setMoreOpen(false)} aria-label="Close menu">
            <X size={20} />
          </button>
        </div>

        <nav className="admin-nav" aria-label="All sections">
          <span className="admin-nav-group-label">Day to day</span>
          {dayItems(items).map(renderItem)}

          {technical.length > 0 && (
            <>
              <button
                type="button"
                className="admin-nav-group-toggle"
                aria-expanded={technicalOpen}
                aria-controls="admin-technical-nav"
                onClick={() => setTechnicalOpen((open) => !open)}
              >
                <span>Technical</span>
                <ChevronDown size={16} className={technicalOpen ? 'is-open' : ''} />
              </button>
              {technicalOpen && (
                <div id="admin-technical-nav" className="admin-nav-technical">
                  {technical.map(renderItem)}
                </div>
              )}
            </>
          )}
        </nav>

        <div className="admin-sidebar-footer">
          <div className="admin-nav-overflow-note" style={{ padding: '4px 12px' }}>
            <strong>{person.name}</strong>
            <div>{person.roleLabel}</div>
          </div>
          <Link href="/admin/security" className="admin-nav-item">
            <ShieldCheck size={18} />
            Your security
          </Link>
          <Link href="/dashboard" className="admin-nav-item">
            Client portal
          </Link>
          <button type="button" onClick={handleLogout} className="admin-nav-item admin-nav-logout text-tertiary">
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </aside>

      <main className="admin-main">
        <div className="admin-main-inner">{children}</div>
      </main>

      {/* Phone bottom bar: the daily destinations plus More, from the same list as the sidebar. */}
      <nav className="admin-bottom-nav" aria-label="Primary">
        {tabItems(items).map((item) => {
          const isActive = current?.href === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`admin-bottom-nav-item ${isActive ? 'active' : ''}`}
              aria-current={isActive ? 'page' : undefined}
              onClick={() => setMoreOpen(false)}
            >
              <item.icon size={22} />
              <span>{item.tab}</span>
            </Link>
          );
        })}
        <button
          type="button"
          className={`admin-bottom-nav-item ${moreOpen ? 'active' : ''}`}
          aria-expanded={moreOpen}
          aria-controls="admin-overflow-nav"
          onClick={() => setMoreOpen((open) => !open)}
        >
          <MoreHorizontal size={22} />
          <span>More</span>
        </button>
      </nav>

      {moreOpen && <div className="admin-mobile-overlay" onClick={() => setMoreOpen(false)} />}
    </div>
  );
}
