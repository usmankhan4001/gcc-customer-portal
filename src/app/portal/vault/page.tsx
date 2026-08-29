'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePortalStore } from '@/lib/store';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import {
  ShieldCheck,
  FileText,
  ExternalLink,
  CheckCircle2,
  Lock,
  Download,
  Share2,
  Copy,
  Check,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

export default function VaultKYCPage() {
  const { entities, activeEntityId, submitKycHandshake } = usePortalStore();
  const activeCompany = entities.find((e) => e.id === activeEntityId) || entities[0];

  const [referenceNumber, setReferenceNumber] = useState(activeCompany?.kycReferenceNumber || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState(Boolean(activeCompany?.kycReferenceNumber));

  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const handleKycHandshakeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!referenceNumber.trim()) {
      alert('Please enter your official application / reference number.');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmissionSuccess(true);
      if (activeCompany) {
        submitKycHandshake(activeCompany.id, referenceNumber);
      }
    }, 800);
  };

  const handleCopyShareLink = () => {
    navigator.clipboard.writeText(`https://gccstartup.com/v/${activeCompany?.id || 'doc'}-vault?token=sec_9842f`);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  if (!activeCompany) {
    return <div className="text-center py-20">No active entity found.</div>;
  }

  return (
    <div className="vault-container">
      {/* Page Header */}
      <Card variant="sand" padding="md" className="vault-header">
        <div className="badge-row">
          <Badge variant="navy" icon={<ShieldCheck className="w-3.5 h-3.5" />}>
            OFFICIAL REGISTRY KYC & CORPORATE KIT LOCKER
          </Badge>
          <Badge variant="blue">{activeCompany.name}</Badge>
        </div>
        <h1 className="title display-font">
          Client Document & <span className="text-orange">Official KYC Hub</span>
        </h1>
        <p className="subtitle">
          Complete official government registry verification, submit your reference handshake, and access your Cloudflare R2 corporate documents.
        </p>
      </Card>

      {/* SECTION 1: OFFICIAL GOVERNMENT KYC GUIDANCE & HANDSHAKE */}
      <Card variant="surface" padding="lg" className="section-card">
        <div className="section-top">
          <div className="badge badge-navy mb-1">STEP 1: OFFICIAL PORTAL VERIFICATION</div>
          <h2 className="section-title display-font">Official Authority Identity Verification</h2>
          <p className="section-desc">
            In accordance with international regulatory frameworks, identity and passport biometric verification is completed directly on the official government registry portal.
          </p>
        </div>

        {/* 3-Step Guided Process */}
        <div className="kyc-steps-grid">
          <div className="kyc-step-box card-sand">
            <div className="step-num-badge">1</div>
            <strong className="block text-navy text-sm mb-1">Pre-Flight Prep</strong>
            <p className="text-xs text-secondary">
              Have your valid international passport and phone camera ready for facial biometrics.
            </p>
          </div>

          <div className="kyc-step-box card-sand">
            <div className="step-num-badge">2</div>
            <strong className="block text-navy text-sm mb-1">Open Official Portal</strong>
            <p className="text-xs text-secondary">
              Use the direct secure authority link below to perform your biometric scan.
            </p>
          </div>

          <div className="kyc-step-box card-sand">
            <div className="step-num-badge">3</div>
            <strong className="block text-navy text-sm mb-1">Submit Confirmation Ref</strong>
            <p className="text-xs text-secondary">
              Enter the reference number given by the portal to start incorporation filing.
            </p>
          </div>
        </div>

        {/* Direct Official Link Card */}
        <Card variant="blue-lt" padding="md" className="official-portal-banner">
          <div className="banner-left">
            <span className="text-xs font-bold text-blue">ASSIGNED AUTHORITY PORTAL</span>
            <h3 className="portal-name display-font text-navy">
              {activeCompany.countryCode === 'hk'
                ? 'Hong Kong Companies Registry Cyber Search Centre'
                : 'UAE Freezone Authority Electronic Registry Portal'}
            </h3>
            <span className="text-xs text-secondary">
              Official URL: {activeCompany.countryCode === 'hk' ? 'https://www.cr.gov.hk/identity' : 'https://portal.authority.ae/identity/v2'}
            </span>
          </div>

          <a
            href={activeCompany.countryCode === 'hk' ? 'https://www.cr.gov.hk' : 'https://portal.authority.ae'}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary"
          >
            <span>Open Official Government Portal</span>
            <ExternalLink className="w-4 h-4" />
          </a>
        </Card>

        {/* Post-KYC Handshake Form */}
        <div className="handshake-box card-sand">
          <h3 className="handshake-title display-font">
            {submissionSuccess ? '✅ Official KYC Handshake Verified' : 'Submit Post-KYC Reference Confirmation'}
          </h3>
          <p className="handshake-desc">
            {submissionSuccess
              ? `Your official reference number (${referenceNumber || activeCompany.kycReferenceNumber}) is matched with the registry queue. Stage 3 (Government Registry Filing) is active!`
              : 'Once you complete your verification on the government portal, submit your official application/reference number below:'}
          </p>

          {!submissionSuccess ? (
            <form onSubmit={handleKycHandshakeSubmit} className="handshake-form">
              <div className="form-row">
                <input
                  type="text"
                  required
                  placeholder="e.g. IFZA-KYC-2026-849201"
                  value={referenceNumber}
                  onChange={(e) => setReferenceNumber(e.target.value)}
                  className="input-field flex-2"
                />
                <Button variant="primary" size="md" isLoading={isSubmitting} className="flex-1">
                  <span>Confirm KYC & Start Filing</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </form>
          ) : (
            <div className="success-badge-box card-blue-lt">
              <CheckCircle2 className="w-5 h-5 text-success" />
              <span className="text-navy text-sm">
                Confirmed Reference: <strong>{referenceNumber || activeCompany.kycReferenceNumber}</strong> • Assigned Specialist Notified via Meta WhatsApp API
              </span>
            </div>
          )}
        </div>
      </Card>

      {/* SECTION 2: CLOUDFLARE R2 CORPORATE KIT LOCKER */}
      <Card variant="surface" padding="lg" className="section-card">
        <div className="section-top-between">
          <div>
            <div className="badge badge-navy mb-1">STEP 2: PERMANENT STORAGE</div>
            <h2 className="section-title display-font">Issued Corporate Kit Locker</h2>
            <p className="section-desc">
              All official government-issued company certificates and legal packs are securely archived in Cloudflare R2.
            </p>
          </div>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => setIsShareModalOpen(true)}
            leftIcon={<Share2 className="w-4 h-4 text-orange" />}
          >
            <span>Generate 1-Click Share Link</span>
          </Button>
        </div>

        {/* Documents Grid */}
        <div className="docs-vault-grid">
          {activeCompany.documents.map((doc) => (
            <Card key={doc.id} variant="sand" padding="md" className="vault-doc-card card-hover">
              <div className="doc-top">
                <FileText className="w-6 h-6 text-orange" />
                <Badge variant={doc.isReady ? 'success' : 'sand'}>
                  {doc.isReady ? 'Ready in Locker' : 'Under Registry Review'}
                </Badge>
              </div>
              <h4 className="doc-card-title display-font text-navy">{doc.title}</h4>
              <div className="doc-meta">
                <span>{doc.type}</span>
                <span>{doc.size}</span>
              </div>
              <div className="doc-footer">
                {doc.isReady ? (
                  <Button variant="secondary" size="sm" className="w-full" leftIcon={<Download className="w-3.5 h-3.5" />}>
                    <span>Download PDF</span>
                  </Button>
                ) : (
                  <span className="text-xs text-tertiary">Auto-delivers upon registry issue</span>
                )}
              </div>
            </Card>
          ))}
        </div>
      </Card>

      {/* 1-CLICK SHARE MODAL */}
      <Modal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        title="Share Corporate Kit with Banks"
        badge="PASSWORD-PROTECTED SHARING"
        badgeVariant="navy"
      >
        <div className="modal-share-body">
          <p className="text-sm text-secondary">
            Generate a temporary, encrypted link to securely send your trade license, MoA, and nominee pack to bankers and payment processors.
          </p>

          <div className="share-link-box card-sand">
            <span className="link-url">
              https://gccstartup.com/v/{activeCompany.id}-vault?token=sec_9842f
            </span>
            <Button variant="primary" size="sm" onClick={handleCopyShareLink}>
              {copiedLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copiedLink ? 'Copied!' : 'Copy Link'}</span>
            </Button>
          </div>

          <div className="share-options">
            <div className="option-row">
              <span className="text-sm">Link Expiry:</span>
              <strong className="text-sm text-navy">7 Days (Auto-Revokes)</strong>
            </div>
            <div className="option-row">
              <span className="text-sm">Access Protection:</span>
              <strong className="text-sm text-success">256-Bit Encrypted + Audit Logged</strong>
            </div>
          </div>
        </div>
      </Modal>

      <style jsx>{`
        .vault-container {
          display: flex;
          flex-direction: column;
          gap: 28px;
          width: 100%;
        }

        .vault-header {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .badge-row {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .title {
          font-size: 2.2rem;
          font-weight: 700;
          color: var(--navy);
        }

        .subtitle {
          color: var(--text-secondary);
          font-size: 15px;
        }

        .section-card {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .section-title {
          font-size: 1.6rem;
          font-weight: 700;
          margin: 6px 0 2px 0;
          color: var(--navy);
        }

        .section-desc {
          color: var(--text-secondary);
          font-size: 15px;
        }

        .section-top-between {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 16px;
        }

        @media (max-width: 768px) {
          .section-top-between {
            flex-direction: column;
          }
        }

        .kyc-steps-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 14px;
        }

        .kyc-step-box {
          padding: 20px;
          border-radius: var(--radius);
        }

        .step-num-badge {
          width: 26px;
          height: 26px;
          border-radius: 50%;
          background: var(--navy);
          color: #FFFFFF;
          font-size: 12px;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 10px;
        }

        .official-portal-banner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
        }

        @media (max-width: 768px) {
          .official-portal-banner {
            flex-direction: column;
            text-align: center;
          }
        }

        .portal-name {
          font-size: 1.35rem;
          margin: 4px 0;
        }

        .handshake-box {
          padding: 24px;
          border-radius: var(--radius);
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .handshake-title {
          font-size: 1.25rem;
          color: var(--navy);
        }

        .handshake-desc {
          font-size: 14px;
          color: var(--text-secondary);
        }

        .handshake-form {
          margin-top: 6px;
        }

        .form-row {
          display: flex;
          gap: 10px;
        }

        @media (max-width: 640px) {
          .form-row {
            flex-direction: column;
          }
        }

        .flex-2 {
          flex: 2;
        }

        .flex-1 {
          flex: 1;
        }

        .success-badge-box {
          padding: 14px 18px;
          border-radius: var(--radius);
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .docs-vault-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
          gap: 16px;
        }

        .vault-doc-card {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .doc-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .doc-card-title {
          font-size: 15px;
          min-height: 40px;
        }

        .doc-meta {
          display: flex;
          justify-content: space-between;
          font-size: 12px;
          color: var(--text-tertiary);
        }

        .doc-footer {
          margin-top: auto;
          padding-top: 10px;
          border-top: 1px solid var(--border);
        }

        .modal-share-body {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .share-link-box {
          padding: 14px 18px;
          border-radius: var(--radius-pill);
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
        }

        .link-url {
          font-size: 13px;
          color: var(--navy);
          font-family: monospace;
          word-break: break-all;
        }

        .share-options {
          display: flex;
          flex-direction: column;
          gap: 8px;
          padding-top: 10px;
          border-top: 1px solid var(--border);
        }

        .option-row {
          display: flex;
          justify-content: space-between;
          color: var(--text-secondary);
        }
      `}</style>
    </div>
  );
}
