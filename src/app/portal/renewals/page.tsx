'use client';

import React, { useState } from 'react';
import { usePortalStore } from '@/lib/store';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useToast } from '@/components/ui/Toast';
import {
  Clock,
  Calendar,
  CreditCard,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  TrendingUp,
} from 'lucide-react';

function EntitySelector({
  entities,
  activeId,
  onSelect,
}: {
  entities: { id: string; name: string; flag: string; renewalDaysLeft: number }[];
  activeId: string;
  onSelect: (id: string) => void;
}) {
  if (entities.length <= 1) return null;
  return (
    <div className="h-scroll" style={{ gap: 8, marginBottom: 20 }}>
      {entities.map((ent) => (
        <button
          key={ent.id}
          onClick={() => onSelect(ent.id)}
          className={`chip ${ent.id === activeId ? 'active' : ''}`}
          style={{ flexShrink: 0 }}
        >
          <span>{ent.flag}</span>
          <span className="truncate" style={{ maxWidth: 110 }}>{ent.name}</span>
          <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 6px', borderRadius: 'var(--radius-pill)', background: ent.renewalDaysLeft <= 90 ? 'var(--color-error-light)' : 'var(--color-surface-alt)', color: ent.renewalDaysLeft <= 90 ? 'var(--color-error)' : 'var(--color-text-secondary)' }}>
            {ent.renewalDaysLeft}d
          </span>
        </button>
      ))}
    </div>
  );
}

