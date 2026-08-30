'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  User,
  EnvelopeSimple,
  GlobeHemisphereWest,
  LockKey,
  WhatsappLogo,
  ShieldCheck,
  TrendUp,
  Buildings,
  EyeSlash,
  Compass,
  ArrowRight,
  ArrowLeft,
  CircleNotch,
  CheckCircle,
} from '@phosphor-icons/react';
import PhoneInputWithCountry from '@/components/ui/PhoneInputWithCountry';
import CountrySelect from '@/components/ui/CountrySelect';

const OBJECTIVES = [
  { value: 'tax_optimization', label: 'Tax Optimization', desc: '0% - 9% corporate tax & zero personal income tax', icon: TrendUp },
  { value: 'banking_access', label: 'Global Banking', desc: 'Tier-1 corporate & multi-currency bank accounts', icon: Buildings },
  { value: 'relocation', label: 'Physical Relocation', desc: 'Investor & Golden Visas for founder and family', icon: GlobeHemisphereWest },
  { value: 'privacy', label: 'Asset Protection', desc: 'Nominee directorships & discrete holding structures', icon: EyeSlash },
  { value: 'exploring', label: 'Exploring Options', desc: 'Evaluating the best jurisdiction for your business model', icon: Compass },
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
  const redirectTo = searchParams?.get('redirect') || '/dashboard';

  // Step indicator (1 to 4)
  const [step, setStep] = useState(1);
  const totalSteps = 4;

  // Step 1: Personal Profile
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [countryOfResidence, setCountryOfResidence] = useState('United States');

  // Step 2: Objectives & Scale
  const [goal, setGoal] = useState('tax_optimization');
  const [budgetBand, setBudgetBand] = useState('50k_150k');
  const [timeline, setTimeline] = useState('asap');
  const [wantsRelocation, setWantsRelocation] = useState(false);

  // Step 3: Password Setup
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Step 4: WhatsApp Verification
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [infoMessage, setInfoMessage] = useState('');

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
    } else if (step === 3) {
      if (password.length < 6) {
        setError('Password must be at least 6 characters long.');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match. Please check and try again.');
        return;
      }
    }
    setStep((prev) => Math.min(totalSteps, prev + 1));
  };

  const prevStep = () => {
    setError('');
    setStep((prev) => Math.max(1, prev - 1));
  };

  const handleSendOtp = async () => {
    if (!phone.trim() || phone.length < 7) {
      setError('Please enter a valid WhatsApp phone number with country code (e.g. +971501234567).');
      return;
    }
    setError('');
    setSendingOtp(true);
    setInfoMessage('');

    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber: phone }),
      });
      const data = await res.json();

      if (res.ok) {
        setOtpSent(true);
        if (data.devOtp) {
          setOtp(data.devOtp);
          setInfoMessage(`Verification code sent! (Demo mode code: ${data.devOtp})`);
        } else {
          setInfoMessage('Verification code sent to your WhatsApp!');
        }
      } else {
        setError(data.error || 'Failed to send OTP code. Please try again.');
      }
    } catch {
      setError('Network error while sending verification code.');
    } finally {
      setSendingOtp(false);
    }
  };

  const handleFinalSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!phone.trim()) {
      setError('Please provide your WhatsApp number.');
      return;
    }
    if (!otp.trim() || otp.length !== 6) {
      setError('Please enter the 6-digit verification code sent to your WhatsApp.');
      return;
    }

    setError('');
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
          phone,
          otp,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        router.push(redirectTo || '/dashboard');
      } else {
        setError(data.error || 'Verification failed. Please check your code.');
      }
    } catch {
      setError('An error occurred during registration. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main id="main-content" className="min-h-[100dvh] bg-gray-50/70 flex flex-col justify-between p-4 sm:p-6 select-none">
      <div className="max-w-xl w-full mx-auto my-auto py-2">
        {/* Header Branding */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-primary">GCC Startup Registration</span>
            <h1 className="text-xl font-bold text-gray-900">
              {step === 1 && 'Create Your Member Account'}
              {step === 2 && 'Your Incorporation Goals'}
              {step === 3 && 'Set Account Password'}
              {step === 4 && 'WhatsApp Verification'}
            </h1>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 bg-primary/10 text-primary rounded-full">
            Step {step} of {totalSteps}
          </span>
        </div>

        {/* Step Progress Bar */}
        <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden mb-5">
          <div
            className="bg-primary h-full transition-all duration-300 ease-out"
            style={{ width: `${(step / totalSteps) * 100}%` }}
          />
        </div>

        {/* Card Container */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 sm:p-7 shadow-sm">
          {error && (
            <div className="mb-4 p-3 bg-destructive/10 text-destructive border border-destructive/20 rounded-lg text-xs font-medium">
              ⚠️ {error}
            </div>
          )}

          {infoMessage && (
            <div className="mb-4 p-3 bg-primary/10 text-primary border border-primary/20 rounded-lg text-xs font-medium">
              ℹ️ {infoMessage}
            </div>
          )}

          {/* STEP 1: Profile */}
          {step === 1 && (
            <div className="space-y-4">
              <p className="text-xs text-gray-500 mb-2">
                Let&apos;s start with your primary legal contact details. All official documents and compliance notices will use this profile.
              </p>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Full Legal Name (as in passport)
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Alexander Wright"
                    className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <EnvelopeSimple className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="alexander@company.com"
                    className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="countryOfResidence" className="block text-xs font-semibold text-gray-700 mb-1">
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
                <label className="block text-xs font-semibold text-gray-700 mb-2">
                  What is your primary formation objective?
                </label>
                <div className="grid grid-cols-1 gap-2">
                  {OBJECTIVES.map((item) => {
                    const Icon = item.icon;
                    const isSelected = goal === item.value;
                    return (
                      <div
                        key={item.value}
                        onClick={() => setGoal(item.value)}
                        className={`p-3 rounded-lg border text-left cursor-pointer transition-all flex items-start gap-3 ${
                          isSelected
                            ? 'border-primary bg-primary/5 ring-1 ring-primary'
                            : 'border-gray-200 hover:border-gray-300 bg-white'
                        }`}
                      >
                        <div className={`p-2 rounded-md ${isSelected ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600'}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="flex-1">
                          <h4 className="text-xs font-bold text-gray-900">{item.label}</h4>
                          <p className="text-[11px] text-gray-500 leading-snug">{item.desc}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Annual Business Revenue
                  </label>
                  <select
                    value={budgetBand}
                    onChange={(e) => setBudgetBand(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                  >
                    {BUDGET_BANDS.map((b) => (
                      <option key={b.value} value={b.value}>{b.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Target Timeline
                  </label>
                  <select
                    value={timeline}
                    onChange={(e) => setTimeline(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                  >
                    {TIMELINES.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2.5 cursor-pointer bg-gray-50 border border-gray-200 p-2.5 rounded-lg">
                  <input
                    type="checkbox"
                    checked={wantsRelocation}
                    onChange={(e) => setWantsRelocation(e.target.checked)}
                    className="rounded border-gray-300 text-primary focus:ring-primary h-4 w-4"
                  />
                  <span className="text-xs text-gray-700 font-medium">
                    I am open to physically relocating to UAE / GCC (Investor Visa)
                  </span>
                </label>
              </div>
            </div>
          )}

          {/* STEP 3: Setup Password */}
          {step === 3 && (
            <div className="space-y-4">
              <p className="text-xs text-gray-500 mb-2">
                Set a secure password so you can sign in directly to your client dashboard anytime.
              </p>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Choose a Password (minimum 6 characters)
                </label>
                <div className="relative">
                  <LockKey className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Confirm Password
                </label>
                <div className="relative">
                  <ShieldCheck className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                    required
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: WhatsApp Verification (Final Step) */}
          {step === 4 && (
            <div className="space-y-4">
              <p className="text-xs text-gray-500 mb-2">
                Verify your WhatsApp number to activate real-time corporate status alerts, KYC milestones, and instant sign-in.
              </p>

              <div>
                <label htmlFor="whatsappPhone" className="block text-xs font-semibold text-gray-700 mb-1">
                  WhatsApp Phone Number
                </label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="flex-1">
                    <PhoneInputWithCountry
                      id="whatsappPhone"
                      value={phone}
                      onChange={(val) => setPhone(val)}
                      placeholder="50 123 4567"
                      disabled={sendingOtp || loading}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    disabled={sendingOtp || loading || !phone.trim()}
                    className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-60 text-white text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap shadow-xs h-[38px]"
                  >
                    {sendingOtp ? (
                      <CircleNotch className="w-3.5 h-3.5 animate-spin" />
                    ) : otpSent ? (
                      'Resend Code'
                    ) : (
                      'Send Verification Code'
                    )}
                  </button>
                </div>
              </div>

              {otpSent && (
                <div className="pt-2">
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Enter 6-Digit WhatsApp Verification Code
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder="123456"
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-center tracking-widest text-lg font-bold focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                    disabled={loading}
                  />
                </div>
              )}
            </div>
          )}

          {/* Navigation Controls */}
          <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between gap-3">
            {step > 1 ? (
              <button
                type="button"
                onClick={prevStep}
                disabled={loading}
                className="px-4 py-2 text-xs font-semibold text-gray-600 hover:text-gray-900 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back
              </button>
            ) : (
              <Link
                href="/auth"
                className="text-xs text-gray-500 hover:text-primary transition-colors font-medium"
              >
                Already registered? <span className="underline font-semibold">Sign In</span>
              </Link>
            )}

            {step < totalSteps ? (
              <button
                type="button"
                onClick={nextStep}
                className="ml-auto px-5 py-2.5 bg-primary hover:bg-primary-700 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
              >
                Continue
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleFinalSubmit()}
                disabled={loading || !otpSent || otp.length !== 6}
                className="ml-auto px-5 py-2.5 bg-primary hover:bg-primary-700 disabled:opacity-60 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
              >
                {loading ? (
                  <>
                    <CircleNotch className="w-3.5 h-3.5 animate-spin" />
                    Registering...
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
        <p className="text-center text-[11px] text-gray-400 mt-4">
          Encrypted & Protected under UAE Federal Decree-Law No. 45/2021 on Personal Data Protection.
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
