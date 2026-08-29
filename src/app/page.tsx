'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Bell,
  Search,
  Calculator,
  Rocket,
  Landmark,
  LayoutGrid,
  Shield,
  Clock,
  Sparkles,
  CreditCard,
  MessageSquare,
} from 'lucide-react';
import { usePortalStore } from '@/lib/store';

const JURISDICTIONS = [
  {
    id: 'uae',
    name: 'UAE Freezone',
    flag: '🇦🇪',
    taxRate: '0% Tax',
    taxBadge: 'badge-success',
    price: '$2,499',
    turnaround: '48h Setup',
    href: '/setup?country=uae',
  },
  {
    id: 'hk',
    name: 'Hong Kong',
    flag: '🇭🇰',
    taxRate: '0% Foreign',
    taxBadge: 'badge-info',
    price: '$1,850',
    turnaround: '3-5 Days',
    href: '/setup?country=hk',
  },
  {
    id: 'singapore',
    name: 'Singapore',
    flag: '🇸🇬',
    taxRate: '5% Effective',
    taxBadge: 'badge-navy',
    price: '$2,800',
    turnaround: '2-3 Days',
    href: '/setup?country=singapore',
  },
  {
    id: 'bahrain',
    name: 'Bahrain',
    flag: '🇧🇭',
    taxRate: '0% Corp Tax',
    taxBadge: 'badge-success',
    price: '$2,200',
    turnaround: '4-6 Days',
    href: '/setup?country=bahrain',
  },
  {
    id: 'ireland',
    name: 'Ireland',
    flag: '🇮🇪',
    taxRate: '12.5% EU',
    taxBadge: 'badge-info',
    price: '$2,650',
    turnaround: '5-7 Days',
    href: '/setup?country=ireland',
  },
  {
    id: 'oman',
    name: 'Oman',
    flag: '🇴🇲',
    taxRate: '0% Freezone',
    taxBadge: 'badge-success',
    price: '$2,400',
    turnaround: '5-8 Days',
    href: '/setup?country=oman',
  },
];

const TOOLS = [
  {
    id: 'tax-calc',
    icon: Calculator,
    name: 'Tax Calculator',
    desc: 'Compare savings across jurisdictions',
    href: '/tools',
    bg: 'var(--color-orange-light)',
    color: 'var(--color-orange)',
  },
  {
    id: 'diagnostic',
    icon: Sparkles,
    name: 'AI Diagnostic',
    desc: '3-min tax & entity blueprint',
    href: '/tools',
    bg: 'var(--color-info-light)',
    color: 'var(--color-info)',
  },
  {
    id: 'banking-check',
    icon: Landmark,
    name: 'Banking Odds',
    desc: 'Approval probability checker',
    href: '/tools',
    bg: 'var(--color-navy-subtle)',
    color: 'var(--color-navy)',
  },
  {
    id: 'compliance',
    icon: Shield,
    name: 'Compliance Score',
    desc: 'Entity health & readiness audit',
    href: '/portal/tax-compliance',
    bg: 'var(--color-success-light)',
    color: 'var(--color-success)',
  },
  {
    id: 'renewal',
    icon: Clock,
    name: 'Renewal Tracker',
    desc: 'License expiry & renewal dates',
    href: '/portal/renewals',
    bg: 'var(--color-warning-light)',
    color: 'var(--color-warning)',
  },
  {
    id: 'expense',
    icon: CreditCard,
    name: 'Expense Log',
    desc: 'Track & categorize business costs',
    href: '/portal/dashboard',
    bg: 'var(--color-orange-light)',
    color: 'var(--color-orange)',
  },
];

function getFirstName(fullName: string): string {
  return fullName.split(' ')[0] || 'there';
}

function getNotificationCount(whatsappLogs: { status: string }[]): number {
  return whatsappLogs.filter((n) => n.status !== 'read').length;
}

