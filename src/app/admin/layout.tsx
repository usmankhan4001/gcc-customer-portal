'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { usePortalStore } from '@/lib/store';
import {
  LayoutDashboard,
  Users,
  Clock,
  Kanban,
  MessageSquare,
  Settings,
  ShieldAlert,
  ArrowLeft,
  Menu,
  X,
  ChevronRight,
} from 'lucide-react';

const navLinks = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/clients', label: 'Clients', icon: Users },
  { href: '/admin/filing-queue', label: 'Filing Queue', icon: Clock },
  { href: '/admin/kanban', label: 'Kanban', icon: Kanban },
  { href: '/admin/whatsapp', label: 'WhatsApp', icon: MessageSquare },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { userProfile } = usePortalStore();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isAdmin = userProfile.role === 'admin' || userProfile.role === 'super_admin';

  if (!isAdmin) {
    return (
      <div className="admin-access-denied">
        <ShieldAlert size={48} style={{ color: 'var(--color-error)' }} />
        <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-navy)' }}>
          Access Denied
        </h2>
        <p style={{ fontSize: 14, color: 'var(--color-text-secondary)' }}>
          You do not have permission to view this page.
        </p>
        <Link href="/portal/dashboard" className="btn btn-primary" style={{ textDecoration: 'none' }}>
          Return to Portal
        </Link>
        <style>{`.admin-access-denied{display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:80vh;gap:16px;text-align:center;padding:24px}`}</style>
      </div>
    );
  }

  const isActive = (href: string) => {
    if (href === '/admin') return pathname === '/admin';
    return pathname.startsWith(href);
  };

  return (
    <div className="admin-shell">
      {/* Mobile top bar */}
      <div className="admin-mobile-bar">
        <button
          className="admin-hamburger"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle navigation"
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
        <span className="admin-mobile-title">GCCStartup Admin</span>
        <Link href="/portal/dashboard" className="admin-mobile-exit" aria-label="Exit to portal">
          <ArrowLeft size={18} />
        </Link>
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="admin-overlay" onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`admin-sidebar ${mobileOpen ? 'admin-sidebar-open' : ''}`}>
        <div className="admin-sidebar-inner">
          {/* Logo */}
          <div className="admin-logo">
            <div className="admin-logo-icon">G</div>
            <div>
              <div className="admin-logo-text">GCCStartup</div>
              <div className="admin-logo-sub">Admin Panel</div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="admin-nav" aria-label="Admin Navigation">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const active = isActive(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`admin-nav-link ${active ? 'admin-nav-active' : ''}`}
                  onClick={() => setMobileOpen(false)}
                >
                  <Icon size={18} />
                  <span>{link.label}</span>
                  {active && <ChevronRight size={14} className="admin-nav-arrow" />}
                </Link>
              );
            })}
          </nav>

          {/* User section */}
          <div className="admin-sidebar-footer">
            <Link href="/portal/dashboard" className="admin-exit-link">
              <ArrowLeft size={16} />
              <span>Exit to Portal</span>
            </Link>
            <div className="admin-user-info">
              <div className="admin-user-avatar">
                {userProfile.name.charAt(0)}
              </div>
              <div className="admin-user-details">
                <div className="admin-user-name">{userProfile.name}</div>
                <div className="admin-user-role">admin</div>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="admin-main">
        <div className="admin-main-inner">
          {children}
        </div>
      </main>

      <style>{`
        .admin-shell {
          display: flex;
          min-height: 100dvh;
          background: var(--color-canvas);
        }

        /* ─── Mobile Top Bar ─── */
        .admin-mobile-bar {
          display: none;
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 150;
          height: 52px;
          background: var(--color-navy);
          align-items: center;
          justify-content: space-between;
          padding: 0 16px;
        }

        .admin-hamburger {
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: none;
          background: rgba(255,255,255,0.1);
          border-radius: var(--radius-sm);
          color: #fff;
          cursor: pointer;
        }

        .admin-mobile-title {
          font-family: var(--font-heading);
          font-weight: 700;
          font-size: 15px;
          color: #fff;
        }

        .admin-mobile-exit {
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: var(--radius-sm);
          background: rgba(255,255,255,0.1);
          color: #fff;
          text-decoration: none;
        }

        @media (max-width: 767px) {
          .admin-mobile-bar {
            display: flex;
          }
        }

        /* ─── Overlay ─── */
        .admin-overlay {
          display: none;
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.4);
          z-index: 160;
        }

        @media (max-width: 767px) {
          .admin-overlay {
            display: block;
          }
        }

        /* ─── Sidebar ─── */
        .admin-sidebar {
          position: fixed;
          top: 0;
          left: 0;
          bottom: 0;
          width: 240px;
          background: var(--color-navy);
          z-index: 170;
          overflow-y: auto;
          flex-shrink: 0;
        }

        .admin-sidebar-inner {
          display: flex;
          flex-direction: column;
          height: 100%;
          padding: 0;
        }

        @media (max-width: 767px) {
          .admin-sidebar {
            transform: translateX(-100%);
            transition: transform 0.25s ease;
          }
          .admin-sidebar-open {
            transform: translateX(0);
          }
        }

        /* ─── Logo ─── */
        .admin-logo {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 20px 20px 24px;
          border-bottom: 1px solid rgba(255,255,255,0.08);
        }

        .admin-logo-icon {
          width: 36px;
          height: 36px;
          border-radius: var(--radius-sm);
          background: var(--color-orange);
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: var(--font-heading);
          font-weight: 800;
          font-size: 16px;
          flex-shrink: 0;
        }

        .admin-logo-text {
          font-family: var(--font-heading);
          font-weight: 700;
          font-size: 15px;
          color: #fff;
          line-height: 1.2;
        }

        .admin-logo-sub {
          font-size: 11px;
          color: rgba(255,255,255,0.45);
          font-weight: 500;
        }

        /* ─── Navigation ─── */
        .admin-nav {
          display: flex;
          flex-direction: column;
          gap: 2px;
          padding: 16px 12px;
          flex: 1;
        }

        .admin-nav-link {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 12px;
          border-radius: var(--radius-sm);
          font-size: 13px;
          font-weight: 600;
          color: rgba(255,255,255,0.6);
          text-decoration: none;
          transition: all 0.15s ease;
          font-family: var(--font-sans);
        }

        .admin-nav-link:hover {
          background: rgba(255,255,255,0.06);
          color: rgba(255,255,255,0.9);
        }

        .admin-nav-active {
          background: rgba(242,101,34,0.15);
          color: var(--color-orange);
        }

        .admin-nav-active:hover {
          background: rgba(242,101,34,0.2);
          color: var(--color-orange);
        }

        .admin-nav-arrow {
          margin-left: auto;
          opacity: 0.5;
        }

        /* ─── Sidebar Footer ─── */
        .admin-sidebar-footer {
          padding: 16px 12px 20px;
          border-top: 1px solid rgba(255,255,255,0.08);
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .admin-exit-link {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          border-radius: var(--radius-sm);
          font-size: 12px;
          font-weight: 600;
          color: rgba(255,255,255,0.5);
          text-decoration: none;
          transition: all 0.15s ease;
        }

        .admin-exit-link:hover {
          background: rgba(255,255,255,0.06);
          color: rgba(255,255,255,0.8);
        }

        .admin-user-info {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 12px;
          background: rgba(255,255,255,0.04);
          border-radius: var(--radius-sm);
        }

        .admin-user-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: var(--color-orange);
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 13px;
          font-weight: 700;
          flex-shrink: 0;
        }

        .admin-user-details {
          min-width: 0;
        }

        .admin-user-name {
          font-size: 12px;
          font-weight: 600;
          color: #fff;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .admin-user-role {
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: var(--color-orange);
        }

        /* ─── Main Content ─── */
        .admin-main {
          flex: 1;
          margin-left: 240px;
          min-height: 100dvh;
          background: var(--color-surface);
        }

        .admin-main-inner {
          padding: 28px 32px;
          max-width: 1200px;
        }

        @media (max-width: 767px) {
          .admin-main {
            margin-left: 0;
            padding-top: 52px;
          }
          .admin-main-inner {
            padding: 20px 16px;
          }
        }

        @media (min-width: 768px) and (max-width: 1024px) {
          .admin-main-inner {
            padding: 24px 20px;
          }
        }
      `}</style>
    </div>
  );
}
