'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { Calculator, ArrowRight, ShieldCheck, TrendingUp, Building, Globe, Zap } from 'lucide-react';
import CountryFlag from '@/components/ui/CountryFlag';

interface CountryPreset {
  code: string;
  name: string;
  countryCode: string;
  effectiveRate: number; // e.g. 0.495 for 49.5%
  currency: string;
  rateLabel: string;
}

const COUNTRY_PRESETS: CountryPreset[] = [
  { code: 'NL', name: 'Netherlands', countryCode: 'NL', effectiveRate: 0.495, currency: '€', rateLabel: '49.5% (Box 1)' },
  { code: 'DE', name: 'Germany', countryCode: 'DE', effectiveRate: 0.45, currency: '€', rateLabel: '45.0% (Income + Soli)' },
  { code: 'UK', name: 'United Kingdom', countryCode: 'GB', effectiveRate: 0.45, currency: '£', rateLabel: '45.0% (Top Bracket)' },
  { code: 'FR', name: 'France', countryCode: 'FR', effectiveRate: 0.45, currency: '€', rateLabel: '45.0% (Tranche Supérieure)' },
  { code: 'US', name: 'United States', countryCode: 'US', effectiveRate: 0.37, currency: '$', rateLabel: '37.0% (Federal Top)' },
  { code: 'CA', name: 'Canada', countryCode: 'CA', effectiveRate: 0.48, currency: 'C$', rateLabel: '48.0% (Federal + Prov)' },
  { code: 'ES', name: 'Spain', countryCode: 'ES', effectiveRate: 0.47, currency: '€', rateLabel: '47.0% (IRPF)' },
  { code: 'AU', name: 'Australia', countryCode: 'AU', effectiveRate: 0.45, currency: 'A$', rateLabel: '45.0% (Top Bracket)' },
];

export default function TaxArbitrageCalculator({ compact = false }: { compact?: boolean }) {
  const [selectedCountryCode, setSelectedCountryCode] = useState('NL');
  const [profit, setProfit] = useState(250000);
  const [selectedOptimization, setSelectedOptimization] = useState<'uae' | 'hk' | 'bahrain'>('uae');

  const selectedCountry = useMemo(() => {
    return COUNTRY_PRESETS.find((c) => c.code === selectedCountryCode) || COUNTRY_PRESETS[0];
  }, [selectedCountryCode]);

  const optimizationRates = {
    uae: { name: 'UAE Freezone', countryCode: 'uae', rate: 0.09, rateLabel: '9% (0% on Foreign QFZP)' },
    hk: { name: 'Hong Kong (Offshore)', countryCode: 'hk', rate: 0.0, rateLabel: '0% (Foreign-Sourced)' },
    bahrain: { name: 'Bahrain', countryCode: 'bahrain', rate: 0.0, rateLabel: '0% Corporate Tax' },
  };

  const currentOpt = optimizationRates[selectedOptimization];

  const homeTax = profit * selectedCountry.effectiveRate;
  const optimizedTax = profit * currentOpt.rate;
  const netSavings = Math.max(0, homeTax - optimizedTax);
  const savingsPercent = Math.round((netSavings / homeTax) * 100) || 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {!compact && (
        <div>
          <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            REAL-TIME TAX ARBITRAGE ENGINE
          </div>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.4rem', fontWeight: 800, color: 'var(--navy)', marginTop: 2 }}>
            Calculate Your Net <span style={{ color: 'var(--orange)' }}>Tax Savings</span>
          </h2>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>
            See exactly how much revenue you retain by legally restructuring your business in a 0% tax jurisdiction.
          </p>
        </div>
      )}

      {/* Country Selector Grid */}
      <div>
        <label className="input-label">Current Country of Tax Residence:</label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
          {COUNTRY_PRESETS.map((country) => (
            <button
              key={country.code}
              type="button"
              onClick={() => setSelectedCountryCode(country.code)}
              className={`btn ${selectedCountryCode === country.code ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontSize: 11, padding: '6px 4px', justifyContent: 'center' }}
            >
              <span>{country.code}</span>
              <span style={{ fontSize: 10, opacity: 0.8 }}>({country.rateLabel.split(' ')[0]})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Slider */}
      <div className="card card-sand" style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <label className="input-label" style={{ marginBottom: 0 }}>Estimated Annual Net Profit:</label>
          <span style={{ fontSize: 16, fontWeight: 800, color: 'var(--navy)', fontFamily: 'monospace' }}>
            {selectedCountry.currency}{profit.toLocaleString()}
          </span>
        </div>

        <input
          type="range"
          min={50000}
          max={1500000}
          step={10000}
          value={profit}
          onChange={(e) => setProfit(Number(e.target.value))}
          style={{ width: '100%', accentColor: 'var(--orange)', cursor: 'pointer' }}
        />

        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-tertiary)' }}>
          <span>{selectedCountry.currency}50k</span>
          <span>{selectedCountry.currency}500k</span>
          <span>{selectedCountry.currency}1M</span>
          <span>{selectedCountry.currency}1.5M+</span>
        </div>
      </div>

      {/* Target Destination Switcher */}
      <div>
        <label className="input-label">Select Target Jurisdiction:</label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
          {(Object.keys(optimizationRates) as Array<'uae' | 'hk' | 'bahrain'>).map((key) => {
            const opt = optimizationRates[key];
            const isSel = selectedOptimization === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setSelectedOptimization(key)}
                className={`card card-hover ${isSel ? 'card-sand' : ''}`}
                style={{
                  cursor: 'pointer',
                  border: isSel ? '1.5px solid var(--orange)' : undefined,
                  padding: 10,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <CountryFlag country={opt.countryCode} size="sm" />
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--navy)' }}>{opt.name.split(' ')[0]}</div>
                  <div style={{ fontSize: 10, color: 'var(--orange)', fontWeight: 700 }}>{opt.rate * 100}% Rate</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Comparative Results Card */}
      <div
        className="card"
        style={{
          background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
          padding: 18,
          color: 'white',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              ANNUAL TAX RETAINED
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--orange)', lineHeight: 1.1 }}>
              {selectedCountry.currency}{Math.round(netSavings).toLocaleString()}
            </div>
          </div>
          <span className="badge badge-success" style={{ fontSize: 11, fontWeight: 800 }}>
            {savingsPercent}% RETAINED
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 10, fontSize: 12 }}>
          <div>
            <div style={{ color: 'rgba(255,255,255,0.6)' }}>Current Home Tax:</div>
            <div style={{ fontWeight: 700, color: '#FF7B7B', marginTop: 2 }}>
              {selectedCountry.currency}{Math.round(homeTax).toLocaleString()} ({selectedCountry.rateLabel})
            </div>
          </div>
          <div>
            <div style={{ color: 'rgba(255,255,255,0.6)' }}>Restructured Tax:</div>
            <div style={{ fontWeight: 700, color: '#4ADE80', marginTop: 2 }}>
              {selectedCountry.currency}{Math.round(optimizedTax).toLocaleString()} ({currentOpt.rateLabel.split(' ')[0]})
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
