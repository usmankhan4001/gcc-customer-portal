'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Calculator,
  Shield,
  Building2,
  Clock,
  Sparkles,
  Search,
  CheckCircle2,
  Landmark,
  Globe,
  Lock,
  MessageSquare,
  TrendingUp,
  Percent,
  Zap,
} from 'lucide-react';
import StatusCard from '@/components/design-system/StatusCard';
import MasterDiagnosticModal from '@/components/tools/MasterDiagnosticModal';
import CountryFlag from '@/components/ui/CountryFlag';
import { usePortalStore } from '@/lib/store';

const jurisdictions = [
  {
    id: 'uae',
    name: 'UAE Freezone',
    sub: 'Dubai (IFZA / Meydan)',
    countryCode: 'uae',
    taxRate: '0% Tax',
    taxBadgeClass: 'badge-success',
    turnaround: '48 Hours',
    price: '$2,499',
    bankingGuarantee: true,
    highlight: 'Emirates ID & Residency Included',
    href: '/setup?country=uae',
  },
  {
    id: 'hk',
    name: 'Hong Kong Offshore',
    sub: 'Companies Registry',
    countryCode: 'hk',
    taxRate: '0% Foreign',
    taxBadgeClass: 'badge-blue',
    turnaround: '3-5 Days',
    price: '$1,850',
    bankingGuarantee: true,
    highlight: '100% Remote Biometric Pass',
    href: '/setup?country=hk',
  },
  {
    id: 'singapore',
    name: 'Singapore Pte Ltd',
    sub: 'ACRA Registry',
    countryCode: 'singapore',
    taxRate: '5% Effective',
    taxBadgeClass: 'badge-navy',
    turnaround: '2-3 Days',
    price: '$2,800',
    bankingGuarantee: true,
    highlight: 'Tier 1 Global Credibility',
    href: '/setup?country=singapore',
  },
  {
    id: 'bahrain',
    name: 'Bahrain W.L.L.',
    sub: 'MOIC Sijilat',
    countryCode: 'bahrain',
    taxRate: '0% Corp Tax',
    taxBadgeClass: 'badge-success',
    turnaround: '4-6 Days',
    price: '$2,200',
    bankingGuarantee: true,
    highlight: '100% Foreign Ownership',
    href: '/setup?country=bahrain',
  },
  {
    id: 'ireland',
    name: 'Ireland Non-Resident',
    sub: 'CRO Registry',
    countryCode: 'ireland',
    taxRate: '12.5% EU Gateway',
    taxBadgeClass: 'badge-blue',
    turnaround: '5-7 Days',
    price: '$2,650',
    bankingGuarantee: true,
    highlight: 'Access to European SEPA IBANs',
    href: '/setup?country=ireland',
  },
  {
    id: 'oman',
    name: 'Oman LLC',
    sub: 'MOCIIP Invest',
    countryCode: 'oman',
    taxRate: '0% Freezone',
    taxBadgeClass: 'badge-success',
    turnaround: '5-8 Days',
    price: '$2,400',
    bankingGuarantee: true,
    highlight: 'GCC Customs & Tariffs Union',
    href: '/setup?country=oman',
  },
];

