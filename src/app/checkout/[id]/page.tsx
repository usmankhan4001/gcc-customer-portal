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

  const tierPrice = formData.tier === 'basic' ? '1,500' : '3,500';

  const tierOptions = [
    { value: 'basic', name: 'Self UBO (Basic)', price: '$1,500', badge: null, note: 'You are the registered director & shareholder. Includes full incorporation filing and registry fees.' },
    { value: 'standard', name: 'Nominee UBO (Privacy tier)', price: '$3,500', badge: 'Recommended', note: 'Maximum privacy. GCCStartup acts as the registered nominee. Includes 1 bank account introduction.' },
  ];

  const nameFields = [
    { key: 'nameOption1', label: 'Option 1 (preferred name)', placeholder: 'ACME GLOBAL FZ-LLC' },
    { key: 'nameOption2', label: 'Option 2 (alternative)', placeholder: 'ACME VENTURES FZ-LLC' },
    { key: 'nameOption3', label: 'Option 3 (alternative)', placeholder: 'ACME ENTERPRISES FZ-LLC' },
  ] as const;

  const iconBtn = { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 44, height: 44, marginLeft: -10, color: 'var(--text-primary)', background: 'transparent', border: 0, borderRadius: 'var(--radius-sm)', cursor: 'pointer' } as const;
  const stepHead = { display: 'flex', alignItems: 'center', gap: 'var(--space-2)', margin: '0 0 var(--space-4)' } as const;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--surface-alt)' }}>
      <header
        style={{
          position: 'sticky', top: 0, zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          gap: 'var(--space-3)', padding: 'var(--space-2) var(--space-4)', background: 'var(--surface)', borderBottom: '1px solid var(--border)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', minWidth: 0 }}>
          {step === 1 ? (
            <Link href={`/services/${resolvedParams.id}`} style={iconBtn} aria-label="Back to jurisdiction details">
              <ArrowLeft size={20} />
            </Link>
          ) : (
            <button type="button" onClick={handleBack} style={iconBtn} aria-label="Previous step">
              <ArrowLeft size={20} />
            </button>
          )}
          <h1 style={{ margin: 0, fontSize: 18 }}>Company registration</h1>
        </div>
        <span className="badge badge-accent" style={{ flexShrink: 0 }}>Step {step} of {totalSteps}</span>
      </header>

      <div style={{ height: 4, background: 'var(--border)' }}>
        <div style={{ height: 4, width: `${(step / totalSteps) * 100}%`, background: 'var(--orange)', transition: 'width .3s ease' }} />
      </div>

      <main className="wrap" style={{ maxWidth: 672, padding: 'var(--space-6) var(--space-4) 128px' }}>
        {step === 1 && (
          <div>
            <h2 style={stepHead}><Buildings size={20} weight="duotone" style={{ color: 'var(--orange)' }} /> Desired company name</h2>
            <p>Provide up to 3 name choices. The government registry will reserve the first available option.</p>
            <div className="card">
              {nameFields.map(({ key, label, placeholder }) => (
                <div className="field" key={key}>
                  <label htmlFor={`checkout-${key}`}>{label}</label>
                  <input
                    id={`checkout-${key}`}
                    type="text"
                    value={formData[key]}
                    onChange={(e) => setFormData({ ...formData, [key]: e.target.value })}
                    placeholder={placeholder}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <h2 style={stepHead}>Select package tier</h2>
            <div style={{ display: 'grid', gap: 'var(--space-3)' }}>
              {tierOptions.map((opt) => {
                const selected = formData.tier === opt.value;
                return (
                  <label
                    key={opt.value}
                    className="card"
                    style={{
                      display: 'block', cursor: 'pointer', padding: 'var(--space-4)',
                      ...(selected ? { borderColor: 'var(--orange)', background: 'var(--orange-lt)' } : {}),
                    }}
                  >
                    <input
                      type="radio"
                      name="tier"
                      value={opt.value}
                      checked={selected}
                      onChange={() => setFormData({ ...formData, tier: opt.value })}
                      style={{ position: 'absolute', opacity: 0, pointerEvents: 'none' }}
                    />
                    <span style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
                      <strong>{opt.name}</strong>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                        {opt.badge && <span className="badge badge-navy">{opt.badge}</span>}
                        <strong>{opt.price}</strong>
                      </span>
                    </span>
                    <p style={{ margin: 'var(--space-2) 0 0', fontSize: 14 }}>{opt.note}</p>
                  </label>
                );
              })}
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <h2 style={stepHead}><WhatsappLogo size={22} weight="duotone" style={{ color: 'var(--green-dk)' }} /> WhatsApp order verification</h2>
            <p>To safeguard corporate filings and dispatch real-time trade license & KYC approval updates, verify your official WhatsApp number.</p>

            {otpError && (
              <div className="admin-callout is-error" role="alert" style={{ marginBottom: 'var(--space-4)' }}>{otpError}</div>
            )}
            {otpInfo && (
              <div className="admin-callout" role="status" style={{ marginBottom: 'var(--space-4)' }}>{otpInfo}</div>
            )}

            <div className="card">
              <div className="field">
                <label htmlFor="checkout-phone">WhatsApp contact number</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
                  <div style={{ flex: '1 1 200px' }}>
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
                    <button type="button" onClick={handleSendOtp} disabled={sendingOtp || !phone.trim()} className="btn btn-primary">
                      {sendingOtp ? <CircleNotch size={16} className="animate-spin" /> : otpSent ? 'Resend OTP' : 'Send WhatsApp OTP'}
                    </button>
                  )}
                </div>
              </div>

              {otpSent && !otpVerified && (
                <div className="field">
                  <label htmlFor="checkout-otp">Enter 6-digit WhatsApp code</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
                    <input
                      id="checkout-otp"
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                      placeholder="123456"
                      style={{ flex: '1 1 140px', textAlign: 'center', letterSpacing: '0.2em' }}
                    />
                    <button type="button" onClick={handleVerifyOtp} disabled={verifyingOtp || otp.length !== 6} className="btn btn-primary">
                      {verifyingOtp ? <CircleNotch size={16} className="animate-spin" /> : 'Verify code'}
                    </button>
                  </div>
                </div>
              )}

              {otpVerified && (
                <div className="admin-callout" role="status">
                  <ShieldCheck size={20} style={{ color: 'var(--green-dk)', flexShrink: 0 }} />
                  <span>WhatsApp number verified ({phone})</span>
                </div>
              )}
            </div>
          </div>
        )}

        {step === 4 && (
          <div>
            <h2 style={stepHead}><CreditCard size={20} weight="duotone" style={{ color: 'var(--orange)' }} /> Order summary & payment</h2>

            <div className="card" style={{ display: 'grid', gap: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
              <div>
                <p className="admin-form-note" style={{ margin: 0 }}>Company name</p>
                <strong>{formData.nameOption1 || 'Not provided'}</strong>
              </div>
              <div>
                <p className="admin-form-note" style={{ margin: 0 }}>Verified WhatsApp number</p>
                <strong>{phone || 'Verified on account'}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 'var(--space-3)' }}>
                <div>
                  <strong>{formData.tier === 'basic' ? 'Basic package' : 'Nominee UBO package'}</strong>
                  <p className="admin-form-note" style={{ margin: 0 }}>Formation + government registry fees</p>
                </div>
                <strong>$ {tierPrice}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 'var(--space-3)', borderTop: '1px solid var(--border)' }}>
                <strong>Total due</strong>
                <strong style={{ fontSize: 22, color: 'var(--orange-dk)' }}>$ {tierPrice}</strong>
              </div>
            </div>

            <div className="admin-callout">
              <CheckCircle size={20} weight="duotone" style={{ color: 'var(--orange)', flexShrink: 0 }} />
              <span>No immediate KYC required. You can upload your passport securely from your dashboard after payment is confirmed.</span>
            </div>
          </div>
        )}
      </main>

      <div
        style={{
          position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 20,
          padding: 'var(--space-3) var(--space-4)', background: 'var(--surface)', borderTop: '1px solid var(--border)',
        }}
      >
        <div style={{ maxWidth: 672, margin: '0 auto' }}>
          {step < totalSteps ? (
            <button
              type="button"
              onClick={handleNext}
              disabled={(step === 1 && !formData.nameOption1) || (step === 3 && !otpVerified)}
              className="btn btn-primary"
              style={{ width: '100%' }}
            >
              Continue <CaretRight size={16} weight="bold" />
            </button>
          ) : (
            <button type="button" onClick={handleCheckout} disabled={loading} className="btn btn-primary" style={{ width: '100%' }}>
              {loading ? (
                <>
                  <CircleNotch size={16} className="animate-spin" /> Processing...
                </>
              ) : (
                'Pay with Stripe'
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
