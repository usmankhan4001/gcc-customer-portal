'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { safeRedirectPath } from '@/lib/safe-redirect';
import {
  User,
  EnvelopeSimple,
  LockKey,
  ShieldCheck,
  TrendUp,
  Buildings,
  EyeSlash,
  Compass,
  ArrowRight,
  ArrowLeft,
  CircleNotch,
  CheckCircle,
  Bank,
} from '@phosphor-icons/react';
import PhoneInputWithCountry from '@/components/ui/PhoneInputWithCountry';
import CountrySelect from '@/components/ui/CountrySelect';

const OBJECTIVES = [
  { value: 'company_registration', label: 'Register a New Company', desc: 'Full formation in UAE, Hong Kong, Singapore, Bahrain & more', icon: Buildings },
  { value: 'tax_optimization', label: 'Tax Optimization / Relocation', desc: '0% corporate tax structures & physical GCC relocation', icon: TrendUp },
  { value: 'banking_access', label: 'Open a Bank Account', desc: 'Tier-1 corporate & multi-currency accounts for existing entities', icon: Bank },
  { value: 'bookkeeping', label: 'Bookkeeping & Tax Accounting', desc: 'I already have a company and need ongoing compliance support', icon: ShieldCheck },
  { value: 'privacy', label: 'Asset Protection & Privacy', desc: 'Nominee directorships & discrete holding structures', icon: EyeSlash },
  { value: 'exploring', label: 'Just Exploring Options', desc: 'Evaluating the best jurisdiction for my business model', icon: Compass },
];

const BUDGET_BANDS = [
  { value: 'under_50k', label: 'Under $50k / yr' },
  { value: '50k_150k', label: '$50k – $150k / yr' },
  { value: '150k_500k', label: '$150k – $500k / yr' },
  { value: 'over_500k', label: '$500k+ / yr' },
];

const TIMELINES = [
  { value: 'asap', label: 'Immediately (ASAP)' },
  { value: '1_3_months', label: 'Within 1 – 3 months' },
  { value: '3_6_months', label: 'In 3 – 6 months' },
  { value: 'exploring', label: 'Just researching for now' },
];

