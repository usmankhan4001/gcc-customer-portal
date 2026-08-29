'use client';

import React, { useState, useMemo } from 'react';
import {
  Calculator,
  Shield,
  Percent,
  Eye,
  Search,
  Landmark,
  Sparkles,
  SearchX,
} from 'lucide-react';
import Modal from '@/components/ui/Modal';
import TaxArbitrageCalculator from '@/components/tools/TaxArbitrageCalculator';
import QFZPEligibilityChecker from '@/components/tools/QFZPEligibilityChecker';
import VATThresholdScorer from '@/components/tools/VATThresholdScorer';
import UBOPrivacyChecker from '@/components/tools/UBOPrivacyChecker';
import NameAvailabilityChecker from '@/components/tools/NameAvailabilityChecker';
import BankingFeasibilityScorer from '@/components/tools/BankingFeasibilityScorer';
import MasterDiagnosticModal from '@/components/tools/MasterDiagnosticModal';

const CATEGORIES = ['All', 'Tax', 'Legal', 'Banking', 'Compliance'] as const;
type Category = (typeof CATEGORIES)[number];

const CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
  Tax: { bg: 'var(--color-orange-light)', text: 'var(--color-orange)' },
  Legal: { bg: 'var(--color-navy-subtle)', text: 'var(--color-navy)' },
  Banking: { bg: 'var(--color-info-light)', text: 'var(--color-info)' },
  Compliance: { bg: 'var(--color-orange-light)', text: 'var(--color-orange)' },
};

interface ToolDef {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  category: Category;
  color: string;
  component: React.ReactNode;
  badge?: string;
  badgeClass?: string;
}

const tools: ToolDef[] = [
  {
    id: 'tax-arbitrage',
    name: 'Tax Arbitrage Calculator',
    description: 'Compare EU/US/UK tax rates against UAE 0–9% corporate tax savings',
    icon: Calculator,
    category: 'Tax',
    color: 'var(--color-orange)',
    badge: 'POPULAR',
    badgeClass: 'badge-orange',
    component: <TaxArbitrageCalculator compact />,
  },
  {
    id: 'qfzp-checker',
    name: 'QFZP 0% Checker',
    description: 'Test Freezone Qualifying Income status for permanent 0% corporate tax',
    icon: Shield,
    category: 'Tax',
    color: 'var(--color-success)',
    badge: 'FTA RULES',
    badgeClass: 'badge-success',
    component: <QFZPEligibilityChecker />,
  },
  {
    id: 'vat-threshold',
    name: 'VAT Threshold Calculator',
    description: 'Assess AED 375,000 threshold requirement and penalty mitigation',
    icon: Percent,
    category: 'Tax',
    color: 'var(--color-info)',
    badge: 'COMPLIANCE',
    badgeClass: 'badge-info',
    component: <VATThresholdScorer />,
  },
  {
    id: 'ubo-privacy',
    name: 'UBO Privacy Checker',
    description: 'Evaluate public registry disclosure vs nominee director shield',
    icon: Eye,
    category: 'Legal',
    color: 'var(--color-navy)',
    badge: 'PRIVACY',
    badgeClass: 'badge-navy',
    component: <UBOPrivacyChecker />,
  },
  {
    id: 'name-checker',
    name: 'Name Availability Checker',
    description: 'Screen trade names across UAE Freezone and Hong Kong registries',
    icon: Search,
    category: 'Legal',
    color: 'var(--color-navy)',
    badge: 'PRE-CHECK',
    badgeClass: 'badge-navy',
    component: <NameAvailabilityChecker />,
  },
  {
    id: 'banking-feasibility',
    name: 'Banking Feasibility Scorer',
    description: 'Calculate real-time approval odds for Airwallex, Wise, Wio & Emirates NBD',
    icon: Landmark,
    category: 'Banking',
    color: 'var(--color-info)',
    badge: 'GUARANTEED',
    badgeClass: 'badge-info',
    component: <BankingFeasibilityScorer />,
  },
  {
    id: 'diagnostic-wizard',
    name: 'AI Diagnostic Wizard',
    description: '4 questions • Instant 0% entity recommendation & banking odds',
    icon: Sparkles,
    category: 'Compliance',
    color: 'var(--color-orange)',
    badge: 'AI POWERED',
    badgeClass: 'badge-orange',
    component: null,
  },
];

