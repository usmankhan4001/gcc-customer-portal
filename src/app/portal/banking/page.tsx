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
  const { bankingApps, entities, activeEntityId } = usePortalStore();
  const activeEntity = entities.find((e) => e.id === activeEntityId) || entities[0];

  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedBank, setSelectedBank] = useState<BankingApplication | null>(null);
  const [copiedBankerLink, setCopiedBankerLink] = useState(false);

  const handleCopyBankerLink = () => {
    navigator.clipboard.writeText('https://gccstartup.com/bank-onboarding/upload?token=b_84920');
    setCopiedBankerLink(true);
    setTimeout(() => setCopiedBankerLink(false), 2000);
  };

  return (
    <div className="banking-page-container">
      {/* Header */}
      <Card variant="sand" padding="md" className="banking-header">
        <div className="badge-row">
          <Badge variant="navy" icon={<Landmark className="w-3.5 h-3.5" />}>
            CORPORATE BANKING ONBOARDING ENGINE
          </Badge>
          <Badge variant="orange">100% MONEY-BACK BANK GUARANTEE</Badge>
        </div>
        <h1 className="header-title display-font">
          Multi-Currency <span className="text-orange">Corporate Banking Hub</span>
        </h1>
        <p className="header-desc">
          Track real-time bank onboarding across Airwallex, Wio Bank, Wise, and Emirates NBD with automated compliance document dispatch.
        </p>
      </Card>

      {/* 2-Column Banking Grid */}
      <div className="banking-grid">
        {/* Left Column: Bank Application Cards */}
        <div className="apps-col">
          <h2 className="section-title display-font">Active Banking Channels</h2>

          <div className="apps-list">
            {bankingApps.map((app) => (
              <Card key={app.id} variant="surface" padding="md" className="bank-app-card">
                <div className="bank-card-top">
                  <div className="bank-icon-title">
                    <div className="bank-icon-box">
                      <Landmark className="w-5 h-5 text-orange" />
                    </div>
                    <div>
                      <h3 className="bank-name display-font">{app.bankName}</h3>
                      <span className="text-xs text-secondary">{app.bankType}</span>
                    </div>
                  </div>

                  <Badge
                    variant={
                      app.status === 'approved'
                        ? 'success'
                        : app.status === 'pre_approved'
                        ? 'blue'
                        : 'orange'
                    }
                  >
                    {app.status === 'approved'
                      ? '✅ Active & Verified'
                      : app.status === 'pre_approved'
                      ? 'Pre-Approved (98% Odds)'
                      : 'Under Review'}
                  </Badge>
                </div>

                <div className="bank-meta-box card-sand">
                  <div className="meta-row">
                    <span>Target Entity:</span>
                    <strong className="text-navy">{app.targetEntityName}</strong>
                  </div>
                  <div className="meta-row">
                    <span>Account Details / IBAN:</span>
                    <strong className="text-navy font-mono text-xs">{app.ibanOrAccount}</strong>
                  </div>
                  <div className="meta-row">
                    <span>Approval Turnaround:</span>
                    <span>{app.turnaroundDays}</span>
                  </div>
                </div>

                <div className="bank-card-footer">
                  <span className="next-step-label text-xs text-secondary">
                    <strong>Next Action:</strong> {app.nextStep}
                  </span>

                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setSelectedBank(app);
                      setIsUploadModalOpen(true);
                    }}
                  >
                    <span>Banker Dossier</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Right Column: Pre-Flight & Interview Prep */}
        <div className="prep-col">
          {/* Pre-Flight Checklist */}
          <Card variant="surface" padding="md" className="prep-card">
            <h3 className="section-title display-font">Banker Pre-Flight Checklist</h3>
            <p className="text-xs text-secondary">
              Ensuring 100% first-attempt approval with global fintech and UAE tier-1 banks.
            </p>

            <div className="checklist-items">
              {[
                { title: 'Commercial Trade License & E-MoA', desc: 'Auto-synced from your Cloud Locker', done: true },
                { title: 'Beneficial Owner Passport & Proof of Address', desc: 'Verified utility bill < 3 months', done: true },
                { title: 'Active Website / Business Contract Sample', desc: 'URL or invoice demonstrating commercial activity', done: true },
                { title: 'Source of Wealth & Bank Statements', desc: '3 months personal or existing corporate statements', done: true },
              ].map((item, idx) => (
                <div key={idx} className="check-item card-sand">
                  <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
                  <div>
                    <strong className="block text-navy text-xs">{item.title}</strong>
                    <span className="text-xs text-tertiary">{item.desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Banker Interview Prep Guide */}
          <Card variant="blue-lt" padding="md" className="interview-card">
            <div className="interview-top">
              <Video className="w-5 h-5 text-blue" />
              <strong className="text-navy text-sm">Tier 1 Banker Video Prep (Emirates NBD / HSBC)</strong>
            </div>
            <p className="text-xs text-secondary mt-1">
              Top 3 questions asked during banker verification:
            </p>
            <div className="qa-list">
              <div className="qa-item">
                <span className="q-badge">Q1</span>
                <span className="text-xs text-navy">"What are your top 3 countries of incoming customer revenue?"</span>
              </div>
              <div className="qa-item">
                <span className="q-badge">Q2</span>
                <span className="text-xs text-navy">"What is your expected average monthly wire transfer volume?"</span>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* BANKER DOSSIER MODAL */}
      <Modal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        title={`Banker Dossier: ${selectedBank?.bankName}`}
        badge="1-CLICK DISPATCH"
        badgeVariant="orange"
      >
        <div className="dossier-body">
          <p className="text-sm text-secondary">
            Your legal formation package, Nominee PoA, and KYC verification records are bundled for direct banker review.
          </p>

          <div className="dossier-link-box card-sand">
            <span className="text-xs font-mono text-navy">https://gccstartup.com/bank-onboarding/upload?token=b_84920</span>
            <Button variant="primary" size="sm" onClick={handleCopyBankerLink}>
              {copiedBankerLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copiedBankerLink ? 'Copied!' : 'Copy Banker Link'}</span>
            </Button>
          </div>

          <div className="included-dossier-docs">
            <span className="text-xs font-bold text-navy uppercase">Included in Secure Banker Docket:</span>
            <div className="d-doc-row">
              <FileCheck className="w-4 h-4 text-success" />
              <span className="text-xs text-secondary">Certified Articles of Association & Trade License</span>
            </div>
            <div className="d-doc-row">
              <FileCheck className="w-4 h-4 text-success" />
              <span className="text-xs text-secondary">Director Register & Nominee Power of Attorney</span>
            </div>
            <div className="d-doc-row">
              <FileCheck className="w-4 h-4 text-success" />
              <span className="text-xs text-secondary">Verified UBO Biometric Verification Confirmation</span>
            </div>
          </div>
        </div>
      </Modal>

      <style jsx>{`
        .banking-page-container {
          display: flex;
          flex-direction: column;
          gap: 24px;
          width: 100%;
        }

        .banking-header {
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

        .banking-grid {
          display: grid;
          grid-template-columns: 1fr 380px;
          gap: 24px;
        }

        @media (max-width: 900px) {
          .banking-grid {
            grid-template-columns: 1fr;
          }
        }

        .apps-col {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .section-title {
          font-size: 1.3rem;
          color: var(--navy);
        }

        .apps-list {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .bank-app-card {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .bank-card-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .bank-icon-title {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .bank-icon-box {
          width: 38px;
          height: 38px;
          border-radius: var(--radius-sm);
          background: var(--orange-lt);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .bank-name {
          font-size: 1.15rem;
          color: var(--navy);
        }

        .bank-meta-box {
          padding: 14px 16px;
          border-radius: var(--radius);
          display: flex;
          flex-direction: column;
          gap: 6px;
          font-size: 13px;
        }

        .meta-row {
          display: flex;
          justify-content: space-between;
          color: var(--text-secondary);
        }

        .bank-card-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          padding-top: 10px;
          border-top: 1px solid var(--border);
        }

        @media (max-width: 640px) {
          .bank-card-footer {
            flex-direction: column;
            align-items: flex-start;
          }
        }

        .prep-col {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .prep-card {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .checklist-items {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .check-item {
          padding: 12px 14px;
          border-radius: var(--radius);
          display: flex;
          align-items: flex-start;
          gap: 10px;
        }

        .interview-card {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .interview-top {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .qa-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-top: 4px;
        }

        .qa-item {
          display: flex;
          align-items: flex-start;
          gap: 8px;
        }

        .q-badge {
          font-size: 10px;
          font-weight: 800;
          background: var(--blue);
          color: #FFFFFF;
          padding: 2px 6px;
          border-radius: var(--radius-pill);
        }

        .dossier-body {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .dossier-link-box {
          padding: 14px;
          border-radius: var(--radius-pill);
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
        }

        .included-dossier-docs {
          display: flex;
          flex-direction: column;
          gap: 8px;
          padding-top: 8px;
          border-top: 1px solid var(--border);
        }

        .d-doc-row {
          display: flex;
          align-items: center;
          gap: 8px;
        }
      `}</style>
    </div>
  );
}
