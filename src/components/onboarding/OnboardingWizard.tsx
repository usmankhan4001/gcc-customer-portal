'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Sparkles,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Building,
  Shield,
  Globe,
  Plane,
  Coins,
} from 'lucide-react';

export default function OnboardingWizard() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [step, setStep] = useState(1);
  const [activity, setActivity] = useState('ecommerce');
  const [jurisdiction, setJurisdiction] = useState('hk');
  const [tier, setTier] = useState<'tier1' | 'tier2' | 'tier3'>('tier2');
  const [selectedAddons, setSelectedAddons] = useState<string[]>(['bank_standard']);
  const [companyName, setCompanyName] = useState('');

  useEffect(() => {
    const qCountry = searchParams.get('country');
    const qTier = searchParams.get('tier');
    const qName = searchParams.get('name');

    if (qCountry && ['hk', 'uae', 'singapore', 'bahrain', 'ireland', 'oman'].includes(qCountry)) {
      setJurisdiction(qCountry);
    }
    if (qTier && ['tier1', 'tier2', 'tier3'].includes(qTier)) {
      setTier(qTier as any);
    }
    if (qName) {
      setCompanyName(decodeURIComponent(qName));
    }
  }, [searchParams]);

  const JURISDICTIONS = [
    {
      id: 'hk',
      name: 'Hong Kong (Offshore Entity)',
      flag: '🇭🇰',
      taxRate: '0% Foreign-Sourced Tax',
      timeline: '2-4 Business Days',
      bestFor: 'E-commerce, SaaS, Digital Agencies',
      basePrice: 1500,
    },
    {
      id: 'uae',
      name: 'UAE Freezone (Dubai / IFZA)',
      flag: '🇦🇪',
      taxRate: '0% - 9% Corporate Tax',
      timeline: '5-7 Business Days',
      bestFor: 'Founders relocating to Dubai, UAE Visas',
      basePrice: 1500,
    },
    {
      id: 'singapore',
      name: 'Singapore Private Limited',
      flag: '🇸🇬',
      taxRate: '8.5% Effective Startup Rate',
      timeline: '3-5 Business Days',
      bestFor: 'Venture Capital, Enterprise Tech, IP Holding',
      basePrice: 1800,
    },
    {
      id: 'bahrain',
      name: 'Bahrain W.L.L.',
      flag: '🇧🇭',
      taxRate: '0% Corporate Tax',
      timeline: '7-10 Business Days',
      bestFor: 'Saudi Arabia & GCC Gateway',
      basePrice: 1600,
    },
    {
      id: 'ireland',
      name: 'Ireland Non-Resident Ltd',
      flag: '🇮🇪',
      taxRate: '12.5% Trading Tax',
      timeline: '5-7 Business Days',
      bestFor: 'EU Stripe & European Single Market access',
      basePrice: 1700,
    },
    {
      id: 'oman',
      name: 'Oman LLC (Sultanate of Oman)',
      flag: '🇴🇲',
      taxRate: '15% Flat Corporate Rate',
      timeline: '10-14 Business Days',
      bestFor: 'Muslim Family Relocation, Real Estate',
      basePrice: 1700,
    },
  ];

  const TIERS = [
    {
      id: 'tier1',
      title: 'Tier 1: Self as UBO & Director',
      price: 2000,
      breakdown: '$1,500 Formation + $500 Bank Opening',
      description: 'You are listed directly on the government registry as Director and Shareholder.',
      features: [
        '100% Beneficial Ownership registered directly',
        'Official Certificate of Incorporation & E-MoA',
        'Fintech / Corporate Bank Account Setup Assistance',
        '1 Year Registered Agent & Address Included',
      ],
    },
    {
      id: 'tier2',
      title: 'Tier 2: Nominee UBO & Director',
      badge: 'MOST POPULAR • 100% PRIVATE',
      price: 3000,
      breakdown: '$1,500 Formation + $500 Bank + $1,000 Nominee',
      description: 'Your identity is shielded behind a licensed Nominee Director & Trustee Shareholder.',
      features: [
        'Full Nominee Director & Shareholder Service',
        'Irrevocable Power of Attorney (PoA) issued to you',
        'Beneficial Ownership Declaration & Trust Agreement',
        'Bank Account Signatory Assistance with Nominee',
        'Guaranteed 100% Public Registry Anonymity',
      ],
    },
    {
      id: 'tier3',
      title: 'Tier 3: Shelf Company (Aged Entity)',
      badge: 'INSTANT 24H HANDOVER',
      price: 2500,
      breakdown: '$2,000 Aged Entity Transfer + $500 Bank Handover',
      description: 'Acquire a pre-registered vintage entity with existing history and active bank accounts.',
      features: [
        'Pre-registered aged company (1 to 3 years old)',
        'Immediate 24-48 hour ownership transfer',
        'Pre-vetted banking rails ready for processing',
        'Instant credibility with global enterprise clients',
      ],
    },
  ];

  const ADDONS = [
    {
      id: 'bank_extra',
      title: 'Secondary Bank Account Setup (Airwallex + Wise)',
      price: 500,
      desc: 'Dual redundancy payment channels for seamless multi-currency processing.',
    },
    {
      id: 'uae_visa_vip',
      title: 'UAE Investor Residency Visa & VIP Medical Concierge',
      price: 1500,
      desc: '2-Year UAE Residence Visa, VIP blood test, and Emirates ID biometric escort.',
    },
    {
      id: 'tax_trn',
      title: 'UAE Corporate Tax & VAT TRN Registration Pack',
      price: 350,
      desc: 'Federal Tax Authority registration and official TRN certificate issuance.',
    },
    {
      id: 'express_filing',
      title: '24-Hour Express Government Filing Priority',
      price: 300,
      desc: 'Priority queue placement with official registry reviewers.',
    },
  ];

  const selectedTierObj = TIERS.find((t) => t.id === tier) || TIERS[1];
  const selectedJurisdictionObj = JURISDICTIONS.find((j) => j.id === jurisdiction) || JURISDICTIONS[0];

  const addonsTotal = selectedAddons.reduce((sum, addonId) => {
    const addon = ADDONS.find((a) => a.id === addonId);
    return sum + (addon ? addon.price : 0);
  }, 0);

  const grandTotal = selectedTierObj.price + addonsTotal;

  const toggleAddon = (addonId: string) => {
    if (selectedAddons.includes(addonId)) {
      setSelectedAddons(selectedAddons.filter((id) => id !== addonId));
    } else {
      setSelectedAddons([...selectedAddons, addonId]);
    }
  };

  const handleProceedToCheckout = () => {
    const params = new URLSearchParams({
      country: jurisdiction,
      tier: tier,
      total: grandTotal.toString(),
      addons: selectedAddons.join(','),
      name: companyName || `${selectedJurisdictionObj.name.split(' ')[0]} Enterprise Ltd`,
    });
    router.push(`/checkout?${params.toString()}`);
  };

  return (
    <div className="wizard-container">
      {/* Step Header */}
      <div className="wizard-step-header card">
        {[
          { num: 1, label: 'Activity' },
          { num: 2, label: 'Country' },
          { num: 3, label: 'Tier' },
          { num: 4, label: 'Add-Ons' },
          { num: 5, label: 'Summary' },
        ].map((s) => (
          <div
            key={s.num}
            onClick={() => s.num <= step && setStep(s.num)}
            className={`step-indicator ${step === s.num ? 'current' : step > s.num ? 'done' : ''}`}
          >
            <div className="step-num">{step > s.num ? '✓' : s.num}</div>
            <span className="step-label">{s.label}</span>
          </div>
        ))}
      </div>

      {/* STEP 1: Activity */}
      {step === 1 && (
        <div className="step-card card">
          <div className="step-title-box">
            <div className="badge badge-navy">STEP 1 OF 5</div>
            <h2 className="step-heading display-font">What is your primary business activity?</h2>
            <p className="step-subheading">
              We tailor your corporate structuring and banking strategy to your specific industry.
            </p>
          </div>

          <div className="activity-grid">
            {[
              {
                id: 'ecommerce',
                title: 'E-Commerce / Amazon / Dropshipping',
                icon: Globe,
                desc: 'Global online retail, Shopify, Amazon FBA, international fulfillment.',
              },
              {
                id: 'saas',
                title: 'SaaS, Software & Digital Products',
                icon: Sparkles,
                desc: 'Digital subscription software, mobile apps, API platforms.',
              },
              {
                id: 'agency',
                title: 'Agency / Consulting / Remote Services',
                icon: Building,
                desc: 'Marketing agencies, IT consulting, high-ticket B2B service providers.',
              },
              {
                id: 'crypto',
                title: 'Crypto / Web3 / Digital Assets',
                icon: Coins,
                desc: 'Blockchain advisory, staking, trading, Web3 project treasury.',
              },
              {
                id: 'relocation',
                title: 'UAE Lifestyle & Tax Relocation',
                icon: Plane,
                desc: 'Moving personal residence to Dubai for 0% personal income tax and golden visas.',
              },
              {
                id: 'holding',
                title: 'Holding Company & Group Structuring',
                icon: Shield,
                desc: 'Holding shares in operating subsidiaries, IP licensing, family wealth.',
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.id}
                  onClick={() => setActivity(item.id)}
                  className={`activity-box card ${activity === item.id ? 'active' : ''}`}
                >
                  <div className="act-icon-box">
                    <Icon className="w-5 h-5 text-orange" />
                  </div>
                  <h3 className="act-title display-font">{item.title}</h3>
                  <p className="act-desc">{item.desc}</p>
                </div>
              );
            })}
          </div>

          <div className="step-actions">
            <button onClick={() => setStep(2)} className="btn btn-primary btn-lg ml-auto">
              <span>Continue to Jurisdiction</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: Jurisdiction */}
      {step === 2 && (
        <div className="step-card card">
          <div className="step-title-box">
            <div className="badge badge-navy">STEP 2 OF 5</div>
            <h2 className="step-heading display-font">Choose Your Formation Jurisdiction</h2>
            <p className="step-subheading">
              Select the optimal country for your tax optimization and banking requirements.
            </p>
          </div>

          <div className="jurisdictions-grid">
            {JURISDICTIONS.map((j) => (
              <div
                key={j.id}
                onClick={() => setJurisdiction(j.id)}
                className={`jurisdiction-box card ${jurisdiction === j.id ? 'active' : ''}`}
              >
                <div className="jur-top">
                  <span className="jur-flag">{j.flag}</span>
                  <span className="badge badge-blue">{j.taxRate}</span>
                </div>
                <h3 className="jur-name display-font">{j.name}</h3>
                <p className="jur-desc"><strong>Best for:</strong> {j.bestFor}</p>
                <div className="jur-footer">
                  <span>⏱️ {j.timeline}</span>
                  <span className="jur-base-price text-navy font-bold">From ${j.basePrice}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="step-actions">
            <button onClick={() => setStep(1)} className="btn btn-secondary">
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
            <button onClick={() => setStep(3)} className="btn btn-primary btn-lg">
              <span>Select Package Tier</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Tiers */}
      {step === 3 && (
        <div className="step-card card">
          <div className="step-title-box">
            <div className="badge badge-navy">STEP 3 OF 5</div>
            <h2 className="step-heading display-font">Select Service Tier</h2>
            <p className="step-subheading">
              All tiers include official government filing, company documents, and banking assistance.
            </p>
          </div>

          <div className="tiers-grid">
            {TIERS.map((t) => (
              <div
                key={t.id}
                onClick={() => setTier(t.id as any)}
                className={`tier-card card ${tier === t.id ? 'active-tier' : ''}`}
              >
                {t.badge && <div className="badge badge-orange mb-2">{t.badge}</div>}
                <h3 className="tier-card-title display-font">{t.title}</h3>
                <div className="tier-price-row">
                  <span className="tier-price display-font text-navy">${t.price.toLocaleString()}</span>
                  <span className="tier-sub-price">total</span>
                </div>
                <p className="tier-breakdown text-tertiary">{t.breakdown}</p>
                <p className="tier-desc-text">{t.description}</p>

                <div className="tier-features-list">
                  {t.features.map((feat, idx) => (
                    <div key={idx} className="tier-feat-item">
                      <CheckCircle2 className="w-4 h-4 text-orange shrink-0" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="step-actions">
            <button onClick={() => setStep(2)} className="btn btn-secondary">
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
            <button onClick={() => setStep(4)} className="btn btn-primary btn-lg">
              <span>Configure Add-Ons</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: Add-Ons */}
      {step === 4 && (
        <div className="step-card card">
          <div className="step-title-box">
            <div className="badge badge-navy">STEP 4 OF 5</div>
            <h2 className="step-heading display-font">Optional Enterprise Add-Ons</h2>
            <p className="step-subheading">
              Enhance your structure with additional banking channels, UAE residency visas, or tax TRN registration.
            </p>
          </div>

          <div className="addons-grid">
            {ADDONS.map((addon) => {
              const isChecked = selectedAddons.includes(addon.id);
              return (
                <div
                  key={addon.id}
                  onClick={() => toggleAddon(addon.id)}
                  className={`addon-card card ${isChecked ? 'active-addon' : ''}`}
                >
                  <div className="addon-left">
                    <div className={`checkbox-box ${isChecked ? 'checked' : ''}`}>
                      {isChecked && <CheckCircle2 className="w-4 h-4 text-orange" />}
                    </div>
                    <div>
                      <h4 className="addon-title display-font">{addon.title}</h4>
                      <p className="addon-desc">{addon.desc}</p>
                    </div>
                  </div>
                  <div className="addon-price display-font text-navy">+${addon.price}</div>
                </div>
              );
            })}
          </div>

          <div className="step-actions">
            <button onClick={() => setStep(3)} className="btn btn-secondary">
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
            <button onClick={() => setStep(5)} className="btn btn-primary btn-lg">
              <span>Review Proposal & Pricing</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 5: Proposal Summary */}
      {step === 5 && (
        <div className="step-card card">
          <div className="step-title-box">
            <div className="badge badge-orange">STEP 5 OF 5 • READY TO INITIATE</div>
            <h2 className="step-heading display-font">Executive Formation Proposal</h2>
            <p className="step-subheading">
              Review your customized incorporation package and proceed to instant 1-page checkout.
            </p>
          </div>

          {/* Company Name Input */}
          <div className="name-input-section">
            <label className="input-label">Proposed Company Name (Can be updated later):</label>
            <input
              type="text"
              placeholder="e.g. Apex Global Horizon Ltd"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="input-field"
            />
          </div>

          {/* Itemized Order Summary Box */}
          <div className="summary-invoice-box card-sand">
            <div className="invoice-header">
              <span className="display-font text-navy">ITEMIZED PACKAGE SPECIFICATION</span>
              <span className="badge badge-navy">100% FIXED PRICE</span>
            </div>

            <div className="invoice-row">
              <div>
                <strong className="text-navy">{selectedJurisdictionObj.name} Formation</strong>
                <span className="row-sub text-secondary">{selectedTierObj.title}</span>
              </div>
              <div className="row-price display-font text-navy">${selectedTierObj.price.toLocaleString()}</div>
            </div>

            {selectedAddons.map((addonId) => {
              const addon = ADDONS.find((a) => a.id === addonId);
              if (!addon) return null;
              return (
                <div key={addonId} className="invoice-row addon-row">
                  <div>
                    <span>{addon.title}</span>
                  </div>
                  <div className="row-price display-font text-navy">+${addon.price}</div>
                </div>
              );
            })}

            <div className="invoice-divider" />

            <div className="invoice-total-row">
              <div>
                <span className="total-label display-font text-navy">TOTAL ALL-INCLUSIVE COST</span>
                <span className="total-sub text-tertiary">Includes government fees, banking onboarding, & 1st year registered agent</span>
              </div>
              <div className="total-price display-font text-orange">
                ${grandTotal.toLocaleString()}
              </div>
            </div>
          </div>

          {/* Money Back Guarantee */}
          <div className="guarantee-badge-box card-blue-lt">
            <Shield className="w-5 h-5 text-blue shrink-0" />
            <span className="text-sm text-navy">
              <strong>Guaranteed Banking Onboarding:</strong> Full refund on banking setup fees if your corporate account is not successfully approved.
            </span>
          </div>

          <div className="step-actions">
            <button onClick={() => setStep(4)} className="btn btn-secondary">
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
            <button onClick={handleProceedToCheckout} className="btn btn-primary btn-lg">
              <span>Proceed to 1-Page Checkout (${grandTotal.toLocaleString()})</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      <style jsx>{`
        .wizard-container {
          max-width: 960px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 24px;
          width: 100%;
        }

        .wizard-step-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 28px;
          border-radius: var(--radius-pill);
          overflow-x: auto;
        }

        .step-indicator {
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          opacity: 0.6;
          transition: all 0.2s ease;
        }

        .step-indicator.current {
          opacity: 1;
        }

        .step-indicator.done {
          opacity: 0.9;
        }

        .step-num {
          width: 30px;
          height: 30px;
          border-radius: 50%;
          background: var(--sand);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 13px;
          color: var(--navy);
        }

        .step-indicator.current .step-num {
          background: var(--orange);
          color: #FFFFFF;
        }

        .step-indicator.done .step-num {
          background: var(--blue-lt);
          color: var(--blue);
        }

        .step-label {
          font-size: 14px;
          font-weight: 700;
          color: var(--navy);
        }

        .step-card {
          padding: 36px 32px;
          display: flex;
          flex-direction: column;
          gap: 28px;
        }

        .step-title-box {
          text-align: left;
        }

        .step-heading {
          font-size: 2.2rem;
          font-weight: 700;
          margin: 8px 0 4px 0;
          color: var(--navy);
        }

        .step-subheading {
          color: var(--text-secondary);
          font-size: 16px;
        }

        .activity-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
          gap: 16px;
        }

        .activity-box {
          padding: 20px;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .activity-box:hover {
          border-color: var(--navy);
        }

        .activity-box.active {
          border-color: var(--orange);
          background: var(--orange-lt);
        }

        .act-icon-box {
          width: 38px;
          height: 38px;
          background: var(--orange-lt);
          border-radius: var(--radius-sm);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 4px;
        }

        .act-title {
          font-size: 16px;
          font-weight: 700;
          color: var(--navy);
        }

        .act-desc {
          font-size: 13px;
          color: var(--text-secondary);
          line-height: 1.4;
        }

        .jurisdictions-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
          gap: 16px;
        }

        .jurisdiction-box {
          padding: 20px;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .jurisdiction-box:hover {
          border-color: var(--navy);
        }

        .jurisdiction-box.active {
          border-color: var(--orange);
          background: var(--orange-lt);
        }

        .jur-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .jur-flag {
          font-size: 1.8rem;
        }

        .jur-name {
          font-size: 17px;
          font-weight: 700;
          color: var(--navy);
        }

        .jur-desc {
          font-size: 13px;
          color: var(--text-secondary);
        }

        .jur-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: auto;
          padding-top: 10px;
          border-top: 1px solid var(--border);
          font-size: 12px;
          color: var(--text-tertiary);
        }

        .tiers-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
          gap: 16px;
        }

        .tier-card {
          padding: 24px;
          cursor: pointer;
          transition: all 0.25s ease;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .tier-card:hover {
          border-color: var(--navy);
        }

        .tier-card.active-tier {
          border-color: var(--orange);
          box-shadow: 0 0 0 2px var(--orange);
        }

        .tier-card-title {
          font-size: 17px;
          color: var(--navy);
        }

        .tier-price-row {
          display: flex;
          align-items: baseline;
          gap: 6px;
        }

        .tier-price {
          font-size: 2rem;
          font-weight: 700;
        }

        .tier-sub-price {
          font-size: 13px;
          color: var(--text-tertiary);
        }

        .tier-breakdown {
          font-size: 12px;
        }

        .tier-desc-text {
          font-size: 13px;
          color: var(--text-secondary);
          line-height: 1.35;
        }

        .tier-features-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-top: 8px;
          border-top: 1px solid var(--border);
          padding-top: 12px;
        }

        .tier-feat-item {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          font-size: 13px;
          color: var(--text-secondary);
        }

        .addons-grid {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .addon-card {
          padding: 18px 22px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .addon-card:hover {
          border-color: var(--navy);
        }

        .addon-card.active-addon {
          border-color: var(--orange);
          background: var(--orange-lt);
        }

        .addon-left {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .checkbox-box {
          width: 22px;
          height: 22px;
          border-radius: var(--radius-sm);
          border: 1px solid var(--border);
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--surface);
        }

        .checkbox-box.checked {
          border-color: var(--orange);
          background: var(--orange-lt);
        }

        .addon-title {
          font-size: 15px;
          font-weight: 700;
          color: var(--navy);
        }

        .addon-desc {
          font-size: 13px;
          color: var(--text-secondary);
        }

        .addon-price {
          font-size: 1.2rem;
          font-weight: 700;
        }

        .summary-invoice-box {
          padding: 24px;
          border-radius: var(--radius);
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .invoice-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 0.04em;
        }

        .invoice-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 15px;
        }

        .addon-row {
          font-size: 14px;
          color: var(--text-secondary);
        }

        .row-sub {
          display: block;
          font-size: 12px;
        }

        .row-price {
          font-weight: 700;
        }

        .invoice-divider {
          height: 1px;
          background: var(--border);
          margin: 6px 0;
        }

        .invoice-total-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .total-label {
          font-size: 16px;
          font-weight: 700;
          display: block;
        }

        .total-sub {
          font-size: 12px;
        }

        .total-price {
          font-size: 2.4rem;
          font-weight: 700;
        }

        .guarantee-badge-box {
          padding: 14px 20px;
          border-radius: var(--radius);
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .step-actions {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          margin-top: 10px;
        }
      `}</style>
    </div>
  );
}
