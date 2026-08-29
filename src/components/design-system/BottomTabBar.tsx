'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Home, Compass, Sparkles, Shield, User } from 'lucide-react';

interface Tab {
  id: string;
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: number;
}

const defaultTabs: Tab[] = [
  { id: 'home', label: 'Home', href: '/', icon: Home },
  { id: 'tools', label: 'Tools', href: '/tools', icon: Compass },
  { id: 'setup', label: 'Setup', href: '/setup', icon: Sparkles },
  { id: 'portal', label: 'Portal', href: '/portal/dashboard', icon: Shield },
  { id: 'account', label: 'Account', href: '/portal/settings', icon: User },
];

interface BottomTabBarProps {
  tabs?: Tab[];
}

export default function BottomTabBar({ tabs = defaultTabs }: BottomTabBarProps) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <nav className="tab-bar" role="navigation" aria-label="Main navigation">
      <div className="tab-bar-inner">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = isActive(tab.href);

          return (
            <Link
              key={tab.id}
              href={tab.href}
              className={`tab-item ${active ? 'active' : ''}`}
              aria-current={active ? 'page' : undefined}
            >
              <span className="tab-icon">
                <Icon
                  size={22}
                  strokeWidth={active ? 2.5 : 1.8}
                />
              </span>
              <span>{tab.label}</span>
              {tab.badge && tab.badge > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: 2,
                    right: 6,
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
                  }}
                >
                  {tab.badge > 9 ? '9+' : tab.badge}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
