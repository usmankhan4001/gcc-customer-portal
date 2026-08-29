'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { Calculator, ArrowRight, ShieldCheck, TrendingUp, Building, Globe } from 'lucide-react';

interface CountryPreset {
  code: string;
  name: string;
  flag: string;
  effectiveRate: number; // e.g. 0.495 for 49.5%
  currency: string;
  rateLabel: string;
}

const COUNTRY_PRESETS: CountryPreset[] = [
  { code: 'NL', name: 'Netherlands', flag: '🇳🇱', effectiveRate: 0.495, currency: '€', rateLabel: '49.5% (Box 1)' },
  { code: 'DE', name: 'Germany', flag: '🇩🇪', effectiveRate: 0.45, currency: '€', rateLabel: '45.0% (Income + Soli)' },
  { code: 'UK', name: 'United Kingdom', flag: '🇬🇧', effectiveRate: 0.45, currency: '£', rateLabel: '45.0% (Top Bracket)' },
  { code: 'FR', name: 'France', flag: '🇫🇷', effectiveRate: 0.45, currency: '€', rateLabel: '45.0% (Tranche Supérieure)' },
  { code: 'US', name: 'United States', flag: '🇺🇸', effectiveRate: 0.37, currency: '$', rateLabel: '37.0% (Federal Top)' },
  { code: 'CA', name: 'Canada', flag: '🇨🇦', effectiveRate: 0.48, currency: 'C$', rateLabel: '48.0% (Federal + Prov)' },
  { code: 'ES', name: 'Spain', flag: '🇪🇸', effectiveRate: 0.47, currency: '€', rateLabel: '47.0% (IRPF)' },
  { code: 'AU', name: 'Australia', flag: '🇦🇺', effectiveRate: 0.45, currency: 'A$', rateLabel: '45.0% (Top Bracket)' },
];

