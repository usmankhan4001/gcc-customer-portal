'use client';

import React, { useState } from 'react';
import { usePortalStore } from '@/lib/store';
import PageHeader from '@/components/design-system/PageHeader';
import ProgressSteps from '@/components/design-system/ProgressSteps';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import StickyFooter from '@/components/ui/StickyFooter';
import Modal from '@/components/ui/Modal';
import CountryFlag from '@/components/ui/CountryFlag';
import {
  FileText,
  Download,
  Share2,
  Copy,
  Check,
  Lock,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  CheckCircle2,
  FolderOpen,
} from 'lucide-react';

const WIZARD_STEPS = [
  { label: 'Entity' },
  { label: 'Documents' },
  { label: 'Upload & KYC' },
];

export default function VaultPage() {
  const { entities, activeEntityId, setActiveEntityId, submitKycHandshake } = usePortalStore();
  const activeEntity = entities.find((e) => e.id === activeEntityId) || entities[0];

  const [currentStep, setCurrentStep] = useState(0);
  const [referenceNumber, setReferenceNumber] = useState(activeEntity?.kycReferenceNumber || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [handshakeDone, setHandshakeDone] = useState(Boolean(activeEntity?.kycReferenceNumber));
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const totalSteps = WIZARD_STEPS.length;
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === totalSteps - 1;

  const handleKycSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!referenceNumber.trim()) return;
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setHandshakeDone(true);
      if (activeEntity) submitKycHandshake(activeEntity.id, referenceNumber);
    }, 800);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(`https://gccstartup.com/v/${activeEntity?.id || 'doc'}-vault?token=sec_9842f`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!activeEntity) {
    return (
      <div className="flex flex-col items-center text-center py-16 px-6">
        <FolderOpen size={40} className="text-muted mb-3" />
        <h3 className="text-base font-extrabold text-navy">No Active Entity</h3>
        <p className="text-[13px] text-tertiary">Set up a company to access your document vault.</p>
      </div>
    );
  }

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="flex flex-col gap-3 animate-slide-up">
            <div className="section-title">Select Entity</div>
            {entities.map((ent) => (
              <button
                key={ent.id}
                onClick={() => setActiveEntityId(ent.id)}
                className={`card card-hover ${ent.id === activeEntity.id ? 'card-sand border-orange' : ''} flex items-center gap-3 p-3 cursor-pointer`}
              >
                <CountryFlag country={ent.countryCode} size="md" />
                <div className="flex-1 text-left">
                  <div className="text-sm font-bold text-navy">{ent.name}</div>
                  <div className="text-xs text-tertiary">{ent.jurisdiction}</div>
                </div>
                {ent.id === activeEntity.id && <Badge variant="orange" size="sm">ACTIVE</Badge>}
              </button>
            ))}
          </div>
        );

      case 1:
        return (
          <div className="flex flex-col gap-3 animate-slide-up">
            <div className="flex justify-between items-center">
              <div className="section-title mb-0">Issued Statutory Files</div>
              <Badge variant="info">{activeEntity.documents.length} Files</Badge>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {activeEntity.documents.map((doc) => (
                <div key={doc.id} className="card card-hover flex flex-col gap-2 p-3.5">
                  <div className="flex justify-between items-center">
                    <div className="w-[34px] h-[34px] rounded-lg bg-orange-lt flex items-center justify-center">
                      <FileText size={18} className="text-orange" />
                    </div>
                    <Badge variant={doc.isReady ? 'success' : 'warning'} size="sm">
                      {doc.isReady ? 'READY' : 'PENDING'}
                    </Badge>
                  </div>
                  <div>
                    <h4 className="text-[13px] font-extrabold text-navy leading-tight">{doc.title}</h4>
                    <div className="text-[11px] text-tertiary mt-0.5">{doc.type} - {doc.size}</div>
                  </div>
                  <div className="mt-auto pt-2 border-t border-border">
                    {doc.isReady ? (
                      <button
                        type="button"
                        onClick={() => alert(`Downloading verified copy of ${doc.title}`)}
                        className="btn btn-secondary btn-sm w-full text-xs"
                      >
                        <Download size={13} />
                        <span>Download PDF</span>
                      </button>
                    ) : (
                      <div className="text-[11px] text-muted text-center py-1">
                        Auto-delivers upon Stage 4
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="flex flex-col gap-4 animate-slide-up">
            <div className="section-title">Upload &amp; KYC Handshake</div>

            <Card padding="md">
              <div className="flex items-center gap-2.5 mb-3">
                <div
                  className={`w-[38px] h-[38px] rounded-[10px] flex items-center justify-center ${
                    handshakeDone
                      ? 'bg-success-lt text-success'
                      : 'bg-orange-lt text-orange'
                  }`}
                >
                  {handshakeDone ? <CheckCircle2 size={20} /> : <ShieldCheck size={20} />}
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-navy">
                    {handshakeDone ? 'Government Verification Confirmed' : 'Official Portal Identity Handshake'}
                  </h3>
                  <div className="text-[11px] text-tertiary">
                    {handshakeDone
                      ? `Registry Reference: ${referenceNumber || activeEntity.kycReferenceNumber}`
                      : 'Enter your confirmation reference to advance to Stage 3 Registry Filing'}
                  </div>
                </div>
              </div>

              {!handshakeDone ? (
                <form onSubmit={handleKycSubmit} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g. IFZA-KYC-2026-849201"
                    value={referenceNumber}
                    onChange={(e) => setReferenceNumber(e.target.value)}
                    className="input-field flex-1"
                    required
                  />
                  <button type="submit" disabled={isSubmitting} className="btn btn-primary shrink-0">
                    <span>{isSubmitting ? 'Verifying...' : 'Verify'}</span>
                    <ArrowRight size={14} />
                  </button>
                </form>
              ) : (
                <div className="p-2.5 rounded-[10px] bg-surface border-l-4 border-l-success text-xs text-secondary">
                  Confirmed Reference: <strong className="text-navy">{referenceNumber || activeEntity.kycReferenceNumber}</strong> - Stage 3 is active.
                </div>
              )}
            </Card>

            <button
              type="button"
              onClick={() => setShareModalOpen(true)}
              className="btn btn-secondary w-full h-11 text-[13px]"
            >
              <Share2 size={16} className="text-orange" />
              <span>Generate Encrypted Banker Share Link</span>
            </button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col gap-5 pb-24">
      <PageHeader
        eyebrow="SECURE CORPORATE KIT LOCKER"
        title="Document Vault"
        subtitle="Encrypted statutory repository - manage official commercial certificates and nominee deeds."
      />

      <div className="card card-sand px-4 py-3">
        <ProgressSteps steps={WIZARD_STEPS} currentStep={currentStep} />
      </div>

      {renderStep()}

      <StickyFooter
        primaryLabel={isLastStep ? 'Done' : 'Next'}
        primaryAction={() => {
          if (!isLastStep) setCurrentStep((s) => s + 1);
        }}
        primaryIcon={isLastStep ? <CheckCircle2 size={16} /> : <ArrowRight size={16} />}
        secondaryLabel={isFirstStep ? undefined : 'Back'}
        secondaryAction={isFirstStep ? undefined : () => setCurrentStep((s) => s - 1)}
      />

      <Modal
        isOpen={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        title="Encrypted Banker Share Link"
        badge="SECURE DOSSIER"
        badgeVariant="orange"
      >
        <div className="flex flex-col gap-3.5">
          <p className="text-[13px] text-secondary leading-relaxed">
            Generate a time-limited 72-hour encrypted viewer link for your corporate banker.
          </p>
          <div className="card card-sand p-3 flex justify-between items-center gap-2">
            <span className="text-[11px] font-mono text-navy overflow-hidden text-ellipsis whitespace-nowrap">
              https://gccstartup.com/v/{activeEntity.id}-vault?token=sec_9842f
            </span>
            <button onClick={handleCopy} className="btn btn-primary btn-sm shrink-0">
              {copied ? <Check size={14} /> : <Copy size={14} />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
