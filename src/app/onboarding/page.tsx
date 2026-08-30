'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

const GOALS = [
  { value: 'tax_optimization', label: 'Minimize my tax bill' },
  { value: 'banking_access', label: 'Get reliable business banking' },
  { value: 'relocation', label: "Relocate — I'll live where I incorporate" },
  { value: 'privacy', label: 'Keep ownership private' },
  { value: 'exploring', label: 'Not sure yet, just exploring' },
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

function OnboardingInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [fullName, setFullName] = useState('');
  const [countryOfResidence, setCountryOfResidence] = useState('');
  const [goal, setGoal] = useState(GOALS[0].value);
  const [budgetBand, setBudgetBand] = useState(BUDGETS[0].value);
  const [timeline, setTimeline] = useState(TIMELINES[0].value);
  const [wantsRelocation, setWantsRelocation] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/onboarding/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName, countryOfResidence, goal, budgetBand, timeline, wantsRelocation }),
      });
      const data = await res.json();

      const redirectTo = searchParams.get('redirect');

      if (data.funnel_track === 'consultation_led') {
        // High-complexity/high-value personas get a human touch first,
        // rather than straight to self-serve checkout — regardless of
        // whatever page they were originally trying to reach.
        router.push('/support');
      } else {
        router.push(redirectTo || '/services');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="mb-6 text-center">
          <h1 className="text-xl font-bold text-gray-900 mb-1">A few quick questions</h1>
          <p className="text-sm text-gray-600">This takes 30 seconds and helps us point you at the right jurisdiction.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Your name</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Jane Doe"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Where do you currently live?</label>
            <input
              type="text"
              value={countryOfResidence}
              onChange={(e) => setCountryOfResidence(e.target.value)}
              placeholder="e.g. United Kingdom"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">What matters most right now?</label>
            <select
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary bg-white"
            >
              {GOALS.map((g) => (
                <option key={g.value} value={g.value}>{g.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Roughly what's your business revenue?</label>
            <select
              value={budgetBand}
              onChange={(e) => setBudgetBand(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary bg-white"
            >
              {BUDGETS.map((b) => (
                <option key={b.value} value={b.value}>{b.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">When do you want to be set up?</label>
            <select
              value={timeline}
              onChange={(e) => setTimeline(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary bg-white"
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
              className="rounded border-gray-300 text-primary focus:ring-primary"
            />
            I'm open to physically relocating
          </label>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-primary hover:bg-primary-700 disabled:opacity-60 text-white text-sm font-semibold py-2.5 px-4 rounded-md transition-colors"
          >
            {submitting ? 'Setting up your account...' : 'Continue'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={null}>
      <OnboardingInner />
    </Suspense>
  );
}
