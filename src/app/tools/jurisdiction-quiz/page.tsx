'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import BannerHeader from '@/components/portal/BannerHeader';
import { ArrowRight, CheckCircle, CircleNotch, Sparkle } from '@phosphor-icons/react';

const GOALS = [
  { value: 'tax_optimization', label: 'Tax Optimization (0% – 9% rate)' },
  { value: 'global_banking', label: 'Tier-1 International Banking Access' },
  { value: 'relocation', label: 'Physical Relocation & Golden Visas' },
  { value: 'privacy', label: 'Maximum Privacy & Asset Protection' },
];

const BUDGETS = [
  { value: 'under_50k', label: 'Under $50,000 / year' },
  { value: '50k_150k', label: '$50,000 – $150,000 / year' },
  { value: '150k_500k', label: '$150,000 – $500,000 / year' },
  { value: 'over_500k', label: 'Over $500,000 / year' },
];

const TIMELINES = [
  { value: 'asap', label: 'Immediately (within 1-2 weeks)' },
  { value: '1_3_months', label: 'In the next 1–3 months' },
  { value: '3_6_months', label: 'In 3–6 months' },
];

interface Recommendation {
  jurisdiction: string;
  name: string;
  matchScore: number;
  whyFit: string;
  corporateTaxRate: string;
  timelineDays: string;
  serviceHref: string;
}

export default function JurisdictionQuiz() {
  const [goal, setGoal] = useState(GOALS[0].value);
  const [budgetBand, setBudgetBand] = useState(BUDGETS[0].value);
  const [timeline, setTimeline] = useState(TIMELINES[0].value);
  const [wantsRelocation, setWantsRelocation] = useState(false);
  const [recommendations, setRecommendations] = useState<Recommendation[] | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/quiz/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goal, budget_band: budgetBand, timeline, wants_relocation: wantsRelocation }),
      });
      const data = await res.json();
      setRecommendations(data.recommendations ?? []);
    } catch {
      // Fallback
      setRecommendations([
        {
          jurisdiction: 'uae',
          name: 'UAE Free Zone (Dubai / RAK)',
          matchScore: 98,
          whyFit: '0% personal income tax, 0% Qualifying Free Zone corporate tax, and fast remote setup.',
          corporateTaxRate: '0% - 9%',
          timelineDays: '3 - 5 days',
          serviceHref: '/services',
        },
        {
          jurisdiction: 'hong-kong',
          name: 'Hong Kong Offshore',
          matchScore: 88,
          whyFit: 'Territorial tax system (0% foreign-sourced profit) and direct Asian banking access.',
          corporateTaxRate: '8.25% - 16.5%',
          timelineDays: '5 - 7 days',
          serviceHref: '/services',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center">
      <BannerHeader title="Jurisdiction Fit Quiz" subtitle="Answer 4 quick questions to reveal your optimal global incorporation structure." />

      <main className="flex-1 w-full max-w-xl mx-auto p-4 mt-4 space-y-4">
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">What matters most right now?</label>
            <select
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
            >
              {GOALS.map((g) => (
                <option key={g.value} value={g.value}>{g.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Estimated annual business revenue / profit?</label>
            <select
              value={budgetBand}
              onChange={(e) => setBudgetBand(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
            >
              {BUDGETS.map((b) => (
                <option key={b.value} value={b.value}>{b.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">How soon do you need your entity active?</label>
            <select
              value={timeline}
              onChange={(e) => setTimeline(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
            >
              {TIMELINES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          <div className="pt-1">
            <label className="flex items-center gap-2 cursor-pointer bg-gray-50 border border-gray-200 p-2.5 rounded-lg">
              <input
                type="checkbox"
                checked={wantsRelocation}
                onChange={(e) => setWantsRelocation(e.target.checked)}
                className="rounded border-gray-300 text-primary focus:ring-primary h-4 w-4"
              />
              <span className="text-xs text-gray-700 font-medium">I want a residence visa (Golden / Investor Visa) with this formation</span>
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary hover:bg-primary-700 disabled:opacity-60 text-white font-semibold py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 text-xs shadow-sm"
          >
            {loading ? <CircleNotch className="w-4 h-4 animate-spin" /> : <Sparkle className="w-4 h-4" />}
            {loading ? 'Analyzing Jurisdictions...' : 'Find My Optimal Jurisdiction'}
          </button>
        </form>

        {recommendations && (
          <div className="space-y-4 animate-in fade-in duration-300">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-gray-900">Your Recommended Jurisdictions</h2>
              <span className="text-xs text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5" /> Matched
              </span>
            </div>

            <div className="space-y-3">
              {recommendations.map((rec, idx) => (
                <div
                  key={rec.jurisdiction}
                  className={`bg-white rounded-xl shadow-sm border p-4 transition-all ${
                    idx === 0 ? 'border-primary ring-1 ring-primary/20' : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      {idx === 0 && (
                        <span className="inline-block bg-primary text-white text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md mb-1">
                          Best Fit #{idx + 1}
                        </span>
                      )}
                      <h3 className="text-sm font-bold text-gray-900">{rec.name}</h3>
                    </div>
                    <div className="text-right">
                      <span className="text-base font-black text-primary">{rec.matchScore}%</span>
                      <p className="text-[10px] text-gray-400 font-medium">Fit Score</p>
                    </div>
                  </div>

                  <p className="text-xs text-gray-600 mb-3">{rec.whyFit}</p>

                  <div className="grid grid-cols-2 gap-2 text-xs bg-gray-50 p-2.5 rounded-lg border border-gray-100 mb-3">
                    <div>
                      <span className="text-gray-400 block text-[10px]">Corporate Tax</span>
                      <span className="font-bold text-gray-900">{rec.corporateTaxRate}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 block text-[10px]">Formation Speed</span>
                      <span className="font-bold text-gray-900">{rec.timelineDays}</span>
                    </div>
                  </div>

                  <Link
                    href={rec.serviceHref || '/services'}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:text-primary-700"
                  >
                    View Packages & Formation Fees <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
