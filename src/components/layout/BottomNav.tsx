'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Wrench, Sparkles, ShieldCheck, User, Clock, Kanban } from 'lucide-react';

export default function BottomNav() {
  const pathname = usePathname();

  const navItems = [
    { label: 'Home', href: '/', icon: Home },
    { label: 'Studio', href: '/tools', icon: Wrench, highlight: true },
    { label: 'Setup', href: '/setup', icon: Sparkles },
    { label: 'Vault', href: '/portal/vault', icon: ShieldCheck },
    { label: 'Renewals', href: '/portal/renewals', icon: Clock },
    { label: 'Admin', href: '/admin/kanban', icon: Kanban },
  ];

  return (
    <div className="bottom-nav-wrapper">
      <nav className="bottom-nav-container">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`bottom-nav-item ${isActive ? 'active' : ''}`}
            >
              <div className="icon-container">
                <Icon className={`w-4 h-4 ${isActive ? 'text-orange' : 'text-muted'}`} />
                {item.highlight && !isActive && <span className="notification-dot" />}
              </div>
              <span className={`label ${isActive ? 'text-navy font-bold' : 'text-muted'}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>

      <style jsx>{`
        .bottom-nav-wrapper {
          display: block;
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          z-index: 90;
          padding: 8px 12px 14px 12px;
          pointer-events: none;
        }

        @media (min-width: 900px) {
          .bottom-nav-wrapper {
            display: none;
          }
        }

        .bottom-nav-container {
          pointer-events: auto;
          max-width: 480px;
          margin: 0 auto;
          background: rgba(255, 255, 255, 0.98);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid var(--border);
          border-radius: var(--radius-pill);
          box-shadow: 0 10px 30px rgba(20, 32, 74, 0.14);
          display: flex;
          align-items: center;
          justify-content: space-around;
          padding: 6px 8px;
        }

        .bottom-nav-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2px;
          padding: 6px 8px;
          text-decoration: none;
          border-radius: var(--radius-pill);
          transition: all 0.2s ease;
        }

        .icon-container {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .notification-dot {
          position: absolute;
          top: -2px;
          right: -2px;
          width: 5px;
          height: 5px;
          background: var(--orange);
          border-radius: 50%;
        }

        .label {
          font-size: 10px;
        }

        .text-orange {
          color: var(--orange);
        }

        .text-navy {
          color: var(--navy);
        }

        .text-muted {
          color: var(--text-tertiary);
        }

        .font-bold {
          font-weight: 700;
        }

        .bottom-nav-item.active {
          background: var(--orange-lt);
        }
      `}</style>
    </div>
  );
}
