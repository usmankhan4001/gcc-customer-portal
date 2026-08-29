'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Building,
  Landmark,
  Lock,
  Clock,
} from 'lucide-react';
import TaxArbitrageCalculator from '@/components/tools/TaxArbitrageCalculator';
import MasterDiagnosticModal from '@/components/tools/MasterDiagnosticModal';

export default function HomePage() {
  const [isDiagnosticOpen, setIsDiagnosticOpen] = useState(false);

  return (
    <div className="home-wrapper">
      {/* 1. HERO SECTION */}
      <section className="hero-section">
        <div className="badge badge-navy mb-2">
          <Sparkles className="w-3.5 h-3.5 text-orange" />
          <span>SELF-SERVE GLOBAL FORMATION & TAX ARBITRAGE APP</span>
        </div>

        <h1 className="hero-headline display-font">
          Legally Reduce Corporate Tax to <span className="text-orange">0% – 9%</span> & Bank Globally
        </h1>

        <p className="hero-subheadline">
          The all-in-one software platform for European, US, and UK entrepreneurs to form entities in UAE, Hong Kong, Singapore & Bahrain with guaranteed fintech banking and 100% nominee privacy.
        </p>

        <div className="hero-cta-group">
          <button onClick={() => setIsDiagnosticOpen(true)} className="btn btn-primary btn-lg">
            <Sparkles className="w-5 h-5" />
            <span>Launch 3-Minute 360° Diagnostic</span>
          </button>

          <Link href="/setup" className="btn btn-secondary btn-lg">
            <span>Direct Setup Recommender</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Live Social Proof Stats Bar */}
        <div className="stats-bar card">
          <div className="stat-item">
            <span className="stat-value display-font text-navy">$48M+</span>
            <span className="stat-label">Client Revenue Optimized</span>
          </div>
          <div className="stat-divider" />
          <div className="stat-item">
            <span className="stat-value display-font text-orange">100%</span>
            <span className="stat-label">Banking Approval Guarantee</span>
          </div>
          <div className="stat-divider" />
          <div className="stat-item">
            <span className="stat-value display-font text-navy">2-4 Days</span>
            <span className="stat-label">Fast-Track Filing</span>
          </div>
        </div>
      </section>

      {/* 2. INTERACTIVE TAX CALCULATOR SHOWCASE */}
      <section className="calc-showcase-section">
        <TaxArbitrageCalculator />
      </section>

      {/* 3. THREE TARGET AUDIENCE CARDS */}
      <section className="audiences-section">
        <div className="section-header">
          <div className="badge badge-navy">TAILORED STRUCTURING</div>
          <h2 className="section-title display-font">Built for Cross-Border Founders</h2>
          <p className="section-subtitle">Select your operating profile to see your recommended roadmap:</p>
        </div>

        <div className="audiences-grid">
          {/* Audience A */}
          <div className="audience-card card card-hover">
            <div className="card-top">
              <span className="card-flag">💻</span>
              <span className="badge badge-orange">MOST POPULAR</span>
            </div>
            <h3 className="card-title display-font">Digital Income Earners</h3>
            <p className="card-desc">
              E-commerce (Amazon FBA, Shopify), SaaS founders, digital marketing agencies, and remote consultants.
            </p>
            <div className="card-specs card-sand">
              <div className="spec-row">
                <span>Recommended:</span> <strong className="text-navy">Hong Kong / UAE Freezone</strong>
              </div>
              <div className="spec-row">
                <span>Tax Rate:</span> <strong className="text-success">0% Foreign-Sourced</strong>
              </div>
              <div className="spec-row">
                <span>Banking:</span> <strong>Airwallex + Wise Business</strong>
              </div>
            </div>
            <Link href="/setup?activity=ecommerce&country=hk" className="btn btn-primary btn-sm mt-auto">
              <span>Explore Digital Setup</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Audience B */}
          <div className="audience-card card card-hover">
            <div className="card-top">
              <span className="card-flag">🌴</span>
              <span className="badge badge-blue">VIP CONCIERGE</span>
            </div>
            <h3 className="card-title display-font">Lifestyle Relocators & HNWI</h3>
            <p className="card-desc">
              Founders moving to Dubai for 0% personal tax, Emirates ID residency, and physical Gulf banking (or conservative families moving to Oman).
            </p>
            <div className="card-specs card-sand">
              <div className="spec-row">
                <span>Recommended:</span> <strong className="text-navy">UAE Freezone / Oman LLC</strong>
              </div>
              <div className="spec-row">
                <span>Tax Rate:</span> <strong className="text-success">0% Personal Income Tax</strong>
              </div>
              <div className="spec-row">
                <span>Visas:</span> <strong>2-Year Investor & 10-Year Golden</strong>
              </div>
            </div>
            <Link href="/setup?activity=relocation&country=uae" className="btn btn-primary btn-sm mt-auto">
              <span>Explore UAE Relocation</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Audience C */}
          <div className="audience-card card card-hover">
            <div className="card-top">
              <span className="card-flag">🏢</span>
              <span className="badge badge-navy">RESTRUCTURING</span>
            </div>
            <h3 className="card-title display-font">Existing Entities & Nominee Veil</h3>
            <p className="card-desc">
              Companies needing nominee directors, registered agent transfer, or migrating existing GCC entities away from traditional agencies.
            </p>
            <div className="card-specs card-sand">
              <div className="spec-row">
                <span>Recommended:</span> <strong className="text-navy">Tier 2 Nominee Protection</strong>
              </div>
              <div className="spec-row">
                <span>Privacy:</span> <strong className="text-orange">100% Shielded UBO Veil</strong>
              </div>
              <div className="spec-row">
                <span>Maintenance:</span> <strong>Annual License & Tax Hub</strong>
              </div>
            </div>
            <Link href="/setup?tier=tier2" className="btn btn-primary btn-sm mt-auto">
              <span>Explore Nominee Structure</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* 4. THE 4 PILLARS OF HIGH-TICKET TRUST */}
      <section className="trust-section card card-sand">
        <div className="trust-grid">
          <div className="trust-item">
            <ShieldCheck className="w-8 h-8 text-success mb-2" />
            <h4 className="trust-title display-font">Legal Compliance First</h4>
            <p className="trust-desc">Double taxation treaties and official OECD/FATF compliant corporate structuring.</p>
          </div>

          <div className="trust-item">
            <Landmark className="w-8 h-8 text-orange mb-2" />
            <h4 className="trust-title display-font">Money-Back Bank Guarantee</h4>
            <p className="trust-desc">Guaranteed business banking onboarding or 100% banking setup fee refund.</p>
          </div>

          <div className="trust-item">
            <Lock className="w-8 h-8 text-blue mb-2" />
            <h4 className="trust-title display-font">Complete Nominee Privacy</h4>
            <p className="trust-desc">Shield your identity from public registries with licensed Nominee Directors and PoA.</p>
          </div>

          <div className="trust-item">
            <Clock className="w-8 h-8 text-navy mb-2" />
            <h4 className="trust-title display-font">Live 6-Stage Progress</h4>
            <p className="trust-desc">Track government filing in real-time with zero status anxiety and instant kit downloads.</p>
          </div>
        </div>
      </section>

      {/* Master 360° Diagnostic Modal */}
      <MasterDiagnosticModal
        isOpen={isDiagnosticOpen}
        onClose={() => setIsDiagnosticOpen(false)}
      />

      <style jsx>{`
        .home-wrapper {
          display: flex;
          flex-direction: column;
          gap: 48px;
          width: 100%;
        }

        .hero-section {
          text-align: center;
          max-width: 880px;
          margin: 20px auto 0 auto;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 18px;
        }

        .hero-headline {
          font-size: 3.2rem;
          font-weight: 700;
          line-height: 1.12;
          letter-spacing: -0.025em;
          color: var(--navy);
        }

        @media (max-width: 768px) {
          .hero-headline {
            font-size: 2.2rem;
          }
        }

        .hero-subheadline {
          font-size: 1.15rem;
          color: var(--text-secondary);
          line-height: 1.6;
          max-width: 740px;
        }

        .hero-cta-group {
          display: flex;
          align-items: center;
          gap: 14px;
          margin-top: 10px;
        }

        @media (max-width: 600px) {
          .hero-cta-group {
            flex-direction: column;
            width: 100%;
          }
        }

        .stats-bar {
          margin-top: 24px;
          padding: 20px 36px;
          display: flex;
          align-items: center;
          justify-content: space-around;
          width: 100%;
          border-radius: var(--radius-pill);
        }

        @media (max-width: 640px) {
          .stats-bar {
            flex-direction: column;
            gap: 16px;
            border-radius: var(--radius-lg);
          }
          .stat-divider {
            display: none;
          }
        }

        .stat-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2px;
        }

        .stat-value {
          font-size: 1.6rem;
          font-weight: 700;
        }

        .stat-label {
          font-size: 12px;
          color: var(--text-tertiary);
          font-weight: 600;
        }

        .stat-divider {
          width: 1px;
          height: 32px;
          background: var(--border);
        }

        .calc-showcase-section {
          width: 100%;
          max-width: 960px;
          margin: 0 auto;
        }

        .audiences-section {
          display: flex;
          flex-direction: column;
          gap: 28px;
        }

        .section-header {
          text-align: center;
          max-width: 640px;
          margin: 0 auto;
        }

        .section-title {
          font-size: 2.2rem;
          font-weight: 700;
          margin: 8px 0 4px 0;
          color: var(--navy);
        }

        .section-subtitle {
          color: var(--text-secondary);
          font-size: 16px;
        }

        .audiences-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 20px;
        }

        .audience-card {
          padding: 30px;
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .card-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .card-flag {
          font-size: 1.8rem;
        }

        .card-title {
          font-size: 1.3rem;
          font-weight: 700;
          color: var(--navy);
        }

        .card-desc {
          font-size: 14px;
          color: var(--text-secondary);
          line-height: 1.45;
        }

        .card-specs {
          padding: 14px;
          border-radius: var(--radius);
          display: flex;
          flex-direction: column;
          gap: 6px;
          font-size: 13px;
        }

        .spec-row {
          display: flex;
          justify-content: space-between;
        }

        .trust-section {
          padding: 40px 36px;
        }

        .trust-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 24px;
        }

        .trust-item {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 4px;
        }

        .trust-title {
          font-size: 16px;
          font-weight: 700;
          color: var(--navy);
        }

        .trust-desc {
          font-size: 13px;
          color: var(--text-secondary);
          line-height: 1.4;
        }
      `}</style>
    </div>
  );
}