export default function RenewalsPage() {
  const { entities, activeEntityId, setActiveEntityId, payRenewalInvoice } = usePortalStore();
  const { showToast } = useToast();
  const entity = entities.find((e) => e.id === activeEntityId) || entities[0];

  const [payModalOpen, setPayModalOpen] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [paidSuccess, setPaidSuccess] = useState(false);

  const renewalFee = 1200;
  const isUrgent = (entity?.renewalDaysLeft ?? 365) <= 90;
  const daysLeft = entity?.renewalDaysLeft ?? 0;
  const progress = Math.max(0, Math.min(100, Math.round(((365 - daysLeft) / 365) * 100)));

  const handlePay = () => {
    setProcessing(true);
    setTimeout(() => {
      setProcessing(false);
      setPaidSuccess(true);
      if (entity) payRenewalInvoice(entity.id);
      showToast('success', 'Renewal payment confirmed — 365 days added');
    }, 1200);
  };

  if (!entity) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon"><Clock size={32} /></div>
        <h3 className="empty-state-title">No Active Entity</h3>
        <p className="empty-state-desc">Set up a company to view renewal information.</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Page Header */}
      <div className="animate-fade-in">
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text-muted)', letterSpacing: '0.08em', marginBottom: 4 }}>
          TRACK AND MANAGE RENEWALS
        </div>
        <h1 className="font-heading" style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--color-text)', lineHeight: 1.2 }}>
          License <span style={{ color: 'var(--color-orange)' }}>Renewals</span>
        </h1>
        <p style={{ fontSize: 14, color: 'var(--color-text-secondary)', marginTop: 4 }}>
          Track and manage renewals for your corporate entities.
        </p>
      </div>

      {/* Entity Selector */}
      <EntitySelector
        entities={entities}
        activeId={entity.id}
        onSelect={(id) => { setActiveEntityId(id); setPaidSuccess(false); }}
      />

      {/* Urgent Warning */}
      {isUrgent && (
        <div
          className="card card-padded animate-slide-up"
          style={{ borderLeft: '4px solid var(--color-error)', display: 'flex', gap: 12, alignItems: 'flex-start' }}
        >
          <AlertTriangle size={20} style={{ color: 'var(--color-error)', flexShrink: 0, marginTop: 2 }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)', marginBottom: 2 }}>
              License Renewal Window Open
            </div>
            <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', lineHeight: 1.45 }}>
              Your trade license expires in{' '}
              <strong style={{ color: 'var(--color-error)' }}>{daysLeft} days</strong>
              {' '}({entity.licenseExpiryDate}). Settle before expiry to avoid statutory penalties.
            </div>
          </div>
        </div>
      )}

      {/* Countdown Card */}
      <div className="section-gap animate-slide-up" style={{ animationDelay: '40ms' }}>
        <div className="card" style={{ padding: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-muted)', letterSpacing: '0.06em', marginBottom: 4 }}>
                RENEWAL COUNTDOWN
              </div>
              <h2 className="font-heading" style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--color-text)' }}>
                {entity.name}
              </h2>
            </div>
            <Badge variant={isUrgent ? 'error' : 'success'}>
              {daysLeft} Days Left
            </Badge>
          </div>

          {/* Countdown Display */}
          <div
            className="card card-flat"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', padding: 24, marginBottom: 16 }}
          >
            <div style={{ textAlign: 'center' }}>
              <div className="font-heading" style={{ fontSize: '2.5rem', fontWeight: 800, color: isUrgent ? 'var(--color-error)' : 'var(--color-navy)', lineHeight: 1 }}>
                {daysLeft}
              </div>
              <div style={{ fontSize: 12, color: 'var(--color-text-tertiary)', fontWeight: 600, marginTop: 4 }}>
                Days to Expiry
              </div>
            </div>
            <div style={{ width: 1, height: 48, background: 'var(--color-border)' }} />
            <div style={{ textAlign: 'center' }}>
              <div className="font-heading" style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-navy)' }}>
                {entity.licenseExpiryDate}
              </div>
              <div style={{ fontSize: 12, color: 'var(--color-text-tertiary)', fontWeight: 600, marginTop: 4 }}>
                Expiry Date
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-secondary)' }}>Time Elapsed</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text)' }}>{progress}%</span>
            </div>
            <div className="progress-track" style={{ height: 8 }}>
              <div
                className={isUrgent ? '' : 'progress-fill'}
                style={{
                  width: `${progress}%`,
                  height: '100%',
                  borderRadius: 'var(--radius-pill)',
                  background: isUrgent ? 'var(--color-error)' : 'var(--color-orange)',
                  transition: 'width 0.5s cubic-bezier(0.4,0,0.2,1)',
                }}
              />
            </div>
          </div>

          {/* Inclusions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-muted)', letterSpacing: '0.06em' }}>
              INCLUDED IN ANNUAL MAINTENANCE
            </span>
            {[
              'Government Trade License Renewal & Registry Filing',
              '1-Year Registered Office Address & Statutory Secretary',
              'Nominee Director & Trustee Shareholder Continuation',
              'Certificate of Good Standing & Registry Receipt',
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <CheckCircle2 size={16} style={{ color: 'var(--color-orange)', flexShrink: 0 }} />
                <span style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>{item}</span>
              </div>
            ))}
          </div>

          {/* Pay Button */}
          <Button
            variant="primary"
            fullWidth
            size="lg"
            onClick={() => setPayModalOpen(true)}
            rightIcon={<ArrowRight size={16} />}
          >
            Pay Renewal — ${renewalFee.toLocaleString()}
          </Button>
        </div>
      </div>

      {/* Compliance Schedule */}
      <div className="section-gap animate-slide-up" style={{ animationDelay: '80ms' }}>
        <div className="section-header">
          <span className="section-title">Compliance Schedule</span>
        </div>
        <div className="card card-bordered" style={{ overflow: 'hidden' }}>
          {[
            { icon: <Calendar size={16} />, color: 'var(--color-info)', bg: 'var(--color-info-light)', title: '60 Days Prior to Expiry', desc: 'Early-bird notification & registry invoice generated', badge: 'Auto-Alert', badgeVariant: 'info' as const },
            { icon: <Calendar size={16} />, color: 'var(--color-orange)', bg: 'var(--color-orange-light)', title: '30 Days Prior to Expiry', desc: 'Registry preparation & nominee PoA extension drafting', badge: 'Drafting', badgeVariant: 'warning' as const },
            { icon: <CheckCircle2 size={16} />, color: 'var(--color-success)', bg: 'var(--color-success-light)', title: `Expiry Date (${entity.licenseExpiryDate})`, desc: 'Updated 1-year trade license delivered to your Cloud Locker', badge: 'Final', badgeVariant: 'success' as const },
          ].map((item, i) => (
            <div
              key={i}
              style={{
                display: 'flex', alignItems: 'center', gap: 14,
                padding: '14px 16px',
                borderBottom: i < 2 ? '1px solid var(--color-border)' : 'none',
              }}
            >
              <div style={{
                width: 34, height: 34, borderRadius: 'var(--radius-sm)',
                background: item.bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: item.color, flexShrink: 0,
              }}>
                {item.icon}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)' }}>{item.title}</div>
                <div style={{ fontSize: 12, color: 'var(--color-text-tertiary)', marginTop: 2 }}>{item.desc}</div>
              </div>
              <Badge variant={item.badgeVariant} size="sm">{item.badge}</Badge>
            </div>
          ))}
        </div>
      </div>

      {/* Specialist Card */}
      <div className="card card-padded animate-slide-up" style={{ animationDelay: '120ms', display: 'flex', alignItems: 'center', gap: 14, borderLeft: '4px solid var(--color-info)' }}>
        <ShieldCheck size={20} style={{ color: 'var(--color-info)', flexShrink: 0 }} />
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)' }}>Dedicated Continuity Manager</div>
          <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 2 }}>
            {entity.assignedSpecialist} — WhatsApp: {entity.specialistPhone}
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      <Modal
        isOpen={payModalOpen}
        onClose={() => { setPayModalOpen(false); setPaidSuccess(false); }}
        title={paidSuccess ? 'Renewal Confirmed' : 'Annual License & Nominee Renewal'}
      >
        {!paidSuccess ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="card card-flat" style={{ padding: 18 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, marginBottom: 8 }}>
                <span style={{ color: 'var(--color-text-secondary)' }}>{entity.name} (1-Year Renewal)</span>
                <strong style={{ color: 'var(--color-text)' }}>${renewalFee.toLocaleString()} USD</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 12 }}>
                <span>Government License + Registered Agent + Nominee</span>
                <span>Fixed Rate</span>
              </div>
              <div style={{ height: 1, background: 'var(--color-border)', marginBottom: 12 }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text)' }}>Total</span>
                <span className="font-heading" style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-orange)' }}>
                  ${renewalFee.toLocaleString()} USD
                </span>
              </div>
            </div>

            <div className="card card-flat" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderRadius: 'var(--radius-pill)' }}>
              <CreditCard size={18} style={{ color: 'var(--color-orange)' }} />
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)' }}>Saved Visa •••• 4242</span>
            </div>

            <Button variant="primary" fullWidth size="lg" isLoading={processing} onClick={handlePay}>
              Authorize & Pay ${renewalFee.toLocaleString()}
            </Button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, padding: '12px 0' }}>
            <div style={{
              width: 64, height: 64, borderRadius: '50%',
              background: 'var(--color-success-light)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <CheckCircle2 size={32} style={{ color: 'var(--color-success)' }} />
            </div>
            <h3 className="font-heading" style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-text)', textAlign: 'center' }}>
              Renewal Successfully Extended!
            </h3>
            <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', textAlign: 'center', lineHeight: 1.5 }}>
              Your license renewal for <strong>{entity.name}</strong> is confirmed. 365 days have been added.
            </p>
            <Button variant="navy" fullWidth onClick={() => setPayModalOpen(false)}>
              Back to Renewals
            </Button>
          </div>
        )}
      </Modal>
    </div>
  );
}
