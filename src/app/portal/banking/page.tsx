'use client';

import React, { useState } from 'react';
import { usePortalStore, BankingApplication } from '@/lib/store';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import {
  Landmark,
  ShieldCheck,
  CheckCircle2,
  Clock,
  ArrowRight,
  ExternalLink,
  UploadCloud,
  FileCheck,
  Video,
  Copy,
  Check,
} from 'lucide-react';

export default function BankingPortalPage() {
  const { bankingApps } = usePortalStore();
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedBank, setSelectedBank] = useState<BankingApplication | null>(null);
  const [copiedBankerLink, setCopiedBankerLink] = useState(false);

  const handleCopyBankerLink = () => {
    navigator.clipboard.writeText('https://gccstartup.com/bank-onboarding/upload?token=b_84920');
    setCopiedBankerLink(true);
    setTimeout(() => setCopiedBankerLink(false), 2000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <span className="badge badge-navy">BANKING ONBOARDING ENGINE</span>
          <span className="badge badge-orange">100% APPROVAL GUARANTEE</span>
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
          Multi-Currency <span style={{ color: 'var(--orange)' }}>Corporate Banking Hub</span>
        </h1>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>
          Track real-time bank onboarding across Airwallex, Wio Bank, Wise, and Emirates NBD with automated compliance dispatch.
        </p>
      </div>

      {/* 2-Column Banking Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16 }}>
        {/* Bank Application Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="section-title">Active Banking Channels</div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {bankingApps.map((app) => (
              <div key={app.id} className="card app-card" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 10,
                        background: 'var(--orange-lt)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Landmark size={18} color="var(--orange)" />
                    </div>
                    <div>
                      <h3 style={{ fontSize: 14, fontWeight: 800, color: 'var(--navy)' }}>{app.bankName}</h3>
                      <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{app.bankType}</div>
                    </div>
                  </div>

                  <span
                    className={`badge ${
                      app.status === 'approved'
                        ? 'badge-success'
                        : app.status === 'pre_approved'
                        ? 'badge-blue'
                        : 'badge-orange'
                    }`}
                  >
                    {app.status === 'approved'
                      ? 'Active & Verified'
                      : app.status === 'pre_approved'
                      ? 'Pre-Approved (98% Odds)'
                      : 'Under Review'}
                  </span>
                </div>

                <div className="card card-sand" style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-tertiary)' }}>Target Entity:</span>
                    <strong style={{ color: 'var(--navy)' }}>{app.targetEntityName}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-tertiary)' }}>Account / IBAN:</span>
                    <strong style={{ color: 'var(--navy)', fontFamily: 'monospace' }}>{app.ibanOrAccount}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-tertiary)' }}>Turnaround SLA:</span>
                    <span>{app.turnaroundDays}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8, borderTop: '1px solid var(--border)' }}>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                    <strong>Next Action:</strong> {app.nextStep}
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedBank(app);
                      setIsUploadModalOpen(true);
                    }}
                    className="btn btn-secondary btn-sm"
                  >
                    <span>Banker Dossier</span>
                    <ArrowRight size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Banker Pre-Flight Checklist Card */}
        <div className="card card-sand" style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="section-title" style={{ marginBottom: 0 }}>Banker Pre-Flight Verification</div>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
            Ensuring 100% first-attempt approval with global fintech and UAE tier-1 banks.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              { title: 'Commercial Trade License & E-MoA', desc: 'Auto-synced from your Cloud Locker' },
              { title: 'Beneficial Owner Passport & Proof of Address', desc: 'Verified utility bill under 3 months' },
              { title: 'Active Website / Commercial Contract Sample', desc: 'URL demonstrating commercial operations' },
              { title: 'Source of Wealth & Bank Statements', desc: '3 months personal or corporate statements' },
            ].map((item, idx) => (
              <div key={idx} className="card" style={{ padding: 10, display: 'flex', alignItems: 'center', gap: 10 }}>
                <CheckCircle2 size={16} color="var(--success)" style={{ flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--navy)' }}>{item.title}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Banker Dossier Modal */}
      <Modal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        title={`Banker Dossier: ${selectedBank?.bankName}`}
        badge="1-CLICK DISPATCH"
        badgeVariant="orange"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.4 }}>
            Your legal formation package, Nominee PoA, and KYC verification records are bundled for direct banker review.
          </p>

          <div className="card card-sand" style={{ padding: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 11, fontFamily: 'monospace', color: 'var(--navy)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              https://gccstartup.com/bank-onboarding/upload?token=b_84920
            </span>
            <button onClick={handleCopyBankerLink} className="btn btn-primary btn-sm" style={{ flexShrink: 0 }}>
              {copiedBankerLink ? <Check size={14} /> : <Copy size={14} />}
              <span>{copiedBankerLink ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
