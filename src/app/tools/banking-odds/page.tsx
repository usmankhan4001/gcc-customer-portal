"use client";

import React, { useState } from "react";
import Link from "next/link";
import BannerHeader from '@/components/portal/BannerHeader';
import ContactCaptureGate from '@/components/portal/ContactCaptureGate';
import { industryRiskTier, type IndustryRiskTier } from '@/lib/persona';

interface BankResult {
  bank: string;
  odds: number;
}

// Rule-based estimate (Decision 15): industry risk tier x turnover band.
// Not real historical approval-rate data — refine once that exists.
function computeOdds(risk: IndustryRiskTier, turnover: number): BankResult[] {
  const base: Record<IndustryRiskTier, { wio: number; enbd: number }> = {
    low: { wio: 95, enbd: 85 },
    medium: { wio: 75, enbd: 60 },
    high: { wio: 40, enbd: 20 },
  };
  const turnoverBonus = turnover >= 500000 ? 5 : turnover < 50000 ? -10 : 0;
  const clamp = (n: number) => Math.max(5, Math.min(99, n));

  return [
    { bank: 'Wio Bank', odds: clamp(base[risk].wio + turnoverBonus) },
    { bank: 'Emirates NBD', odds: clamp(base[risk].enbd + turnoverBonus) },
  ];
}

export default function BankingOddsMatcher() {
  const [nationality, setNationality] = useState("");
  const [industry, setIndustry] = useState("");
  const [turnover, setTurnover] = useState<number | ''>('');
  const [results, setResults] = useState<BankResult[] | null>(null);
  const [captured, setCaptured] = useState(false);

  const handleCalculate = () => {
    if (!nationality || !industry || !turnover) return;
    const risk = industryRiskTier(industry) ?? 'medium';
    setResults(computeOdds(risk, Number(turnover)));
    setCaptured(false);
  };

  const handleCapture = async (contact: { email: string; whatsapp_number: string }) => {
    if (!results) return;
    await fetch('/api/leads/capture', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        source_tool: 'banking_odds',
        email: contact.email || undefined,
        whatsapp_number: contact.whatsapp_number || undefined,
        tool_input: { nationality, industry, turnover },
        tool_result: results,
        signals: { industryRiskTier: industryRiskTier(industry), primaryInterestJurisdiction: 'uae' },
      }),
    });
    setCaptured(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <BannerHeader title="Banking Odds" />

      <main className="flex-1 max-w-2xl w-full mx-auto p-4 space-y-4 mt-4">
        <div className="bg-white p-4 rounded-md shadow-sm border border-gray-200 space-y-4">
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <label htmlFor="nationality" className="w-40 text-sm font-medium text-gray-700">
                Nationality
              </label>
              <select
                id="nationality"
                value={nationality}
                onChange={(e) => setNationality(e.target.value)}
                className="flex-1 border-gray-300 rounded-md shadow-sm focus:border-red-500 focus:ring-1 focus:ring-red-500 p-1.5 text-sm border outline-none transition-colors bg-white text-gray-900"
              >
                <option value="">Select Nationality</option>
                <option value="US">United States</option>
                <option value="UK">United Kingdom</option>
                <option value="IN">India</option>
                <option value="AE">UAE</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <label htmlFor="industry" className="w-40 text-sm font-medium text-gray-700">
                Industry
              </label>
              <select
                id="industry"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                className="flex-1 border-gray-300 rounded-md shadow-sm focus:border-red-500 focus:ring-1 focus:ring-red-500 p-1.5 text-sm border outline-none transition-colors bg-white text-gray-900"
              >
                <option value="">Select Industry</option>
                <option value="Consulting">Consulting</option>
                <option value="E-commerce">E-commerce</option>
                <option value="Technology">Technology</option>
                <option value="Crypto">Crypto</option>
                <option value="Forex">Forex</option>
                <option value="Real Estate">Real Estate</option>
              </select>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <label htmlFor="turnover" className="w-40 text-sm font-medium text-gray-700">
                Annual Turnover ($)
              </label>
              <input
                id="turnover"
                type="number"
                value={turnover}
                onChange={(e) => setTurnover(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="150000"
                className="flex-1 border-gray-300 rounded-md shadow-sm focus:border-red-500 focus:ring-1 focus:ring-red-500 p-1.5 text-sm border outline-none transition-colors bg-white text-gray-900"
              />
            </div>
          </div>

          <button
            onClick={handleCalculate}
            disabled={!nationality || !industry || !turnover}
            className="w-full bg-red-600 hover:bg-red-700 text-white text-sm font-medium py-2 px-4 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Calculate Odds
          </button>
        </div>

        {results && !captured && (
          <ContactCaptureGate
            title="See your bank-by-bank odds"
            subtitle="Enter your contact info to reveal the estimate below."
            onCapture={handleCapture}
          />
        )}

        {results && captured && (
          <div className="space-y-4 animate-in fade-in duration-500">
            <h2 className="text-lg font-semibold text-gray-900">Your Match Results</h2>

            <div className="space-y-3">
              {results.map((result, idx) => (
                <div key={idx} className="bg-white p-3 rounded-md shadow-sm border border-gray-200 flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-sm text-gray-900">{result.bank}</h3>
                    <p className="text-xs text-gray-500">Estimated Approval</p>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-gray-900">
                      {result.odds}<span className="text-sm text-gray-400">%</span>
                    </div>
                    <p className={`text-xs font-medium ${result.odds > 80 ? 'text-green-600' : result.odds > 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                      {result.odds > 80 ? 'High Likelihood' : result.odds > 50 ? 'Medium Likelihood' : 'Low Likelihood'}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-red-50 border border-red-100 rounded-md p-4 text-center space-y-3 mt-4 shadow-sm">
              <h3 className="text-sm font-bold text-red-900">Need guaranteed approval?</h3>
              <p className="text-red-800 text-xs max-w-md mx-auto">
                Skip the guesswork. Our experts have relationships with all major UAE banks.
              </p>
              <Link
                href="/services"
                className="inline-block w-full bg-red-600 hover:bg-red-700 text-white text-sm font-medium py-2 px-4 rounded-md transition-colors shadow-sm"
              >
                Get Guaranteed Banking
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
