'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Building,
  Shield,
  Globe,
  Plane,
  Coins,
  Sparkles,
  Check,
  ShoppingCart,
  Lock,
  Zap,
} from 'lucide-react';
import CountryFlag from '@/components/ui/CountryFlag';
import StickyFooter from '@/components/ui/StickyFooter';

/* ──────────────────────────────────────────────
   DATA (De-slopified with zero emojis)
   ────────────────────────────────────────────── */

const ACTIVITIES = [
  { id: 'ecommerce', label: 'E-Commerce', icon: Globe, desc: 'Amazon, Shopify, cross-border dropshipping' },
  { id: 'saas', label: 'SaaS & Software', icon: Sparkles, desc: 'Digital products, APIs, cloud subscriptions' },
  { id: 'consulting', label: 'Consulting & Advisory', icon: Building, desc: 'Agencies, strategic advisory, B2B services' },
  { id: 'digital', label: 'Digital Media & Web3', icon: Coins, desc: 'Fintech, digital assets, online media' },
  { id: 'physical', label: 'Trading & Logistics', icon: Plane, desc: 'Import, export, global logistics' },
  { id: 'other', label: 'Holding & Investment', icon: Shield, desc: 'IP holding, asset protection, wealth management' },
];

const JURISDICTIONS = [
  { id: 'uae', name: 'UAE Freezone (IFZA Dubai)', taxRate: '0%–9% Corporate Tax', price: 1500, highlight: 'Emirates ID & Residency' },
  { id: 'hk', name: 'Hong Kong (Offshore Entity)', taxRate: '0% Foreign-Sourced', price: 1500, highlight: '100% Remote Biometric Pass' },
  { id: 'singapore', name: 'Singapore Private Limited', taxRate: '8.5% Effective Startup Rate', price: 1800, highlight: 'Tier 1 Global Prestige' },
  { id: 'bahrain', name: 'Bahrain W.L.L. (GCC Gateway)', taxRate: '0% Corporate Tax', price: 1600, highlight: '100% Foreign Ownership' },
  { id: 'ireland', name: 'Ireland Non-Resident Ltd', taxRate: '12.5% Trading Rate', price: 1700, highlight: 'Access to European SEPA IBANs' },
  { id: 'oman', name: 'Oman LLC (Sultanate of Oman)', taxRate: '0% Freezone Rate', price: 1700, highlight: 'GCC Customs & Tariffs Union' },
];

const TIERS = [
  {
    id: 'tier1',
    title: 'Tier 1: Self UBO & Director',
    price: 2000,
    breakdown: '$1,500 Formation + $500 Bank Assistance',
    desc: 'You are registered directly on the official government registry as Director and Shareholder.',
    features: [
      '100% Beneficial Ownership registered directly',
      'Certificate of Incorporation & Official E-MoA',
      'Corporate Banking Setup Assistance',
      '1 Year Registered Agent & Statutory Office',
    ],
  },
  {
    id: 'tier2',
    title: 'Tier 2: Nominee UBO & Director',
    badge: 'MOST POPULAR',
    price: 3000,
    breakdown: '$1,500 Formation + $500 Bank + $1,000 Nominee',
    desc: 'Your identity is fully shielded behind a licensed Nominee Director & Trustee Shareholder.',
    features: [
      'Full Nominee Director & Shareholder Service',
      'Irrevocable Power of Attorney (PoA)',
      'Beneficial Ownership Declaration & Trust Deed',
      'Bank Account Signatory Assistance',
      '100% Public Registry Privacy',
    ],
  },
  {
    id: 'tier3',
    title: 'Tier 3: Shelf Company (Aged)',
    badge: 'INSTANT 24H',
    price: 2500,
    breakdown: '$2,000 Aged Entity + $500 Bank Handover',
    desc: 'Acquire a pre-registered vintage entity with existing corporate track record.',
    features: [
      'Pre-registered aged company (1–3 years vintage)',
      'Immediate 24–48 hour ownership transfer',
      'Pre-vetted corporate banking rails ready',
      'Instant institutional credibility',
    ],
  },
];

const ADDONS = [
  { id: 'bank_extra', title: 'Secondary Multi-Currency Bank (Airwallex + Wise)', price: 500, desc: 'Dual redundancy payment channels.' },
  { id: 'uae_visa', title: 'UAE Investor Residency Visa & Emirates ID', price: 1500, desc: '2-Year UAE Residence Visa, VIP medical, Emirates ID.' },
  { id: 'tax_trn', title: 'UAE Federal Tax & VAT TRN Registration', price: 350, desc: 'Official FTA registration & TRN certificate.' },
  { id: 'express', title: '24-Hour Express Registry Filing', price: 300, desc: 'Priority queue with official registry reviewers.' },
];