function OnboardingWizard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = safeRedirectPath(searchParams?.get('redirect'));

  // Step indicator (1 to 3)
  const [step, setStep] = useState(1);
  const totalSteps = 3;

  // Step 1: Personal Profile
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [countryOfResidence, setCountryOfResidence] = useState('United Arab Emirates');

  // Step 2: Objectives & Scale
  const [goal, setGoal] = useState('company_registration');
  const [budgetBand, setBudgetBand] = useState('50k_150k');
  const [timeline, setTimeline] = useState('asap');
  const [wantsRelocation, setWantsRelocation] = useState(false);

  // Step 3: Security & Contact
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phone, setPhone] = useState('');

  // Status & Errors
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const nextStep = () => {
    setError('');
    if (step === 1) {
      if (!fullName.trim()) {
        setError('Please enter your full legal name.');
        return;
      }
      if (!email.trim() || !email.includes('@')) {
        setError('Please provide a valid email address.');
        return;
      }
    }
    setStep((prev) => Math.min(totalSteps, prev + 1));
  };

  const prevStep = () => {
    setError('');
    setStep((prev) => Math.max(1, prev - 1));
  };

  const handleFinalSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match. Please check and try again.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/onboarding/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName,
          email,
          countryOfResidence,
          goal,
          budgetBand,
          timeline,
          wantsRelocation,
          password,
          phone: phone.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        router.push(redirectTo || '/dashboard');
      } else {
        setError(data.error || 'Registration failed. Please try again.');
      }
    } catch {
      setError('An error occurred during registration. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main id="main-content" className="min-h-[100dvh] bg-[#FFFFFF] flex flex-col justify-between p-4 sm:p-6 select-none font-sans">
      <div className="max-w-xl w-full mx-auto my-auto py-6">
        {/* Header Branding */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-widest text-[#F26522] block mb-1">
              GCC Startup Guided Intake
            </span>
            <h1 className="text-2xl font-bold text-[#0F172A] tracking-tight">
              {step === 1 && 'Create Your Member Account'}
              {step === 2 && 'Your Incorporation Goals'}
              {step === 3 && 'Account Security & Setup'}
            </h1>
          </div>
          <span className="text-xs font-bold px-3 py-1 bg-[#FEF1E9] text-[#F26522] rounded-full border border-[#FDE4D3]">
            Step {step} of {totalSteps}
          </span>
        </div>

        {/* Step Progress Bar */}
        <div className="w-full bg-[#E2E8F0] h-1.5 rounded-full overflow-hidden mb-6">
          <div
            className="bg-[#F26522] h-full transition-all duration-300 ease-out"
            style={{ width: `${(step / totalSteps) * 100}%` }}
          />
        </div>

        {/* Card Container */}
        <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-[0_10px_25px_-5px_rgba(10,20,47,0.06)]">
          {error && (
            <div className="mb-5 p-3.5 bg-[#FEE2E2] text-[#DC2626] border border-[#FECACA] rounded-xl text-xs font-semibold flex items-center gap-2">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {/* STEP 1: Profile */}
          {step === 1 && (
            <div className="space-y-4">
              <p className="text-xs text-[#64748B] mb-2 leading-relaxed">
                Let&apos;s start with your primary legal contact details. All official documents, milestone tracking, and statutory notices will use this profile.
              </p>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#0F172A] mb-1.5">
                  Full Legal Name (as in passport)
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-[#64748B] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Tariq Al-Mansoor"
                    className="w-full pl-10 pr-3.5 py-2.5 text-sm border border-[#E2E8F0] rounded-xl focus:outline-none focus:border-[#F26522] focus:ring-2 focus:ring-[#F26522]/10 transition-all text-[#0F172A]"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#0F172A] mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <EnvelopeSimple className="w-4 h-4 text-[#64748B] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tariq@example.com"
                    className="w-full pl-10 pr-3.5 py-2.5 text-sm border border-[#E2E8F0] rounded-xl focus:outline-none focus:border-[#F26522] focus:ring-2 focus:ring-[#F26522]/10 transition-all text-[#0F172A]"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="countryOfResidence" className="block text-xs font-bold uppercase tracking-wider text-[#0F172A] mb-1.5">
                  Current Country of Tax Residence
                </label>
                <CountrySelect
                  id="countryOfResidence"
                  value={countryOfResidence}
                  onChange={(val) => setCountryOfResidence(val)}
                />
              </div>
            </div>
          )}

          {/* STEP 2: Objectives & Strategy */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#0F172A] mb-2">
                  What is your primary formation objective?
                </label>
                <div className="grid grid-cols-1 gap-2.5">
                  {OBJECTIVES.map((item) => {
                    const Icon = item.icon;
                    const isSelected = goal === item.value;
                    return (
                      <div
                        key={item.value}
                        onClick={() => setGoal(item.value)}
                        className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all flex items-start gap-3.5 ${
                          isSelected
                            ? 'border-[#F26522] bg-[#FEF1E9]/40 ring-1 ring-[#F26522]'
                            : 'border-[#E2E8F0] hover:border-[#CBD5E1] bg-white'
                        }`}
                      >
                        <div
                          className={`p-2 rounded-lg flex-shrink-0 ${
                            isSelected ? 'bg-[#F26522] text-white' : 'bg-[#F8FAFC] text-[#14204A]'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-[#0F172A]">{item.label}</p>
                          <p className="text-[11px] text-[#64748B] mt-0.5">{item.desc}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#0F172A] mb-1.5">
                    Estimated Annual Revenue
                  </label>
                  <select
                    value={budgetBand}
                    onChange={(e) => setBudgetBand(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs font-medium border border-[#E2E8F0] rounded-xl bg-white focus:outline-none focus:border-[#F26522] text-[#0F172A]"
                  >
                    {BUDGET_BANDS.map((b) => (
                      <option key={b.value} value={b.value}>
                        {b.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#0F172A] mb-1.5">
                    Target Timeline
                  </label>
                  <select
                    value={timeline}
                    onChange={(e) => setTimeline(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs font-medium border border-[#E2E8F0] rounded-xl bg-white focus:outline-none focus:border-[#F26522] text-[#0F172A]"
                  >
                    {TIMELINES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={wantsRelocation}
                    onChange={(e) => setWantsRelocation(e.target.checked)}
                    className="w-4 h-4 rounded text-[#F26522] border-[#E2E8F0] focus:ring-[#F26522]"
                  />
                  <span className="text-xs text-[#0F172A] font-medium">
                    I am interested in physical GCC residency visas &amp; tax relocation
                  </span>
                </label>
              </div>
            </div>
          )}

          {/* STEP 3: Security & Contact */}
          {step === 3 && (
            <div className="space-y-4">
              <p className="text-xs text-[#64748B] mb-2 leading-relaxed">
                Secure your member portal account with a password and optional WhatsApp number for instant document status notifications.
              </p>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#0F172A] mb-1.5">
                  Create Password (min. 6 characters)
                </label>
                <div className="relative">
                  <LockKey className="w-4 h-4 text-[#64748B] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-10 pr-3.5 py-2.5 text-sm border border-[#E2E8F0] rounded-xl focus:outline-none focus:border-[#F26522] focus:ring-2 focus:ring-[#F26522]/10 transition-all text-[#0F172A]"
                    disabled={loading}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#0F172A] mb-1.5">
                  Confirm Password
                </label>
                <div className="relative">
                  <LockKey className="w-4 h-4 text-[#64748B] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-10 pr-3.5 py-2.5 text-sm border border-[#E2E8F0] rounded-xl focus:outline-none focus:border-[#F26522] focus:ring-2 focus:ring-[#F26522]/10 transition-all text-[#0F172A]"
                    disabled={loading}
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="whatsappPhone" className="block text-xs font-bold uppercase tracking-wider text-[#0F172A] mb-1.5">
                  WhatsApp Phone Number (Optional)
                </label>
                <PhoneInputWithCountry
                  id="whatsappPhone"
                  value={phone}
                  onChange={(val) => setPhone(val)}
                  placeholder="50 123 4567"
                  disabled={loading}
                />
              </div>
            </div>
          )}

          {/* Navigation Controls */}
          <div className="mt-8 pt-5 border-t border-[#E2E8F0] flex items-center justify-between gap-3">
            {step > 1 ? (
              <button
                type="button"
                onClick={prevStep}
                disabled={loading}
                className="px-5 py-2.5 text-xs font-bold text-[#0F172A] hover:bg-[#F8FAFC] border border-[#E2E8F0] rounded-full transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back
              </button>
            ) : (
              <Link
                href="/auth"
                className="text-xs text-[#64748B] hover:text-[#0F172A] transition-colors font-semibold"
              >
                Already registered? <span className="text-[#F26522] underline font-bold">Sign In</span>
              </Link>
            )}

            {step < totalSteps ? (
              <button
                type="button"
                onClick={nextStep}
                className="ml-auto px-6 py-2.5 bg-[#F26522] hover:bg-[#14204A] text-white text-xs font-bold rounded-full transition-all duration-300 flex items-center gap-1.5 shadow-[0_4px_14px_rgba(242,101,34,0.25)] cursor-pointer"
              >
                Continue
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleFinalSubmit()}
                disabled={loading || !password || password.length < 6}
                className="ml-auto px-6 py-2.5 bg-[#F26522] hover:bg-[#14204A] disabled:opacity-50 text-white text-xs font-bold rounded-full transition-all duration-300 flex items-center gap-1.5 shadow-[0_4px_14px_rgba(242,101,34,0.25)] cursor-pointer"
              >
                {loading ? (
                  <>
                    <CircleNotch className="w-3.5 h-3.5 animate-spin" />
                    Completing Registration...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-3.5 h-3.5" />
                    Complete Registration
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Footer Support */}
        <p className="text-center text-[11px] text-[#94A3B8] mt-5">
          Encrypted &bull; UAE Federal Decree-Law No. 45/2021 on Personal Data Protection.
        </p>
      </div>
    </main>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={null}>
      <OnboardingWizard />
    </Suspense>
  );
}
