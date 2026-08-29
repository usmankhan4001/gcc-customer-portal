'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronLeft, Bell } from 'lucide-react';

interface TopBarProps {
  title?: string;
  showBack?: boolean;
  backHref?: string;
  showNotifications?: boolean;
  notificationCount?: number;
  rightAction?: React.ReactNode;
}

export default function TopBar({
  title,
  showBack = false,
  backHref = '/',
  showNotifications = true,
  notificationCount = 0,
  rightAction,
}: TopBarProps) {
  return (
    <header className="app-header">
      <div className="app-header-inner">
        {/* Left */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 40 }}>
          {showBack && (
            <Link
              href={backHref}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 36,
                height: 36,
                borderRadius: 10,
                background: 'var(--color-surface-alt)',
                border: '1px solid var(--color-border)',
                textDecoration: 'none',
                color: 'var(--color-brand-navy)',
                transition: 'all 0.15s ease',
              }}
            >
              <ChevronLeft size={20} />
            </Link>
          )}
          {!showBack && (
            <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  background: 'var(--color-brand-orange-lt)',
                  border: '1px solid #FCD9C7',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 14,
                  fontWeight: 800,
                  color: 'var(--color-brand-orange)',
                  fontFamily: 'var(--font-heading)',
                }}
              >
                G
              </div>
              <span
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontWeight: 700,
                  fontSize: 16,
                  color: 'var(--color-brand-navy)',
                  letterSpacing: '-0.02em',
                }}
              >
                GCC<span style={{ color: 'var(--color-brand-orange)' }}>Startup</span>
              </span>
            </Link>
          )}
        </div>

        {/* Center title (mobile only) */}
        {title && (
          <span
            style={{
              position: 'absolute',
              left: '50%',
              transform: 'translateX(-50%)',
              fontFamily: 'var(--font-heading)',
              fontWeight: 700,
              fontSize: 16,
              color: 'var(--color-brand-navy)',
              whiteSpace: 'nowrap',
            }}
          >
            {title}
          </span>
        )}

        {/* Right */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {rightAction}
          {showNotifications && (
            <button
              style={{
                position: 'relative',
                width: 36,
                height: 36,
                borderRadius: 10,
                background: 'var(--color-surface-alt)',
                border: '1px solid var(--color-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: 'var(--color-text-secondary)',
                transition: 'all 0.15s ease',
              }}
            >
              <Bell size={18} />
              {notificationCount > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: -2,
                    right: -2,
                    width: 16,
                    height: 16,
                    borderRadius: '50%',
                    background: 'var(--color-brand-orange)',
                    color: 'white',
                    fontSize: 9,
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '2px solid white',
                  }}
                >
                  {notificationCount > 9 ? '9+' : notificationCount}
                </span>
              )}
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
