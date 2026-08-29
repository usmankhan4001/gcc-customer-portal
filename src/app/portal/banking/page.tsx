'use client';

import React, { useState } from 'react';
import { usePortalStore } from '@/lib/store';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useToast } from '@/components/ui/Toast';
import {
  Landmark,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldCheck,
  UploadCloud,
  FileCheck,
  Video,
  Copy,
  Check,
  AlertTriangle,
  TrendingUp,
} from 'lucide-react';

function EntitySelector({
  entities,
  activeId,
  onSelect,
}: {
  entities: { id: string; name: string; flag: string }[];
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
        </button>
      ))}
    </div>
  );
}

function statusBadgeVariant(status: string) {
  switch (status) {
    case 'pre_approved':
    case 'approved':
      return 'success';
    case 'submitted':
      return 'info';
    case 'under_review':
      return 'warning';
    case 'action_required':
      return 'error';
    default:
      return 'navy';
  }
}

function statusLabel(status: string) {
  switch (status) {
    case 'pre_approved': return 'Pre-Approved';
    case 'approved': return 'Active & Verified';
    case 'submitted': return 'Submitted';
    case 'under_review': return 'Under Review';
    case 'action_required': return 'Action Required';
    default: return status;
  }
}

const CHECKLIST_ITEMS = [
  { title: 'Commercial Trade License & E-MoA', desc: 'Auto-synced from your Cloud Locker' },
  { title: 'Beneficial Owner Passport & Proof of Address', desc: 'Verified utility bill < 3 months' },
  { title: 'Active Website / Business Contract Sample', desc: 'URL or invoice demonstrating commercial activity' },
  { title: 'Source of Wealth & Bank Statements', desc: '3 months personal or existing corporate statements' },
];

