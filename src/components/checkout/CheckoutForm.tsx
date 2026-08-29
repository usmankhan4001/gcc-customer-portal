'use client';

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import confetti from 'canvas-confetti';
import { usePortalStore } from '@/lib/store';
import {
  CreditCard,
  ShieldCheck,
  Lock,
  ArrowRight,
  CheckCircle2,
  Building,
  Mail,
  User,
} from 'lucide-react';

export default function CheckoutForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { createOrderAndEntity } = usePortalStore();

  const country = searchParams.get('country') || 'hk';
  const tier = (searchParams.get('tier') as any) || 'tier2';
  const totalAmount = Number(searchParams.get('total')) || 3000;
  const companyName = searchParams.get('name') || 'Apex Global Horizon Ltd';

  const [fullName, setFullName] = useState('Alex Van Der Berg');
  const [email, setEmail] = useState('alex@horizonventures.com');
  const [whatsappNumber, setWhatsappNumber] = useState('612345678');
  const [countryCode, setCountryCode] = useState('+31');
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'apple_pay' | 'wire'>('card');
  const [cardNumber, setCardNumber] = useState('4242 •••• •••• 4242');
  const [expiry, setExpiry] = useState('12/28');
  const [cvc, setCvc] = useState('982');

  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [orderId, setOrderId] = useState('');

  const isGulf = country === 'uae' || country === 'bahrain' || country === 'oman';
  const chargedNow = isGulf ? 1500 : totalAmount;
  const govFeeSchedule = isGulf ? totalAmount - 1500 : 0;

  const handlePay = (e: React.FormEvent) => {
    e.preventDefault();

    if (!fullName || !email || !whatsappNumber) {
      alert('Please fill in your name, email, and WhatsApp number.');
      return;
    }

    setIsProcessing(true);

    setTimeout(() => {
      setIsProcessing(false);
      setIsSuccess(true);

      const generatedOrderId = createOrderAndEntity({
        companyName,
        country,
        tier,
        totalAmount,
        chargedNow,
        clientName: fullName,
        clientEmail: email,
        clientWhatsApp: `${countryCode} ${whatsappNumber}`,
        paymentMethod: paymentMethod === 'card' ? 'Visa / MasterCard' : paymentMethod,
      });

      setOrderId(generatedOrderId);

      try {
        confetti({
          particleCount: 120,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch (err) {
        console.error('Confetti error:', err);
      }
    }, 1200);
  };

  const handleGoToPortal = () => {
    router.push('/portal/dashboard');
  };

  return (
    <div className="checkout-container">
      {/* SUCCESS MODAL */}
      {isSuccess && (
        <div className="modal-backdrop">
          <div className="success-card card">
            <div className="success-icon-box">
              <CheckCircle2 className="w-12 h-12 text-success" />
            </div>
            <h2 className="success-title display-font text-navy">Payment Confirmed!</h2>
            <p className="success-subtitle">
              Order <strong>#{orderId}</strong> is officially registered in the GCCStartup legal filing queue.
            </p>

            <div className="success-info-box card-sand">
              <div className="success-row">
                <span>Entity Name:</span>
                <strong className="text-navy">{companyName}</strong>
              </div>
              <div className="success-row">
                <span>Amount Paid:</span>
                <strong className="text-orange">${chargedNow.toLocaleString()} USD</strong>
              </div>
              <div className="success-row">
                <span>WhatsApp Confirmation:</span>
                <span>Sent to {countryCode} {whatsappNumber}</span>
              </div>
            </div>

            <button onClick={handleGoToPortal} className="btn btn-primary btn-lg w-full">
              <span>Open Document & Official KYC Hub</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Main 2-Column Checkout Layout */}
      <div className="checkout-grid">
        {/* Left Column: Form */}
        <form onSubmit={handlePay} className="checkout-form-card card">
          <div className="form-header">
            <div className="badge badge-navy">
              <Lock className="w-3.5 h-3.5" />
              <span>256-BIT ENCRYPTED CHECKOUT</span>
            </div>
            <h2 className="form-title display-font">Finalize Entity Formation</h2>
            <p className="form-subtitle">Complete your details to allocate your corporate structuring specialist.</p>
          </div>

          {/* Section 1: Contact Info */}
          <div className="form-section">
            <h3 className="section-title display-font">1. Authorized Contact Information</h3>
            <div className="input-group">
              <div>
                <label className="input-label">Full Legal Name (as per Passport):</label>
                <div className="input-with-icon">
                  <User className="w-4 h-4 input-icon" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Alex Van Der Berg"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="input-field pl-10"
                  />
                </div>
              </div>

              <div>
                <label className="input-label">Primary Business Email:</label>
                <div className="input-with-icon">
                  <Mail className="w-4 h-4 input-icon" />
                  <input
                    type="email"
                    required
                    placeholder="alex@horizonventures.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input-field pl-10"
                  />
                </div>
              </div>

              <div>
                <label className="input-label">Official WhatsApp Number (For Direct Live Updates):</label>
                <div className="phone-input-row">
                  <select
                    value={countryCode}
                    onChange={(e) => setCountryCode(e.target.value)}
                    className="input-field country-code-select"
                  >
                    <option value="+31">🇳🇱 +31 (Netherlands)</option>
                    <option value="+49">🇩🇪 +49 (Germany)</option>
                    <option value="+44">🇬🇧 +44 (United Kingdom)</option>
                    <option value="+33">🇫🇷 +33 (France)</option>
                    <option value="+1">🇺🇸 +1 (USA / Canada)</option>
                    <option value="+971">🇦🇪 +971 (UAE)</option>
                    <option value="+973">🇧🇭 +973 (Bahrain)</option>
                    <option value="+968">🇴🇲 +968 (Oman)</option>
                  </select>
                  <input
                    type="tel"
                    required
                    placeholder="6 12345678"
                    value={whatsappNumber}
                    onChange={(e) => setWhatsappNumber(e.target.value)}
                    className="input-field flex-1"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Payment Method */}
          <div className="form-section">
            <h3 className="section-title display-font">2. Payment Method</h3>
            <div className="payment-options">
              <button
                type="button"
                onClick={() => setPaymentMethod('card')}
                className={`pay-method-btn ${paymentMethod === 'card' ? 'active' : ''}`}
              >
                <CreditCard className="w-4 h-4 text-orange" />
                <span>Credit / Debit Card</span>
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('apple_pay')}
                className={`pay-method-btn ${paymentMethod === 'apple_pay' ? 'active' : ''}`}
              >
                <span>🍏 Apple / Google Pay</span>
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('wire')}
                className={`pay-method-btn ${paymentMethod === 'wire' ? 'active' : ''}`}
              >
                <span>🏦 Bank Wire / USDT</span>
              </button>
            </div>

            {paymentMethod === 'card' && (
              <div className="card-inputs-box card-sand">
                <div>
                  <label className="input-label">Card Number:</label>
                  <input
                    type="text"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    className="input-field"
                  />
                </div>
                <div className="card-row">
                  <div>
                    <label className="input-label">Expiry Date:</label>
                    <input
                      type="text"
                      value={expiry}
                      onChange={(e) => setExpiry(e.target.value)}
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="input-label">CVC / CVV:</label>
                    <input
                      type="text"
                      value={cvc}
                      onChange={(e) => setCvc(e.target.value)}
                      className="input-field"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <button type="submit" disabled={isProcessing} className="btn btn-primary btn-lg w-full mt-4">
            {isProcessing ? (
              <span>Securing Transaction...</span>
            ) : (
              <span>Pay ${chargedNow.toLocaleString()} USD & Start Formation</span>
            )}
            <ArrowRight className="w-5 h-5" />
          </button>
        </form>

        {/* Right Column: Summary */}
        <div className="order-summary-sidebar">
          <div className="summary-card card">
            <h3 className="summary-title display-font">Order Specification</h3>
            
            <div className="entity-target-box card-sand">
              <Building className="w-5 h-5 text-orange" />
              <div>
                <strong className="block text-navy">{companyName}</strong>
                <span className="text-xs text-secondary">Target: {country.toUpperCase()} ({tier.toUpperCase()})</span>
              </div>
            </div>

            <div className="summary-breakdown">
              <div className="sum-row">
                <span>Formation Service & Nominee</span>
                <strong className="text-navy">${chargedNow.toLocaleString()}</strong>
              </div>

              {isGulf && govFeeSchedule > 0 && (
                <div className="sum-row text-tertiary">
                  <span>Gov License & Visa (Scheduled Direct)</span>
                  <span>${govFeeSchedule.toLocaleString()}</span>
                </div>
              )}

              <div className="sum-divider" />

              <div className="sum-total-row">
                <span className="text-navy">Amount Due Now</span>
                <span className="total-val display-font text-orange">
                  ${chargedNow.toLocaleString()}
                </span>
              </div>
            </div>

            <div className="guarantee-box card-blue-lt">
              <ShieldCheck className="w-5 h-5 text-blue shrink-0" />
              <p className="text-xs text-navy">
                <strong>Money-Back Bank Guarantee:</strong> If corporate banking onboarding is not approved, 100% of your banking fee is refunded.
              </p>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .checkout-container {
          max-width: 1040px;
          margin: 0 auto;
          width: 100%;
        }

        .checkout-grid {
          display: grid;
          grid-template-columns: 1fr 360px;
          gap: 28px;
        }

        @media (max-width: 860px) {
          .checkout-grid {
            grid-template-columns: 1fr;
          }
        }

        .checkout-form-card {
          padding: 36px 32px;
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .form-title {
          font-size: 2rem;
          font-weight: 700;
          margin: 8px 0 4px 0;
          color: var(--navy);
        }

        .form-subtitle {
          color: var(--text-secondary);
          font-size: 15px;
        }

        .form-section {
          display: flex;
          flex-direction: column;
          gap: 14px;
          border-top: 1px solid var(--border);
          padding-top: 20px;
        }

        .section-title {
          font-size: 1.15rem;
          font-weight: 700;
          color: var(--navy);
        }

        .input-group {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .input-with-icon {
          position: relative;
        }

        .input-icon {
          position: absolute;
          left: 16px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--text-tertiary);
        }

        .pl-10 {
          padding-left: 44px;
        }

        .phone-input-row {
          display: flex;
          gap: 8px;
        }

        .country-code-select {
          width: 190px;
        }

        .payment-options {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
          gap: 10px;
        }

        .pay-method-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 13px;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-pill);
          color: var(--text-secondary);
          font-weight: 700;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .pay-method-btn.active {
          background: var(--orange-lt);
          border-color: var(--orange);
          color: var(--navy);
        }

        .card-inputs-box {
          padding: 20px;
          border-radius: var(--radius);
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-top: 8px;
        }

        .card-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }

        .order-summary-sidebar {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .summary-card {
          padding: 28px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .summary-title {
          font-size: 1.25rem;
          font-weight: 700;
          color: var(--navy);
        }

        .entity-target-box {
          padding: 14px;
          border-radius: var(--radius);
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .summary-breakdown {
          display: flex;
          flex-direction: column;
          gap: 10px;
          font-size: 14px;
        }

        .sum-row {
          display: flex;
          justify-content: space-between;
          color: var(--text-secondary);
        }

        .sum-divider {
          height: 1px;
          background: var(--border);
          margin: 6px 0;
        }

        .sum-total-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-weight: 700;
          font-size: 16px;
        }

        .total-val {
          font-size: 1.8rem;
        }

        .guarantee-box {
          padding: 14px;
          border-radius: var(--radius);
          display: flex;
          gap: 10px;
          align-items: center;
        }

        .modal-backdrop {
          position: fixed;
          inset: 0;
          z-index: 300;
          background: rgba(20, 32, 74, 0.7);
          backdrop-filter: blur(10px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }

        .success-card {
          max-width: 520px;
          width: 100%;
          padding: 36px 32px;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
        }

        .success-icon-box {
          width: 64px;
          height: 64px;
          background: var(--success-lt);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .success-title {
          font-size: 2.2rem;
          font-weight: 700;
        }

        .success-subtitle {
          color: var(--text-secondary);
          font-size: 15px;
        }

        .success-info-box {
          padding: 18px;
          border-radius: var(--radius);
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 8px;
          font-size: 14px;
          text-align: left;
        }

        .success-row {
          display: flex;
          justify-content: space-between;
          color: var(--text-secondary);
        }
      `}</style>
    </div>
  );
}
