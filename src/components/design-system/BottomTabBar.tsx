'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Home, Wrench, Plus, Building2, User } from 'lucide-react';

const tabs = [
  { id: 'home', label: 'Home', href: '/', icon: Home },
  { id: 'tools', label: 'Tools', href: '/tools', icon: Wrench },
  { id: 'center', href: '/setup' },
  { id: 'portal', label: 'Portal', href: '/portal/dashboard', icon: Building2 },
  { id: 'profile', label: 'Profile', href: '/profile', icon: User },
];

export default function BottomTabBar() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <nav className="tab-bar" role="navigation" aria-label="Main navigation">
      <div className="tab-bar-inner">
        {tabs.map((tab) => {
          if ('icon' in tab && tab.icon) {
            const Icon = tab.icon;
            const active = isActive(tab.href);

            return (
              <Link
                key={tab.id}
                href={tab.href}
                className={`tab-item ${active ? 'active' : ''}`}
                aria-current={active ? 'page' : undefined}
                aria-label={tab.label}
              >
                <span className="tab-icon">
                  <Icon size={22} strokeWidth={active ? 2.5 : 1.8} />
                </span>
                <span>{tab.label}</span>
              </Link>
            );
          }

          return (
            <Link
              key={tab.id}
              href={tab.href}
              className="tab-center-btn"
              aria-label="Start new setup"
            >
              <Plus size={24} strokeWidth={2.5} />
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
