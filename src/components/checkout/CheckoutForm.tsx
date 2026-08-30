'use client';

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { usePortalStore } from '@/lib/store';
import CountryFlag from '@/components/ui/CountryFlag';
import StickyFooter from '@/components/ui/StickyFooter';
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
  { code: '+971', label: 'UAE (+971)' },
  { code: '+973', label: 'Bahrain (+973)' },
  { code: '+968', label: 'Oman (+968)' },
  { code: '+44', label: 'UK (+44)' },
  { code: '+1', label: 'USA/CA (+1)' },
  { code: '+49', label: 'Germany (+49)' },
  { code: '+31', label: 'Netherlands (+31)' },
  { code: '+33', label: 'France (+33)' },
  { code: '+91', label: 'India (+91)' },
  { code: '+65', label: 'Singapore (+65)' },
  { code: '+852', label: 'Hong Kong (+852)' },
];

export default function CheckoutForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { createOrderAndEntity } = usePortalStore();

  const jurisdiction = searchParams.get('country') || 'uae';
  const tier = (searchParams.get('tier') as any) || 'tier2';
  const totalAmount = Number(searchParams.get('total')) || 3000;
  const companyName = searchParams.get('name') || 'Apex Global Horizon Ltd';

  const [fullName, setFullName] = useState('Alex Van Der Berg');
  const [email, setEmail] = useState('alex@vanderberg-holdings.eu');
  const [whatsappNumber, setWhatsappNumber] = useState('6 12345678');
  const [countryCode, setCountryCode] = useState('+31');

  const [paymentTab, setPaymentTab] = useState<'card' | 'bank'>('card');
  const [cardNumber, setCardNumber] = useState('4242 •••• •••• 4242');
  const [cardExpiry, setCardExpiry] = useState('12/28');
  const [cardCvc, setCardCvc] = useState('849');
  const [splitPayment, setSplitPayment] = useState<'full' | 'deposit'>('full');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const chargedNow = splitPayment === 'deposit' ? Math.round(totalAmount / 2) : totalAmount;

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!fullName || !email || !whatsappNumber) return;

    setIsProcessing(true);

    setTimeout(() => {
      setIsProcessing(false);
      setIsSuccess(true);

      createOrderAndEntity({
        companyName,
        country: jurisdiction,
        tier,
        totalAmount,
        chargedNow,
        clientName: fullName,
        clientEmail: email,
        clientWhatsApp: `${countryCode} ${whatsappNumber}`,
        paymentMethod: paymentTab === 'card' ? 'Visa / Mastercard' : 'Direct Corporate Wire',
      });
    }, 1200);
  };

  if (isSuccess) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: '50%',
            background: 'var(--success-lt)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <CheckCircle2 size={40} color="var(--success)" />
        </div>

        <div>
          <span className="badge badge-success">PAYMENT AUTHORIZED</span>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.6rem', color: 'var(--navy)', marginTop: 6 }}>
            Formation File Activated!
          </h2>
          <p style={{ fontSize: 13, color: 'var(--text-tertiary)', marginTop: 4 }}>
            Order for <strong>{companyName}</strong> has been registered.
          </p>
        </div>

        <div className="card app-card" style={{ width: '100%', maxWidth: 420, padding: 18, textAlign: 'left' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '6px 0' }}>
            <span style={{ color: 'var(--text-tertiary)' }}>Charged Now:</span>
            <strong style={{ color: 'var(--orange)' }}>${chargedNow.toLocaleString()} USD</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '6px 0' }}>
            <span style={{ color: 'var(--text-tertiary)' }}>Assigned Specialist:</span>
            <strong style={{ color: 'var(--navy)' }}>Abdullah K. (Senior Lead)</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '6px 0' }}>
            <span style={{ color: 'var(--text-tertiary)' }}>Next Step:</span>
            <span className="badge badge-orange">Official KYC Verification</span>
          </div>
        </div>

        <button
          onClick={() => router.push('/portal/vault')}
          className="btn btn-primary btn-lg"
          style={{ width: '100%', maxWidth: 420 }}
        >
          <span>Open Document Vault & KYC →</span>
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18, paddingBottom: 80 }}>
      {/* Order Header Summary */}
      <div className="card app-card" style={{ padding: 18 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <CountryFlag country={jurisdiction} size="lg" />
            <div>
              <span className="badge badge-navy" style={{ fontSize: 10 }}>CORPORATE CHECKOUT</span>
              <h2 style={{ fontSize: 15, fontWeight: 800, color: 'var(--navy)', marginTop: 2 }}>{companyName}</h2>
              <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{jurisdiction.toUpperCase()} Formation Package</div>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Package Total</div>
            <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--orange)' }}>
              ${totalAmount.toLocaleString()} USD
            </div>
          </div>
        </div>
      </div>

      {/* Founder Details */}
      <div className="card app-card" style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div className="section-title" style={{ marginBottom: 0 }}>Founder & UBO Information</div>

        <div>
          <label className="input-label">Full Legal Name (as in Passport):</label>
          <input
            type="text"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="input-field"
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div>
            <label className="input-label">Email Address:</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field"
            />
          </div>

          <div>
            <label className="input-label">WhatsApp Mobile Phone:</label>
            <input
              type="text"
              required
              value={whatsappNumber}
              onChange={(e) => setWhatsappNumber(e.target.value)}
              className="input-field"
            />
          </div>
        </div>
      </div>

      {/* Payment Split Options */}
      <div className="card app-card" style={{ padding: 18 }}>
        <div className="section-title">Payment Settlement Schedule</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div
            onClick={() => setSplitPayment('full')}
            className={`card card-hover ${splitPayment === 'full' ? 'card-sand' : ''}`}
            style={{
              cursor: 'pointer',
              border: splitPayment === 'full' ? '1.5px solid var(--orange)' : undefined,
              padding: 12,
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--navy)' }}>100% Full Payment</span>
              <span className="badge badge-success" style={{ fontSize: 9 }}>FASTEST</span>
            </div>
            <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--orange)' }}>${totalAmount.toLocaleString()} USD</div>
            <div style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>Immediate expedited registry dispatch</div>
          </div>

          <div
            onClick={() => setSplitPayment('deposit')}
            className={`card card-hover ${splitPayment === 'deposit' ? 'card-sand' : ''}`}
            style={{
              cursor: 'pointer',
              border: splitPayment === 'deposit' ? '1.5px solid var(--orange)' : undefined,
              padding: 12,
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--navy)' }}>50% Milestone Deposit</span>
              <span className="badge badge-blue" style={{ fontSize: 9 }}>MILESTONE</span>
            </div>
            <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--orange)' }}>${chargedNow.toLocaleString()} USD</div>
            <div style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>50% balance upon license issuance</div>
          </div>
        </div>
      </div>

      {/* Payment Rails */}
      <div className="card app-card" style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            type="button"
            onClick={() => setPaymentTab('card')}
            className={`btn ${paymentTab === 'card' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ flex: 1, fontSize: 13 }}
          >
            <CreditCard size={16} /> Credit / Debit Card
          </button>
          <button
            type="button"
            onClick={() => setPaymentTab('bank')}
            className={`btn ${paymentTab === 'bank' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ flex: 1, fontSize: 13 }}
          >
            <Landmark size={16} /> Corporate Wire Transfer
          </button>
        </div>

        {paymentTab === 'card' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div>
              <label className="input-label">Card Number:</label>
              <input
                type="text"
                value={cardNumber}
                onChange={(e) => setCardNumber(e.target.value)}
                className="input-field"
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                <label className="input-label">Expires (MM/YY):</label>
                <input
                  type="text"
                  value={cardExpiry}
                  onChange={(e) => setCardExpiry(e.target.value)}
                  className="input-field"
                />
              </div>
              <div>
                <label className="input-label">Security CVC:</label>
                <input
                  type="text"
                  value={cardCvc}
                  onChange={(e) => setCardCvc(e.target.value)}
                  className="input-field"
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="card card-sand" style={{ padding: 14, fontSize: 12, lineHeight: 1.5 }}>
            <strong style={{ color: 'var(--navy)' }}>Direct Wire Transfer Instructions:</strong>
            <p style={{ marginTop: 4 }}>
              SWIFT / SEPA wire details with escrow reference will be generated upon confirmation.
            </p>
          </div>
        )}
      </div>

      {/* Sticky Bottom Action Bar */}
      <StickyFooter
        priceLabel="CHARGED NOW"
        priceValue={`$${chargedNow.toLocaleString()} USD`}
        priceSub="256-Bit SSL Encrypted"
        primaryLabel={`Authorize $${chargedNow.toLocaleString()} USD`}
        primaryAction={handleSubmit}
        primaryLoading={isProcessing}
      />
    </form>
  );
}