export default function BankingPage() {
  const { bankingApps, entities, activeEntityId, setActiveEntityId } = usePortalStore();
  const { showToast } = useToast();
  const entity = entities.find((e) => e.id === activeEntityId) || entities[0];

  const [dossierModal, setDossierModal] = useState(false);
  const [selectedBank, setSelectedBank] = useState<string>('');
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText('https://gccstartup.com/bank-onboarding/upload?token=b_84920');
    setCopied(true);
    showToast('success', 'Banker link copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  if (!entity) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon"><Landmark size={32} /></div>
        <h3 className="empty-state-title">No Active Entity</h3>
        <p className="empty-state-desc">Set up a company to access banking services.</p>
      </div>
    );
  }

  const filteredApps = bankingApps.filter((a) => a.targetEntityName === entity.name);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Page Header */}
      <div className="animate-fade-in">
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text-muted)', letterSpacing: '0.08em', marginBottom: 4 }}>
          CORPORATE ACCOUNT MANAGEMENT
        </div>
        <h1 className="font-heading" style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--color-text)', lineHeight: 1.2 }}>
          Banking <span style={{ color: 'var(--color-orange)' }}>Hub</span>
        </h1>
        <p style={{ fontSize: 14, color: 'var(--color-text-secondary)', marginTop: 4 }}>
          Corporate account management — track onboarding across multiple banks.
        </p>
      </div>

      {/* Entity Selector */}
      <EntitySelector
        entities={entities}
        activeId={entity.id}
        onSelect={setActiveEntityId}
      />

      {/* Application Cards */}
      <div className="section-gap animate-slide-up" style={{ animationDelay: '40ms' }}>
        <div className="section-header">
          <span className="section-title">Banking Applications</span>
          <Badge variant="info" size="sm">{filteredApps.length} active</Badge>
        </div>

        {filteredApps.length === 0 ? (
          <div className="empty-state" style={{ padding: 32 }}>
            <div className="empty-state-icon"><Landmark size={28} /></div>
            <h3 className="empty-state-title" style={{ fontSize: '1rem' }}>No Applications</h3>
            <p className="empty-state-desc" style={{ fontSize: 13 }}>No banking applications found for this entity.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {filteredApps.map((app) => (
              <div key={app.id} className="card card-padded" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: 'var(--radius-md)',
                      background: 'var(--color-orange-light)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: 'var(--color-orange)',
                    }}>
                      <Landmark size={20} />
                    </div>
                    <div>
                      <h3 className="font-heading" style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-text)' }}>
                        {app.bankName}
                      </h3>
                      <span style={{ fontSize: 12, color: 'var(--color-text-tertiary)' }}>{app.bankType}</span>
                    </div>
                  </div>
                  <Badge variant={statusBadgeVariant(app.status) as any}>
                    {statusLabel(app.status)}
                  </Badge>
                </div>

                {/* Meta */}
                <div className="card card-flat" style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                    <span style={{ color: 'var(--color-text-secondary)' }}>Approval Odds</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ width: 60, height: 6, background: 'var(--color-border)', borderRadius: 'var(--radius-pill)', overflow: 'hidden' }}>
                        <div style={{ width: `${app.odds}%`, height: '100%', background: app.odds >= 95 ? 'var(--color-success)' : 'var(--color-orange)', borderRadius: 'var(--radius-pill)' }} />
                      </div>
                      <strong style={{ fontSize: 13, color: 'var(--color-text)' }}>{app.odds}%</strong>
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                    <span style={{ color: 'var(--color-text-secondary)' }}>Account / IBAN</span>
                    <span style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--color-text)' }}>{app.ibanOrAccount || 'Pending'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                    <span style={{ color: 'var(--color-text-secondary)' }}>Turnaround</span>
                    <span style={{ color: 'var(--color-text)', fontWeight: 600 }}>{app.turnaroundDays}</span>
                  </div>
                </div>

                {/* Next Step + Action */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, paddingTop: 12, borderTop: '1px solid var(--color-border)' }}>
                  <div style={{ flex: 1 }}>
                    <span style={{ fontSize: 12, color: 'var(--color-text-muted)', fontWeight: 600 }}>Next Step: </span>
                    <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>{app.nextStep}</span>
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => { setSelectedBank(app.bankName); setDossierModal(true); }}
                  >
                    <span>Dossier</span>
                    <ArrowRight size={14} />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pre-flight Checklist */}
      <div className="section-gap animate-slide-up" style={{ animationDelay: '80ms' }}>
        <div className="section-header">
          <span className="section-title">Pre-Flight Checklist</span>
        </div>
        <div className="card card-padded" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {CHECKLIST_ITEMS.map((item, i) => (
            <div key={i} className="card card-flat" style={{ padding: '12px 14px', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <CheckCircle2 size={16} style={{ color: 'var(--color-success)', flexShrink: 0, marginTop: 2 }} />
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)' }}>{item.title}</div>
                <div style={{ fontSize: 12, color: 'var(--color-text-tertiary)', marginTop: 1 }}>{item.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Apply Button */}
      <div className="animate-slide-up" style={{ animationDelay: '100ms' }}>
        <Button
          variant="primary"
          fullWidth
          leftIcon={<Landmark size={16} />}
          onClick={() => showToast('info', 'New account application will be available after backend integration')}
        >
          Apply for New Account
        </Button>
      </div>

      {/* Dossier Modal */}
      <Modal
        isOpen={dossierModal}
        onClose={() => setDossierModal(false)}
        title={`Banker Dossier: ${selectedBank}`}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <p style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>
            Your legal formation package, Nominee PoA, and KYC records bundled for direct banker review.
          </p>
          <div
            className="card card-flat"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderRadius: 'var(--radius-pill)', gap: 10 }}
          >
            <span style={{ fontSize: 12, fontFamily: 'monospace', color: 'var(--color-text)', wordBreak: 'break-all', flex: 1 }}>
              https://gccstartup.com/bank-onboarding/upload?token=b_84920
            </span>
            <Button variant="primary" size="sm" onClick={handleCopy}>
              {copied ? <Check size={14} /> : <Copy size={14} />}
              <span>{copied ? 'Copied!' : 'Copy'}</span>
            </Button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingTop: 10, borderTop: '1px solid var(--color-border)' }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-muted)', letterSpacing: '0.06em' }}>
              INCLUDED IN SECURE BANKER DOCKET
            </span>
            {[
              'Certified Articles of Association & Trade License',
              'Director Register & Nominee Power of Attorney',
              'Verified UBO Biometric Verification Confirmation',
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <FileCheck size={14} style={{ color: 'var(--color-success)', flexShrink: 0 }} />
                <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </Modal>
    </div>
  );
}