const STEP_LABELS = ['Activity', 'Jurisdiction', 'Tier', 'Add-Ons', 'Summary'];

type ActivityId = string;
type JurisdictionId = string;
type TierId = 'tier1' | 'tier2' | 'tier3';

export default function OnboardingWizard() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [step, setStep] = useState(1);
  const [activity, setActivity] = useState<ActivityId>('ecommerce');
  const [jurisdiction, setJurisdiction] = useState<JurisdictionId>('uae');
  const [tier, setTier] = useState<TierId>('tier2');
  const [selectedAddons, setSelectedAddons] = useState<string[]>([]);
  const [companyName, setCompanyName] = useState('');

  useEffect(() => {
    const c = searchParams.get('country');
    const t = searchParams.get('tier');
    const n = searchParams.get('name');
    if (c && JURISDICTIONS.some((j) => j.id === c)) setJurisdiction(c);
    if (t && ['tier1', 'tier2', 'tier3'].includes(t)) setTier(t as TierId);
    if (n) setCompanyName(decodeURIComponent(n));
  }, [searchParams]);

  const selectedJurisdiction = JURISDICTIONS.find((j) => j.id === jurisdiction) || JURISDICTIONS[0];
  const selectedTier = TIERS.find((t) => t.id === tier) || TIERS[1];
  const addonsTotal = selectedAddons.reduce((s, id) => {
    const a = ADDONS.find((ad) => ad.id === id);
    return s + (a?.price ?? 0);
  }, 0);
  const grandTotal = selectedTier.price + addonsTotal;

  const toggleAddon = (id: string) =>
    setSelectedAddons((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]
    );

  const goToCheckout = () => {
    const params = new URLSearchParams({
      country: jurisdiction,
      tier,
      total: grandTotal.toString(),
      addons: selectedAddons.join(','),
      name: companyName || `${selectedJurisdiction.name.split(' ')[0]} Enterprise Ltd`,
    });
    router.push(`/checkout?${params.toString()}`);
  };

  const next = () => { if (step < 5) setStep(step + 1); };
  const prev = () => { if (step > 1) setStep(step - 1); };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingBottom: 80 }}>
      {/* Progress Steps Header */}
      <div className="card app-card" style={{ padding: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            STEP {step} OF 5: {STEP_LABELS[step - 1].toUpperCase()}
          </span>
          <span className="badge badge-orange">{Math.round((step / 5) * 100)}% COMPLETE</span>
        </div>

        <div className="progress-track">
          <div className="progress-fill" style={{ width: `${(step / 5) * 100}%` }} />
        </div>
      </div>

      {/* Screen 1: Activity */}
      {step === 1 && (
        <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <h2 className="section-title" style={{ fontSize: '1.25rem', marginBottom: 2 }}>
              Select Primary Business Activity
            </h2>
            <p style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>
              Determines qualifying corporate tax classification (QFZP) and banking license categories.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {ACTIVITIES.map((act) => {
              const Icon = act.icon;
              const isSel = activity === act.id;
              return (
                <div
                  key={act.id}
                  onClick={() => setActivity(act.id)}
                  className={`card card-hover ${isSel ? 'card-sand' : ''}`}
                  style={{
                    cursor: 'pointer',
                    border: isSel ? '1.5px solid var(--orange)' : undefined,
                    padding: 14,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                  }}
                >
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 10,
                      background: isSel ? 'var(--orange)' : 'var(--surface-alt)',
                      color: isSel ? 'white' : 'var(--navy)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Icon size={18} />
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--navy)' }}>{act.label}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2 }}>{act.desc}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Screen 2: Jurisdiction */}
      {step === 2 && (
        <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <h2 className="section-title" style={{ fontSize: '1.25rem', marginBottom: 2 }}>
              Choose Formation Jurisdiction
            </h2>
            <p style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>
              All jurisdictions include guaranteed remote banking and statutory registered office.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {JURISDICTIONS.map((j) => {
              const isSel = jurisdiction === j.id;
              return (
                <div
                  key={j.id}
                  onClick={() => setJurisdiction(j.id)}
                  className={`card card-hover ${isSel ? 'card-sand' : ''}`}
                  style={{
                    cursor: 'pointer',
                    border: isSel ? '1.5px solid var(--orange)' : undefined,
                    padding: 14,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <CountryFlag country={j.id} size="md" />
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--navy)' }}>{j.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{j.taxRate} • {j.highlight}</div>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--orange)' }}>${j.price}</div>
                    <span className="badge badge-sand" style={{ fontSize: 9 }}>BASE</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Screen 3: Structuring Tier */}
      {step === 3 && (
        <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <h2 className="section-title" style={{ fontSize: '1.25rem', marginBottom: 2 }}>
              Select Legal & Privacy Tier
            </h2>
            <p style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>
              Protect public registry disclosure and speed up corporate banking rails.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {TIERS.map((t) => {
              const isSel = tier === t.id;
              return (
                <div
                  key={t.id}
                  onClick={() => setTier(t.id as TierId)}
                  className={`card card-hover ${isSel ? 'card-sand' : ''}`}
                  style={{
                    cursor: 'pointer',
                    border: isSel ? '1.5px solid var(--orange)' : undefined,
                    padding: 16,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 10,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--navy)' }}>{t.title}</span>
                        {t.badge && <span className="badge badge-orange">{t.badge}</span>}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2 }}>{t.breakdown}</div>
                    </div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--orange)' }}>${t.price}</div>
                  </div>

                  <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.4 }}>{t.desc}</p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {t.features.map((f, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--text-secondary)' }}>
                        <CheckCircle2 size={13} color="var(--orange)" />
                        <span>{f}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Screen 4: Add-Ons */}
      {step === 4 && (
        <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <h2 className="section-title" style={{ fontSize: '1.25rem', marginBottom: 2 }}>
              Optional Corporate Add-Ons
            </h2>
            <p style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>
              Accelerate your operations with investor visas and tax TRN registrations.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {ADDONS.map((add) => {
              const isSel = selectedAddons.includes(add.id);
              return (
                <div
                  key={add.id}
                  onClick={() => toggleAddon(add.id)}
                  className={`card card-hover ${isSel ? 'card-sand' : ''}`}
                  style={{
                    cursor: 'pointer',
                    border: isSel ? '1.5px solid var(--orange)' : undefined,
                    padding: 14,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
                    <input
                      type="checkbox"
                      checked={isSel}
                      onChange={() => {}}
                      style={{ width: 18, height: 18, accentColor: 'var(--orange)', cursor: 'pointer' }}
                    />
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--navy)' }}>{add.title}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{add.desc}</div>
                    </div>
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--orange)', marginLeft: 8 }}>+${add.price}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Screen 5: Summary */}
      {step === 5 && (
        <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <h2 className="section-title" style={{ fontSize: '1.25rem', marginBottom: 2 }}>
              Order Review & Summary
            </h2>
            <p style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>
              Confirm your entity package before initiating automated registry filing.
            </p>
          </div>

          <div className="card app-card" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <label className="input-label">Target Company Name (or leave blank to assign later):</label>
              <input
                type="text"
                placeholder="e.g. Horizon Global Holdings FZE"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="input-field"
              />
            </div>

            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span style={{ color: 'var(--text-tertiary)' }}>Jurisdiction:</span>
                <strong style={{ color: 'var(--navy)' }}>{selectedJurisdiction.name}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span style={{ color: 'var(--text-tertiary)' }}>Legal Tier:</span>
                <strong style={{ color: 'var(--navy)' }}>{selectedTier.title}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span style={{ color: 'var(--text-tertiary)' }}>Selected Add-Ons:</span>
                <strong style={{ color: 'var(--navy)' }}>{selectedAddons.length} Applied (+${addonsTotal})</strong>
              </div>

              <div style={{ height: 1, background: 'var(--border)', margin: '4px 0' }} />

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--navy)' }}>Total Package Cost:</span>
                <span style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--orange)' }}>
                  ${grandTotal.toLocaleString()} USD
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sticky Bottom Action Bar */}
      <StickyFooter
        secondaryLabel={step > 1 ? 'Back' : undefined}
        secondaryAction={step > 1 ? prev : undefined}
        priceLabel="PACKAGE TOTAL"
        priceValue={`$${grandTotal.toLocaleString()} USD`}
        priceSub="100% Money-Back Guarantee"
        primaryLabel={step === 5 ? 'Proceed to Checkout' : 'Next Step'}
        primaryAction={step === 5 ? goToCheckout : next}
      />
    </div>
  );
}