export default function ToolsStudioPage() {
  const [activeCategory, setActiveCategory] = useState<Category>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTool, setSelectedTool] = useState<ToolDef | null>(null);
  const [isDiagnosticOpen, setIsDiagnosticOpen] = useState(false);

  const filteredTools = useMemo(() => {
    let result = tools;

    if (activeCategory !== 'All') {
      result = result.filter((t) => t.category === activeCategory);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q)
      );
    }

    return result;
  }, [activeCategory, searchQuery]);

  const handleToolClick = (tool: ToolDef) => {
    if (tool.id === 'diagnostic-wizard') {
      setIsDiagnosticOpen(true);
    } else {
      setSelectedTool(tool);
    }
  };

  const handleCloseModal = () => setSelectedTool(null);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Page Header */}
      <div className="animate-slide-up">
        <h1
          className="font-heading"
          style={{
            fontSize: '1.5rem',
            fontWeight: 800,
            color: 'var(--color-text)',
            marginBottom: 4,
          }}
        >
          Structuring Tools
        </h1>
        <p
          style={{
            fontSize: 14,
            color: 'var(--color-text-secondary)',
          }}
        >
          Interactive calculators & diagnostics
        </p>
      </div>

      {/* Search Bar */}
      <div className="search-bar animate-slide-up" style={{ animationDelay: '40ms' }}>
        <Search size={18} className="search-bar-icon" />
        <input
          type="text"
          placeholder="Search tools..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Category Chips */}
      <div
        className="h-scroll animate-slide-up"
        style={{ animationDelay: '80ms', gap: 8 }}
      >
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            className={`chip ${activeCategory === cat ? 'active' : ''}`}
            onClick={() => setActiveCategory(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Tool Grid */}
      {filteredTools.length > 0 ? (
        <div
          className="stagger"
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 10,
          }}
        >
          {filteredTools.map((tool) => {
            const Icon = tool.icon;
            return (
              <button
                key={tool.id}
                className="card card-interactive card-padded animate-slide-up"
                onClick={() => handleToolClick(tool)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                  textAlign: 'left',
                  border: 'none',
                  font: 'inherit',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                  }}
                >
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 'var(--radius-md)',
                      background:
                        CATEGORY_COLORS[tool.category]?.bg ||
                        'var(--color-surface-alt)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Icon size={22} color={tool.color} />
                  </div>
                  {tool.badge && (
                    <span className={`badge badge-sm ${tool.badgeClass || ''}`}>
                      {tool.badge}
                    </span>
                  )}
                </div>

                <div>
                  <h3
                    className="font-heading"
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                      color: 'var(--color-text)',
                      lineHeight: 1.25,
                      marginBottom: 3,
                    }}
                  >
                    {tool.name}
                  </h3>
                  <p
                    style={{
                      fontSize: 11,
                      color: 'var(--color-text-tertiary)',
                      lineHeight: 1.35,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {tool.description}
                  </p>
                </div>

                <span
                  className="badge badge-sm"
                  style={{
                    alignSelf: 'flex-start',
                    background:
                      CATEGORY_COLORS[tool.category]?.bg ||
                      'var(--color-surface-alt)',
                    color:
                      CATEGORY_COLORS[tool.category]?.text ||
                      'var(--color-text-secondary)',
                  }}
                >
                  {tool.category}
                </span>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="empty-state animate-fade-in">
          <div className="empty-state-icon">
            <SearchX size={28} />
          </div>
          <div className="empty-state-title">No tools found</div>
          <div className="empty-state-desc">
            Try a different search term or category filter.
          </div>
        </div>
      )}

      {/* Tool Modal */}
      <Modal
        isOpen={!!selectedTool}
        onClose={handleCloseModal}
        title={selectedTool?.name}
      >
        {selectedTool?.component}
      </Modal>

      {/* AI Diagnostic Wizard Modal */}
      <MasterDiagnosticModal
        isOpen={isDiagnosticOpen}
        onClose={() => setIsDiagnosticOpen(false)}
      />
    </div>
  );
}
