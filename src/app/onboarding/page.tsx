'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Percent,
  Bank,
  AirplaneTilt,
  EyeSlash,
  Compass,
  Lightning,
  CalendarBlank,
  Hourglass,
  User,
  Globe,
  CircleNotch,
} from '@phosphor-icons/react';
import BannerHeader from '@/components/portal/BannerHeader';

const GOALS = [
  { value: 'tax_optimization', label: 'Minimize my tax bill', icon: Percent },
  { value: 'banking_access', label: 'Get reliable business banking', icon: Bank },
  { value: 'relocation', label: "Relocate — I'll live where I incorporate", icon: AirplaneTilt },
  { value: 'privacy', label: 'Keep ownership private', icon: EyeSlash },
  { value: 'exploring', label: 'Not sure yet, just exploring', icon: Compass },
];

const BUDGETS = [
  { value: 'under_50k', label: 'Under $50k', sublabel: '/year revenue' },
  { value: '50k_150k', label: '$50k – $150k', sublabel: '/year revenue' },
  { value: '150k_500k', label: '$150k – $500k', sublabel: '/year revenue' },
  { value: 'over_500k', label: 'Over $500k', sublabel: '/year revenue' },
];

const TIMELINES = [
  { value: 'asap', label: 'As soon as possible', icon: Lightning },
  { value: 'few_months', label: 'In the next few months', icon: CalendarBlank },
  { value: 'no_rush', label: 'No rush, just researching', icon: Hourglass },
];

function TileGroup<T extends string>({
  options,
  value,
  onChange,
  columns = 1,
}: {
  options: { value: T; label: string; sublabel?: string; icon?: React.ElementType }[];
  value: T;
  onChange: (v: T) => void;
  columns?: 1 | 2;
}) {
  return (
    <div className={`grid gap-2 ${columns === 2 ? 'grid-cols-2' : 'grid-cols-1'}`}>
      {options.map((opt) => {
        const active = opt.value === value;
        const Icon = opt.icon;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`flex items-center gap-3 text-left px-3 py-2.5 rounded-[var(--radius-tile)] border transition-colors ${
              active
                ? 'border-primary bg-primary-50 text-primary-900'
                : 'border-gray-200 bg-white text-gray-700 hover:border-primary-200 hover:bg-primary-50/40'
            }`}
          >
            {Icon && (
              <span
                className={`shrink-0 w-8 h-8 rounded-[var(--radius-tile)] flex items-center justify-center ${
                  active ? 'bg-primary text-white' : 'bg-gray-100 text-gray-500'
                }`}
              >
                <Icon size={16} weight="bold" />
              </span>
            )}
            <span className="min-w-0">
              <span className={`block text-sm font-semibold ${active ? 'text-primary-900' : 'text-gray-900'}`}>
                {opt.label}
              </span>
              {opt.sublabel && <span className="block text-xs text-gray-400">{opt.sublabel}</span>}
            </span>
          </button>
        );
      })}
    </div>
  );
}

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
    <div className="min-h-screen bg-gray-50 flex flex-col items-center">
      <BannerHeader title="A Few Quick Questions" subtitle="30 seconds — helps us point you at the right jurisdiction." />

      <main className="flex-1 w-full max-w-lg mx-auto p-4 mt-4 pb-10">
        <form onSubmit={handleSubmit} className="bg-white rounded-md shadow-sm border border-gray-200 divide-y divide-gray-100">
          <div className="p-4 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-primary-50 text-primary flex items-center justify-center shrink-0">
                <User size={14} weight="bold" />
              </div>
              <label className="text-sm font-semibold text-gray-900">Your name</label>
            </div>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Jane Doe"
              className="w-full px-3 py-2 text-sm rounded-md border border-gray-300 bg-gray-50 focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
              required
            />
          </div>

          <div className="p-4 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-primary-50 text-primary flex items-center justify-center shrink-0">
                <Globe size={14} weight="bold" />
              </div>
              <label className="text-sm font-semibold text-gray-900">Where do you currently live?</label>
            </div>
            <input
              type="text"
              value={countryOfResidence}
              onChange={(e) => setCountryOfResidence(e.target.value)}
              placeholder="e.g. United Kingdom"
              className="w-full px-3 py-2 text-sm rounded-md border border-gray-300 bg-gray-50 focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
              required
            />
          </div>

          <div className="p-4 space-y-3">
            <label className="text-sm font-semibold text-gray-900">What matters most right now?</label>
            <TileGroup options={GOALS} value={goal} onChange={setGoal} />
          </div>

          <div className="p-4 space-y-3">
            <label className="text-sm font-semibold text-gray-900">Roughly what's your business revenue?</label>
            <TileGroup options={BUDGETS} value={budgetBand} onChange={setBudgetBand} columns={2} />
          </div>

          <div className="p-4 space-y-3">
            <label className="text-sm font-semibold text-gray-900">When do you want to be set up?</label>
            <TileGroup options={TIMELINES} value={timeline} onChange={setTimeline} />
          </div>

          <div className="p-4">
            <button
              type="button"
              onClick={() => setWantsRelocation(!wantsRelocation)}
              className={`w-full flex items-center gap-3 text-left px-3 py-2.5 rounded-[var(--radius-tile)] border transition-colors ${
                wantsRelocation
                  ? 'border-primary bg-primary-50'
                  : 'border-gray-200 bg-white hover:border-primary-200'
              }`}
            >
              <span
                className={`shrink-0 w-9 h-5 rounded-full transition-colors relative ${
                  wantsRelocation ? 'bg-primary' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                    wantsRelocation ? 'translate-x-4' : 'translate-x-0.5'
                  }`}
                />
              </span>
              <span className={`text-sm font-medium ${wantsRelocation ? 'text-primary-900' : 'text-gray-700'}`}>
                I&apos;m open to physically relocating
              </span>
            </button>
          </div>

          <div className="p-4">
            <button
              type="submit"
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary-700 disabled:opacity-60 text-white text-sm font-bold py-2.5 rounded-md transition-colors"
            >
              {submitting && <CircleNotch size={16} className="animate-spin" />}
              {submitting ? 'Setting up your account...' : 'Continue'}
            </button>
          </div>
        </form>
      </main>
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
