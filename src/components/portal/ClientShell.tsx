'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowLeft, Bell, MessageCircle } from 'lucide-react';
import ConnectSheet from '@/components/portal/ConnectSheet';
import { CLIENT_NAV, activeClientNav, clientBackTarget, clientTitle } from './client-nav';

// The client portal's shell, built on the same admin-* classes as the gccstartup-cms admin and
// our own AdminLayoutShell: sidebar on desktop, header + bottom tab bar on a phone.
export default function ClientShell({
  name,
  unreadCount,
  children,
}: {
  name: string;
  unreadCount: number;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [connectOpen, setConnectOpen] = useState(false);
  const current = activeClientNav(pathname);
  const back = clientBackTarget(pathname);

  return (
    <div className="admin-shell">
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
        <div className="admin-header-title">{clientTitle(pathname)}</div>
        <Link
          href="/notifications"
          className="admin-header-back"
          aria-label={unreadCount ? `Notifications, ${unreadCount} unread` : 'Notifications'}
        >
          <Bell size={20} />
          {unreadCount > 0 && (
            <span className="badge badge-accent" style={{ marginLeft: 4 }}>
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Link>
      </div>

      <aside className="admin-sidebar">
        <div className="admin-sidebar-header">
          <div className="admin-brand">
            GCC <span>Portal</span>
          </div>
        </div>
        <nav className="admin-nav" aria-label="Portal sections">
          {CLIENT_NAV.map((item) => {
            const active = current?.href === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`admin-nav-item ${active ? 'active' : ''}`}
                aria-current={active ? 'page' : undefined}
              >
                <item.icon size={18} />
                {item.label}
              </Link>
            );
          })}
          <Link href="/notifications" className={`admin-nav-item ${pathname === '/notifications' ? 'active' : ''}`}>
            <Bell size={18} />
            Notifications
            {unreadCount > 0 && (
              <span className="badge badge-accent" style={{ marginLeft: 'auto' }}>
                {unreadCount}
              </span>
            )}
          </Link>
        </nav>
        <div className="admin-sidebar-footer">
          <button type="button" className="admin-nav-item" onClick={() => setConnectOpen(true)}>
            <MessageCircle size={18} />
            Talk to your concierge
          </button>
          <div className="admin-nav-item text-tertiary" style={{ cursor: 'default' }}>
            Signed in as {name}
          </div>
        </div>
      </aside>

      <main className="admin-main">
        <div className="admin-main-inner">{children}</div>
      </main>

      <nav className="admin-bottom-nav" aria-label="Primary">
        {CLIENT_NAV.map((item) => {
          const active = current?.href === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`admin-bottom-nav-item ${active ? 'active' : ''}`}
              aria-current={active ? 'page' : undefined}
            >
              <item.icon size={22} />
              <span>{item.tab}</span>
            </Link>
          );
        })}
        <button type="button" className="admin-bottom-nav-item" onClick={() => setConnectOpen(true)}>
          <MessageCircle size={22} />
          <span>Support</span>
        </button>
      </nav>

      <ConnectSheet open={connectOpen} onOpenChange={setConnectOpen} />
    </div>
  );
}
