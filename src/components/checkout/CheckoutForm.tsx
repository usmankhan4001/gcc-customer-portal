'use client';

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import confetti from 'canvas-confetti';
import { usePortalStore } from '@/lib/store';
import {
  CreditCard,
  ShieldCheck,
  Lock,
  CheckCircle2,
  Building,
  Mail,
  User,
  Phone,
  MapPin,
  ChevronDown,
  ArrowRight,
  Shield,
  Landmark,
} from 'lucide-react';

const COUNTRY_CODES = [
  { code: '+971', label: 'UAE', flag: '🇦🇪' },
  { code: '+973', label: 'Bahrain', flag: '🇧🇭' },
  { code: '+968', label: 'Oman', flag: '🇴🇲' },
  { code: '+44', label: 'UK', flag: '🇬🇧' },
  { code: '+1', label: 'USA/CA', flag: '🇺🇸' },
  { code: '+49', label: 'Germany', flag: '🇩🇪' },
  { code: '+31', label: 'Netherlands', flag: '🇳🇱' },
  { code: '+33', label: 'France', flag: '🇫🇷' },
  { code: '+91', label: 'India', flag: '🇮🇳' },
  { code: '+65', label: 'Singapore', flag: '🇸🇬' },
];

const BILLING_COUNTRIES = [
  'United Arab Emirates', 'Bahrain', 'Oman', 'Saudi Arabia',
  'United Kingdom', 'United States', 'Germany', 'France',
  'Netherlands', 'Singapore', 'India', 'Canada', 'Australia',
  'Switzerland', 'Hong Kong', 'Japan', 'Other',
];

