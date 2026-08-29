'use client';

import React, { useState } from 'react';
import {
  Sparkles,
  Calculator,
  ShieldCheck,
  Receipt,
  Lock,
  Landmark,
  Globe,
  ArrowRight,
} from 'lucide-react';
import TaxArbitrageCalculator from '@/components/tools/TaxArbitrageCalculator';
import QFZPEligibilityChecker from '@/components/tools/QFZPEligibilityChecker';
import VATThresholdScorer from '@/components/tools/VATThresholdScorer';
import UBOPrivacyChecker from '@/components/tools/UBOPrivacyChecker';
import BankingFeasibilityScorer from '@/components/tools/BankingFeasibilityScorer';
import NameAvailabilityChecker from '@/components/tools/NameAvailabilityChecker';
import MasterDiagnosticModal from '@/components/tools/MasterDiagnosticModal';

export default function ToolsStudioPage() {
  const [activeCategory, setActiveCategory] = useState<'all' | 'tax' | 'jurisdiction' | 'privacy' | 'banking'>('all');
  const [activeToolId, setActiveToolId] = useState<string>('tax-arbitrage');
  const [isDiagnosticOpen, setIsDiagnosticOpen] = useState(false);

  const categories = [
    { id: 'all', label: '🔥 All Featured Tools' },
    { id: 'tax', label: '💰 Tax & Arbitrage' },
    { id: 'jurisdiction', label: '🏛️ Jurisdiction & Freezones' },
    { id: 'privacy', label: '🛡️ Privacy & Nominee' },
    { id: 'banking', label: '🏦 Banking Feasibility' },
  ];

  const toolsList = [
    {
      id: 'tax-arbitrage',
      category: 'tax',
      title: 'Global Tax Arbitrage Calculator',
      description: 'Compare European, US, UK taxes against 0–9% Gulf & Hong Kong savings.',
      badge: 'POPULAR • 60 SECONDS',
      icon: Calculator,
      component: <TaxArbitrageCalculator compact />,
    },
    {
      id: 'qfzp-checker',
      category: 'tax',
      title: 'UAE Freezone 0% QFZP Qualifier',
      description: 'Test 0% Corporate Tax eligibility under UAE Cabinet Decision No. 55.',
      badge: 'OFFICIAL FTA RULES',
      icon: ShieldCheck,
      component: <QFZPEligibilityChecker />,
    },
    {
      id: 'vat-threshold',
      category: 'tax',
      title: 'UAE VAT & Mandatory TRN Scorer',
      description: 'Check if you exceed AED 375,000 threshold and avoid late registration fines.',
      badge: 'PENALTY AUDIT',
      icon: Receipt,
      component: <VATThresholdScorer />,
    },
    {
      id: 'ubo-privacy',
      category: 'privacy',
      title: 'UBO Privacy & Nominee Risk Scorer',
      description: 'See public registry visibility vs. 100% shielded Nominee structure.',
      badge: 'CORPORATE VEIL',
      icon: Lock,
      component: <UBOPrivacyChecker />,
    },
    {
      id: 'banking-feasibility',
      category: 'banking',
      title: 'Corporate Banking Feasibility Scorer',
      description: 'Test approval odds for Airwallex, Wise, Wio, and Emirates NBD.',
      badge: 'MONEY-BACK GUARANTEE',
      icon: Landmark,
      component: <BankingFeasibilityScorer />,
    },
    {
      id: 'name-checker',
      category: 'jurisdiction',
      title: 'Trade Name Availability Screener',
      description: 'Screen trade names across Freezone and Hong Kong registry rules.',
      badge: 'REGISTRY PRE-CHECK',
      icon: Globe,
      component: <NameAvailabilityChecker />,
    },
  ];

  const filteredTools =
    activeCategory === 'all'
      ? toolsList
      : toolsList.filter((t) => t.category === activeCategory);

  const selectedTool = toolsList.find((t) => t.id === activeToolId) || toolsList[0];

  return (
    <div className="studio-wrapper">
      {/* Hero Master Diagnostic Banner */}
      <div className="hero-diagnostic-banner card-navy">
        <div className="hero-content">
          <div className="badge badge-orange mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>EXECUTIVE DIAGNOSTIC COCKPIT</span>
          </div>
          <h1 className="hero-title display-font text-white">
            Global Tax & Entity <span className="text-orange">Optimization Studio</span>
          </h1>
          <p className="hero-desc">
            Use our interactive intelligence tools to calculate tax savings, evaluate 0% Freezone rules, and test banking approval before incorporating.
          </p>
        </div>

        <button onClick={() => setIsDiagnosticOpen(true)} className="btn btn-primary btn-lg hero-btn">
          <Sparkles className="w-5 h-5" />
          <span>Launch 3-Minute 360° Diagnostic</span>
        </button>
      </div>

      {/* Category Filter Pills */}
      <div className="category-nav">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id as any)}
            className={`cat-pill ${activeCategory === cat.id ? 'active' : ''}`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* 2-Column Studio Cockpit */}
      <div className="studio-grid">
        {/* Left Column: Tool Switcher Cards */}
        <div className="tools-sidebar">
          {filteredTools.map((tool) => {
            const Icon = tool.icon;
            const isCurrent = activeToolId === tool.id;

            return (
              <div
                key={tool.id}
                onClick={() => setActiveToolId(tool.id)}
                className={`tool-selector-card card ${isCurrent ? 'active' : ''}`}
              >
                <div className="tool-card-top">
                  <div className="tool-icon-box">
                    <Icon className="w-4 h-4 text-orange" />
                  </div>
                  <span className="badge badge-sand">{tool.badge}</span>
                </div>
                <h3 className="tool-card-title display-font">{tool.title}</h3>
                <p className="tool-card-desc">{tool.description}</p>
              </div>
            );
          })}
        </div>

        {/* Right Column: Active Workspace */}
        <div className="tool-active-workspace">
          {selectedTool.component}
        </div>
      </div>

      {/* Master 360° Diagnostic Modal */}
      <MasterDiagnosticModal
        isOpen={isDiagnosticOpen}
        onClose={() => setIsDiagnosticOpen(false)}
      />

      <style jsx>{`
        .studio-wrapper {
          display: flex;
          flex-direction: column;
          gap: 28px;
          width: 100%;
        }

        .hero-diagnostic-banner {
          padding: 36px 40px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 24px;
        }

        @media (max-width: 860px) {
          .hero-diagnostic-banner {
            flex-direction: column;
            text-align: center;
            padding: 28px 24px;
          }
        }

        .hero-title {
          font-size: 2.3rem;
          font-weight: 700;
          margin: 8px 0;
        }

        .hero-desc {
          opacity: 0.9;
          font-size: 16px;
          max-width: 620px;
        }

        .hero-btn {
          white-space: nowrap;
        }

        .category-nav {
          display: flex;
          gap: 10px;
          overflow-x: auto;
          padding-bottom: 4px;
        }

        .cat-pill {
          padding: 10px 20px;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-pill);
          color: var(--text-secondary);
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          white-space: nowrap;
          transition: all 0.2s ease;
        }

        .cat-pill:hover {
          border-color: var(--navy);
          color: var(--navy);
        }

        .cat-pill.active {
          background: var(--navy);
          border-color: var(--navy);
          color: #FFFFFF;
        }

        .studio-grid {
          display: grid;
          grid-template-columns: 340px 1fr;
          gap: 24px;
          align-items: start;
        }

        @media (max-width: 1024px) {
          .studio-grid {
            grid-template-columns: 1fr;
          }
        }

        .tools-sidebar {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .tool-selector-card {
          padding: 18px;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .tool-selector-card:hover {
          border-color: var(--navy);
        }

        .tool-selector-card.active {
          border-color: var(--orange);
          background: var(--orange-lt);
        }

        .tool-card-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .tool-icon-box {
          width: 32px;
          height: 32px;
          background: var(--orange-lt);
          border-radius: var(--radius-sm);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .tool-card-title {
          font-size: 15px;
          font-weight: 700;
          color: var(--navy);
        }

        .tool-card-desc {
          font-size: 12px;
          color: var(--text-secondary);
          line-height: 1.35;
        }

        .tool-active-workspace {
          width: 100%;
        }
      `}</style>
    </div>
  );
}
