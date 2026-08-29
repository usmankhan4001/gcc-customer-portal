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
} from 'lucide-react';

/* ──────────────────────────────────────────────
   DATA
   ────────────────────────────────────────────── */

const ACTIVITIES = [
  { id: 'ecommerce', label: 'E-Commerce', icon: Globe, desc: 'Amazon, Shopify, dropshipping' },
  { id: 'saas', label: 'SaaS & Software', icon: Sparkles, desc: 'Digital products, APIs' },
  { id: 'consulting', label: 'Consulting', icon: Building, desc: 'Agencies, B2B services' },
  { id: 'digital', label: 'Digital Services', icon: Coins, desc: 'Crypto, Web3, media' },
  { id: 'physical', label: 'Physical Goods', icon: Plane, desc: 'Import, manufacturing' },
  { id: 'other', label: 'Other', icon: Shield, desc: 'Holding, misc structures' },
];

const JURISDICTIONS = [
  { id: 'hk', name: 'Hong Kong', flag: '🇭🇰', taxRate: '0% Foreign-Sourced', price: 1500 },
  { id: 'uae', name: 'UAE Freezone', flag: '🇦🇪', taxRate: '0%–9% Corp Tax', price: 1500 },
  { id: 'singapore', name: 'Singapore', flag: '🇸🇬', taxRate: '8.5% Startup Rate', price: 1800 },
  { id: 'bahrain', name: 'Bahrain', flag: '🇧🇭', taxRate: '0% Corp Tax', price: 1600 },
  { id: 'ireland', name: 'Ireland', flag: '🇮🇪', taxRate: '12.5% Trading', price: 1700 },
  { id: 'oman', name: 'Oman', flag: '🇴🇲', taxRate: '15% Flat Rate', price: 1700 },
];

const TIERS = [
  {
    id: 'tier1',
    title: 'Self UBO & Director',
    price: 2000,
    breakdown: '$1,500 Formation + $500 Bank',
    desc: 'You are listed directly on the government registry as Director and Shareholder.',
    features: [
      '100% Beneficial Ownership registered directly',
      'Certificate of Incorporation & E-MoA',
      'Bank Account Setup Assistance',
      '1 Year Registered Agent & Address',
    ],
  },
  {
    id: 'tier2',
    title: 'Nominee UBO & Director',
    badge: 'MOST POPULAR',
    price: 3000,
    breakdown: '$1,500 Formation + $500 Bank + $1,000 Nominee',
    desc: 'Your identity is shielded behind a licensed Nominee Director & Trustee Shareholder.',
    features: [
      'Full Nominee Director & Shareholder Service',
      'Irrevocable Power of Attorney (PoA)',
      'Beneficial Ownership Declaration & Trust Agreement',
      'Bank Account Signatory Assistance',
      '100% Public Registry Anonymity',
    ],
  },
  {
    id: 'tier3',
    title: 'Shelf Company (Aged)',
    badge: 'INSTANT 24H',
    price: 2500,
    breakdown: '$2,000 Aged Entity + $500 Bank Handover',
    desc: 'Acquire a pre-registered vintage entity with existing history and active bank accounts.',
    features: [
      'Pre-registered aged company (1–3 years old)',
      'Immediate 24–48 hour ownership transfer',
      'Pre-vetted banking rails ready',
      'Instant credibility with global clients',
    ],
  },
];

const ADDONS = [
  { id: 'bank_extra', title: 'Secondary Bank (Airwallex + Wise)', price: 500, desc: 'Dual redundancy multi-currency payment channels.' },
  { id: 'uae_visa', title: 'UAE Investor Residency Visa', price: 1500, desc: '2-Year UAE Residence Visa, VIP medical, Emirates ID.' },
  { id: 'tax_trn', title: 'UAE Tax & VAT TRN Registration', price: 350, desc: 'Federal Tax Authority registration & TRN certificate.' },
  { id: 'express', title: '24-Hour Express Filing', price: 300, desc: 'Priority queue with official registry reviewers.' },
];

const STEP_LABELS = ['Activity', 'Jurisdiction', 'Tier', 'Add-Ons', 'Summary'];

/* ──────────────────────────────────────────────
   TYPES
   ────────────────────────────────────────────── */