function getStageProgress(stage: number): number {
  return Math.round((stage / 6) * 100);
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'active':
    case 'license_issued':
    case 'banking_setup':
      return 'var(--color-success)';
    case 'filing':
      return 'var(--color-info)';
    case 'official_kyc_pending':
    case 'paid':
      return 'var(--color-warning)';
    default:
      return 'var(--color-text-muted)';
  }
}

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const { userProfile, entities, whatsappLogs } = usePortalStore();

  const unreadCount = getNotificationCount(whatsappLogs);
  const firstName = getFirstName(userProfile.name);

  const filteredJurisdictions = JURISDICTIONS.filter((j) =>
    j.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    j.taxRate.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      {/* Section 1: Brand Header */}
      <div className="brand-header animate-fade-in">
        <div
          className="brand-header-inner"
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
        >
          <Link href="/" style={{ textDecoration: 'none' }}>
            <span
              className="font-heading"
              style={{
                fontSize: '1.25rem',
                fontWeight: 800,
                color: 'var(--color-navy)',
                letterSpacing: '-0.02em',
              }}
            >
              GCCStartup
            </span>
          </Link>

          <Link href="/portal/settings" style={{ textDecoration: 'none' }}>
            <button className="header-icon-btn" aria-label="Notifications">
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="header-badge">{unreadCount}</span>
              )}
            </button>
          </Link>
        </div>
      </div>

      {/* Section 2: Greeting + Search */}
      <div className="section-gap animate-slide-up" style={{ paddingTop: 20 }}>
        <div style={{ marginBottom: 16 }}>
          <h1
            className="font-heading"
            style={{
              fontSize: '1.65rem',
              fontWeight: 800,
              color: 'var(--color-navy)',
              lineHeight: 1.15,
              letterSpacing: '-0.02em',
            }}
          >
            Hello, {firstName} 👋
          </h1>
          <p
            style={{
              fontSize: 14,
              color: 'var(--color-text-tertiary)',
              marginTop: 4,
            }}
          >
            Find your perfect tax structure
          </p>
        </div>

        <div className="search-bar">
          <Search size={18} className="search-bar-icon" />
          <input
            type="text"
            placeholder="Search jurisdictions, tools, tax rates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Section 3: Quick Action Grid */}
      <div className="section-gap animate-slide-up">
        <div className="section-header">
          <h2 className="section-title">Quick Actions</h2>
          <Link href="/tools" className="section-link">
            See All
          </Link>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <Link href="/tools" style={{ textDecoration: 'none' }} className="quick-action">
            <div
              className="quick-action-icon"
              style={{ background: 'var(--color-orange-light)' }}
            >
              <Calculator size={22} color="var(--color-orange)" />
            </div>
            <span className="quick-action-label">Tax Calculator</span>
          </Link>

          <Link href="/setup" style={{ textDecoration: 'none' }} className="quick-action">
            <div
              className="quick-action-icon"
              style={{ background: 'var(--color-navy-subtle)' }}
            >
              <Rocket size={22} color="var(--color-navy)" />
            </div>
            <span className="quick-action-label">Start Setup</span>
          </Link>

          <Link href="/portal/banking" style={{ textDecoration: 'none' }} className="quick-action">
            <div
              className="quick-action-icon"
              style={{ background: 'var(--color-info-light)' }}
            >
              <Landmark size={22} color="var(--color-info)" />
            </div>
            <span className="quick-action-label">Banking</span>
          </Link>

          <Link href="/tools" style={{ textDecoration: 'none' }} className="quick-action">
            <div
              className="quick-action-icon"
              style={{ background: 'var(--color-success-light)' }}
            >
              <LayoutGrid size={22} color="var(--color-success)" />
            </div>
            <span className="quick-action-label">All Tools</span>
          </Link>
        </div>
      </div>

      {/* Section 4: Featured Jurisdictions */}
      <div className="section-gap animate-slide-up">
        <div className="section-header">
          <h2 className="section-title">Popular Jurisdictions</h2>
          <Link href="/setup" className="section-link">
            View All →
          </Link>
        </div>

        <div className="h-scroll" style={{ margin: '0 calc(-1 * var(--spacing-page))', padding: '0 var(--spacing-page) 8px' }}>
          {filteredJurisdictions.map((j) => (
            <Link
              key={j.id}
              href={j.href}
              style={{ textDecoration: 'none', minWidth: 200, maxWidth: 220 }}
              className="card card-interactive card-padded"
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 32 }}>{j.flag}</span>
                  <span className={`badge badge-sm ${j.taxBadge}`}>{j.taxRate}</span>
                </div>

                <div>
                  <h3
                    className="font-heading"
                    style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text)' }}
                  >
                    {j.name}
                  </h3>
                  <div style={{ fontSize: 12, color: 'var(--color-text-tertiary)', marginTop: 2 }}>
                    {j.turnaround}
                  </div>
                </div>

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingTop: 8,
                    borderTop: '1px solid var(--color-border)',
                  }}
                >
                  <span style={{ fontSize: 15, fontWeight: 800, color: 'var(--color-orange)' }}>
                    {j.price}
                  </span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-orange)' }}>
                    Learn More →
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Section 5: Your Entities */}
      {entities.length > 0 && (
        <div className="section-gap animate-slide-up">
          <div className="section-header">
            <h2 className="section-title">Your Entities</h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {entities.map((entity) => {
              const progress = getStageProgress(entity.currentStage);
              const dotColor = getStatusColor(entity.status);

              return (
                <Link
                  key={entity.id}
                  href="/portal/dashboard"
                  style={{ textDecoration: 'none' }}
                  className="card card-interactive card-padded"
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontSize: 24 }}>{entity.flag}</span>
                        <div>
                          <h3
                            className="font-heading"
                            style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text)' }}
                          >
                            {entity.name}
                          </h3>
                          <div style={{ fontSize: 12, color: 'var(--color-text-tertiary)' }}>
                            {entity.jurisdiction}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="status-row" style={{ gap: 8 }}>
                      <span className="status-dot" style={{ background: dotColor }} />
                      <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-secondary)' }}>
                        {entity.stageName}
                      </span>
                      <span style={{ marginLeft: 'auto', fontSize: 12, fontWeight: 700, color: 'var(--color-orange)' }}>
                        {progress}%
                      </span>
                    </div>

                    <div className="progress-track">
                      <div className="progress-fill" style={{ width: `${progress}%` }} />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Section 6: Featured Tools */}
      <div className="section-gap animate-slide-up">
        <div className="section-header">
          <h2 className="section-title">Popular Tools</h2>
          <Link href="/tools" className="section-link">
            See All
          </Link>
        </div>

        <div className="h-scroll" style={{ margin: '0 calc(-1 * var(--spacing-page))', padding: '0 var(--spacing-page) 8px' }}>
          {TOOLS.map((tool) => {
            const Icon = tool.icon;
            return (
              <Link
                key={tool.id}
                href={tool.href}
                style={{ textDecoration: 'none', minWidth: 180 }}
                className="card card-interactive card-padded"
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: 'var(--radius-md)',
                      background: tool.bg,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Icon size={20} color={tool.color} />
                  </div>

                  <div>
                    <h3
                      className="font-heading"
                      style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)' }}
                    >
                      {tool.name}
                    </h3>
                    <p style={{ fontSize: 11, color: 'var(--color-text-tertiary)', lineHeight: 1.4, marginTop: 2 }}>
                      {tool.desc}
                    </p>
                  </div>

                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-orange)' }}>
                    Try Now →
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Section 7: Concierge Card */}
      <div className="section-gap animate-slide-up">
        <div className="card card-orange card-padded" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                background: 'var(--color-navy)',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: 16,
                fontFamily: 'var(--font-heading)',
                flexShrink: 0,
              }}
            >
              AK
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                <strong
                  className="font-heading"
                  style={{ fontSize: 14, color: 'var(--color-navy)' }}
                >
                  Abdullah K.
                </strong>
                <span className="badge badge-sm badge-success">Available</span>
              </div>
              <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 2 }}>
                Senior Structuring Lead
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: 'var(--color-whatsapp)',
              }}
            />
            <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-secondary)' }}>
              Available on WhatsApp
            </span>
          </div>

          <a
            href="https://wa.me/971501234567?text=Hello%20Abdullah,%20I%20need%20guidance%20on%20my%20GCCStartup%20setup."
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-full"
            style={{
              background: 'var(--color-whatsapp)',
              color: '#FFFFFF',
              height: 44,
              fontSize: 13,
              fontWeight: 700,
              borderRadius: 'var(--radius-md)',
              gap: 8,
            }}
          >
            <MessageSquare size={16} />
            Chat on WhatsApp
          </a>
        </div>
      </div>
    </>
  );
}
