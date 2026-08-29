'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Sparkles, ArrowRight, X, ArrowLeft } from 'lucide-react';

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

  if (!isOpen) return null;

  const handleNext = () => {
    if (step < 4) setStep(step + 1);
  };

  const handlePrev = () => {
    if (step > 1) setStep(step - 1);
  };

  const isGulfMatch = answers.relocationInterest === 'yes_uae' || answers.relocationInterest === 'yes_oman';
  const optimalCountry = isGulfMatch ? 'UAE Freezone (IFZA/DMCC)' : 'Hong Kong (Offshore)';
  const optimalCountryCode = isGulfMatch ? 'uae' : 'hk';
  const optimalTier = answers.privacyNeed === 'high' ? 'Tier 2 (Nominee UBO & Director)' : 'Tier 1 (Self as UBO)';
  const optimalTierCode = answers.privacyNeed === 'high' ? 'tier2' : 'tier1';
  
  const estimatedHomeTax = answers.annualProfit * 0.48;
  const optimizedTax = isGulfMatch ? answers.annualProfit * 0.09 : 0;
  const netSavings = Math.round(estimatedHomeTax - optimizedTax);

  return (
    <div className="modal-backdrop">
      <div className="modal-card card">
        {/* Header */}
        <div className="modal-header">
          <div className="badge badge-orange">
            <Sparkles className="w-3.5 h-3.5" />
            <span>3-MINUTE 360° DIAGNOSTIC ENGINE</span>
          </div>
          <button onClick={onClose} className="close-btn">
            <X className="w-5 h-5 text-navy" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="progress-bar-container">
          <div className="progress-fill" style={{ width: `${(step / 4) * 100}%` }} />
        </div>

        {/* Step 1: Business Profile */}
        {step === 1 && (
          <div className="step-body">
            <h3 className="step-title display-font">Step 1 of 4: What is your primary business activity?</h3>
            <div className="options-grid">
              {[
                { id: 'ecommerce', label: 'E-Commerce / Amazon / Dropshipping', desc: 'Selling physical goods globally' },
                { id: 'saas', label: 'SaaS / AI / Software Products', desc: 'Digital subscription software' },
                { id: 'agency', label: 'Agency / Consulting / Freelance', desc: 'Services & remote client billing' },
                { id: 'crypto', label: 'Crypto / Web3 / Trading', desc: 'Capital gains & digital assets' },
              ].map((item) => (
                <div
                  key={item.id}
                  onClick={() => setAnswers({ ...answers, businessType: item.id })}
                  className={`opt-card card ${answers.businessType === item.id ? 'active' : ''}`}
                >
                  <strong className="opt-title text-navy">{item.label}</strong>
                  <span className="opt-desc">{item.desc}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Income & Profit */}
        {step === 2 && (
          <div className="step-body">
            <h3 className="step-title display-font">Step 2 of 4: What is your estimated annual profit?</h3>
            <div className="slider-wrapper card-sand">
              <div className="profit-value display-font text-navy">
                €{answers.annualProfit.toLocaleString()}
              </div>
              <input
                type="range"
                min={50000}
                max={1000000}
                step={10000}
                value={answers.annualProfit}
                onChange={(e) => setAnswers({ ...answers, annualProfit: Number(e.target.value) })}
                className="w-full"
              />
              <div className="slider-labels">
                <span>€50,000</span>
                <span>€500,000</span>
                <span>€1,000,000+</span>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Privacy & Relocation */}
        {step === 3 && (
          <div className="step-body">
            <h3 className="step-title display-font">Step 3 of 4: What are your privacy & relocation goals?</h3>
            
            <label className="input-label">Public Registry Privacy Requirement:</label>
            <div className="options-grid" style={{ marginBottom: '16px' }}>
              <div
                onClick={() => setAnswers({ ...answers, privacyNeed: 'high' })}
                className={`opt-card card ${answers.privacyNeed === 'high' ? 'active' : ''}`}
              >
                <strong className="opt-title text-navy">🛡️ High Privacy (Nominee Shield)</strong>
                <span className="opt-desc">Keep my name 100% off public company registries</span>
              </div>
              <div
                onClick={() => setAnswers({ ...answers, privacyNeed: 'standard' })}
                className={`opt-card card ${answers.privacyNeed === 'standard' ? 'active' : ''}`}
              >
                <strong className="opt-title text-navy">👤 Standard (Self UBO)</strong>
                <span className="opt-desc">I am comfortable listing my name as direct director</span>
              </div>
            </div>

            <label className="input-label">Relocation Preference:</label>
            <div className="options-grid">
              <div
                onClick={() => setAnswers({ ...answers, relocationInterest: 'no_remote_only' })}
                className={`opt-card card ${answers.relocationInterest === 'no_remote_only' ? 'active' : ''}`}
              >
                <strong className="opt-title text-navy">💻 100% Remote Operation</strong>
                <span className="opt-desc">Manage everything online with fintech banking</span>
              </div>
              <div
                onClick={() => setAnswers({ ...answers, relocationInterest: 'yes_uae' })}
                className={`opt-card card ${answers.relocationInterest === 'yes_uae' ? 'active' : ''}`}
              >
                <strong className="opt-title text-navy">✈️ Move to UAE (Residency Visas)</strong>
                <span className="opt-desc">Tax residency, Emirates ID & physical bank accounts</span>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Summary Match */}
        {step === 4 && (
          <div className="step-body">
            <div className="badge badge-navy" style={{ alignSelf: 'center' }}>
              <Sparkles className="w-3.5 h-3.5 text-orange" />
              <span>CUSTOM STRUCTURING ROADMAP GENERATED</span>
            </div>

            <div className="diagnostic-summary-grid">
              <div className="summary-box card-sand">
                <span className="sum-label text-tertiary">OPTIMAL JURISDICTION</span>
                <div className="sum-val display-font text-navy">{optimalCountry}</div>
                <span className="sum-sub">100% Foreign Ownership • Fast Fintech Banking</span>
              </div>

              <div className="summary-box card-blue-lt">
                <span className="sum-label text-blue font-bold">RECOMMENDED TIER</span>
                <div className="sum-val display-font text-navy">{optimalTier}</div>
                <span className="sum-sub">Includes Banking Onboarding Guarantee</span>
              </div>
            </div>

            <div className="summary-roi-banner card-navy">
              <span className="roi-label text-orange">ESTIMATED NET ANNUAL CASH SAVINGS</span>
              <div className="roi-val display-font text-white">+€{netSavings.toLocaleString()} / year</div>
              <p className="roi-desc">Based on €{answers.annualProfit.toLocaleString()} profit compared to European baseline rates.</p>
            </div>
          </div>
        )}

        {/* Footer Navigation */}
        <div className="modal-footer">
          {step > 1 && step < 4 && (
            <button onClick={handlePrev} className="btn btn-secondary btn-sm">
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
          )}

          {step < 4 ? (
            <button onClick={handleNext} className="btn btn-primary btn-sm" style={{ marginLeft: 'auto' }}>
              <span>Continue</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <Link
              href={`/setup?country=${optimalCountryCode}&tier=${optimalTierCode}&profit=${answers.annualProfit}`}
              className="btn btn-primary btn-lg"
              style={{ width: '100%', justifyContent: 'center' }}
            >
              <span>Launch This Formation Package</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
          )}
        </div>

        <style jsx>{`
          .modal-backdrop {
            position: fixed;
            inset: 0;
            z-index: 200;
            background: rgba(20, 32, 74, 0.6);
            backdrop-filter: blur(8px);
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
          }

          .modal-card {
            width: 100%;
            max-width: 680px;
            padding: 32px;
            display: flex;
            flex-direction: column;
            gap: 20px;
            box-shadow: 0 20px 60px rgba(20, 32, 74, 0.2);
          }

          .modal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
          }

          .close-btn {
            background: var(--sand);
            border: 1px solid var(--sand-dk);
            border-radius: var(--radius-pill);
            width: 34px;
            height: 34px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
          }

          .progress-bar-container {
            width: 100%;
            height: 6px;
            background: #E5E7EB;
            border-radius: var(--radius-pill);
            overflow: hidden;
          }

          .progress-fill {
            height: 100%;
            background: var(--orange);
            transition: width 0.3s ease;
          }

          .step-body {
            display: flex;
            flex-direction: column;
            gap: 16px;
          }

          .step-title {
            font-size: 1.4rem;
            font-weight: 700;
            color: var(--navy);
          }

          .options-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
          }

          @media (max-width: 600px) {
            .options-grid {
              grid-template-columns: 1fr;
            }
          }

          .opt-card {
            padding: 16px;
            cursor: pointer;
            transition: all 0.2s ease;
            display: flex;
            flex-direction: column;
            gap: 4px;
          }

          .opt-card:hover {
            border-color: var(--navy);
          }

          .opt-card.active {
            border-color: var(--orange);
            background: var(--orange-lt);
          }

          .opt-title {
            font-size: 14px;
          }

          .opt-desc {
            font-size: 12px;
            color: var(--text-secondary);
          }

          .slider-wrapper {
            padding: 24px;
            border-radius: var(--radius);
            display: flex;
            flex-direction: column;
            gap: 12px;
          }

          .profit-value {
            font-size: 2.2rem;
            font-weight: 700;
            text-align: center;
          }

          .slider-labels {
            display: flex;
            justify-content: space-between;
            font-size: 12px;
            color: var(--text-tertiary);
          }

          .diagnostic-summary-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 14px;
          }

          .summary-box {
            padding: 18px;
            border-radius: var(--radius);
          }

          .sum-label {
            font-size: 11px;
            font-weight: 700;
            letter-spacing: 0.05em;
            display: block;
            margin-bottom: 4px;
          }

          .sum-val {
            font-size: 1.2rem;
            font-weight: 700;
            margin-bottom: 2px;
          }

          .sum-sub {
            font-size: 12px;
            color: var(--text-secondary);
          }

          .summary-roi-banner {
            padding: 24px;
            border-radius: var(--radius);
            text-align: center;
          }

          .roi-label {
            font-size: 12px;
            font-weight: 700;
            letter-spacing: 0.08em;
          }

          .roi-val {
            font-size: 2.2rem;
            font-weight: 700;
            margin: 4px 0;
          }

          .roi-desc {
            font-size: 13px;
            opacity: 0.9;
          }

          .modal-footer {
            display: flex;
            align-items: center;
            gap: 12px;
            margin-top: 10px;
          }
        `}</style>
      </div>
    </div>
  );
}