type ActivityId = string;
type JurisdictionId = string;
type TierId = 'tier1' | 'tier2' | 'tier3';

/* ──────────────────────────────────────────────
   COMPONENT
   ────────────────────────────────────────────── */

export default function OnboardingWizard() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [step, setStep] = useState(1);
  const [activity, setActivity] = useState<ActivityId>('ecommerce');
  const [jurisdiction, setJurisdiction] = useState<JurisdictionId>('hk');
  const [tier, setTier] = useState<TierId>('tier2');
  const [selectedAddons, setSelectedAddons] = useState<string[]>([]);
  const [companyName, setCompanyName] = useState('');

  /* Hydrate from URL params */
  useEffect(() => {
    const c = searchParams.get('country');
    const t = searchParams.get('tier');
    const n = searchParams.get('name');
    if (c && JURISDICTIONS.some((j) => j.id === c)) setJurisdiction(c);
    if (t && ['tier1', 'tier2', 'tier3'].includes(t)) setTier(t as TierId);
    if (n) setCompanyName(decodeURIComponent(n));
  }, [searchParams]);

  /* Computed */
  const selectedJurisdiction = JURISDICTIONS.find((j) => j.id === jurisdiction)!;
  const selectedTier = TIERS.find((t) => t.id === tier)!;
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
      name: companyName || `${selectedJurisdiction.name} Enterprise Ltd`,
    });
    router.push(`/checkout?${params.toString()}`);
  };

  const canAdvance = () => {
    if (step === 1) return !!activity;
    if (step === 2) return !!jurisdiction;
    if (step === 3) return !!tier;
    return true;
  };

  const next = () => { if (step < 5 && canAdvance()) setStep(step + 1); };
  const prev = () => { if (step > 1) setStep(step - 1); };

  /* ────────────────────── RENDER ────────────────────── */

  return (
    <div style={styles.root}>
      {/* ── Progress Indicator ── */}
      <div style={styles.progressOuter}>
        <div style={styles.progressTrack}>
          {STEP_LABELS.map((label, i) => {
            const num = i + 1;
            const isDone = step > num;
            const isCurrent = step === num;
            return (
              <React.Fragment key={num}>
                {/* Connector line before */}
                {i > 0 && (
                  <div
                    style={{
                      ...styles.connector,
                      background: isDone || isCurrent ? 'var(--color-orange)' : 'var(--color-border)',
                    }}
                  />
                )}
                <button
                  type="button"
                  onClick={() => num <= step && setStep(num)}
                  style={{
                    ...styles.stepDot,
                    background: isDone
                      ? 'var(--color-orange)'
                      : isCurrent
                        ? 'var(--color-orange)'
                        : 'var(--color-surface)',
                    borderColor: isDone || isCurrent ? 'var(--color-orange)' : 'var(--color-border)',
                    color: isDone || isCurrent ? '#FFF' : 'var(--color-text-muted)',
                    cursor: num <= step ? 'pointer' : 'default',
                  }}
                >
                  {isDone ? <Check size={14} strokeWidth={3} /> : num}
                </button>
                {/* Label */}
                <span
                  style={{
                    ...styles.stepLabel,
                    color: isCurrent ? 'var(--color-text)' : isDone ? 'var(--color-orange)' : 'var(--color-text-muted)',
                    fontWeight: isCurrent ? 700 : 500,
                  }}
                >
                  {label}
                </span>
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* ── Step Content ── */}
      <div style={styles.contentArea}>
        <div style={styles.stepWrapper} key={step}>
          {step === 1 && (
            <StepActivity activity={activity} setActivity={setActivity} />
          )}
          {step === 2 && (
            <StepJurisdiction jurisdiction={jurisdiction} setJurisdiction={setJurisdiction} />
          )}
          {step === 3 && (
            <StepTier tier={tier} setTier={setTier} />
          )}
          {step === 4 && (
            <StepAddons selectedAddons={selectedAddons} toggleAddon={toggleAddon} />
          )}
          {step === 5 && (
            <StepSummary
              companyName={companyName}
              setCompanyName={setCompanyName}
              jurisdiction={selectedJurisdiction}
              tier={selectedTier}
              selectedAddons={selectedAddons}
              addonsTotal={addonsTotal}
              grandTotal={grandTotal}
              goToCheckout={goToCheckout}
            />
          )}
        </div>
      </div>

      {/* ── Navigation ── */}
      <div style={styles.navBar}>
        <div style={styles.navInner}>
          {step > 1 ? (
            <button type="button" onClick={prev} style={styles.btnSecondary}>
              <ArrowLeft size={16} />
              Back
            </button>
          ) : (
            <div />
          )}

          {step < 5 ? (
            <button
              type="button"
              onClick={next}
              disabled={!canAdvance()}
              style={{
                ...styles.btnPrimary,
                opacity: canAdvance() ? 1 : 0.5,
                pointerEvents: canAdvance() ? 'auto' : 'none',
              }}
            >
              Continue
              <ArrowRight size={16} />
            </button>
          ) : (
            <button type="button" onClick={goToCheckout} style={styles.btnPrimary}>
              <ShoppingCart size={16} />
              Proceed to Checkout — ${grandTotal.toLocaleString()}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   STEP COMPONENTS
   ═══════════════════════════════════════════════ */

function StepHeader({ num, title, subtitle }: { num: number; title: string; subtitle: string }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <span style={styles.stepBadge}>STEP {num} OF 5</span>
      <h2 style={styles.stepTitle}>{title}</h2>
      <p style={styles.stepSubtitle}>{subtitle}</p>
    </div>
  );
}

/* ── Step 1: Activity ── */
function StepActivity({
  activity,
  setActivity,
}: {
  activity: string;
  setActivity: (id: string) => void;
}) {
  return (
    <>
      <StepHeader
        num={1}
        title="What's your business type?"
        subtitle="We tailor your corporate structuring and banking strategy to your specific industry."
      />
      <div style={styles.activityGrid}>
        {ACTIVITIES.map((item) => {
          const Icon = item.icon;
          const active = activity === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setActivity(item.id)}
              style={{
                ...styles.activityCard,
                borderColor: active ? 'var(--color-orange)' : 'var(--color-border)',
                background: active ? 'var(--color-orange-light)' : 'var(--color-card)',
                boxShadow: active ? '0 0 0 2px var(--color-orange)' : 'var(--shadow-card)',
              }}
            >
              <div
                style={{
                  ...styles.activityIcon,
                  background: active ? 'var(--color-orange)' : 'var(--color-surface-alt)',
                  color: active ? '#FFF' : 'var(--color-orange)',
                }}
              >
                <Icon size={20} />
              </div>
              <span
                style={{
                  ...styles.activityLabel,
                  color: active ? 'var(--color-text)' : 'var(--color-text-secondary)',
                  fontWeight: active ? 700 : 600,
                }}
              >
                {item.label}
              </span>
              <span style={styles.activityDesc}>{item.desc}</span>
            </button>
          );
        })}
      </div>
    </>
  );
}

/* ── Step 2: Jurisdiction ── */
function StepJurisdiction({
  jurisdiction,
  setJurisdiction,
}: {
  jurisdiction: string;
  setJurisdiction: (id: string) => void;
}) {
  return (
    <>
      <StepHeader
        num={2}
        title="Where do you want to incorporate?"
        subtitle="Select the optimal country for tax optimization and banking access."
      />
      <div style={styles.hScroll}>
        {JURISDICTIONS.map((j) => {
          const active = jurisdiction === j.id;
          return (
            <button
              key={j.id}
              type="button"
              onClick={() => setJurisdiction(j.id)}
              style={{
                ...styles.jurCard,
                borderColor: active ? 'var(--color-orange)' : 'var(--color-border)',
                background: active ? 'var(--color-orange-light)' : 'var(--color-card)',
                boxShadow: active ? '0 0 0 2px var(--color-orange)' : 'var(--shadow-card)',
              }}
            >
              <div style={styles.jurTop}>
                <span style={styles.jurFlag}>{j.flag}</span>
                {active && (
                  <span style={styles.jurCheck}>
                    <CheckCircle2 size={18} />
                  </span>
                )}
              </div>
              <span style={styles.jurName}>{j.name}</span>
              <span style={styles.jurTax}>{j.taxRate}</span>
              <div style={styles.jurFooter}>
                <span style={styles.jurPrice}>From ${j.price.toLocaleString()}</span>
              </div>
            </button>
          );
        })}
      </div>
    </>
  );
}

/* ── Step 3: Tier ── */
function StepTier({
  tier,
  setTier,
}: {
  tier: TierId;
  setTier: (id: TierId) => void;
}) {
  return (
    <>
      <StepHeader
        num={3}
        title="Choose your privacy tier"
        subtitle="All tiers include official government filing, company documents, and banking assistance."
      />
      <div style={styles.tiersGrid}>
        {TIERS.map((t) => {
          const active = tier === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTier(t.id as TierId)}
              style={{
                ...styles.tierCard,
                borderColor: active ? 'var(--color-orange)' : 'var(--color-border)',
                background: active ? 'var(--color-orange-light)' : 'var(--color-card)',
                boxShadow: active ? '0 0 0 2px var(--color-orange)' : 'var(--shadow-card)',
              }}
            >
              {t.badge && <span style={styles.tierBadge}>{t.badge}</span>}
              <span style={styles.tierTitle}>{t.title}</span>
              <div style={styles.tierPriceRow}>
                <span style={styles.tierPrice}>${t.price.toLocaleString()}</span>
                <span style={styles.tierTotal}>total</span>
              </div>
              <span style={styles.tierBreakdown}>{t.breakdown}</span>
              <span style={styles.tierDesc}>{t.desc}</span>
              <div style={styles.tierFeatures}>
                {t.features.map((f, i) => (
                  <div key={i} style={styles.tierFeat}>
                    <CheckCircle2 size={14} style={{ color: 'var(--color-orange)', flexShrink: 0, marginTop: 1 }} />
                    <span>{f}</span>
                  </div>
                ))}
              </div>
            </button>
          );
        })}
      </div>
    </>
  );
}

/* ── Step 4: Add-ons ── */
function StepAddons({
  selectedAddons,
  toggleAddon,
}: {
  selectedAddons: string[];
  toggleAddon: (id: string) => void;
}) {
  return (
    <>
      <StepHeader
        num={4}
        title="Enhance your package"
        subtitle="Optional add-ons to strengthen your corporate structure."
      />
      <div style={styles.addonsList}>
        {ADDONS.map((a) => {
          const active = selectedAddons.includes(a.id);
          return (
            <button
              key={a.id}
              type="button"
              onClick={() => toggleAddon(a.id)}
              style={{
                ...styles.addonCard,
                borderColor: active ? 'var(--color-orange)' : 'var(--color-border)',
                background: active ? 'var(--color-orange-light)' : 'var(--color-card)',
              }}
            >
              <div style={styles.addonLeft}>
                <div
                  style={{
                    ...styles.checkbox,
                    borderColor: active ? 'var(--color-orange)' : 'var(--color-border)',
                    background: active ? 'var(--color-orange)' : 'var(--color-surface)',
                  }}
                >
                  {active && <Check size={12} color="#FFF" strokeWidth={3} />}
                </div>
                <div>
                  <span style={styles.addonTitle}>{a.title}</span>
                  <span style={styles.addonDesc}>{a.desc}</span>
                </div>
              </div>
              <span style={styles.addonPrice}>+${a.price}</span>
            </button>
          );
        })}
      </div>
    </>
  );
}

/* ── Step 5: Summary ── */
function StepSummary({
  companyName,
  setCompanyName,
  jurisdiction,
  tier,
  selectedAddons: addonIds,
  addonsTotal,
  grandTotal,
  goToCheckout,
}: {
  companyName: string;
  setCompanyName: (v: string) => void;
  jurisdiction: (typeof JURISDICTIONS)[number];
  tier: (typeof TIERS)[number];
  selectedAddons: string[];
  addonsTotal: number;
  grandTotal: number;
  goToCheckout: () => void;
}) {
  const activeAddons = ADDONS.filter((a) => addonIds.includes(a.id));

  return (
    <>
      <StepHeader
        num={5}
        title="Review & checkout"
        subtitle="Review your customized incorporation package below."
      />

      {/* Company Name */}
      <div style={{ marginBottom: 20 }}>
        <label style={styles.inputLabel}>Proposed Company Name</label>
        <input
          type="text"
          placeholder="e.g. Apex Global Horizon Ltd"
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
          style={styles.inputField}
        />
        <span style={styles.inputHelper}>Can be updated later</span>
      </div>

      {/* Summary Card */}
      <div style={styles.summaryCard}>
        {/* Jurisdiction */}
        <div style={styles.summaryRow}>
          <div>
            <span style={styles.summaryLabel}>Jurisdiction</span>
            <span style={styles.summaryValue}>{jurisdiction.flag} {jurisdiction.name}</span>
          </div>
        </div>

        {/* Tier */}
        <div style={styles.summaryRow}>
          <div>
            <span style={styles.summaryLabel}>Privacy Tier</span>
            <span style={styles.summaryValue}>{tier.title}</span>
          </div>
          <span style={styles.summaryPrice}>${tier.price.toLocaleString()}</span>
        </div>

        {/* Add-ons */}
        {activeAddons.map((a) => (
          <div key={a.id} style={styles.summaryRow}>
            <span style={styles.summaryAddon}>{a.title}</span>
            <span style={styles.summaryPriceSmall}>+${a.price}</span>
          </div>
        ))}

        {/* Divider */}
        <div style={styles.summaryDivider} />

        {/* Total */}
        <div style={styles.summaryRow}>
          <div>
            <span style={styles.summaryTotalLabel}>Total</span>
            <span style={styles.summaryTotalSub}>Government fees, banking onboarding & 1st year agent</span>
          </div>
          <span style={styles.summaryTotalPrice}>${grandTotal.toLocaleString()}</span>
        </div>
      </div>

      {/* Guarantee */}
      <div style={styles.guarantee}>
        <Shield size={16} style={{ color: 'var(--color-info)', flexShrink: 0 }} />
        <span style={styles.guaranteeText}>
          <strong>Banking Guarantee:</strong> Full refund on banking fees if your corporate account is not approved.
        </span>
      </div>
    </>
  );
}

/* ═══════════════════════════════════════════════
   STYLES
   ═══════════════════════════════════════════════ */

const styles: Record<string, React.CSSProperties> = {
  /* Root */
  root: {
    display: 'flex',
    flexDirection: 'column',
    height: '100dvh',
    background: 'var(--color-surface)',
    overflow: 'hidden',
  },

  /* Progress */
  progressOuter: {
    padding: '20px 20px 0',
    flexShrink: 0,
  },
  progressTrack: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 0,
    maxWidth: 560,
    margin: '0 auto',
  },
  connector: {
    flex: 1,
    height: 2,
    minWidth: 16,
    borderRadius: 1,
    transition: 'background 0.3s ease',
  },
  stepDot: {
    width: 30,
    height: 30,
    borderRadius: '50%',
    border: '2px solid',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 12,
    fontWeight: 700,
    fontFamily: 'var(--font-sans)',
    transition: 'all 0.25s ease',
    flexShrink: 0,
    padding: 0,
    lineHeight: 1,
  },
  stepLabel: {
    fontSize: 11,
    fontFamily: 'var(--font-sans)',
    transition: 'color 0.2s ease',
    whiteSpace: 'nowrap' as const,
    display: 'none',
  },

  /* Content */
  contentArea: {
    flex: 1,
    overflowY: 'auto',
    overflowX: 'hidden',
    padding: '24px 20px 20px',
  },
  stepWrapper: {
    maxWidth: 720,
    margin: '0 auto',
    animation: 'slideUp 0.25s ease-out',
  },

  /* Nav */
  navBar: {
    flexShrink: 0,
    padding: '16px 20px',
    paddingBottom: 'max(16px, env(safe-area-inset-bottom, 0px))',
    borderTop: '1px solid var(--color-border)',
    background: 'var(--color-surface)',
  },
  navInner: {
    maxWidth: 720,
    margin: '0 auto',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },

  /* Buttons */
  btnPrimary: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: '14px 28px',
    borderRadius: 9999,
    fontSize: 14,
    fontWeight: 700,
    fontFamily: 'var(--font-sans)',
    border: 'none',
    cursor: 'pointer',
    background: 'var(--color-orange)',
    color: '#FFF',
    boxShadow: 'var(--shadow-orange)',
    transition: 'all 0.18s ease',
    lineHeight: 1.2,
    whiteSpace: 'nowrap' as const,
  },
  btnSecondary: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    padding: '12px 20px',
    borderRadius: 9999,
    fontSize: 14,
    fontWeight: 600,
    fontFamily: 'var(--font-sans)',
    border: '1.5px solid var(--color-border)',
    cursor: 'pointer',
    background: 'var(--color-surface)',
    color: 'var(--color-text)',
    transition: 'all 0.18s ease',
    lineHeight: 1.2,
  },

  /* Step badge */
  stepBadge: {
    display: 'inline-block',
    padding: '3px 10px',
    borderRadius: 9999,
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: '0.02em',
    background: 'var(--color-navy-subtle)',
    color: 'var(--color-navy)',
    marginBottom: 10,
  },

  /* Step header */
  stepTitle: {
    fontFamily: 'var(--font-heading)',
    fontSize: 'clamp(1.5rem, 4vw, 2rem)',
    fontWeight: 800,
    color: 'var(--color-text)',
    lineHeight: 1.15,
    marginBottom: 6,
  },
  stepSubtitle: {
    fontSize: 15,
    color: 'var(--color-text-secondary)',
    lineHeight: 1.5,
  },

  /* ── Activity ── */
  activityGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    gap: 12,
  },
  activityCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8,
    padding: '20px 12px',
    borderRadius: 'var(--radius-lg)',
    border: '1.5px solid',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    fontFamily: 'var(--font-sans)',
    textAlign: 'center' as const,
  },
  activityIcon: {
    width: 44,
    height: 44,
    borderRadius: 'var(--radius-md)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s ease',
  },
  activityLabel: {
    fontSize: 13,
    fontFamily: 'var(--font-sans)',
    transition: 'color 0.15s ease',
  },
  activityDesc: {
    fontSize: 11,
    color: 'var(--color-text-tertiary)',
    lineHeight: 1.3,
  },

  /* ── Jurisdiction ── */
  hScroll: {
    display: 'flex',
    gap: 12,
    overflowX: 'auto',
    scrollSnapType: 'x mandatory',
    paddingBottom: 4,
    WebkitOverflowScrolling: 'touch',
    scrollbarWidth: 'none' as any,
  },
  jurCard: {
    flex: '0 0 220px',
    scrollSnapAlign: 'start',
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    padding: 18,
    borderRadius: 'var(--radius-lg)',
    border: '1.5px solid',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    fontFamily: 'var(--font-sans)',
    textAlign: 'left' as const,
  },
  jurTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  jurFlag: { fontSize: '1.6rem' },
  jurCheck: { color: 'var(--color-orange)' },
  jurName: {
    fontSize: 15,
    fontWeight: 700,
    color: 'var(--color-text)',
    fontFamily: 'var(--font-heading)',
  },
  jurTax: {
    fontSize: 12,
    color: 'var(--color-text-secondary)',
    lineHeight: 1.3,
  },
  jurFooter: {
    marginTop: 'auto',
    paddingTop: 8,
    borderTop: '1px solid var(--color-border)',
  },
  jurPrice: {
    fontSize: 13,
    fontWeight: 700,
    color: 'var(--color-navy)',
  },

  /* ── Tier ── */
  tiersGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
  },
  tierCard: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    padding: 22,
    borderRadius: 'var(--radius-lg)',
    border: '1.5px solid',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    fontFamily: 'var(--font-sans)',
    textAlign: 'left' as const,
  },
  tierBadge: {
    display: 'inline-block',
    padding: '2px 8px',
    borderRadius: 9999,
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: '0.03em',
    background: 'var(--color-orange-light)',
    color: 'var(--color-orange)',
    alignSelf: 'flex-start',
  },
  tierTitle: {
    fontSize: 16,
    fontWeight: 700,
    color: 'var(--color-text)',
    fontFamily: 'var(--font-heading)',
  },
  tierPriceRow: {
    display: 'flex',
    alignItems: 'baseline',
    gap: 6,
  },
  tierPrice: {
    fontSize: '1.8rem',
    fontWeight: 800,
    color: 'var(--color-navy)',
    fontFamily: 'var(--font-heading)',
  },
  tierTotal: {
    fontSize: 13,
    color: 'var(--color-text-tertiary)',
  },
  tierBreakdown: {
    fontSize: 12,
    color: 'var(--color-text-tertiary)',
  },
  tierDesc: {
    fontSize: 13,
    color: 'var(--color-text-secondary)',
    lineHeight: 1.4,
  },
  tierFeatures: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    marginTop: 6,
    paddingTop: 10,
    borderTop: '1px solid var(--color-border)',
  },
  tierFeat: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 8,
    fontSize: 12,
    color: 'var(--color-text-secondary)',
    lineHeight: 1.4,
  },

  /* ── Add-ons ── */
  addonsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  addonCard: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 14,
    padding: '16px 18px',
    borderRadius: 'var(--radius-lg)',
    border: '1.5px solid',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    fontFamily: 'var(--font-sans)',
    textAlign: 'left' as const,
  },
  addonLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    flex: 1,
    minWidth: 0,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 'var(--radius-xs)',
    border: '1.5px solid',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    transition: 'all 0.15s ease',
  },
  addonTitle: {
    display: 'block',
    fontSize: 14,
    fontWeight: 700,
    color: 'var(--color-text)',
    lineHeight: 1.3,
  },
  addonDesc: {
    display: 'block',
    fontSize: 12,
    color: 'var(--color-text-tertiary)',
    lineHeight: 1.3,
    marginTop: 2,
  },
  addonPrice: {
    fontSize: 15,
    fontWeight: 700,
    color: 'var(--color-navy)',
    flexShrink: 0,
    fontFamily: 'var(--font-heading)',
  },

  /* ── Summary ── */
  inputLabel: {
    display: 'block',
    fontSize: 13,
    fontWeight: 600,
    color: 'var(--color-text)',
    marginBottom: 6,
    fontFamily: 'var(--font-sans)',
  },
  inputField: {
    width: '100%',
    height: 48,
    padding: '0 16px',
    background: 'var(--color-surface)',
    border: '1.5px solid var(--color-border)',
    borderRadius: 'var(--radius-md)',
    fontSize: 14,
    fontFamily: 'var(--font-sans)',
    color: 'var(--color-text)',
    outline: 'none',
    transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
  },
  inputHelper: {
    display: 'block',
    fontSize: 12,
    color: 'var(--color-text-tertiary)',
    marginTop: 4,
  },

  summaryCard: {
    background: 'var(--color-surface-alt)',
    borderRadius: 'var(--radius-lg)',
    padding: 20,
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
  },
  summaryRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  summaryLabel: {
    display: 'block',
    fontSize: 11,
    fontWeight: 600,
    color: 'var(--color-text-tertiary)',
    letterSpacing: '0.03em',
    textTransform: 'uppercase' as const,
    marginBottom: 2,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: 700,
    color: 'var(--color-text)',
  },
  summaryPrice: {
    fontSize: 14,
    fontWeight: 700,
    color: 'var(--color-navy)',
    fontFamily: 'var(--font-heading)',
    flexShrink: 0,
  },
  summaryAddon: {
    fontSize: 13,
    color: 'var(--color-text-secondary)',
  },
  summaryPriceSmall: {
    fontSize: 13,
    fontWeight: 600,
    color: 'var(--color-navy)',
    flexShrink: 0,
  },
  summaryDivider: {
    height: 1,
    background: 'var(--color-border)',
    margin: '2px 0',
  },
  summaryTotalLabel: {
    display: 'block',
    fontSize: 15,
    fontWeight: 800,
    color: 'var(--color-text)',
    fontFamily: 'var(--font-heading)',
  },
  summaryTotalSub: {
    display: 'block',
    fontSize: 12,
    color: 'var(--color-text-tertiary)',
    marginTop: 2,
  },
  summaryTotalPrice: {
    fontSize: '1.8rem',
    fontWeight: 800,
    color: 'var(--color-orange)',
    fontFamily: 'var(--font-heading)',
    flexShrink: 0,
    lineHeight: 1,
  },

  /* Guarantee */
  guarantee: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 10,
    padding: '14px 16px',
    borderRadius: 'var(--radius-md)',
    background: 'var(--color-info-light)',
    marginTop: 16,
  },
  guaranteeText: {
    fontSize: 13,
    color: 'var(--color-navy)',
    lineHeight: 1.4,
  },
};
