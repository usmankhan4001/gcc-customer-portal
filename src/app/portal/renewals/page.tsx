'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePortalStore } from '@/lib/store';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import AlertBanner from '@/components/ui/AlertBanner';
import Modal from '@/components/ui/Modal';
import {
  Clock,
  ShieldCheck,
  Calendar,
  CreditCard,
  CheckCircle2,
  AlertTriangle,
  Building,
  ArrowRight,
  FileCheck,
} from 'lucide-react';

export default function RenewalsPage() {
  const { entities, activeEntityId, setActiveEntityId, payRenewalInvoice } = usePortalStore();
  const activeEntity = entities.find((e) => e.id === activeEntityId) || entities[0];

  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPaidSuccess, setIsPaidSuccess] = useState(false);

  const renewalFee = 1200; // Annual government license + registered agent + nominee continuation
  const isUrgent = (activeEntity?.renewalDaysLeft ?? 365) <= 90;

  const handlePayRenewal = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setIsPaidSuccess(true);
      if (activeEntity) {
        payRenewalInvoice(activeEntity.id);
      }
    }, 1200);
  };

  if (!activeEntity) {
    return <div className="text-center py-20">No active entity found.</div>;
  }

  return (
    <div className="renewals-container">
      {/* Header */}
      <Card variant="sand" padding="md" className="renewals-header">
        <div className="badge-row">
          <Badge variant="navy" icon={<Clock className="w-3.5 h-3.5" />}>
            ANNUAL MAINTENANCE & CONTINUITY HUB
          </Badge>
          <Badge variant="blue">{activeEntity.jurisdiction}</Badge>
        </div>
        <h1 className="header-title display-font">
          Trade License & <span className="text-orange">Nominee Renewals</span>
        </h1>
        <p className="header-desc">
          Automated compliance tracking to maintain active corporate good standing, registered office address, and licensed nominee appointments.
        </p>
      </Card>

      {/* Entity Switcher */}
      <div className="entity-pills-row">
        {entities.map((ent) => (
          <button
            key={ent.id}
            onClick={() => {
              setActiveEntityId(ent.id);
              setIsPaidSuccess(false);
            }}
            className={`entity-tab-btn ${ent.id === activeEntity.id ? 'active' : ''}`}
          >
            <span>{ent.flag}</span>
            <span className="font-bold">{ent.name}</span>
            <span className="days-badge">
              {ent.renewalDaysLeft} Days Left
            </span>
          </button>
        ))}
      </div>

      {/* Urgent Warning if <= 90 days */}
      {isUrgent && (
        <AlertBanner
          type="warning"
          title="⚠️ Annual License Renewal Window Open"
          description={`Your government trade license for ${activeEntity.name} expires in ${activeEntity.renewalDaysLeft} days (${activeEntity.licenseExpiryDate}). Settle renewal before expiration to avoid statutory registry penalty fees.`}
          action={{
            label: `Pay Renewal ($${renewalFee.toLocaleString()})`,
            onClick: () => setIsPayModalOpen(true),
          }}
        />
      )}

      {/* 2-Column Maintenance Grid */}
      <div className="maintenance-grid">
        {/* Left Column: Countdown & Status */}
        <Card variant="surface" padding="md" className="status-card">
          <div className="status-top">
            <div>
              <span className="text-xs text-tertiary font-bold uppercase">RENEWAL COUNTDOWN</span>
              <h2 className="status-entity-title display-font">{activeEntity.name}</h2>
            </div>
            <Badge variant={isUrgent ? 'warning' : 'success'}>
              {activeEntity.renewalDaysLeft} Days Remaining
            </Badge>
          </div>

          <div className="countdown-display-box card-sand">
            <div className="countdown-item">
              <span className="count-number display-font text-navy">
                {activeEntity.renewalDaysLeft}
              </span>
              <span className="count-label">Days to Expiry</span>
            </div>
            <div className="count-divider" />
            <div className="countdown-item">
              <span className="count-number display-font text-navy">
                {activeEntity.licenseExpiryDate}
              </span>
              <span className="count-label">Official Expiry Date</span>
            </div>
          </div>

          <div className="inclusions-list">
            <span className="text-xs font-bold text-navy uppercase">Included in Annual Maintenance:</span>
            {[
              'Government Trade License Renewal & Registry Filing',
              '1-Year Registered Office Address & Statutory Secretary',
              'Nominee Director & Trustee Shareholder Continuation',
              'Certificate of Good Standing & Registry Renewal Receipt',
            ].map((item, idx) => (
              <div key={idx} className="inclusion-item">
                <CheckCircle2 className="w-4 h-4 text-orange shrink-0" />
                <span className="text-sm text-secondary">{item}</span>
              </div>
            ))}
          </div>

          <Button
            variant="primary"
            size="lg"
            className="w-full mt-4"
            onClick={() => setIsPayModalOpen(true)}
            rightIcon={<ArrowRight className="w-4 h-4" />}
          >
            <span>Renew License & Nominee (${renewalFee.toLocaleString()})</span>
          </Button>
        </Card>

        {/* Right Column: Invoices & Statutory Schedule */}
        <div className="schedule-col">
          <Card variant="surface" padding="md" className="schedule-card">
            <h3 className="section-title display-font">Statutory Compliance Schedule</h3>

            <div className="timeline-items">
              <div className="timeline-item card-sand">
                <div className="time-icon-box">
                  <Calendar className="w-4 h-4 text-navy" />
                </div>
                <div className="time-info">
                  <strong className="block text-navy text-sm">60 Days Prior to Expiry</strong>
                  <span className="text-xs text-secondary">Early-bird notification & registry invoice generated</span>
                </div>
                <Badge variant="navy">Auto-Alert</Badge>
              </div>

              <div className="timeline-item card-sand">
                <div className="time-icon-box">
                  <Calendar className="w-4 h-4 text-orange" />
                </div>
                <div className="time-info">
                  <strong className="block text-navy text-sm">30 Days Prior to Expiry</strong>
                  <span className="text-xs text-secondary">Registry preparation & nominee PoA extension drafting</span>
                </div>
                <Badge variant="orange">Drafting</Badge>
              </div>

              <div className="timeline-item card-sand">
                <div className="time-icon-box">
                  <FileCheck className="w-4 h-4 text-success" />
                </div>
                <div className="time-info">
                  <strong className="block text-navy text-sm">Expiry Date ({activeEntity.licenseExpiryDate})</strong>
                  <span className="text-xs text-secondary">Updated 1-year trade license delivered to your Cloud Locker</span>
                </div>
                <Badge variant="success">Final Handover</Badge>
              </div>
            </div>
          </Card>

          {/* Assigned Specialist Concierge Card */}
          <Card variant="blue-lt" padding="sm" className="specialist-card">
            <ShieldCheck className="w-6 h-6 text-blue shrink-0" />
            <div>
              <strong className="block text-navy text-sm">Dedicated Continuity Manager</strong>
              <p className="text-xs text-secondary">
                {activeEntity.assignedSpecialist} handles your government filing. For bespoke renewals, reach out on WhatsApp at{' '}
                <strong>{activeEntity.specialistPhone}</strong>.
              </p>
            </div>
          </Card>
        </div>
      </div>

      {/* RENEWAL PAYMENT MODAL */}
      <Modal
        isOpen={isPayModalOpen}
        onClose={() => {
          setIsPayModalOpen(false);
          setIsPaidSuccess(false);
        }}
        title="Annual License & Nominee Renewal"
        badge="INSTANT IN-APP SETTLEMENT"
        badgeVariant="orange"
      >
        {!isPaidSuccess ? (
          <div className="pay-modal-body">
            <div className="modal-invoice-summary card-sand">
              <div className="inv-row">
                <span className="text-secondary">{activeEntity.name} (1-Year Renewal)</span>
                <strong className="text-navy">${renewalFee.toLocaleString()} USD</strong>
              </div>
              <div className="inv-row text-xs text-tertiary">
                <span>Includes Government License Fee + Registered Agent + Nominee</span>
                <span>Fixed Rate</span>
              </div>
              <div className="inv-divider" />
              <div className="inv-total">
                <span className="font-bold text-navy">Total Charged Now:</span>
                <span className="display-font text-orange font-bold text-xl">${renewalFee.toLocaleString()} USD</span>
              </div>
            </div>

            <div className="payment-method-box">
              <label className="input-label">Select Payment Method:</label>
              <div className="card-mock card-sand">
                <CreditCard className="w-5 h-5 text-orange inline mr-2" />
                <span className="text-sm font-bold text-navy">Saved Visa •••• 4242 (Instant Processing)</span>
              </div>
            </div>

            <Button
              variant="primary"
              size="lg"
              className="w-full mt-2"
              isLoading={isProcessing}
              onClick={handlePayRenewal}
            >
              <span>Authorize & Pay ${renewalFee.toLocaleString()} USD</span>
            </Button>
          </div>
        ) : (
          <div className="pay-success-body">
            <div className="success-icon-wrap">
              <CheckCircle2 className="w-12 h-12 text-success" />
            </div>
            <h3 className="display-font text-navy text-xl text-center">Renewal Successfully Extended!</h3>
            <p className="text-sm text-secondary text-center">
              Your license renewal for <strong>{activeEntity.name}</strong> is confirmed. 365 days have been added to your corporate good standing.
            </p>
            <Button
              variant="navy"
              size="md"
              className="w-full mt-2"
              onClick={() => setIsPayModalOpen(false)}
            >
              <span>Back to Renewals Hub</span>
            </Button>
          </div>
        )}
      </Modal>

      <style jsx>{`
        .renewals-container {
          display: flex;
          flex-direction: column;
          gap: 24px;
          width: 100%;
        }

        .renewals-header {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .badge-row {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .header-title {
          font-size: 2.2rem;
          font-weight: 700;
          color: var(--navy);
        }

        .header-desc {
          font-size: 15px;
          color: var(--text-secondary);
        }

        .entity-pills-row {
          display: flex;
          align-items: center;
          gap: 10px;
          overflow-x: auto;
        }

        .entity-tab-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 18px;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-pill);
          color: var(--navy);
          font-size: 14px;
          cursor: pointer;
          white-space: nowrap;
          transition: all 0.2s;
        }

        .entity-tab-btn.active {
          border-color: var(--orange);
          background: var(--orange-lt);
        }

        .days-badge {
          font-size: 11px;
          font-weight: 700;
          padding: 2px 7px;
          border-radius: var(--radius-pill);
          background: var(--sand);
          color: var(--navy);
        }

        .maintenance-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
        }

        @media (max-width: 860px) {
          .maintenance-grid {
            grid-template-columns: 1fr;
          }
        }

        .status-card {
          display: flex;
          flex-direction: column;
          gap: 18px;
        }

        .status-top {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }

        .status-entity-title {
          font-size: 1.4rem;
          color: var(--navy);
          margin-top: 2px;
        }

        .countdown-display-box {
          padding: 20px;
          border-radius: var(--radius);
          display: flex;
          align-items: center;
          justify-content: space-around;
        }

        .countdown-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2px;
        }

        .count-number {
          font-size: 2rem;
          font-weight: 700;
        }

        .count-label {
          font-size: 12px;
          color: var(--text-tertiary);
          font-weight: 600;
        }

        .count-divider {
          width: 1px;
          height: 44px;
          background: var(--border);
        }

        .inclusions-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .inclusion-item {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .schedule-col {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .schedule-card {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .section-title {
          font-size: 1.25rem;
          color: var(--navy);
        }

        .timeline-items {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .timeline-item {
          padding: 14px 16px;
          border-radius: var(--radius);
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }

        .time-icon-box {
          width: 32px;
          height: 32px;
          border-radius: var(--radius-sm);
          background: var(--surface);
          display: flex;
          align-items: center;
          justify-content: center;
          shrink-0: 0;
        }

        .time-info {
          flex: 1;
        }

        .specialist-card {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .pay-modal-body {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .modal-invoice-summary {
          padding: 18px;
          border-radius: var(--radius);
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .inv-row {
          display: flex;
          justify-content: space-between;
          font-size: 14px;
        }

        .inv-divider {
          height: 1px;
          background: var(--border);
          margin: 4px 0;
        }

        .inv-total {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .card-mock {
          padding: 12px 16px;
          border-radius: var(--radius-pill);
          display: flex;
          align-items: center;
        }

        .pay-success-body {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 14px;
          padding: 12px 0;
        }

        .success-icon-wrap {
          width: 64px;
          height: 64px;
          border-radius: 50%;
          background: var(--success-lt);
          display: flex;
          align-items: center;
          justify-content: center;
        }
      `}</style>
    </div>
  );
}
