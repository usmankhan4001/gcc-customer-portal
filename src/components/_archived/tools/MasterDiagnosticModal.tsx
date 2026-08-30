'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  ArrowRight,
  X,
  ArrowLeft,
  Shield,
  User,
  Globe,
  Plane,
  ShieldCheck,
  CheckCircle2,
  Building,
  Coins,
} from 'lucide-react';
import CountryFlag from '@/components/ui/CountryFlag';

interface MasterDiagnosticProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MasterDiagnosticModal({ isOpen, onClose }: MasterDiagnosticProps) {
  const [step, setStep] = useState(1);
  const [answers, setAnswers] = useState({
    businessType: 'ecommerce',
    annualProfit: 250000,
    currentTaxCountry: 'NL',
    privacyNeed: 'high',
    relocationInterest: 'no_remote_only',
  });

  const countryTaxRates: Record<string, number> = {
    NL: 0.48,
    DE: 0.45,
    FR: 0.45,
    UK: 0.40,
    IE: 0.375,
    US: 0.37,
    CA: 0.33,
    ES: 0.47,
    IT: 0.43,
    PT: 0.48,
    BE: 0.44,
    SG: 0.17,
    AE: 0.09,
    HK: 0.165,
  };

  const handleEscape = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  }, [onClose]);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, handleEscape]);

  if (!isOpen) return null;

  const handleNext = () => {
    if (step < 4) setStep(step + 1);
  };

  const handlePrev = () => {
    if (step > 1) setStep(step - 1);
  };

  const isGulfMatch = answers.relocationInterest === 'yes_uae' || answers.relocationInterest === 'yes_oman';
  const optimalCountry = isGulfMatch ? 'UAE Freezone (IFZA Dubai)' : 'Hong Kong (Offshore Entity)';
  const optimalCountryCode = isGulfMatch ? 'uae' : 'hk';
  const optimalTier = answers.privacyNeed === 'high' ? 'Tier 2 (Nominee UBO & Director)' : 'Tier 1 (Self as UBO)';
  const optimalTierCode = answers.privacyNeed === 'high' ? 'tier2' : 'tier1';

  const homeTaxRate = countryTaxRates[answers.currentTaxCountry] ?? 0.40;
  const estimatedHomeTax = Math.round(answers.annualProfit * homeTaxRate);
  const optimizedTax = isGulfMatch ? answers.annualProfit * 0.09 : 0;
  const netSavings = Math.round(estimatedHomeTax - optimizedTax);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 250,
        background: 'var(--modal-backdrop, rgba(20, 32, 74, 0.6))',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
      }}
      onClick={onClose}
    >
      <div
        className="card"
        style={{
          width: '100%',
          maxWidth: 500,
          background: 'var(--card-bg, #FFFFFF)',
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          borderBottomLeftRadius: 0,
          borderBottomRightRadius: 0,
          boxShadow: 'var(--shadow-xl)',
          padding: 20,
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
          maxHeight: '90vh',
          overflowY: 'auto',
          animation: 'slideUp 0.25s ease-out',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Handle Pill */}
        <div
          style={{
            width: 40,
            height: 4,
            borderRadius: 2,
            background: 'var(--border)',
            margin: '0 auto -4px',
          }}
        />

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Sparkles size={18} color="var(--orange)" />
            <span className="badge badge-orange">AI STRUCTURING DIAGNOSTIC</span>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="progress-track">
          <div className="progress-fill" style={{ width: `${(step / 4) * 100}%` }} />
        </div>

        {/* Step 1: Business Profile */}
        {step === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <h3 style={{ fontSize: 15, fontWeight: 800, color: 'var(--navy)' }}>
              Step 1 of 4: What is your primary business activity?
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {[
                { id: 'ecommerce', label: 'E-Commerce', desc: 'Amazon, Shopify dropshipping', icon: Globe },
                { id: 'saas', label: 'SaaS & AI Software', desc: 'Cloud digital products', icon: Sparkles },
                { id: 'agency', label: 'Agencies & Consulting', desc: 'Remote B2B client billing', icon: Building },
                { id: 'crypto', label: 'Fintech & Web3', desc: 'Capital gains & digital assets', icon: Coins },
              ].map((item) => {
                const Icon = item.icon;
                const isSel = answers.businessType === item.id;
                return (
                  <div
                    key={item.id}
                    onClick={() => setAnswers({ ...answers, businessType: item.id })}
                    className={`card card-hover ${isSel ? 'card-sand' : ''}`}
                    style={{
                      cursor: 'pointer',
                      border: isSel ? '1.5px solid var(--orange)' : undefined,
                      padding: 12,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 6,
                    }}
                  >
                    <Icon size={16} color="var(--orange)" />
                    <strong style={{ fontSize: 13, color: 'var(--navy)' }}>{item.label}</strong>
                    <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{item.desc}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 2: Income & Profit */}
        {step === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <h3 style={{ fontSize: 15, fontWeight: 800, color: 'var(--navy)' }}>
              Step 2 of 4: Estimated annual net taxable profit?
            </h3>
            <div className="card card-sand" style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>Estimated Annual Profit:</span>
                <span style={{ fontSize: 18, fontWeight: 800, color: 'var(--navy)', fontFamily: 'monospace' }}>
                  €{answers.annualProfit.toLocaleString()}
                </span>
              </div>
              <input
                type="range"
                min={50000}
                max={1000000}
                step={10000}
                value={answers.annualProfit}
                onChange={(e) => setAnswers({ ...answers, annualProfit: Number(e.target.value) })}
                style={{ width: '100%', accentColor: 'var(--orange)', cursor: 'pointer' }}
              />
            </div>

            <div>
              <label className="input-label">Current Country of Tax Residence:</label>
              <select
                value={answers.currentTaxCountry}
                onChange={(e) => setAnswers({ ...answers, currentTaxCountry: e.target.value })}
                className="input-field"
              >
                <option value="NL">Netherlands (48%)</option>
                <option value="DE">Germany (45%)</option>
                <option value="FR">France (45%)</option>
                <option value="UK">United Kingdom (40%)</option>
                <option value="IE">Ireland (37.5%)</option>
                <option value="US">United States (37%)</option>
                <option value="CA">Canada (33%)</option>
                <option value="ES">Spain (47%)</option>
                <option value="IT">Italy (43%)</option>
              </select>
            </div>
          </div>
        )}

        {/* Step 3: Privacy & Relocation */}
        {step === 3 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <h3 style={{ fontSize: 15, fontWeight: 800, color: 'var(--navy)' }}>
              Step 3 of 4: Privacy and Relocation Preference
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div
                onClick={() => setAnswers({ ...answers, privacyNeed: 'high' })}
                className={`card card-hover ${answers.privacyNeed === 'high' ? 'card-sand' : ''}`}
                style={{
                  cursor: 'pointer',
                  border: answers.privacyNeed === 'high' ? '1.5px solid var(--orange)' : undefined,
                  padding: 12,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                }}
              >
                <ShieldCheck size={20} color="var(--orange)" />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--navy)' }}>Nominee Privacy Shield</div>
                  <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>Keep identity 100% off public company registry</div>
                </div>
              </div>

              <div
                onClick={() => setAnswers({ ...answers, privacyNeed: 'standard' })}
                className={`card card-hover ${answers.privacyNeed === 'standard' ? 'card-sand' : ''}`}
                style={{
                  cursor: 'pointer',
                  border: answers.privacyNeed === 'standard' ? '1.5px solid var(--orange)' : undefined,
                  padding: 12,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                }}
              >
                <User size={20} color="var(--blue)" />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--navy)' }}>Direct Self-Listed UBO</div>
                  <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>List myself directly as registered director</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Summary Result */}
        {step === 4 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div
              className="card card-sand"
              style={{
                padding: 16,
                display: 'flex',
                alignItems: 'center',
                gap: 12,
              }}
            >
              <CountryFlag country={optimalCountryCode} size="lg" />
              <div>
                <span className="badge badge-orange" style={{ fontSize: 9 }}>OPTIMAL MATCH</span>
                <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--navy)' }}>{optimalCountry}</div>
                <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{optimalTier}</div>
              </div>
            </div>

            <div
              className="card"
              style={{
                background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
                padding: 16,
                color: 'white',
              }}
            >
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase' }}>
                ESTIMATED ANNUAL CASH SAVINGS
              </div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--orange)', marginTop: 2 }}>
                +€{netSavings.toLocaleString()} / year
              </div>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 4 }}>
                Based on €{answers.annualProfit.toLocaleString()} profit vs {answers.currentTaxCountry} tax.
              </p>
            </div>
          </div>
        )}

        {/* Footer Navigation */}
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, marginTop: 4 }}>
          {step > 1 && step < 4 && (
            <button onClick={handlePrev} className="btn btn-secondary btn-sm">
              <ArrowLeft size={14} /> Back
            </button>
          )}

          {step < 4 ? (
            <button onClick={handleNext} className="btn btn-primary btn-sm" style={{ marginLeft: 'auto' }}>
              <span>Continue</span>
              <ArrowRight size={14} />
            </button>
          ) : (
            <Link
              href={`/setup?country=${optimalCountryCode}&tier=${optimalTierCode}`}
              onClick={onClose}
              className="btn btn-primary btn-lg"
              style={{ width: '100%', justifyContent: 'center' }}
            >
              <span>Launch This Formation Package →</span>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
