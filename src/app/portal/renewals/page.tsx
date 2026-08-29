'use client';

import React, { useState } from 'react';
import { usePortalStore } from '@/lib/store';
import Modal from '@/components/ui/Modal';
import CountryFlag from '@/components/ui/CountryFlag';
import {
  Clock,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  AlertTriangle,
  ArrowRight,
  Receipt,
  FileCheck,
  CreditCard,
} from 'lucide-react';

export default function RenewalsPortalPage() {
  const { entities, activeEntityId, setActiveEntityId, payRenewalInvoice } = usePortalStore();
  const [isRenewModalOpen, setIsRenewModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPaidSuccess, setIsPaidSuccess] = useState(false);

  const activeEntity = entities.find((e) => e.id === activeEntityId) || entities[0];

  const handlePayRenewal = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setIsPaidSuccess(true);
      if (activeEntity) payRenewalInvoice(activeEntity.id);
      setTimeout(() => {
        setIsPaidSuccess(false);
        setIsRenewModalOpen(false);
      }, 1500);
    }, 1000);
  };

  if (!activeEntity) return null;

  const isDueSoon = activeEntity.renewalDaysLeft <= 90;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <span className="badge badge-navy">STATUTORY CONTINUITY</span>
          <span className="badge badge-orange">ANNUAL COMPLIANCE</span>
        </div>
        <h1
          style={{
            fontFamily: 'var(--font-heading)',
            fontSize: '1.65rem',
            fontWeight: 800,
            color: 'var(--navy)',
            letterSpacing: '-0.02em',
          }}
        >
          Annual License <span style={{ color: 'var(--orange)' }}>Renewals & Maintenance</span>
        </h1>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>
          Ensure uninterrupted corporate legal standing, registered agent service, and banking validity.
        </p>
      </div>

      {/* Entity Switcher Pills */}
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
        {entities.map((ent) => (
          <button
            key={ent.id}
            onClick={() => setActiveEntityId(ent.id)}
            className={`btn ${ent.id === activeEntity.id ? 'btn-primary' : 'btn-secondary'}`}
            style={{ flexShrink: 0, gap: 8, fontSize: 13, padding: '8px 16px' }}
          >
            <CountryFlag country={ent.countryCode} size="sm" />
            <span style={{ maxWidth: 130, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {ent.name}
            </span>
          </button>
        ))}
      </div>

      {/* Renewal Status Banner */}
      <div
        className="card card-sand"
        style={{
          padding: 18,
          borderLeft: `4px solid ${isDueSoon ? 'var(--orange)' : 'var(--success)'}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: isDueSoon ? 'var(--orange-lt)' : 'var(--success-lt)',
              color: isDueSoon ? 'var(--orange)' : 'var(--success)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Clock size={22} />
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              RENEWAL COUNTDOWN
            </div>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--navy)' }}>
              {activeEntity.renewalDaysLeft} Days Remaining
            </h3>
            <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
              Trade License Expiry: {activeEntity.licenseExpiryDate}
            </div>
          </div>
        </div>

        <button
          onClick={() => setIsRenewModalOpen(true)}
          className="btn btn-primary"
          style={{ height: 42, padding: '0 18px', fontSize: 13 }}
        >
          <span>Renew for Next Year</span>
          <ArrowRight size={14} />
        </button>
      </div>

      {/* Statutory Maintenance Breakdown */}
      <div className="card app-card" style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div className="section-title">Annual Statutory Breakdown</div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[
            { title: 'Official Government Freezone License Renewal Fee', cost: '$1,200 USD', desc: 'Direct government regulatory charge' },
            { title: 'Registered Agent & Statutory Office Representation', cost: '$450 USD', desc: 'Mandatory statutory address & legal representative' },
            { title: 'Nominee Director & Trustee Shareholder Maintenance', cost: '$800 USD', desc: '12 months nominee deed extension & PoA renewal' },
            { title: 'Corporate Banking Good Standing Certificate', cost: 'Included', desc: 'Banker compliance confirmation' },
          ].map((item, idx) => (
            <div key={idx} className="card" style={{ padding: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--navy)' }}>{item.title}</div>
                <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{item.desc}</div>
              </div>
              <strong style={{ fontSize: 13, color: 'var(--orange)' }}>{item.cost}</strong>
            </div>
          ))}
        </div>
      </div>

      {/* Renewal Modal */}
      <Modal
        isOpen={isRenewModalOpen}
        onClose={() => setIsRenewModalOpen(false)}
        title="Annual License Renewal Settlement"
        badge="INSTANT EXTENSION"
        badgeVariant="orange"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.4 }}>
            Extend the commercial trade license for <strong>{activeEntity.name}</strong> for another 12 months with immediate government priority filing.
          </p>

          <div className="card card-sand" style={{ padding: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>Total Annual Renewal Cost:</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--orange)' }}>$2,450 USD</div>
            </div>
            <span className="badge badge-success">ALL FEES INCLUDED</span>
          </div>

          <button
            onClick={handlePayRenewal}
            disabled={isProcessing || isPaidSuccess}
            className="btn btn-primary btn-lg"
            style={{ width: '100%' }}
          >
            <CreditCard size={18} />
            <span>{isPaidSuccess ? 'Renewal Confirmed!' : isProcessing ? 'Processing...' : 'Authorize $2,450 USD & Extend'}</span>
          </button>
        </div>
      </Modal>
    </div>
  );
}
