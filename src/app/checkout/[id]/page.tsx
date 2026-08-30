"use client";

import { useState, use } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  CheckCircle,
  CaretRight,
  Buildings,
  CreditCard,
  WhatsappLogo,
  ShieldCheck,
  CircleNotch,
} from '@phosphor-icons/react';
import { useRouter } from 'next/navigation';
import PhoneInputWithCountry from '@/components/ui/PhoneInputWithCountry';

export default function CheckoutWizard({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();

  const [step, setStep] = useState(1);
  const totalSteps = 4;
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    nameOption1: '',
    nameOption2: '',
    nameOption3: '',
    tier: 'standard', // basic, standard, premium
  });

  // WhatsApp OTP Verification State
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [otpInfo, setOtpInfo] = useState('');

  const handleNext = () => {
    if (step < totalSteps) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSendOtp = async () => {
    if (!phone || phone.length < 7) {
      setOtpError('Please enter a valid WhatsApp phone number.');
      return;
    }
    setOtpError('');
    setOtpInfo('');
    setSendingOtp(true);

    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setOtpSent(true);
        if (data.devOtp) {
          setOtp(data.devOtp);
          setOtpInfo(`Verification code sent! (Demo mode code: ${data.devOtp})`);
        } else {
          setOtpInfo('Verification code sent to your WhatsApp!');
        }
      } else {
        setOtpError(data.error || 'Failed to send OTP code. Please try again.');
      }
    } catch {
      setOtpError('Network error while sending verification code.');
    } finally {
      setSendingOtp(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp || otp.length !== 6) {
      setOtpError('Please enter the 6-digit OTP code.');
      return;
    }
    setOtpError('');
    setVerifyingOtp(true);

    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, otp }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setOtpVerified(true);
        setOtpInfo('WhatsApp number verified successfully for official filing updates.');
      } else {
        setOtpError(data.error || 'Invalid verification code.');
      }
    } catch {
      setOtpError('Verification failed. Please try again.');
    } finally {
      setVerifyingOtp(false);
    }
  };

  const handleCheckout = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tier: formData.tier,
          companyName: formData.nameOption1,
          jurisdiction: resolvedParams.id,
        }),
      });
      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || 'Payment failed to initialize.');
        setLoading(false);
      }
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Top Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center">
          {step === 1 ? (
            <Link href={`/services/${resolvedParams.id}`} className="p-1 -ml-1 rounded-md hover:bg-gray-100 transition-colors">
              <ArrowLeft size={20} className="text-gray-900" />
            </Link>
          ) : (
            <button onClick={handleBack} className="p-1 -ml-1 rounded-md hover:bg-gray-100 transition-colors">
              <ArrowLeft size={20} className="text-gray-900" />
            </button>
          )}
          <h1 className="ml-2 text-base font-black text-gray-900 uppercase tracking-tight">Company Registration</h1>
        </div>
        <div className="text-xs font-black text-primary bg-primary-50 px-2 py-1 rounded-sm border border-primary-100 uppercase tracking-wider">
          Step {step} of {totalSteps}
        </div>
      </header>

      {/* Progress Bar */}
      <div className="w-full bg-gray-200 h-1">
        <div
          className="bg-primary h-1 transition-all duration-300"
          style={{ width: `${(step / totalSteps) * 100}%` }}
        />
      </div>

      {/* Main Content Area */}
      <main className="flex-grow p-4 md:p-6 max-w-2xl mx-auto w-full pb-32">
        {/* Step 1: Company Name */}
        {step === 1 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="flex items-center gap-2 mb-4 border-b border-gray-200 pb-3">
              <Buildings size={20} weight="duotone" className="text-primary" />
              <h2 className="text-lg font-black text-gray-900 uppercase tracking-tight">Desired Company Name</h2>
            </div>
            <p className="text-gray-600 text-sm font-medium mb-6">
              Provide up to 3 name choices. The government registry will reserve the first available option.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-black text-gray-900 uppercase tracking-wider mb-1.5">
                  Option 1 (Preferred Name)
                </label>
                <input
                  type="text"
                  value={formData.nameOption1}
                  onChange={(e) => setFormData({ ...formData, nameOption1: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-md border-2 border-gray-300 focus:border-primary focus:ring-0 outline-none transition-all font-bold text-sm text-gray-900 placeholder:font-medium placeholder:text-gray-400"
                  placeholder="ACME GLOBAL FZ-LLC"
                />
              </div>
              <div>
                <label className="block text-xs font-black text-gray-900 uppercase tracking-wider mb-1.5">
                  Option 2 (Alternative)
                </label>
                <input
                  type="text"
                  value={formData.nameOption2}
                  onChange={(e) => setFormData({ ...formData, nameOption2: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-md border-2 border-gray-300 focus:border-primary focus:ring-0 outline-none transition-all font-bold text-sm text-gray-900 placeholder:font-medium placeholder:text-gray-400"
                  placeholder="ACME VENTURES FZ-LLC"
                />
              </div>
              <div>
                <label className="block text-xs font-black text-gray-900 uppercase tracking-wider mb-1.5">
                  Option 3 (Alternative)
                </label>
                <input
                  type="text"
                  value={formData.nameOption3}
                  onChange={(e) => setFormData({ ...formData, nameOption3: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-md border-2 border-gray-300 focus:border-primary focus:ring-0 outline-none transition-all font-bold text-sm text-gray-900 placeholder:font-medium placeholder:text-gray-400"
                  placeholder="ACME ENTERPRISES FZ-LLC"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Package Tier */}
        {step === 2 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300">
            <h2 className="text-lg font-black text-gray-900 uppercase tracking-tight border-b border-gray-200 pb-3 mb-5">
              Select Package Tier
            </h2>

            <div className="space-y-4">
              <label
                className={`block relative p-4 rounded-md border-2 cursor-pointer transition-all ${
                  formData.tier === 'basic' ? 'border-primary bg-primary-50' : 'border-gray-300 bg-white hover:border-gray-400'
                }`}
              >
                <input
                  type="radio"
                  name="tier"
                  value="basic"
                  checked={formData.tier === 'basic'}
                  onChange={() => setFormData({ ...formData, tier: 'basic' })}
                  className="sr-only"
                />
                <div className="flex justify-between items-start mb-1.5">
                  <span className="font-black text-gray-900 uppercase tracking-wide">Self UBO (Basic)</span>
                  <span className="font-black text-gray-900">$1,500</span>
                </div>
                <p className="text-sm text-gray-700 font-medium leading-snug">
                  You are the registered director & shareholder. Includes full incorporation filing and registry fees.
                </p>
                {formData.tier === 'basic' && <div className="absolute top-4 right-4 w-3.5 h-3.5 rounded-full bg-primary" />}
              </label>

              <label
                className={`block relative p-4 rounded-md border-2 cursor-pointer transition-all ${
                  formData.tier === 'standard' ? 'border-primary bg-primary-50' : 'border-gray-300 bg-white hover:border-gray-400'
                }`}
              >
                <div className="absolute -top-2.5 left-3 bg-gray-900 text-white text-[10px] font-black px-2 py-0.5 rounded-sm uppercase tracking-widest">
                  RECOMMENDED
                </div>
                <input
                  type="radio"
                  name="tier"
                  value="standard"
                  checked={formData.tier === 'standard'}
                  onChange={() => setFormData({ ...formData, tier: 'standard' })}
                  className="sr-only"
                />
                <div className="flex justify-between items-start mb-1.5">
                  <span className="font-black text-gray-900 uppercase tracking-wide">Nominee UBO (Privacy Tier)</span>
                  <span className="font-black text-gray-900">$3,500</span>
                </div>
                <p className="text-sm text-gray-700 font-medium leading-snug">
                  Maximum privacy. GCCStartup acts as the registered nominee. Includes 1 bank account introduction.
                </p>
                {formData.tier === 'standard' && <div className="absolute top-4 right-4 w-3.5 h-3.5 rounded-full bg-primary" />}
              </label>
            </div>
          </div>
        )}

        {/* Step 3: WhatsApp OTP Verification */}
        {step === 3 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="flex items-center gap-2 mb-4 border-b border-gray-200 pb-3">
              <WhatsappLogo size={22} weight="duotone" className="text-emerald-600" />
              <h2 className="text-lg font-black text-gray-900 uppercase tracking-tight">WhatsApp Order Verification</h2>
            </div>
            <p className="text-gray-600 text-sm font-medium mb-6">
              To safeguard corporate filings and dispatch real-time trade license & KYC approval updates, verify your official WhatsApp number.
            </p>

            {otpError && (
              <div className="mb-4 p-3 bg-destructive/10 text-destructive border border-destructive/20 rounded-lg text-xs font-medium">
                ⚠️ {otpError}
              </div>
            )}

            {otpInfo && (
              <div className="mb-4 p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-medium">
                ℹ️ {otpInfo}
              </div>
            )}

            <div className="bg-white border-2 border-gray-200 rounded-xl p-5 space-y-4">
              <div>
                <label className="block text-xs font-black text-gray-900 uppercase tracking-wider mb-1.5">
                  WhatsApp Contact Number
                </label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="flex-1">
                    <PhoneInputWithCountry
                      id="checkout-phone"
                      value={phone}
                      onChange={(val) => {
                        setPhone(val);
                        setOtpVerified(false);
                      }}
                      disabled={otpVerified || sendingOtp}
                      placeholder="50 123 4567"
                    />
                  </div>
                  {!otpVerified && (
                    <button
                      type="button"
                      onClick={handleSendOtp}
                      disabled={sendingOtp || !phone.trim()}
                      className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-60 text-white text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap shadow-xs h-[38px]"
                    >
                      {sendingOtp ? (
                        <CircleNotch className="w-3.5 h-3.5 animate-spin" />
                      ) : otpSent ? (
                        'Resend OTP'
                      ) : (
                        'Send WhatsApp OTP'
                      )}
                    </button>
                  )}
                </div>
              </div>

              {otpSent && !otpVerified && (
                <div className="pt-3 border-t border-gray-100 space-y-3">
                  <label className="block text-xs font-black text-gray-900 uppercase tracking-wider">
                    Enter 6-Digit WhatsApp Code
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      maxLength={6}
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                      placeholder="123456"
                      className="flex-1 px-3 py-2 text-center tracking-widest text-lg font-bold border-2 border-gray-300 rounded-lg focus:border-primary outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleVerifyOtp}
                      disabled={verifyingOtp || otp.length !== 6}
                      className="px-5 py-2 bg-primary hover:bg-primary-700 disabled:opacity-60 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5"
                    >
                      {verifyingOtp ? <CircleNotch className="w-3.5 h-3.5 animate-spin" /> : 'Verify Code'}
                    </button>
                  </div>
                </div>
              )}

              {otpVerified && (
                <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-2.5 text-emerald-800 text-xs font-bold">
                  <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span>WhatsApp Number Verified ({phone})</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 4: Summary & Payment */}
        {step === 4 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="flex items-center gap-2 mb-4 border-b border-gray-200 pb-3">
              <CreditCard size={20} weight="duotone" className="text-primary" />
              <h2 className="text-lg font-black text-gray-900 uppercase tracking-tight">Order Summary & Payment</h2>
            </div>

            <div className="bg-white rounded-md shadow-sm border-2 border-gray-200 overflow-hidden mb-5">
              <div className="p-4 border-b-2 border-gray-100">
                <div className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-1">Company Name</div>
                <div className="font-bold text-gray-900 uppercase text-sm">{formData.nameOption1 || 'NOT PROVIDED'}</div>
              </div>
              <div className="p-4 border-b-2 border-gray-100">
                <div className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-1">Verified WhatsApp Dispatch</div>
                <div className="font-mono font-bold text-emerald-700 text-xs">{phone || 'Verified on Account'}</div>
              </div>
              <div className="p-4 border-b-2 border-gray-100 flex justify-between items-center">
                <div>
                  <div className="font-bold text-gray-900 uppercase text-sm">
                    {formData.tier === 'basic' ? 'Basic Package' : 'Nominee UBO Package'}
                  </div>
                  <div className="text-[10px] text-gray-500 font-black uppercase tracking-widest mt-1">
                    Formation + Government Registry Fees
                  </div>
                </div>
                <div className="font-black text-gray-900">$ {formData.tier === 'basic' ? '1,500' : '3,500'}</div>
              </div>
              <div className="p-4 bg-gray-50 flex justify-between items-center border-t border-gray-200">
                <div className="font-black text-gray-900 uppercase tracking-wider text-sm">Total Due</div>
                <div className="font-black text-primary text-xl">$ {formData.tier === 'basic' ? '1,500' : '3,500'}</div>
              </div>
            </div>

            <div className="bg-primary-50 border border-primary-200 p-4 rounded-md flex items-start gap-3">
              <CheckCircle size={20} weight="duotone" className="text-primary shrink-0 mt-0.5" />
              <p className="text-xs text-primary-900 font-bold leading-relaxed">
                NO IMMEDIATE KYC REQUIRED. YOU CAN UPLOAD YOUR PASSPORT SECURELY FROM YOUR DASHBOARD AFTER PAYMENT IS CONFIRMED.
              </p>
            </div>
          </div>
        )}
      </main>

      {/* Sticky Bottom Actions */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-[0_-10px_15px_-3px_rgba(0,0,0,0.05)] z-20 p-4">
        <div className="max-w-2xl mx-auto w-full flex justify-between items-center">
          {step < totalSteps ? (
            <button
              onClick={handleNext}
              disabled={
                (step === 1 && !formData.nameOption1) ||
                (step === 3 && !otpVerified)
              }
              className="w-full flex items-center justify-center gap-2 bg-primary disabled:bg-primary-300 hover:bg-primary-700 text-white font-black py-3.5 px-6 rounded-md shadow-sm transition duration-200 text-sm uppercase tracking-widest"
            >
              Continue <CaretRight size={16} weight="bold" />
            </button>
          ) : (
            <button
              onClick={handleCheckout}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-gray-900 hover:bg-black text-white font-black py-3.5 px-6 rounded-md shadow-sm transition duration-200 text-sm uppercase tracking-widest relative overflow-hidden"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  PROCESSING...
                </span>
              ) : (
                'PAY WITH STRIPE'
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
