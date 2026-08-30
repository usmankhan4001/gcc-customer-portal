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
                <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--color-orange-light)',
                      border: '1px solid #FCD9C7',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 14,
                      fontWeight: 800,
                      color: 'var(--color-orange)',
                      fontFamily: 'var(--font-heading)',
                    }}
                  >
                    G
                  </div>
                  <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 16, color: 'var(--color-navy)', letterSpacing: '-0.02em' }}>
                    GCC<span style={{ color: 'var(--color-orange)' }}>Startup</span>
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
          className="modal-backdrop"
          onClick={() => setIsDrawerOpen(false)}
          style={{ animation: 'fadeIn 0.2s ease-out' }}
        >
          <div
            ref={drawerRef}
            className="modal-content"
            style={{ display: 'flex', flexDirection: 'column', animation: 'slideUp 0.25s ease-out' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-handle" />

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingBottom: 14,
                borderBottom: '1px solid var(--color-border)',
                marginBottom: 14,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Bell size={18} color="var(--color-orange)" />
                <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: 15, fontWeight: 700, color: 'var(--color-navy)' }}>
                  Notification Center
                </h3>
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
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 14,
                }}
              >
                <span style={{ fontSize: 12, color: 'var(--color-text-tertiary)' }}>
                  {unreadCount} unread
                </span>
                <button
                  onClick={markAllNotificationsRead}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--color-orange)',
                    fontWeight: 700,
                    cursor: 'pointer',
                    fontSize: 12,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    fontFamily: 'var(--font-sans)',
                  }}
                >
                  <CheckCheck size={14} /> Mark all read
                </button>
              </div>
            )}

            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {whatsappLogs.length === 0 ? (
                <div className="empty-state" style={{ padding: '40px 16px' }}>
                  <p style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>No recent notifications</p>
                </div>
              ) : (
                whatsappLogs.map((log) => (
                  <div
                    key={log.id}
                    onClick={() => markNotificationRead(log.id)}
                    className={`card card-padded-sm ${log.status !== 'read' ? 'card-orange' : 'card-bordered'}`}
                    style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 6 }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          color: log.status === 'read' ? 'var(--color-text-tertiary)' : 'var(--color-orange)',
                          textTransform: 'uppercase',
                        }}
                      >
                        {log.templateName.replace(/_/g, ' ')}
                      </span>
                      <span style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>
                        {log.sentAt}
                      </span>
                    </div>
                    <p style={{ fontSize: 12, color: 'var(--color-navy)', lineHeight: 1.4 }}>
                      {log.messageText}
                    </p>
                  </div>
                ))
              )}
            </div>

            <div style={{ paddingTop: 14, marginTop: 'auto' }}>
              <Link
                href="/portal/settings"
                onClick={() => setIsDrawerOpen(false)}
                className="btn btn-secondary btn-sm btn-full"
                style={{ textDecoration: 'none', fontSize: 12 }}
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
