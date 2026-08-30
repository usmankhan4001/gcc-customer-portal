'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Calculator,
  ShieldCheck,
  Receipt,
  Lock,
  Landmark,
  Globe,
  Sparkles,
  ChevronRight,
  ArrowRight,
} from 'lucide-react';
import PageHeader from '@/components/design-system/PageHeader';
import SkeletonCard from '@/components/ui/SkeletonCard';
import StickyFooter from '@/components/ui/StickyFooter';

// Lazy load calculators via next/dynamic with shimmering skeletons
const TaxArbitrageCalculator = dynamic(
  () => import('@/components/tools/TaxArbitrageCalculator'),
  { loading: () => <SkeletonCard height={280} />, ssr: false }
);

const QFZPEligibilityChecker = dynamic(
  () => import('@/components/tools/QFZPEligibilityChecker'),
  { loading: () => <SkeletonCard height={260} />, ssr: false }
);

const VATThresholdScorer = dynamic(
  () => import('@/components/tools/VATThresholdScorer'),
  { loading: () => <SkeletonCard height={240} />, ssr: false }
);

const BankingFeasibilityScorer = dynamic(
  () => import('@/components/tools/BankingFeasibilityScorer'),
  { loading: () => <SkeletonCard height={260} />, ssr: false }
);

const UBOPrivacyChecker = dynamic(
  () => import('@/components/tools/UBOPrivacyChecker'),
  { loading: () => <SkeletonCard height={240} />, ssr: false }
);

const NameAvailabilityChecker = dynamic(
  () => import('@/components/tools/NameAvailabilityChecker'),
  { loading: () => <SkeletonCard height={220} />, ssr: false }
);

const MasterDiagnosticModal = dynamic(
  () => import('@/components/tools/MasterDiagnosticModal'),
  { ssr: false }
);

const categories = [
  { id: 'all', label: 'All Tools' },
  { id: 'tax', label: '0% Tax Calculators' },
  { id: 'banking', label: 'Banking Pre-Approval' },
  { id: 'privacy', label: 'Nominee Privacy' },
  { id: 'jurisdiction', label: 'Name Screening' },
] as const;

const toolsList = [
  {
    id: 'tax-arbitrage',
    category: 'tax',
    title: 'Tax Arbitrage Calculator',
    description: 'Compare EU/US/UK tax rates against UAE 0–9% corporate tax savings',
    icon: Calculator,
    iconBg: 'var(--orange-lt)',
    iconColor: 'var(--orange)',
    badge: 'POPULAR',
    badgeClass: 'badge-orange',
    countryTarget: 'uae',
  },
  {
    id: 'qfzp-checker',
    category: 'tax',
    title: 'UAE QFZP Qualifier',
    description: 'Test Freezone Qualifying Income status for permanent 0% corporate tax',
    icon: ShieldCheck,
    iconBg: 'var(--success-lt)',
    iconColor: 'var(--success)',
    badge: 'FTA RULES',
    badgeClass: 'badge-success',
    countryTarget: 'uae',
  },
  {
    id: 'vat-threshold',
    category: 'tax',
    title: 'VAT & TRN Threshold Scorer',
    description: 'Assess AED 375,000 threshold requirement and penalty mitigation',
    icon: Receipt,
    iconBg: 'var(--blue-lt)',
    iconColor: 'var(--blue)',
    badge: 'COMPLIANCE',
    badgeClass: 'badge-blue',
    countryTarget: 'uae',
  },
  {
    id: 'banking-feasibility',
    category: 'banking',
    title: 'Banking Feasibility Scorer',
    description: 'Calculate real-time approval odds for Airwallex, Wise, Wio & Emirates NBD',
    icon: Landmark,
    iconBg: 'var(--orange-lt)',
    iconColor: 'var(--orange)',
    badge: 'GUARANTEED',
    badgeClass: 'badge-orange',
    countryTarget: 'hk',
  },
  {
    id: 'ubo-privacy',
    category: 'privacy',
    title: 'UBO & Nominee Privacy Scorer',
    description: 'Evaluate public registry disclosure vs nominee director shield',
    icon: Lock,
    iconBg: 'var(--sand)',
    iconColor: 'var(--navy)',
    badge: 'PRIVACY',
    badgeClass: 'badge-sand',
    countryTarget: 'uae',
  },
  {
    id: 'name-checker',
    category: 'jurisdiction',
    title: 'Trade Name Availability Pre-Check',
    description: 'Screen trade names across UAE Freezone and Hong Kong registries',
    icon: Globe,
    iconBg: 'var(--blue-lt)',
    iconColor: 'var(--blue)',
    badge: 'PRE-CHECK',
    badgeClass: 'badge-blue',
    countryTarget: 'singapore',
  },
];