export default function HomePage() {
  const [isDiagnosticOpen, setIsDiagnosticOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { userProfile } = usePortalStore();

  const filteredJurisdictions = jurisdictions.filter((j) =>
    j.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    j.sub.toLowerCase().includes(searchQuery.toLowerCase()) ||
    j.taxRate.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Executive Header Bar */}
      <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              GLOBAL FORMATION STUDIO
            </div>
            <h1
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: '1.65rem',
                fontWeight: 800,
                color: 'var(--navy)',
                letterSpacing: '-0.02em',
                lineHeight: 1.15,
                marginTop: 2,
              }}
            >
              Hello, {userProfile.name.split(' ')[0]}
            </h1>
          </div>

          <Link href="/portal/dashboard" style={{ textDecoration: 'none' }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: '50%',
                background: 'var(--orange-lt)',
                border: '2px solid rgba(242,101,34,0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 16,
                fontWeight: 800,
                color: 'var(--orange)',
              }}
            >
              {userProfile.name.charAt(0)}
            </div>
          </Link>
        </div>

        {/* Quick Search Bar */}
        <div style={{ position: 'relative', width: '100%' }}>
          <Search
            size={18}
            color="var(--text-tertiary)"
            style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)' }}
          />
          <input
            type="text"
            placeholder="Search 15+ jurisdictions, tax structures, or banking..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-field"
            style={{ paddingLeft: 44, height: 46 }}
          />
        </div>
      </div>

      {/* Quick Diagnostic Card */}
      <div
        className="card card-navy animate-slide-up"
        style={{
          padding: 20,
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
          border: '1px solid rgba(255,255,255,0.1)',
          boxShadow: 'var(--shadow-lg)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: 'rgba(242,101,34,0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Sparkles size={18} color="var(--orange)" />
            </div>
            <div>
              <span className="badge badge-orange" style={{ fontSize: 10 }}>
                SMART DIAGNOSTIC
              </span>
              <div style={{ fontSize: 15, fontWeight: 800, color: 'white' }}>
                3-Minute Tax & Entity Diagnostic
              </div>
            </div>
          </div>
        </div>

        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', lineHeight: 1.45 }}>
          Answer 4 quick questions. Receive your tailored 0% tax entity blueprint, banking approval probability, and estimated annual savings.
        </p>

        <button
          onClick={() => setIsDiagnosticOpen(true)}
          className="btn btn-primary"
          style={{ width: '100%', height: 44, fontSize: 13, borderRadius: 10 }}
        >
          <Sparkles size={16} />
          Launch Free Diagnostic Wizard
        </button>
      </div>

      {/* Quick Metrics Bar */}
      <div className="animate-slide-up" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
        <StatusCard title="Jurisdictions" value="15+" variant="orange" />
        <StatusCard title="Entities Formed" value="500+" variant="blue" />
        <StatusCard title="Setup SLA" value="48h" variant="success" />
      </div>

      {/* 2-Column Jurisdiction Catalog Grid */}
      <div className="animate-slide-up">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <div>
            <h2 className="section-title" style={{ marginBottom: 2 }}>Company Formation Catalog</h2>
            <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
              100% remote incorporation with guaranteed corporate banking
            </div>
          </div>
          <Link href="/setup" style={{ fontSize: 13, fontWeight: 700, color: 'var(--orange)', textDecoration: 'none' }}>
            View All →
          </Link>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {filteredJurisdictions.map((j) => (
            <Link
              key={j.id}
              href={j.href}
              style={{ textDecoration: 'none' }}
              className="card card-hover"
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, height: '100%' }}>
                {/* Top Row: Flag & Tax Badge */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <CountryFlag country={j.countryCode} size="md" />
                  <span className={`badge ${j.taxBadgeClass}`}>{j.taxRate}</span>
                </div>

                {/* Title & Sub */}
                <div>
                  <h3 style={{ fontSize: 14, fontWeight: 800, color: 'var(--navy)', lineHeight: 1.2 }}>
                    {j.name}
                  </h3>
                  <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2 }}>
                    {j.sub}
                  </div>
                </div>

                {/* Highlight Tag */}
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: 'var(--text-secondary)',
                    background: 'var(--surface-alt)',
                    padding: '4px 8px',
                    borderRadius: 6,
                    lineHeight: 1.3,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  <Zap size={12} color="var(--orange)" />
                  <span>{j.highlight}</span>
                </div>

                {/* Footer: Price & SLA */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginTop: 'auto',
                    paddingTop: 8,
                    borderTop: '1px solid var(--border)',
                  }}
                >
                  <div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>From</div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--orange)' }}>
                      {j.price}
                    </div>
                  </div>
                  <span className="badge badge-sand" style={{ fontSize: 10 }}>
                    {j.turnaround}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Quick Interactive Tools Hub */}
      <div className="animate-slide-up">
        <div className="section-title">Structuring & Calculators Hub</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <Link href="/tools" style={{ textDecoration: 'none' }}>
            <div className="card card-hover" style={{ padding: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--orange-lt)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Calculator size={18} color="var(--orange)" />
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--navy)' }}>Tax Arbitrage</div>
                <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>Compare EU/US savings</div>
              </div>
            </div>
          </Link>

          <Link href="/tools" style={{ textDecoration: 'none' }}>
            <div className="card card-hover" style={{ padding: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--blue-lt)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Landmark size={18} color="var(--blue)" />
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--navy)' }}>Banking Odds</div>
                <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>Airwallex & Wio approval</div>
              </div>
            </div>
          </Link>

          <Link href="/portal/vault" style={{ textDecoration: 'none' }}>
            <div className="card card-hover" style={{ padding: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--success-lt)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Shield size={18} color="var(--success)" />
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--navy)' }}>Document Vault</div>
                <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>KYC & license locker</div>
              </div>
            </div>
          </Link>

          <Link href="/portal/renewals" style={{ textDecoration: 'none' }}>
            <div className="card card-hover" style={{ padding: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--warning-lt)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Clock size={18} color="var(--warning)" />
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--navy)' }}>Renewals Hub</div>
                <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>License continuity</div>
              </div>
            </div>
          </Link>
        </div>
      </div>

      {/* Dedicated Concierge Specialist Advisor Card */}
      <div
        className="card card-sand animate-slide-up"
        style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 12 }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: '50%',
                background: 'var(--navy)',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: 16,
              }}
            >
              AK
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <strong style={{ fontSize: 14, color: 'var(--navy)' }}>Abdullah K.</strong>
                <span className="badge badge-success" style={{ fontSize: 9 }}>ONLINE</span>
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
                Senior Structuring Lead • Under 15m Response Time
              </div>
            </div>
          </div>
          <span className="badge badge-orange">ASSIGNED SPECIALIST</span>
        </div>

        <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.4 }}>
          Have questions regarding nominee trust deeds, UAE Freezone trade licenses, or multi-currency IBAN pre-approvals?
        </p>

        <a
          href="https://wa.me/971501234567?text=Hello%20Abdullah,%20I%20would%20like%20guidance%20on%20GCCStartup%20formation."
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-primary"
          style={{ width: '100%', height: 42, fontSize: 13, background: 'var(--whatsapp)', borderColor: 'var(--whatsapp)' }}
        >
          <MessageSquare size={16} />
          Chat Directly on WhatsApp (+971 50 123 4567)
        </a>
      </div>

      <MasterDiagnosticModal isOpen={isDiagnosticOpen} onClose={() => setIsDiagnosticOpen(false)} />
    </div>
  );
}
