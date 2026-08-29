'use client';

import React, { useState } from 'react';
import {
  Calculator,
  ShieldCheck,
  Receipt,
  Lock,
  Landmark,
  Globe,
  Sparkles,
} from 'lucide-react';
import PageHeader from '@/components/design-system/PageHeader';
import TaxArbitrageCalculator from '@/components/tools/TaxArbitrageCalculator';
import QFZPEligibilityChecker from '@/components/tools/QFZPEligibilityChecker';
import VATThresholdScorer from '@/components/tools/VATThresholdScorer';
import UBOPrivacyChecker from '@/components/tools/UBOPrivacyChecker';
import BankingFeasibilityScorer from '@/components/tools/BankingFeasibilityScorer';
import NameAvailabilityChecker from '@/components/tools/NameAvailabilityChecker';
import MasterDiagnosticModal from '@/components/tools/MasterDiagnosticModal';

const categories = [
  { id: 'all', label: 'All' },
  { id: 'tax', label: 'Tax' },
  { id: 'jurisdiction', label: 'Jurisdiction' },
  { id: 'privacy', label: 'Privacy' },
  { id: 'banking', label: 'Banking' },
] as const;

const toolsList = [
  {
    id: 'tax-arbitrage',
    category: 'tax',
    title: 'Tax Arbitrage Calculator',
    description: 'Compare EU/US/UK taxes against 0–9% savings',
    icon: Calculator,
    iconBg: 'var(--color-brand-orange-lt)',
    badge: 'POPULAR',
    badgeClass: 'chip-orange',
  },
  {
    id: 'qfzp-checker',
    category: 'tax',
    title: 'UAE QFZP Qualifier',
    description: 'Test 0% corporate tax eligibility',
    icon: ShieldCheck,
    iconBg: 'var(--color-success-lt)',
    badge: 'FTA RULES',
    badgeClass: 'chip-success',
  },
  {
    id: 'vat-threshold',
    category: 'tax',
    title: 'VAT & TRN Scorer',
    description: 'Check AED 375K threshold & penalties',
    icon: Receipt,
    iconBg: 'var(--color-brand-blue-lt)',
    badge: 'PENALTY AUDIT',
    badgeClass: 'chip-blue',
  },
  {
    id: 'ubo-privacy',
    category: 'privacy',
    title: 'UBO Privacy Scorer',
    description: 'Registry visibility vs nominee protection',
    icon: Lock,
    iconBg: 'var(--color-brand-sand)',
    badge: 'PRIVACY',
    badgeClass: 'chip-sand',
  },
  {
    id: 'banking-feasibility',
    category: 'banking',
    title: 'Banking Feasibility',
    description: 'Test approval odds for Airwallex, Wise, Wio',
    icon: Landmark,
    iconBg: 'var(--color-warning-lt)',
    badge: 'GUARANTEE',
    badgeClass: 'chip-orange',
  },
  {
    id: 'name-checker',
    category: 'jurisdiction',
    title: 'Name Availability',
    description: 'Screen trade names across registries',
    icon: Globe,
    iconBg: 'var(--color-brand-blue-lt)',
    badge: 'PRE-CHECK',
    badgeClass: 'chip-blue',
  },
];

const toolComponents: Record<string, React.ReactNode> = {
  'tax-arbitrage': <TaxArbitrageCalculator compact />,
  'qfzp-checker': <QFZPEligibilityChecker />,
  'vat-threshold': <VATThresholdScorer />,
  'ubo-privacy': <UBOPrivacyChecker />,
  'banking-feasibility': <BankingFeasibilityScorer />,
  'name-checker': <NameAvailabilityChecker />,
};

export default function ToolsStudioPage() {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [activeToolId, setActiveToolId] = useState<string>('tax-arbitrage');
  const [isDiagnosticOpen, setIsDiagnosticOpen] = useState(false);

  const filteredTools =
    activeCategory === 'all'
      ? toolsList
      : toolsList.filter((t) => t.category === activeCategory);

  const selectedTool = toolsList.find((t) => t.id === activeToolId) || toolsList[0];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <PageHeader
        eyebrow="STUDIO"
        title="Tax & Entity Tools"
        subtitle="Calculate savings, test eligibility, check banking odds."
      />

      {/* Diagnostic CTA */}
      <button
        onClick={() => setIsDiagnosticOpen(true)}
        className="app-card app-card-navy"
        style={{
          padding: 16,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          cursor: 'pointer',
          textAlign: 'left',
          width: '100%',
          border: 'none',
        }}
      >
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            background: 'rgba(242,101,34,0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Sparkles size={20} color="var(--color-brand-orange)" />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'white' }}>360° Diagnostic</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>4 questions • 60 seconds • personalized</div>
        </div>
      </button>

      {/* Category Filter */}
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`pill ${activeCategory === cat.id ? 'pill-navy' : 'pill-secondary'}`}
            style={{ flexShrink: 0 }}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Tool List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {filteredTools.map((tool) => {
          const Icon = tool.icon;
          const isActive = activeToolId === tool.id;

          return (
            <button
              key={tool.id}
              onClick={() => setActiveToolId(tool.id)}
              className="list-item"
              style={{
                cursor: 'pointer',
                textAlign: 'left',
                width: '100%',
                border: isActive ? '1.5px solid var(--color-brand-orange)' : '1px solid var(--color-border)',
                background: isActive ? 'var(--color-brand-orange-lt)' : 'var(--color-surface)',
              }}
            >
              <div className="list-item-icon" style={{ background: tool.iconBg }}>
                <Icon size={18} color="var(--color-brand-orange)" />
              </div>
              <div className="list-item-content">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className="list-item-title">{tool.title}</span>
                  <span className={`chip ${tool.badgeClass}`}>{tool.badge}</span>
                </div>
                <div className="list-item-desc">{tool.description}</div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Active Tool Workspace */}
      <div
        className="app-card"
        style={{ padding: 16, minHeight: 200 }}
      >
        {toolComponents[selectedTool.id]}
      </div>

      <MasterDiagnosticModal isOpen={isDiagnosticOpen} onClose={() => setIsDiagnosticOpen(false)} />
    </div>
  );
}