export default function CheckoutForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { createOrderAndEntity } = usePortalStore();

  const jurisdiction = searchParams.get('country') || 'hk';
  const tier = (searchParams.get('tier') as any) || 'tier2';
  const totalAmount = Number(searchParams.get('total')) || 3000;
  const companyName = searchParams.get('name') || 'Apex Global Horizon Ltd';

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [countryCode, setCountryCode] = useState('+971');

  const [paymentTab, setPaymentTab] = useState<'card' | 'bank'>('card');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');

  const [billingCountry, setBillingCountry] = useState('');
  const [address1, setAddress1] = useState('');
  const [address2, setAddress2] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [postalCode, setPostalCode] = useState('');

  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [orderId, setOrderId] = useState('');

  const isGulf = jurisdiction === 'uae' || jurisdiction === 'bahrain' || jurisdiction === 'oman';
  const chargedNow = isGulf ? 1500 : totalAmount;
  const govFee = isGulf ? totalAmount - 1500 : 0;

  const tierLabel: Record<string, string> = {
    tier1: 'Tier 1: Basic Formation',
    tier2: 'Tier 2: Nominee UBO & Director',
    tier3: 'Tier 3: Full Corporate Suite',
  };

  const jurisdictionLabel: Record<string, string> = {
    hk: 'Hong Kong',
    uae: 'UAE Freezone',
    bahrain: 'Bahrain',
    oman: 'Oman',
    sg: 'Singapore',
    uk: 'United Kingdom',
    us: 'United States',
  };

  const formatCardNumber = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 16);
    return digits.replace(/(\d{4})(?=\d)/g, '$1 ');
  };

  const formatExpiry = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 4);
    if (digits.length > 2) return digits.slice(0, 2) + ' / ' + digits.slice(2);
    return digits;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email || !whatsappNumber) return;
    if (!agreedToTerms) return;

    setIsProcessing(true);

    setTimeout(() => {
      setIsProcessing(false);
      setIsSuccess(true);

      const generatedOrderId = createOrderAndEntity({
        companyName,
        country: jurisdiction,
        tier,
        totalAmount,
        chargedNow,
        clientName: fullName,
        clientEmail: email,
        clientWhatsApp: `${countryCode} ${whatsappNumber}`,
        paymentMethod: paymentTab === 'card' ? 'Visa / MasterCard' : 'Bank Transfer',
      });

      setOrderId(generatedOrderId);

      try {
        confetti({
          particleCount: 150,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#F26522', '#14204A', '#16A34A', '#2563EB'],
        });
      } catch (_) {}
    }, 1500);
  };

  return (
    <div className="checkout-root">
      {/* ─── SUCCESS MODAL ─── */}
      {isSuccess && (
        <div className="modal-backdrop" style={{ zIndex: 500 }}>
          <div className="success-modal animate-scale-in">
            <div className="success-icon-circle">
              <CheckCircle2 size={40} strokeWidth={2.5} />
            </div>
            <h2 className="success-heading">Order Confirmed!</h2>
            <p className="success-order-id">Order #{orderId}</p>
            <p className="success-message">
              Your assigned specialist will contact you within 2 hours to begin your entity formation.
            </p>
            <button
              onClick={() => router.push('/portal/dashboard')}
              className="btn btn-primary btn-lg btn-full"
              style={{ marginTop: 8 }}
            >
              Go to Dashboard
              <ArrowRight size={18} />
            </button>
          </div>
        </div>
      )}

      {/* ─── MAIN LAYOUT ─── */}
      <div className="checkout-grid">
        {/* ─── LEFT: FORM ─── */}
        <form onSubmit={handleSubmit} className="checkout-form animate-slide-up">
          {/* Contact Information */}
          <div className="checkout-section">
            <div className="checkout-section-header">
              <div className="checkout-section-number">1</div>
              <div>
                <h2 className="checkout-section-title">Contact Information</h2>
                <p className="checkout-section-desc">We'll use this to assign your specialist and send updates.</p>
              </div>
            </div>

            <div className="checkout-field-stack">
              <div className="checkout-field">
                <label className="input-label">Full Name</label>
                <div className="input-with-icon">
                  <User size={16} className="input-icon-left" />
                  <input
                    type="text"
                    required
                    placeholder="As it appears on your passport"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="input-field input-icon-input"
                  />
                </div>
              </div>

              <div className="checkout-field">
                <label className="input-label">Email Address</label>
                <div className="input-with-icon">
                  <Mail size={16} className="input-icon-left" />
                  <input
                    type="email"
                    required
                    placeholder="you@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input-field input-icon-input"
                  />
                </div>
              </div>

              <div className="checkout-field">
                <label className="input-label">WhatsApp Number</label>
                <div className="phone-row">
                  <div className="phone-select-wrap">
                    <select
                      value={countryCode}
                      onChange={(e) => setCountryCode(e.target.value)}
                      className="input-field phone-select"
                    >
                      {COUNTRY_CODES.map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.flag} {c.code} ({c.label})
                        </option>
                      ))}
                    </select>
                    <ChevronDown size={14} className="phone-select-arrow" />
                  </div>
                  <input
                    type="tel"
                    required
                    placeholder="50 123 4567"
                    value={whatsappNumber}
                    onChange={(e) => setWhatsappNumber(e.target.value)}
                    className="input-field phone-input"
                  />
                </div>
                <p className="input-helper">For real-time filing updates and document delivery.</p>
              </div>
            </div>
          </div>

          {/* Company Details */}
          <div className="checkout-section">
            <div className="checkout-section-header">
              <div className="checkout-section-number">2</div>
              <div>
                <h2 className="checkout-section-title">Company Details</h2>
                <p className="checkout-section-desc">Pre-filled from your setup wizard.</p>
              </div>
            </div>

            <div className="readonly-grid">
              <div className="readonly-card">
                <span className="readonly-label">Company Name</span>
                <span className="readonly-value">{companyName}</span>
              </div>
              <div className="readonly-card">
                <span className="readonly-label">Jurisdiction</span>
                <span className="readonly-value">{jurisdictionLabel[jurisdiction] || jurisdiction.toUpperCase()}</span>
              </div>
              <div className="readonly-card">
                <span className="readonly-label">Tier</span>
                <span className="readonly-value">{tierLabel[tier] || tier}</span>
              </div>
            </div>
          </div>

          {/* Payment Method */}
          <div className="checkout-section">
            <div className="checkout-section-header">
              <div className="checkout-section-number">3</div>
              <div>
                <h2 className="checkout-section-title">Payment Method</h2>
                <p className="checkout-section-desc">All transactions are encrypted and PCI-compliant.</p>
              </div>
            </div>

            <div className="payment-tabs">
              <button
                type="button"
                onClick={() => setPaymentTab('card')}
                className={`payment-tab ${paymentTab === 'card' ? 'active' : ''}`}
              >
                <CreditCard size={16} />
                <span>Card</span>
              </button>
              <button
                type="button"
                onClick={() => setPaymentTab('bank')}
                className={`payment-tab ${paymentTab === 'bank' ? 'active' : ''}`}
              >
                <Landmark size={16} />
                <span>Bank Transfer</span>
              </button>
            </div>

            {paymentTab === 'card' && (
              <div className="card-form animate-fade-in">
                <div className="checkout-field">
                  <label className="input-label">Card Number</label>
                  <div className="input-with-icon">
                    <CreditCard size={16} className="input-icon-left" />
                    <input
                      type="text"
                      required
                      placeholder="1234 5678 9012 3456"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                      className="input-field input-icon-input"
                      maxLength={19}
                    />
                  </div>
                </div>
                <div className="card-row">
                  <div className="checkout-field">
                    <label className="input-label">Expiry</label>
                    <input
                      type="text"
                      required
                      placeholder="MM / YY"
                      value={cardExpiry}
                      onChange={(e) => setCardExpiry(formatExpiry(e.target.value))}
                      className="input-field"
                      maxLength={7}
                    />
                  </div>
                  <div className="checkout-field">
                    <label className="input-label">CVC</label>
                    <input
                      type="text"
                      required
                      placeholder="123"
                      value={cardCvc}
                      onChange={(e) => setCardCvc(e.target.value.replace(/\D/g, '').slice(0, 4))}
                      className="input-field"
                      maxLength={4}
                    />
                  </div>
                </div>
              </div>
            )}

            {paymentTab === 'bank' && (
              <div className="bank-details animate-fade-in">
                <div className="bank-detail-row">
                  <span className="bank-detail-label">Bank Name</span>
                  <span className="bank-detail-value">Emirates NBD</span>
                </div>
                <div className="bank-detail-row">
                  <span className="bank-detail-label">Account Name</span>
                  <span className="bank-detail-value">GCCStartup Ltd</span>
                </div>
                <div className="bank-detail-row">
                  <span className="bank-detail-label">IBAN</span>
                  <span className="bank-detail-value bank-iban">AE07 0260 0010 1234 5678 901</span>
                </div>
                <div className="bank-detail-row">
                  <span className="bank-detail-label">SWIFT / BIC</span>
                  <span className="bank-detail-value">EBILAEAD</span>
                </div>
                <div className="bank-detail-row">
                  <span className="bank-detail-label">Reference</span>
                  <span className="bank-detail-value text-orange" style={{ fontWeight: 700 }}>
                    {companyName.slice(0, 12).toUpperCase()}
                  </span>
                </div>
                <p className="input-helper" style={{ marginTop: 8 }}>
                  Transfer processing takes 1–2 business days. Your specialist will confirm once funds are received.
                </p>
              </div>
            )}
          </div>

          {/* Billing Address */}
          <div className="checkout-section">
            <div className="checkout-section-header">
              <div className="checkout-section-number">4</div>
              <div>
                <h2 className="checkout-section-title">Billing Address</h2>
                <p className="checkout-section-desc">Optional — for invoicing purposes.</p>
              </div>
            </div>

            <div className="checkout-field-stack">
              <div className="checkout-field">
                <label className="input-label">Country</label>
                <div className="input-with-icon">
                  <MapPin size={16} className="input-icon-left" />
                  <select
                    value={billingCountry}
                    onChange={(e) => setBillingCountry(e.target.value)}
                    className="input-field input-icon-input"
                  >
                    <option value="">Select country</option>
                    {BILLING_COUNTRIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="checkout-field">
                <label className="input-label">Address Line 1</label>
                <input
                  type="text"
                  placeholder="Street address, P.O. box"
                  value={address1}
                  onChange={(e) => setAddress1(e.target.value)}
                  className="input-field"
                />
              </div>

              <div className="checkout-field">
                <label className="input-label">Address Line 2</label>
                <input
                  type="text"
                  placeholder="Apartment, suite, unit (optional)"
                  value={address2}
                  onChange={(e) => setAddress2(e.target.value)}
                  className="input-field"
                />
              </div>

              <div className="address-row">
                <div className="checkout-field" style={{ flex: 2 }}>
                  <label className="input-label">City</label>
                  <input
                    type="text"
                    placeholder="Dubai"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="input-field"
                  />
                </div>
                <div className="checkout-field" style={{ flex: 1 }}>
                  <label className="input-label">State</label>
                  <input
                    type="text"
                    placeholder="—"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="input-field"
                  />
                </div>
                <div className="checkout-field" style={{ flex: 1 }}>
                  <label className="input-label">Postal Code</label>
                  <input
                    type="text"
                    placeholder="00000"
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    className="input-field"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Terms & Submit (mobile: inside form) */}
          <div className="checkout-submit-section mobile-only">
            <label className="terms-check">
              <input
                type="checkbox"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
              />
              <span className="terms-text">
                I agree to the{' '}
                <a href="/terms" target="_blank" className="terms-link">Terms of Service</a>
                {' '}and{' '}
                <a href="/privacy" target="_blank" className="terms-link">Privacy Policy</a>
              </span>
            </label>

            <button
              type="submit"
              disabled={isProcessing || !agreedToTerms || !fullName || !email || !whatsappNumber}
              className="btn btn-primary btn-lg btn-full submit-btn"
            >
              {isProcessing ? (
                <span className="submit-processing">
                  <span className="btn-spinner" />
                  Processing…
                </span>
              ) : (
                <>
                  Complete Order — ${chargedNow.toLocaleString()} USD
                  <Lock size={16} />
                </>
              )}
            </button>

            <div className="secure-badge">
              <Shield size={14} />
              <span>256-bit SSL Encrypted · PCI DSS Compliant</span>
            </div>
          </div>
        </form>

        {/* ─── RIGHT: ORDER SUMMARY ─── */}
        <aside className="checkout-summary">
          <div className="summary-card card">
            <h3 className="summary-title">Order Summary</h3>

            <div className="summary-entity">
              <Building size={18} className="text-orange" />
              <div>
                <p className="summary-entity-name">{companyName}</p>
                <p className="summary-entity-meta">
                  {jurisdictionLabel[jurisdiction] || jurisdiction.toUpperCase()} · {tierLabel[tier] || tier}
                </p>
              </div>
            </div>

            <div className="summary-divider" />

            <div className="summary-line">
              <span>Formation Service & Nominee</span>
              <span className="summary-line-amount">${chargedNow.toLocaleString()}</span>
            </div>

            {isGulf && govFee > 0 && (
              <div className="summary-line summary-line-muted">
                <span>Gov License & Visa (Scheduled)</span>
                <span>${govFee.toLocaleString()}</span>
              </div>
            )}

            <div className="summary-divider" />

            <div className="summary-total">
              <span>Total Due Now</span>
              <span className="summary-total-amount">${chargedNow.toLocaleString()}</span>
            </div>
          </div>

          <div className="summary-trust">
            <div className="trust-badge">
              <ShieldCheck size={16} className="text-success" />
              <span className="trust-badge-text">Secure Checkout</span>
            </div>
            <p className="trust-guarantee">
              <strong>Money-back guarantee:</strong> If corporate banking onboarding is not approved, 100% of your banking fee is refunded.
            </p>
          </div>

          {/* Terms & Submit (desktop: inside sidebar) */}
          <div className="checkout-submit-section desktop-only">
            <label className="terms-check">
              <input
                type="checkbox"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
              />
              <span className="terms-text">
                I agree to the{' '}
                <a href="/terms" target="_blank" className="terms-link">Terms of Service</a>
                {' '}and{' '}
                <a href="/privacy" target="_blank" className="terms-link">Privacy Policy</a>
              </span>
            </label>

            <button
              type="submit"
              disabled={isProcessing || !agreedToTerms || !fullName || !email || !whatsappNumber}
              className="btn btn-primary btn-lg btn-full submit-btn"
              onClick={handleSubmit}
            >
              {isProcessing ? (
                <span className="submit-processing">
                  <span className="btn-spinner" />
                  Processing…
                </span>
              ) : (
                <>
                  Complete Order — ${chargedNow.toLocaleString()} USD
                  <Lock size={16} />
                </>
              )}
            </button>

            <div className="secure-badge">
              <Shield size={14} />
              <span>256-bit SSL Encrypted · PCI DSS Compliant</span>
            </div>
          </div>
        </aside>
      </div>

      <style jsx>{`
        .checkout-root {
          min-height: 100dvh;
          background: var(--color-canvas);
          padding: 0;
        }

        .checkout-grid {
          display: grid;
          grid-template-columns: 1fr 380px;
          gap: 0;
          max-width: 1120px;
          margin: 0 auto;
          min-height: 100dvh;
        }

        @media (max-width: 920px) {
          .checkout-grid {
            grid-template-columns: 1fr;
          }
        }

        /* ─── FORM COLUMN ─── */
        .checkout-form {
          padding: 32px 40px 48px;
          display: flex;
          flex-direction: column;
          gap: 0;
        }

        @media (max-width: 920px) {
          .checkout-form {
            padding: 20px var(--spacing-page) 32px;
          }
        }

        /* ─── SECTIONS ─── */
        .checkout-section {
          padding: 28px 0;
          border-bottom: 1px solid var(--color-border);
        }
        .checkout-section:first-child {
          padding-top: 0;
        }
        .checkout-section:last-of-type {
          border-bottom: none;
        }

        .checkout-section-header {
          display: flex;
          gap: 14px;
          align-items: flex-start;
          margin-bottom: 20px;
        }

        .checkout-section-number {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: var(--color-navy);
          color: #FFFFFF;
          font-size: 13px;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          margin-top: 1px;
        }

        .checkout-section-title {
          font-family: var(--font-heading);
          font-size: 1.05rem;
          font-weight: 700;
          color: var(--color-text);
          line-height: 1.3;
        }

        .checkout-section-desc {
          font-size: 13px;
          color: var(--color-text-tertiary);
          margin-top: 2px;
        }

        .checkout-field-stack {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .checkout-field {
          display: flex;
          flex-direction: column;
        }

        .input-with-icon {
          position: relative;
        }

        .input-icon-left {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--color-text-muted);
          pointer-events: none;
        }

        .input-icon-input {
          padding-left: 40px;
        }

        /* ─── PHONE ROW ─── */
        .phone-row {
          display: flex;
          gap: 8px;
        }

        .phone-select-wrap {
          position: relative;
          flex-shrink: 0;
        }

        .phone-select {
          width: 160px;
          padding-right: 28px;
          appearance: none;
          cursor: pointer;
        }

        .phone-select-arrow {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--color-text-muted);
          pointer-events: none;
        }

        .phone-input {
          flex: 1;
        }

        /* ─── READONLY GRID ─── */
        .readonly-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
        }

        @media (max-width: 600px) {
          .readonly-grid {
            grid-template-columns: 1fr;
          }
        }

        .readonly-card {
          background: var(--color-surface-alt);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          padding: 14px 16px;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .readonly-label {
          font-size: 11px;
          font-weight: 600;
          color: var(--color-text-tertiary);
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }

        .readonly-value {
          font-size: 14px;
          font-weight: 600;
          color: var(--color-text);
        }

        /* ─── PAYMENT TABS ─── */
        .payment-tabs {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
          margin-bottom: 16px;
        }

        .payment-tab {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 12px;
          border-radius: var(--radius-md);
          border: 1.5px solid var(--color-border);
          background: var(--color-surface);
          color: var(--color-text-secondary);
          font-size: 14px;
          font-weight: 600;
          font-family: var(--font-sans);
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .payment-tab:hover {
          border-color: var(--color-border-hover);
          background: var(--color-surface-alt);
        }

        .payment-tab.active {
          border-color: var(--color-orange);
          background: var(--color-orange-light);
          color: var(--color-navy);
        }

        /* ─── CARD FORM ─── */
        .card-form {
          display: flex;
          flex-direction: column;
          gap: 14px;
          padding: 20px;
          background: var(--color-surface-alt);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
        }

        .card-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }

        /* ─── BANK DETAILS ─── */
        .bank-details {
          padding: 20px;
          background: var(--color-surface-alt);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .bank-detail-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          font-size: 13px;
        }

        .bank-detail-label {
          color: var(--color-text-tertiary);
          font-weight: 500;
          flex-shrink: 0;
        }

        .bank-detail-value {
          color: var(--color-text);
          font-weight: 600;
          text-align: right;
          word-break: break-all;
        }

        .bank-iban {
          font-family: 'SF Mono', 'Fira Code', monospace;
          font-size: 12px;
          letter-spacing: 0.03em;
        }

        /* ─── ADDRESS ROW ─── */
        .address-row {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr;
          gap: 12px;
        }

        @media (max-width: 600px) {
          .address-row {
            grid-template-columns: 1fr 1fr;
          }
        }

        /* ─── SUBMIT SECTION ─── */
        .checkout-submit-section {
          display: flex;
          flex-direction: column;
          gap: 14px;
          padding-top: 24px;
          border-top: 1px solid var(--color-border);
        }

        .mobile-only {
          display: none;
        }

        .desktop-only {
          display: flex;
        }

        @media (max-width: 920px) {
          .mobile-only {
            display: flex;
          }
          .desktop-only {
            display: none;
          }
        }

        .terms-check {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          cursor: pointer;
          font-size: 13px;
          color: var(--color-text-secondary);
          line-height: 1.5;
        }

        .terms-check input[type='checkbox'] {
          width: 18px;
          height: 18px;
          border-radius: 4px;
          border: 1.5px solid var(--color-border-hover);
          accent-color: var(--color-orange);
          cursor: pointer;
          flex-shrink: 0;
          margin-top: 1px;
        }

        .terms-text {
          flex: 1;
        }

        .terms-link {
          color: var(--color-orange);
          text-decoration: none;
          font-weight: 600;
        }
        .terms-link:hover {
          text-decoration: underline;
        }

        .submit-btn {
          height: 52px;
          font-size: 15px;
          border-radius: var(--radius-md);
        }

        .submit-processing {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .btn-spinner {
          width: 18px;
          height: 18px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: #FFFFFF;
          border-radius: 50%;
          animation: spin 0.6s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .secure-badge {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          font-size: 12px;
          color: var(--color-text-tertiary);
          font-weight: 500;
        }

        /* ─── SUMMARY SIDEBAR ─── */
        .checkout-summary {
          background: var(--color-surface);
          border-left: 1px solid var(--color-border);
          padding: 32px 28px;
          display: flex;
          flex-direction: column;
          gap: 20px;
          position: sticky;
          top: 0;
          height: 100dvh;
          overflow-y: auto;
        }

        @media (max-width: 920px) {
          .checkout-summary {
            border-left: none;
            border-top: 1px solid var(--color-border);
            height: auto;
            position: static;
            padding: 24px var(--spacing-page) 40px;
            background: var(--color-surface-alt);
          }
        }

        .summary-card {
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 16px;
          background: var(--color-surface);
        }

        @media (max-width: 920px) {
          .summary-card {
            box-shadow: var(--shadow-md);
          }
        }

        .summary-title {
          font-family: var(--font-heading);
          font-size: 1.1rem;
          font-weight: 700;
          color: var(--color-text);
        }

        .summary-entity {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px;
          background: var(--color-orange-light);
          border-radius: var(--radius-md);
        }

        .summary-entity-name {
          font-size: 14px;
          font-weight: 700;
          color: var(--color-navy);
          line-height: 1.3;
        }

        .summary-entity-meta {
          font-size: 12px;
          color: var(--color-text-secondary);
          margin-top: 2px;
        }

        .summary-divider {
          height: 1px;
          background: var(--color-border);
        }

        .summary-line {
          display: flex;
          justify-content: space-between;
          font-size: 14px;
          color: var(--color-text-secondary);
        }

        .summary-line-amount {
          font-weight: 600;
          color: var(--color-text);
        }

        .summary-line-muted {
          color: var(--color-text-tertiary);
          font-size: 13px;
        }

        .summary-total {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-weight: 700;
          font-size: 15px;
          color: var(--color-text);
        }

        .summary-total-amount {
          font-family: var(--font-heading);
          font-size: 1.6rem;
          font-weight: 800;
          color: var(--color-orange);
        }

        /* ─── TRUST ─── */
        .summary-trust {
          display: flex;
          flex-direction: column;
          gap: 10px;
          padding: 16px;
          background: var(--color-surface-alt);
          border-radius: var(--radius-md);
          border: 1px solid var(--color-border);
        }

        .trust-badge {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .trust-badge-text {
          font-size: 13px;
          font-weight: 700;
          color: var(--color-text);
        }

        .trust-guarantee {
          font-size: 12px;
          color: var(--color-text-tertiary);
          line-height: 1.5;
        }
        .trust-guarantee strong {
          color: var(--color-text-secondary);
        }

        /* ─── SUCCESS MODAL ─── */
        .success-modal {
          background: var(--color-surface);
          border-radius: var(--radius-2xl);
          width: 100%;
          max-width: 440px;
          padding: 40px 32px;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          box-shadow: var(--shadow-xl);
        }

        .success-icon-circle {
          width: 72px;
          height: 72px;
          border-radius: 50%;
          background: var(--color-success-light);
          color: var(--color-success);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 4px;
        }

        .success-heading {
          font-family: var(--font-heading);
          font-size: 1.6rem;
          font-weight: 800;
          color: var(--color-text);
        }

        .success-order-id {
          font-size: 14px;
          color: var(--color-text-tertiary);
          font-weight: 500;
        }

        .success-message {
          font-size: 14px;
          color: var(--color-text-secondary);
          line-height: 1.6;
          max-width: 320px;
          margin-bottom: 8px;
        }
      `}</style>
    </div>
  );
}
