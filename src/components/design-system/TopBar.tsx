'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Bell, X, CheckCheck } from 'lucide-react';
import { usePortalStore } from '@/lib/store';

const PAGE_TITLES: Record<string, string> = {
  '/tools': 'Tools',
  '/tools/agents': 'AI Agents',
  '/tools/contracts': 'Contracts',
  '/tools/valuation': 'Valuation',
  '/portal': 'Portal',
  '/portal/dashboard': 'Dashboard',
  '/portal/documents': 'Documents',
  '/portal/orders': 'Orders',
  '/portal/invoicing': 'Invoicing',
  '/portal/accounting': 'Accounting',
  '/portal/compliance': 'Compliance',
  '/portal/banking': 'Banking',
  '/portal/settings': 'Settings',
  '/profile': 'Profile',
};

function getTitleForPathname(pathname: string): string {
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname];
  const segments = pathname.split('/').filter(Boolean);
  if (segments.length > 1) {
    const last = segments[segments.length - 1];
    return last.charAt(0).toUpperCase() + last.slice(1).replace(/-/g, ' ');
  }
  return segments[0]?.charAt(0).toUpperCase() + (segments[0]?.slice(1) || '');
}

interface TopBarProps {
  isHome?: boolean;
  pathname?: string;
  title?: string;
  rightAction?: React.ReactNode;
}

export default function TopBar({ isHome = false, pathname = '/', title, rightAction }: TopBarProps) {
  const router = useRouter();
  const { whatsappLogs, markNotificationRead, markAllNotificationsRead } = usePortalStore();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isDrawerOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsDrawerOpen(false);
        return;
      }

      if (e.key === 'Tab' && drawerRef.current) {
        const focusable = drawerRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), textarea, input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDrawerOpen]);

  const unreadCount = mounted ? whatsappLogs.filter((n) => n.status !== 'read').length : 0;
  const pageTitle = title || getTitleForPathname(pathname);

  return (
    <>
      <header className={isHome ? 'brand-header' : 'app-header'}>
        <div className={isHome ? 'brand-header-inner' : 'app-header-inner'}>
          {isHome ? (
            <>
              <div className="header-left">
                <Link href="/" className="topbar-brand-link">
                  <div className="topbar-brand-logo">G</div>
                  <span className="topbar-brand-text">
                    GCC<span className="topbar-brand-highlight">Startup</span>
                  </span>
                </Link>
              </div>
              <div className="header-right">
                <button
                  type="button"
                  onClick={() => setIsDrawerOpen(true)}
                  className="header-icon-btn"
                  aria-label="Notifications"
                >
                  <Bell size={18} />
                  {mounted && unreadCount > 0 && (
                    <span className="header-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
                  )}
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="header-left">
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="header-back-btn"
                  aria-label="Go back"
                >
                  <ChevronLeft size={20} />
                </button>
              </div>
              <div className="header-center">
                <span className="header-title">{pageTitle}</span>
              </div>
              <div className="header-right">
                {rightAction}
                <button
                  type="button"
                  onClick={() => setIsDrawerOpen(true)}
                  className="header-icon-btn"
                  aria-label="Notifications"
                >
                  <Bell size={18} />
                  {mounted && unreadCount > 0 && (
                    <span className="header-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </header>

      {isDrawerOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Notification Center"
          className="modal-backdrop notif-drawer"
          onClick={() => setIsDrawerOpen(false)}
        >
          <div
            ref={drawerRef}
            className="modal-content notif-drawer-content"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-handle" />

            <div className="notif-drawer-header">
              <div className="notif-drawer-header-left">
                <Bell size={18} color="var(--color-orange)" />
                <h3 className="notif-drawer-title">Notification Center</h3>
              </div>
              <button
                onClick={() => setIsDrawerOpen(false)}
                aria-label="Close Notification Center"
                className="header-icon-btn"
              >
                <X size={18} />
              </button>
            </div>

            {unreadCount > 0 && (
              <div className="notif-bar-actions">
                <span className="notif-unread-count">{unreadCount} unread</span>
                <button onClick={markAllNotificationsRead} className="notif-mark-all-btn">
                  <CheckCheck size={14} /> Mark all read
                </button>
              </div>
            )}

            <div className="notif-list">
              {whatsappLogs.length === 0 ? (
                <div className="empty-state notif-empty">
                  <p className="notif-empty-text">No recent notifications</p>
                </div>
              ) : (
                whatsappLogs.map((log) => (
                  <div
                    key={log.id}
                    onClick={() => markNotificationRead(log.id)}
                    className={`card card-padded-sm ${log.status !== 'read' ? 'card-orange' : 'card-bordered'} notif-item`}
                  >
                    <div className="notif-item-header">
                      <span
                        className={`notif-item-name ${
                          log.status === 'read' ? 'notif-item-name-read' : 'notif-item-name-unread'
                        }`}
                      >
                        {log.templateName.replace(/_/g, ' ')}
                      </span>
                      <span className="notif-item-time">{log.sentAt}</span>
                    </div>
                    <p className="notif-item-message">{log.messageText}</p>
                  </div>
                ))
              )}
            </div>

            <div className="notif-footer">
              <Link
                href="/portal/settings"
                onClick={() => setIsDrawerOpen(false)}
                className="btn btn-secondary btn-sm btn-full notif-footer-link"
              >
                Configure Notification Preferences
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