export default function ToolsStudioPage() {
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [activeToolId, setActiveToolId] = useState<string>('tax-arbitrage');
  const [isDiagnosticOpen, setIsDiagnosticOpen] = useState(false);

  const filteredTools =
    activeCategory === 'all'
      ? toolsList
      : toolsList.filter((t) => t.category === activeCategory);

  const selectedTool = toolsList.find((t) => t.id === activeToolId) || toolsList[0];

  const renderActiveTool = () => {
    switch (selectedTool.id) {
      case 'tax-arbitrage':
        return <TaxArbitrageCalculator compact />;
      case 'qfzp-checker':
        return <QFZPEligibilityChecker />;
      case 'vat-threshold':
        return <VATThresholdScorer />;
      case 'banking-feasibility':
        return <BankingFeasibilityScorer />;
      case 'ubo-privacy':
        return <UBOPrivacyChecker />;
      case 'name-checker':
        return <NameAvailabilityChecker />;
      default:
        return <TaxArbitrageCalculator compact />;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingBottom: 60 }}>
      <PageHeader
        eyebrow="FORMATION STUDIO"
        title="Tax & Structuring Tools"
        subtitle="Calculate net savings, evaluate 0% QFZP status, and check banking approval odds."
      />

      {/* Diagnostic Card */}
      <button
        onClick={() => setIsDiagnosticOpen(true)}
        className="card card-navy app-card-navy"
        style={{
          padding: 16,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          cursor: 'pointer',
          textAlign: 'left',
          width: '100%',
        }}
      >
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            background: 'rgba(242,101,34,0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Sparkles size={20} color="var(--orange)" />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: 'white' }}>
            360° Structuring Diagnostic
          </div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)' }}>
            4 questions • Instant 0% entity recommendation & banking odds
          </div>
        </div>
        <ChevronRight size={18} color="rgba(255,255,255,0.5)" />
      </button>

      {/* Segmented Category Filters */}
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`btn ${activeCategory === cat.id ? 'btn-navy' : 'btn-secondary'}`}
            style={{ flexShrink: 0, fontSize: 12, padding: '7px 14px' }}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Tool Selector Cards (2-Column Grid) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {filteredTools.map((tool) => {
          const Icon = tool.icon;
          const isActive = activeToolId === tool.id;

          return (
            <div
              key={tool.id}
              onClick={() => setActiveToolId(tool.id)}
              className={`card card-hover ${isActive ? 'card-sand' : ''}`}
              style={{
                cursor: 'pointer',
                border: isActive ? '1.5px solid var(--orange)' : undefined,
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
                padding: 14,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    background: tool.iconBg,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Icon size={18} color={tool.iconColor} />
                </div>
                <span className={`badge ${tool.badgeClass}`}>{tool.badge}</span>
              </div>

              <div>
                <h3 style={{ fontSize: 13, fontWeight: 800, color: 'var(--navy)', lineHeight: 1.25 }}>
                  {tool.title}
                </h3>
                <p style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 3, lineHeight: 1.35 }}>
                  {tool.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Active Calculator Workspace */}
      <div className="card app-card" style={{ padding: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--orange)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            ACTIVE CALCULATOR: {selectedTool.title}
          </div>
          <span className="badge badge-sand">INTERACTIVE</span>
        </div>

        {renderActiveTool()}
      </div>

      {/* Sticky Bottom Action Bar */}
      <StickyFooter
        priceLabel="RECOMMENDED STRUCTURE"
        priceValue={selectedTool.title.includes('Tax') ? '0% Tax UAE FZE' : 'Guaranteed Bank'}
        priceSub="Starting from $2,499 USD"
        primaryLabel="Start Company Formation"
        primaryAction={() => router.push(`/setup?country=${selectedTool.countryTarget}`)}
      />

      <MasterDiagnosticModal isOpen={isDiagnosticOpen} onClose={() => setIsDiagnosticOpen(false)} />
    </div>
  );
}
