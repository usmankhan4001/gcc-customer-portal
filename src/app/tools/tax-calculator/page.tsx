"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import BannerHeader from '@/components/portal/BannerHeader';
import ContactCaptureGate from '@/components/portal/ContactCaptureGate';
import { bandFromAnnualProfit } from '@/lib/persona';

const HOME_COUNTRIES = [
  { code: 'GB', name: 'United Kingdom' },
  { code: 'DE', name: 'Germany' },
  { code: 'FR', name: 'France' },
  { code: 'US', name: 'United States' },
  { code: 'CA', name: 'Canada' },
  { code: 'AU', name: 'Australia' },
  { code: 'NL', name: 'Netherlands' },
  { code: 'IN', name: 'India' },
];

const TARGET_JURISDICTIONS = [
  { code: 'uae', name: 'UAE' },
  { code: 'hong_kong', name: 'Hong Kong' },
  { code: 'singapore', name: 'Singapore' },
  { code: 'estonia_e_residency', name: 'Estonia (e-Residency)' },
  { code: 'bvi', name: 'BVI' },
  { code: 'cayman', name: 'Cayman Islands' },
];

interface EvaluateResult {
  home_tax_rate: number;
  home_tax_amount: number;
  optimized_tax_rate: number;
  optimized_tax_amount: number;
  net_annual_savings: number;
  recommended_tier: string;
  recommended_package_usd: number;
}

export default function TaxCalculatorPage() {
  const [countryResidence, setCountryResidence] = useState(HOME_COUNTRIES[0].code);
  const [targetJurisdiction, setTargetJurisdiction] = useState(TARGET_JURISDICTIONS[0].code);
  const [annualProfit, setAnnualProfit] = useState<number | ''>('');
  const [businessModel, setBusinessModel] = useState('remote_services');
  const [result, setResult] = useState<EvaluateResult | null>(null);
  const [captured, setCaptured] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCalculate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!annualProfit || annualProfit <= 0) {
      setError('Enter your annual profit.');
      return;
    }
    setError('');
    setLoading(true);
    setCaptured(false);
    try {
      const res = await fetch('/api/calculator/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          country_residence: countryResidence,
          annual_profit: annualProfit,
          business_model: businessModel,
          target_jurisdiction: targetJurisdiction,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Could not calculate — try a different jurisdiction.');
        return;
      }
      setResult(data);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCapture = async (contact: { email: string; whatsapp_number: string }) => {
    if (!result) return;
    await fetch('/api/leads/capture', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        source_tool: 'tax_calculator',
        email: contact.email || undefined,
        whatsapp_number: contact.whatsapp_number || undefined,
        tool_input: { countryResidence, targetJurisdiction, annualProfit, businessModel },
        tool_result: result,
        signals: {
          revenueBand: bandFromAnnualProfit(typeof annualProfit === 'number' ? annualProfit : undefined),
          primaryInterestJurisdiction: mapToSellableJurisdiction(targetJurisdiction),
        },
      }),
    });
    setCaptured(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center">
      <BannerHeader title="Tax Savings Calculator" />

      <main className="flex-1 w-full max-w-lg mx-auto p-4 mt-4 space-y-4">
        <div className="bg-white rounded-md shadow-sm border border-gray-200">
          <form onSubmit={handleCalculate} className="p-4 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <label className="w-40 text-sm font-semibold text-gray-700">Current Country</label>
              <select
                className="flex-1 px-2 py-1.5 text-sm rounded-md border border-gray-300 focus:ring-1 focus:ring-red-500 focus:border-red-500 bg-gray-50"
                value={countryResidence}
                onChange={(e) => setCountryResidence(e.target.value)}
              >
                {HOME_COUNTRIES.map((c) => (
                  <option key={c.code} value={c.code}>{c.name}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <label className="w-40 text-sm font-semibold text-gray-700">Annual Profit ($)</label>
              <input
                type="number"
                className="flex-1 px-2 py-1.5 text-sm rounded-md border border-gray-300 focus:ring-1 focus:ring-red-500 focus:border-red-500 bg-gray-50"
                placeholder="100000"
                value={annualProfit}
                onChange={(e) => setAnnualProfit(e.target.value === '' ? '' : Number(e.target.value))}
              />
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <label className="w-40 text-sm font-semibold text-gray-700">Compare with</label>
              <select
                className="flex-1 px-2 py-1.5 text-sm rounded-md border border-gray-300 focus:ring-1 focus:ring-red-500 focus:border-red-500 bg-gray-50"
                value={targetJurisdiction}
                onChange={(e) => setTargetJurisdiction(e.target.value)}
              >
                {TARGET_JURISDICTIONS.map((j) => (
                  <option key={j.code} value={j.code}>{j.name}</option>
                ))}
              </select>
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white text-sm font-bold py-2 rounded-md transition-colors"
            >
              {loading ? 'Calculating...' : 'Calculate My Savings'}
            </button>
          </form>
        </div>

        {result && !captured && (
          <ContactCaptureGate
            title="See your exact savings"
            subtitle="Enter your contact info to reveal the numbers below."
            onCapture={handleCapture}
          />
        )}

        {result && captured && (
          <div className="bg-white rounded-md shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-4 bg-red-50 border-b border-red-100">
              <h3 className="text-xs font-semibold text-red-800 uppercase tracking-wider mb-1">Your Potential Savings</h3>
              <div className="flex items-baseline space-x-1">
                <span className="text-2xl font-bold text-red-900">
                  ${result.net_annual_savings.toLocaleString()}
                </span>
                <span className="text-red-700 text-sm font-medium">/ year</span>
              </div>
              <div className="mt-3 pt-3 border-t border-red-200/60 space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-600">Current Tax ({(result.home_tax_rate * 100).toFixed(1)}%):</span>
                  <span className="font-semibold text-gray-800">${result.home_tax_amount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-600">Optimized Tax ({(result.optimized_tax_rate * 100).toFixed(1)}%):</span>
                  <span className="font-semibold text-gray-800">${result.optimized_tax_amount.toLocaleString()}</span>
                </div>
              </div>
            </div>
            <div className="p-4 border-t border-gray-200">
              <Link
                href="/services"
                className="block w-full bg-red-600 hover:bg-red-700 text-white text-center text-sm font-bold py-2 rounded-md shadow hover:shadow-md transition-all"
              >
                Start 0% Tax Setup Now
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function mapToSellableJurisdiction(code: string): 'uae' | 'hong-kong' | 'singapore' | 'bahrain' | 'ireland' | 'bvi' | undefined {
  const map: Record<string, 'uae' | 'hong-kong' | 'singapore' | 'bahrain' | 'ireland' | 'bvi'> = {
    uae: 'uae',
    hong_kong: 'hong-kong',
    singapore: 'singapore',
    bvi: 'bvi',
    cayman: 'bvi',
  };
  return map[code];
}
