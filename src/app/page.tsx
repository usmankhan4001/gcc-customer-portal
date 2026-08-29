'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Calculator,
  Shield,
  Building2,
  Clock,
  TrendingDown,
  Sparkles,
  ChevronRight,
  Globe,
  Landmark,
  FileText,
} from 'lucide-react';
import TopBar from '@/components/design-system/TopBar';
import StatusCard from '@/components/design-system/StatusCard';
import ListItem from '@/components/design-system/ListItem';
import MasterDiagnosticModal from '@/components/tools/MasterDiagnosticModal';

export default function HomePage() {
  const [isDiagnosticOpen, setIsDiagnosticOpen] = useState(false);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Greeting + Quick Stats */}
      <div className="animate-slide-up">
        <div style={{ fontSize: 13, color: 'var(--color-text-muted)', fontWeight: 600, marginBottom: 2 }}>
          WELCOME TO
        </div>
        <h1
          style={{
            fontFamily: 'var(--font-heading)',
            fontSize: '1.6rem',
            fontWeight: 700,
            color: 'var(--color-brand-navy)',
            letterSpacing: '-0.02em',
            lineHeight: 1.2,
          }}
        >
          Global Company <br />
          <span style={{ color: 'var(--color-brand-orange)' }}>Formation Studio</span>
        </h1>
        <p style={{ fontSize: 14, color: 'var(--color-text-tertiary)', marginTop: 4, lineHeight: 1.4 }}>
          Form entities in 15+ jurisdictions with 0% tax, guaranteed banking & full privacy.
        </p>
      </div>

      {/* Hero CTA */}
      <div
        className="app-card app-card-navy animate-slide-up"
        style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
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
            <Sparkles size={18} color="var(--color-brand-orange)" />
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.6)', letterSpacing: '0.1em' }}>
              AI-POWERED
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'white' }}>3-Minute Diagnostic</div>
          </div>
        </div>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', lineHeight: 1.4 }}>
          Answer 4 questions. Get your optimal jurisdiction, tax savings estimate, and banking approval odds.
        </p>
        <button
          onClick={() => setIsDiagnosticOpen(true)}
          className="pill pill-primary"
          style={{ width: '100%', height: 44, fontSize: 14, borderRadius: 12 }}
        >
          <Sparkles size={16} />
          Launch Diagnostic
        </button>
      </div>

      {/* Quick Actions Grid */}
      <div className="animate-slide-up">
        <div className="section-title">Quick Actions</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <Link href="/tools" style={{ textDecoration: 'none' }}>
            <div
              className="app-card app-card-interactive"
              style={{
                padding: 16,
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
                cursor: 'pointer',
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: 'var(--color-brand-orange-lt)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Calculator size={18} color="var(--color-brand-orange)" />
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-brand-navy)' }}>Tax Calculator</div>
                <div style={{ fontSize: 11, color: 'var(--color-text-tertiary)' }}>Compare savings</div>
              </div>
            </div>
          </Link>

          <Link href="/setup" style={{ textDecoration: 'none' }}>
            <div
              className="app-card app-card-interactive"
              style={{
                padding: 16,
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
                cursor: 'pointer',
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: 'var(--color-brand-blue-lt)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Building2 size={18} color="var(--color-brand-blue)" />
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-brand-navy)' }}>Setup Wizard</div>
                <div style={{ fontSize: 11, color: 'var(--color-text-tertiary)' }}>Form a company</div>
              </div>
            </div>
          </Link>

          <Link href="/portal/vault" style={{ textDecoration: 'none' }}>
            <div
              className="app-card app-card-interactive"
              style={{
                padding: 16,
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
                cursor: 'pointer',
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: 'var(--color-success-lt)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Shield size={18} color="var(--color-success)" />
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-brand-navy)' }}>Document Vault</div>
                <div style={{ fontSize: 11, color: 'var(--color-text-tertiary)' }}>KYC & licenses</div>
              </div>
            </div>
          </Link>

          <Link href="/portal/renewals" style={{ textDecoration: 'none' }}>
            <div
              className="app-card app-card-interactive"
              style={{
                padding: 16,
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
                cursor: 'pointer',
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: 'var(--color-warning-lt)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Clock size={18} color="var(--color-warning)" />
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-brand-navy)' }}>Renewals</div>
                <div style={{ fontSize: 11, color: 'var(--color-text-tertiary)' }}>License tracker</div>
              </div>
            </div>
          </Link>
        </div>
      </div>

      {/* Stats Row */}
      <div className="animate-slide-up" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
        <StatusCard title="Jurisdictions" value="15+" variant="orange" />
        <StatusCard title="Companies" value="500+" variant="blue" />
        <StatusCard title="Setup Time" value="48h" variant="success" />
      </div>

      {/* Popular Jurisdictions */}
      <div className="animate-slide-up">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div className="section-title" style={{ marginBottom: 0 }}>Popular Jurisdictions</div>
          <Link href="/tools" style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-brand-orange)', textDecoration: 'none' }}>
            View All
          </Link>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <ListItem
            icon={<span style={{ fontSize: 20 }}>🇦🇪</span>}
            iconBg="var(--color-brand-orange-lt)"
            title="UAE Freezone"
            description="0% foreign income • Emirates ID residency"
            badge={<span className="chip chip-orange">POPULAR</span>}
            href="/setup?country=uae"
          />
          <ListItem
            icon={<span style={{ fontSize: 20 }}>🇭🇰</span>}
            iconBg="var(--color-brand-blue-lt)"
            title="Hong Kong"
            description="0% foreign-sourced • 100% remote setup"
            badge={<span className="chip chip-blue">REMOTE</span>}
            href="/setup?country=hk"
          />
          <ListItem
            icon={<span style={{ fontSize: 20 }}>🇧🇭</span>}
            iconBg="var(--color-success-lt)"
            title="Bahrain"
            description="0% corporate tax • Local banking"
            badge={<span className="chip chip-success">0% TAX</span>}
            href="/setup?country=bahrain"
          />
          <ListItem
            icon={<span style={{ fontSize: 20 }}>🇸🇬</span>}
            iconBg="var(--color-brand-sand)"
            title="Singapore"
            description="5% corporate tax • ASEAN credibility"
            href="/setup?country=singapore"
          />
        </div>
      </div>

      {/* Tax Savings Teaser */}
      <div
        className="app-card animate-slide-up"
        style={{
          padding: 20,
          background: 'linear-gradient(135deg, var(--color-brand-navy) 0%, #1e3a6e 100%)',
          border: 'none',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <TrendingDown size={20} color="var(--color-brand-orange)" />
          <span style={{ fontSize: 15, fontWeight: 700, color: 'white' }}>How Much Can You Save?</span>
        </div>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', lineHeight: 1.4, marginBottom: 14 }}>
          European entrepreneurs save $12K–$80K/year on corporate tax with the right structure.
        </p>
        <Link
          href="/tools"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            padding: '10px 0',
            background: 'var(--color-brand-orange)',
            color: 'white',
            borderRadius: 12,
            fontSize: 14,
            fontWeight: 700,
            textDecoration: 'none',
            transition: 'all 0.15s ease',
          }}
        >
          Calculate Your Savings
          <ArrowRight size={16} />
        </Link>
      </div>

      {/* Trust Indicators */}
      <div className="animate-slide-up">
        <div className="section-title">Why GCCStartup</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <ListItem
            icon={<Shield size={18} color="var(--color-success)" />}
            iconBg="var(--color-success-lt)"
            title="Legal Compliance First"
            description="OECD/FATF compliant • Double tax treaties"
            interactive={false}
          />
          <ListItem
            icon={<Landmark size={18} color="var(--color-brand-orange)" />}
            iconBg="var(--color-brand-orange-lt)"
            title="Money-Back Bank Guarantee"
            description="Guaranteed banking or 100% fee refund"
            interactive={false}
          />
          <ListItem
            icon={<Globe size={18} color="var(--color-brand-blue)" />}
            iconBg="var(--color-brand-blue-lt)"
            title="100% Nominee Privacy"
            description="Shield identity from public registries"
            interactive={false}
          />
        </div>
      </div>

      <MasterDiagnosticModal isOpen={isDiagnosticOpen} onClose={() => setIsDiagnosticOpen(false)} />
    </div>
  );
}
