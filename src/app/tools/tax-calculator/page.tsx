'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import BannerHeader from '@/components/portal/BannerHeader';
import { ArrowRight, CircleNotch, TrendDown } from '@phosphor-icons/react';

const CURRENT_COUNTRIES = [
  { code: 'US', name: 'United States (avg 27%)', baseRate: 0.27 },
  { code: 'UK', name: 'United Kingdom (25%)', baseRate: 0.25 },
  { code: 'DE', name: 'Germany (30%)', baseRate: 0.30 },
  { code: 'FR', name: 'France (25%)', baseRate: 0.25 },
  { code: 'CA', name: 'Canada (26%)', baseRate: 0.26 },
  { code: 'AU', name: 'Australia (30%)', baseRate: 0.30 },
  { code: 'IN', name: 'India (25%)', baseRate: 0.25 },
];

const TARGET_JURISDICTIONS = [
  { code: 'uae', name: 'UAE Free Zone (0% - 9%)', targetRate: 0.045 },
  { code: 'hong-kong', name: 'Hong Kong (8.25% / 16.5%)', targetRate: 0.0825 },
  { code: 'singapore', name: 'Singapore (17% with startup exemptions)', targetRate: 0.085 },
  { code: 'ireland', name: 'Ireland (12.5% Trading)', targetRate: 0.125 },
  { code: 'bvi', name: 'BVI / Offshore Holding (0%)', targetRate: 0.0 },
];

export default function TaxCalculator() {
  const [countryResidence, setCountryResidence] = useState('US');
  const [targetJurisdiction, setTargetJurisdiction] = useState('uae');
  const [annualProfit, setAnnualProfit] = useState<number | ''>(250000);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleCalculate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!annualProfit || annualProfit <= 0) return;
    setLoading(true);

    try {
      const res = await fetch('/api/calculator/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          country_residence: countryResidence,
          target_jurisdiction: targetJurisdiction,
          annual_profit: Number(annualProfit),
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setResult(data);
      } else {
        // Local calculation fallback
        const homeRate = CURRENT_COUNTRIES.find((c) => c.code === countryResidence)?.baseRate || 0.25;
        const targetRate = TARGET_JURISDICTIONS.find((j) => j.code === targetJurisdiction)?.targetRate || 0.05;
        const profit = Number(annualProfit);
        const homeTax = profit * homeRate;
        const targetTax = profit * targetRate;
        setResult({
          current_tax: homeTax,
          target_tax: targetTax,
          savings: homeTax - targetTax,
          effective_tax_rate: (targetRate * 100).toFixed(1) + '%',
        });
      }
    } catch {
      const homeRate = CURRENT_COUNTRIES.find((c) => c.code === countryResidence)?.baseRate || 0.25;
      const targetRate = TARGET_JURISDICTIONS.find((j) => j.code === targetJurisdiction)?.targetRate || 0.05;
      const profit = Number(annualProfit);
      const homeTax = profit * homeRate;
      const targetTax = profit * targetRate;
      setResult({
        current_tax: homeTax,
        target_tax: targetTax,
        savings: homeTax - targetTax,
        effective_tax_rate: (targetRate * 100).toFixed(1) + '%',
      });
    } finally {
      setLoading(false);
    }
  };

  const fmtUSD = (n: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center">
      <BannerHeader title="Tax Savings Calculator" />

      <main className="flex-1 w-full max-w-xl mx-auto p-4 mt-4 space-y-4">
        <form onSubmit={handleCalculate} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              Current Country of Operations / Tax Residence
            </label>
            <select
              value={countryResidence}
              onChange={(e) => setCountryResidence(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
            >
              {CURRENT_COUNTRIES.map((c) => (
                <option key={c.code} value={c.code}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              Target Relocation / Formation Jurisdiction
            </label>
            <select
              value={targetJurisdiction}
              onChange={(e) => setTargetJurisdiction(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
            >
              {TARGET_JURISDICTIONS.map((j) => (
                <option key={j.code} value={j.code}>{j.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              Estimated Annual Net Business Profit ($ USD)
            </label>
            <input
              type="number"
              value={annualProfit}
              onChange={(e) => setAnnualProfit(e.target.value === '' ? '' : Number(e.target.value))}
              placeholder="250000"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary font-mono"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading || !annualProfit}
            className="w-full bg-primary hover:bg-primary-700 disabled:opacity-60 text-white font-semibold py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 text-xs shadow-sm"
          >
            {loading ? <CircleNotch className="w-4 h-4 animate-spin" /> : <TrendDown className="w-4 h-4" />}
            {loading ? 'Calculating Taxes...' : 'Calculate Potential Savings'}
          </button>
        </form>

        {result && (
          <div className="space-y-4 animate-in fade-in duration-300">
            <div className="bg-emerald-800 text-white rounded-xl p-5 shadow-sm text-center">
              <span className="text-emerald-200 text-xs font-semibold uppercase tracking-wider block mb-1">
                Estimated Annual Tax Savings
              </span>
              <div className="text-3xl font-black">{fmtUSD(result.savings ?? 0)}</div>
              <p className="text-emerald-100 text-xs mt-1">Per year retained in your business treasury</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                <span className="text-gray-400 block text-[11px] font-semibold">Current Home Country Tax</span>
                <span className="text-lg font-bold text-gray-800">{fmtUSD(result.current_tax ?? 0)}</span>
              </div>
              <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                <span className="text-gray-400 block text-[11px] font-semibold">New Jurisdiction Tax</span>
                <span className="text-lg font-bold text-emerald-600">{fmtUSD(result.target_tax ?? 0)}</span>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-gray-900">Form a tax-optimized entity</h4>
                <p className="text-[11px] text-gray-500">Fast-track incorporation in 3–5 working days</p>
              </div>
              <Link
                href="/services"
                className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:text-primary-700 whitespace-nowrap"
              >
                View Packages <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
