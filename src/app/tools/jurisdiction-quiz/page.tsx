'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import BannerHeader from '@/components/portal/BannerHeader';
import ContactCaptureGate from '@/components/portal/ContactCaptureGate';
import { bandFromAnnualProfit } from '@/lib/persona';

interface Recommendation {
  jurisdiction: string;
  name: string;
  score: number;
  rationale: string;
}

const GOALS = [
  { value: 'tax_optimization', label: 'Minimize my tax bill' },
  { value: 'banking_access', label: 'Get reliable business banking' },
  { value: 'relocation', label: "Relocate — I'll live where I incorporate" },
  { value: 'privacy', label: 'Keep ownership private' },
  { value: 'exploring', label: "Not sure yet, just exploring" },
];

const BUDGETS = [
  { value: 'under_50k', label: 'Under $50k/year revenue' },
  { value: '50k_150k', label: '$50k - $150k/year' },
  { value: '150k_500k', label: '$150k - $500k/year' },
  { value: 'over_500k', label: 'Over $500k/year' },
];

const TIMELINES = [
  { value: 'asap', label: 'As soon as possible' },
  { value: 'few_months', label: 'In the next few months' },
  { value: 'no_rush', label: 'No rush, just researching' },
];

export default function JurisdictionQuizPage() {
  const [goal, setGoal] = useState(GOALS[0].value);
  const [budgetBand, setBudgetBand] = useState(BUDGETS[0].value);
  const [timeline, setTimeline] = useState(TIMELINES[0].value);
  const [wantsRelocation, setWantsRelocation] = useState(false);
  const [recommendations, setRecommendations] = useState<Recommendation[] | null>(null);
  const [captured, setCaptured] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setCaptured(false);
    try {
      const res = await fetch('/api/quiz/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goal, budget_band: budgetBand, timeline, wants_relocation: wantsRelocation }),
      });
      const data = await res.json();
      setRecommendations(data.recommendations ?? []);
    } finally {
      setLoading(false);
    }
  };

  const handleCapture = async (contact: { email: string; whatsapp_number: string }) => {
    if (!recommendations) return;
    await fetch('/api/leads/capture', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        source_tool: 'jurisdiction_quiz',
        email: contact.email || undefined,
        whatsapp_number: contact.whatsapp_number || undefined,
        tool_input: { goal, budgetBand, timeline, wantsRelocation },
        tool_result: recommendations,
        signals: {
          revenueBand: bandFromAnnualProfit(
            { under_50k: 25000, '50k_150k': 100000, '150k_500k': 300000, over_500k: 750000 }[budgetBand]
          ),
          primaryInterestJurisdiction: recommendations[0]?.jurisdiction as any,
          wantsRelocation,
        },
      }),
    });
    setCaptured(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center">
      <BannerHeader title="Jurisdiction Fit Quiz" subtitle="4 quick questions, then we'll tell you where to incorporate." />

      <main className="flex-1 w-full max-w-lg mx-auto p-4 mt-4 space-y-4">
        <form onSubmit={handleSubmit} className="bg-white rounded-md shadow-sm border border-gray-200 p-4 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">What matters most right now?</label>
            <select
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              className="w-full px-2 py-1.5 text-sm rounded-md border border-gray-300 focus:ring-1 focus:ring-red-500 focus:border-red-500 bg-gray-50"
            >
              {GOALS.map((g) => (
                <option key={g.value} value={g.value}>{g.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Roughly what's your business revenue?</label>
            <select
              value={budgetBand}
              onChange={(e) => setBudgetBand(e.target.value)}
              className="w-full px-2 py-1.5 text-sm rounded-md border border-gray-300 focus:ring-1 focus:ring-red-500 focus:border-red-500 bg-gray-50"
            >
              {BUDGETS.map((b) => (
                <option key={b.value} value={b.value}>{b.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">When do you want to be set up?</label>
            <select
              value={timeline}
              onChange={(e) => setTimeline(e.target.value)}
              className="w-full px-2 py-1.5 text-sm rounded-md border border-gray-300 focus:ring-1 focus:ring-red-500 focus:border-red-500 bg-gray-50"
            >
              {TIMELINES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={wantsRelocation}
              onChange={(e) => setWantsRelocation(e.target.checked)}
              className="rounded border-gray-300 text-red-600 focus:ring-red-500"
            />
            I'm open to physically relocating
          </label>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white text-sm font-bold py-2 rounded-md transition-colors"
          >
            {loading ? 'Matching...' : 'Find My Jurisdiction'}
          </button>
        </form>

        {recommendations && !captured && (
          <ContactCaptureGate
            title="See your top matches"
            subtitle="Enter your contact info to reveal your recommendations."
            onCapture={handleCapture}
          />
        )}

        {recommendations && captured && (
          <div className="space-y-3">
            <h2 className="text-sm font-bold text-gray-900 px-1">Your Top Matches</h2>
            {recommendations.map((rec, idx) => (
              <div key={rec.jurisdiction} className="bg-white rounded-md shadow-sm border border-gray-200 p-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-gray-900">
                    {idx === 0 && <span className="text-red-600">#1 </span>}
                    {rec.name}
                  </span>
                  <Link
                    href={`/services/${rec.jurisdiction}`}
                    className="text-xs font-semibold text-red-600 hover:text-red-700"
                  >
                    View details →
                  </Link>
                </div>
                <p className="text-xs text-gray-500">{rec.rationale}</p>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