export default function TaxArbitrageCalculator({ compact = false }: { compact?: boolean }) {
  const [selectedCountryCode, setSelectedCountryCode] = useState('NL');
  const [profit, setProfit] = useState(250000);
  const [selectedOptimization, setSelectedOptimization] = useState<'uae' | 'hk' | 'bahrain'>('uae');

  const selectedCountry = useMemo(() => {
    return COUNTRY_PRESETS.find((c) => c.code === selectedCountryCode) || COUNTRY_PRESETS[0];
  }, [selectedCountryCode]);

  // Target rates
  const optimizationRates = {
    uae: { name: 'UAE Freezone', flag: '🇦🇪', rate: 0.09, rateLabel: '9% (0% on Foreign Income)' },
    hk: { name: 'Hong Kong (Offshore)', flag: '🇭🇰', rate: 0.0, rateLabel: '0% (Foreign-Sourced)' },
    bahrain: { name: 'Bahrain', flag: '🇧🇭', rate: 0.0, rateLabel: '0% Corporate Tax' },
  };

  const currentOpt = optimizationRates[selectedOptimization];

  // Calculation
  const homeTax = profit * selectedCountry.effectiveRate;
  const optimizedTax = profit * currentOpt.rate;
  const netSavings = Math.max(0, homeTax - optimizedTax);
  const savingsPercent = Math.round((netSavings / homeTax) * 100) || 0;

  return (
    <div className={`tax-calc-card card ${compact ? 'compact' : ''}`}>
      {/* Header */}
      <div className="calc-header">
        <div className="badge badge-blue">
          <Calculator className="w-3.5 h-3.5" />
          <span>REAL-TIME TAX ARBITRAGE ENGINE</span>
        </div>
        <h2 className="calc-title display-font">
          Calculate Your Net <span className="text-orange">Tax Savings</span>
        </h2>
        <p className="calc-subtitle">
          See exactly how much revenue you retain by legally restructuring your digital or cross-border income.
        </p>
      </div>

      {/* Country Selector Grid */}
      <div className="country-section">
        <label className="input-label">Select Your Current Country of Tax Residence:</label>
        <div className="country-grid">
          {COUNTRY_PRESETS.map((country) => (
            <button
              key={country.code}
              onClick={() => setSelectedCountryCode(country.code)}
              className={`country-pill ${selectedCountryCode === country.code ? 'active' : ''}`}
            >
              <span className="flag">{country.flag}</span>
              <span className="name">{country.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Annual Profit Range Slider */}
      <div className="slider-section card-sand">
        <div className="slider-label-row">
          <label className="input-label mb-0">Estimated Annual Taxable Income / Profit:</label>
          <div className="profit-display display-font text-navy">
            {selectedCountry.currency}
            {profit.toLocaleString()}
          </div>
        </div>
        <input
          type="range"
          min={50000}
          max={1500000}
          step={10000}
          value={profit}
          onChange={(e) => setProfit(Number(e.target.value))}
          className="w-full"
        />
        <div className="slider-hints">
          <span>{selectedCountry.currency}50k</span>
          <span>{selectedCountry.currency}500k</span>
          <span>{selectedCountry.currency}1M</span>
          <span>{selectedCountry.currency}1.5M+</span>
        </div>
      </div>

      {/* Target Destination Switcher */}
      <div className="target-section">
        <label className="input-label">Select Target Jurisdiction for Comparison:</label>
        <div className="target-buttons">
          {(Object.keys(optimizationRates) as Array<'uae' | 'hk' | 'bahrain'>).map((key) => {
            const opt = optimizationRates[key];
            return (
              <button
                key={key}
                onClick={() => setSelectedOptimization(key)}
                className={`target-btn ${selectedOptimization === key ? 'active' : ''}`}
              >
                <div className="target-top">
                  <span className="target-flag">{opt.flag}</span>
                  <span className="target-name">{opt.name}</span>
                </div>
                <span className="rate-sub">{opt.rateLabel}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Visual Side-by-Side Result Card */}
      <div className="result-container">
        <div className="result-grid">
          {/* Home Country Box */}
          <div className="result-box home-box card-sand">
            <span className="box-tag text-tertiary">CURRENT LIABILITY ({selectedCountry.name})</span>
            <div className="box-value text-error display-font">
              {selectedCountry.currency}
              {Math.round(homeTax).toLocaleString()}
            </div>
            <span className="box-sub">Effective Rate: {selectedCountry.rateLabel}</span>
          </div>

          {/* Optimized Box */}
          <div className="result-box opt-box card-blue-lt">
            <span className="box-tag text-blue font-bold">OPTIMIZED ({currentOpt.name})</span>
            <div className="box-value text-blue display-font">
              {selectedCountry.currency}
              {Math.round(optimizedTax).toLocaleString()}
            </div>
            <span className="box-sub">Tax Rate: {currentOpt.rateLabel}</span>
          </div>
        </div>

        {/* Big ROI Highlight Banner */}
        <div className="net-savings-banner card-navy">
          <div className="savings-content">
            <div className="savings-label">
              <TrendingUp className="w-4 h-4 inline mr-1 text-orange" />
              NET ANNUAL CASH RETAINED
            </div>
            <div className="savings-number display-font text-white">
              +{selectedCountry.currency}
              {Math.round(netSavings).toLocaleString()}
              <span className="per-year"> / YEAR</span>
            </div>
            <p className="savings-desc">
              You retain <strong>{savingsPercent}% more</strong> of your profits legally within international corporate frameworks.
            </p>
          </div>

          <Link
            href={`/setup?country=${selectedOptimization}&profit=${profit}&home=${selectedCountryCode}`}
            className="btn btn-primary btn-lg"
          >
            <span>Lock In This Structure</span>
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </div>

      {/* Compliance Guarantee Footnote */}
      <div className="calc-footer">
        <ShieldCheck className="w-4 h-4 text-success" />
        <span>
          100% Legal Tax Mitigation • Full Double Taxation Treaty Compliance • OECD / FATF Standards
        </span>
      </div>

      <style jsx>{`
        .tax-calc-card {
          padding: 36px 32px;
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .tax-calc-card.compact {
          padding: 24px 20px;
          border: none;
          box-shadow: none;
          background: transparent;
        }

        .calc-header {
          text-align: center;
          max-width: 680px;
          margin: 0 auto;
        }

        .calc-title {
          font-size: 2.2rem;
          font-weight: 700;
          color: var(--navy);
          margin: 8px 0;
        }

        .calc-subtitle {
          color: var(--text-secondary);
          font-size: 16px;
        }

        .country-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
          gap: 8px;
          margin-top: 8px;
        }

        .country-pill {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 9px 14px;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-pill);
          color: var(--text-secondary);
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .country-pill:hover {
          border-color: var(--navy);
          color: var(--navy);
        }

        .country-pill.active {
          background: var(--navy);
          border-color: var(--navy);
          color: #FFFFFF;
        }

        .flag {
          font-size: 1.1rem;
        }

        .slider-section {
          padding: 22px;
          border-radius: var(--radius);
        }

        .slider-label-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }

        .mb-0 {
          margin-bottom: 0;
        }

        .profit-display {
          font-size: 1.6rem;
          font-weight: 700;
        }

        .slider-hints {
          display: flex;
          justify-content: space-between;
          font-size: 12px;
          color: var(--text-tertiary);
          margin-top: 8px;
        }

        .target-buttons {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 10px;
          margin-top: 8px;
        }

        .target-btn {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 4px;
          padding: 14px 16px;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .target-btn:hover {
          border-color: var(--navy);
        }

        .target-btn.active {
          border-color: var(--orange);
          background: var(--orange-lt);
        }

        .target-top {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .target-flag {
          font-size: 1.2rem;
        }

        .target-name {
          font-weight: 700;
          font-size: 14px;
          color: var(--navy);
        }

        .rate-sub {
          font-size: 12px;
          color: var(--text-secondary);
        }

        .result-container {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .result-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
        }

        @media (max-width: 600px) {
          .result-grid {
            grid-template-columns: 1fr;
          }
        }

        .result-box {
          padding: 20px;
          border-radius: var(--radius);
        }

        .box-tag {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.08em;
          margin-bottom: 6px;
          display: block;
        }

        .box-value {
          font-size: 1.8rem;
          font-weight: 700;
          margin-bottom: 4px;
        }

        .text-error {
          color: var(--error);
        }

        .text-blue {
          color: var(--blue);
        }

        .box-sub {
          font-size: 13px;
          color: var(--text-secondary);
        }

        .net-savings-banner {
          padding: 28px 32px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 24px;
        }

        @media (max-width: 768px) {
          .net-savings-banner {
            flex-direction: column;
            text-align: center;
          }
        }

        .savings-label {
          font-size: 12px;
          font-weight: 700;
          color: var(--orange);
          letter-spacing: 0.08em;
        }

        .savings-number {
          font-size: 2.4rem;
          font-weight: 700;
          margin: 4px 0;
        }

        .per-year {
          font-size: 14px;
          opacity: 0.8;
        }

        .savings-desc {
          font-size: 14px;
          opacity: 0.9;
        }

        .calc-footer {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          font-size: 12px;
          color: var(--text-tertiary);
          text-align: center;
        }
      `}</style>
    </div>
  );
}
