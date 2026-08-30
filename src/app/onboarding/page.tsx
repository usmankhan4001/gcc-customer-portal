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
  ArrowLeft,
  ArrowRight,
  CheckCircle,
} from '@phosphor-icons/react';
import BannerHeader from '@/components/portal/BannerHeader';

const GOALS = [
  { value: 'tax_optimization', label: 'Minimize my tax bill', sublabel: '0% or low corporate tax structures', icon: Percent },
  { value: 'banking_access', label: 'Get reliable business banking', sublabel: 'Fast multi-currency account opening', icon: Bank },
  { value: 'relocation', label: "Relocate — Live where I incorporate", sublabel: 'Investor/residence visa guidance', icon: AirplaneTilt },
  { value: 'privacy', label: 'Keep ownership private', sublabel: 'Nominee directorship and privacy', icon: EyeSlash },
  { value: 'exploring', label: 'Not sure yet, just exploring', sublabel: 'Compare all GCC & global options', icon: Compass },
];

const BUDGETS = [
  { value: 'under_50k', label: 'Under $50k', sublabel: '/year revenue' },
  { value: '50k_150k', label: '$50k – $150k', sublabel: '/year revenue' },
  { value: '150k_500k', label: '$150k – $500k', sublabel: '/year revenue' },
  { value: 'over_500k', label: 'Over $500k', sublabel: '/year revenue' },
];

const TIMELINES = [
  { value: 'asap', label: 'As soon as possible', sublabel: 'Ready to incorporate immediately', icon: Lightning },
  { value: 'few_months', label: 'In the next few months', sublabel: 'Planning ahead for launch', icon: CalendarBlank },
  { value: 'no_rush', label: 'No rush, just researching', sublabel: 'Evaluating structural options', icon: Hourglass },
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
    <div className={`grid gap-2.5 ${columns === 2 ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'}`}>
      {options.map((opt) => {
        const active = opt.value === value;
        const Icon = opt.icon;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`flex items-center gap-3 text-left p-3 rounded-lg border transition-all ${
              active
                ? 'border-primary bg-primary-50/80 text-primary-900 shadow-sm ring-1 ring-primary'
                : 'border-gray-200 bg-white text-gray-700 hover:border-primary-300 hover:bg-primary-50/20'
            }`}
          >
            {Icon && (
              <span
                className={`shrink-0 w-9 h-9 rounded-md flex items-center justify-center transition-colors ${
                  active ? 'bg-primary text-white' : 'bg-gray-100 text-gray-500'
                }`}
              >
                <Icon size={18} weight="bold" />
              </span>
            )}
            <span className="min-w-0 flex-1">
              <span className={`block text-sm font-semibold ${active ? 'text-primary-900' : 'text-gray-900'}`}>
                {opt.label}
              </span>
              {opt.sublabel && <span className="block text-xs text-gray-500 mt-0.5">{opt.sublabel}</span>}
            </span>
            {active && <CheckCircle size={18} weight="fill" className="text-primary shrink-0" />}
          </button>
        );
      })}
    </div>
  );
}

function OnboardingInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [fullName, setFullName] = useState('');
  const [countryOfResidence, setCountryOfResidence] = useState('');
  const [goal, setGoal] = useState(GOALS[0].value);
  const [budgetBand, setBudgetBand] = useState(BUDGETS[0].value);
  const [timeline, setTimeline] = useState(TIMELINES[0].value);
  const [wantsRelocation, setWantsRelocation] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [stepError, setStepError] = useState('');

  const handleNextStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setStepError('Please enter your full name');
      return;
    }
    if (!countryOfResidence.trim()) {
      setStepError('Please enter your country of residence');
      return;
    }
    setStepError('');
    setCurrentStep(2);
  };

  const handleNextStep2 = (e: React.FormEvent) => {
    e.preventDefault();
    setStepError('');
    setCurrentStep(3);
  };

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
        router.push('/support');
      } else {
        router.push(redirectTo || '/services');
      }
    } catch {
      setStepError('Failed to save profile. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main id="main-content" className="min-h-[100dvh] bg-gray-50 flex flex-col items-center select-none pb-8">
      <BannerHeader title="Welcome to GCC Startup" subtitle="Let's tailor your setup in just 3 quick steps." />

      <div className="w-full max-w-lg mx-auto px-4 -mt-6 sm:-mt-8 z-10">
        {/* Step Progress Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-4">
          <div className="flex items-center justify-between text-xs font-semibold text-gray-500 mb-2">
            <span className="text-primary font-bold">Step {currentStep} of 3</span>
            <span>
              {currentStep === 1 && 'Personal Profile'}
              {currentStep === 2 && 'Primary Goal'}
              {currentStep === 3 && 'Scale & Timeline'}
            </span>
          </div>

          <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden flex">
            <div
              className="bg-primary h-2 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${(currentStep / 3) * 100}%` }}
            />
          </div>

          <div className="grid grid-cols-3 gap-2 mt-3 text-center text-xs">
            <span className={`font-medium ${currentStep >= 1 ? 'text-primary font-semibold' : 'text-gray-400'}`}>
              1. Profile
            </span>
            <span className={`font-medium ${currentStep >= 2 ? 'text-primary font-semibold' : 'text-gray-400'}`}>
              2. Goals
            </span>
            <span className={`font-medium ${currentStep >= 3 ? 'text-primary font-semibold' : 'text-gray-400'}`}>
              3. Timeline
            </span>
          </div>
        </div>

        {stepError && (
          <div className="mb-4 p-3 bg-destructive/10 text-destructive border border-destructive/20 rounded-lg text-sm font-medium">
            {stepError}
          </div>
        )}

        {/* Wizard Step 1: Personal Profile */}
        {currentStep === 1 && (
          <form onSubmit={handleNextStep1} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 space-y-4">
            <div>
              <h2 className="text-base font-bold text-gray-900">About You</h2>
              <p className="text-xs text-gray-500 mt-0.5">Tell us your legal name and primary residence.</p>
            </div>

            <div className="space-y-3 pt-2">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Full Legal Name</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <User size={16} />
                  </div>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Sarah Jenkins"
                    className="w-full pl-9 pr-3 py-2.5 text-sm rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-gray-50/50"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Country of Residence</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <Globe size={16} />
                  </div>
                  <input
                    type="text"
                    value={countryOfResidence}
                    onChange={(e) => setCountryOfResidence(e.target.value)}
                    placeholder="e.g. United Kingdom, UAE, USA"
                    className="w-full pl-9 pr-3 py-2.5 text-sm rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-gray-50/50"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="pt-3">
              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary-700 text-white font-semibold py-3 px-4 rounded-lg shadow-sm transition-colors text-sm"
              >
                <span>Continue to Goals</span>
                <ArrowRight size={16} weight="bold" />
              </button>
            </div>
          </form>
        )}

        {/* Wizard Step 2: Objectives & Relocation */}
        {currentStep === 2 && (
          <form onSubmit={handleNextStep2} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 space-y-4">
            <div>
              <h2 className="text-base font-bold text-gray-900">What is your primary objective?</h2>
              <p className="text-xs text-gray-500 mt-0.5">We tailor the jurisdiction matching to your key priority.</p>
            </div>

            <TileGroup options={GOALS} value={goal} onChange={setGoal} />

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setWantsRelocation(!wantsRelocation)}
                className={`w-full flex items-center gap-3 text-left p-3 rounded-lg border transition-colors ${
                  wantsRelocation
                    ? 'border-primary bg-primary-50/60'
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
                <span className={`text-xs font-medium ${wantsRelocation ? 'text-primary-900 font-semibold' : 'text-gray-700'}`}>
                  I am open to physically relocating or obtaining residency
                </span>
              </button>
            </div>

            <div className="flex gap-2.5 pt-3">
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="flex items-center justify-center gap-1.5 px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <ArrowLeft size={16} />
                <span>Back</span>
              </button>
              <button
                type="submit"
                className="flex-1 flex items-center justify-center gap-2 bg-primary hover:bg-primary-700 text-white font-semibold py-2.5 px-4 rounded-lg shadow-sm transition-colors text-sm"
              >
                <span>Continue to Timeline</span>
                <ArrowRight size={16} weight="bold" />
              </button>
            </div>
          </form>
        )}

        {/* Wizard Step 3: Scale & Timeline */}
        {currentStep === 3 && (
          <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 space-y-4">
            <div>
              <h2 className="text-base font-bold text-gray-900">Scale & Launch Timeline</h2>
              <p className="text-xs text-gray-500 mt-0.5">Used to prepare tax schedules and banking tracks.</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-2">Estimated Annual Business Revenue</label>
              <TileGroup options={BUDGETS} value={budgetBand} onChange={setBudgetBand} columns={2} />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-2">Target Formation Timeline</label>
              <TileGroup options={TIMELINES} value={timeline} onChange={setTimeline} />
            </div>

            <div className="flex gap-2.5 pt-3">
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                disabled={submitting}
                className="flex items-center justify-center gap-1.5 px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                <ArrowLeft size={16} />
                <span>Back</span>
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 flex items-center justify-center gap-2 bg-primary hover:bg-primary-700 disabled:opacity-60 text-white text-sm font-bold py-2.5 px-4 rounded-lg shadow-sm transition-colors"
              >
                {submitting ? (
                  <>
                    <CircleNotch size={16} className="animate-spin" />
                    <span>Setting up portal...</span>
                  </>
                ) : (
                  <>
                    <span>Complete & Launch Portal</span>
                    <CheckCircle size={16} weight="bold" />
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </main>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={null}>
      <OnboardingInner />
    </Suspense>
  );
}
