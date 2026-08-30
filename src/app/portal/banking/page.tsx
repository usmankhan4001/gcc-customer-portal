'use client';

import React, { useState } from 'react';
import { usePortalStore, BankingApplication } from '@/lib/store';
import PageHeader from '@/components/design-system/PageHeader';
import ProgressSteps from '@/components/design-system/ProgressSteps';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import StickyFooter from '@/components/ui/StickyFooter';
import Modal from '@/components/ui/Modal';
import {
  Landmark,
  ShieldCheck,
  CheckCircle2,
  Clock,
  ArrowRight,
  ArrowLeft,
  ExternalLink,
  UploadCloud,
  FileCheck,
  Video,
  Copy,
  Check,
} from 'lucide-react';

const WIZARD_STEPS = [
  { label: 'Select Bank' },
  { label: 'Pre-Flight' },
  { label: 'Status' },
];

export default function BankingPortalPage() {
  const { bankingApps } = usePortalStore();
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedBankIndex, setSelectedBankIndex] = useState<number | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedBank, setSelectedBank] = useState<BankingApplication | null>(null);
  const [copiedBankerLink, setCopiedBankerLink] = useState(false);

  const selected = selectedBankIndex !== null ? bankingApps[selectedBankIndex] : null;
  const totalSteps = WIZARD_STEPS.length;
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === totalSteps - 1;

  const handleCopyBankerLink = () => {
    navigator.clipboard.writeText('https://gccstartup.com/bank-onboarding/upload?token=b_84920');
    setCopiedBankerLink(true);
    setTimeout(() => setCopiedBankerLink(false), 2000);
  };

  const preFlightItems = [
    { title: 'Commercial Trade License & E-MoA', desc: 'Auto-synced from your Cloud Locker' },
    { title: 'Beneficial Owner Passport & Proof of Address', desc: 'Verified utility bill under 3 months' },
    { title: 'Active Website / Commercial Contract Sample', desc: 'URL demonstrating commercial operations' },
    { title: 'Source of Wealth & Bank Statements', desc: '3 months personal or corporate statements' },
  ];

  const canProceedStep0 = selectedBankIndex !== null;
  const canProceedStep1 = true;

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="flex flex-col gap-3 animate-slide-up">
            <div className="section-title">Choose a Banking Channel</div>
            {bankingApps.map((app, idx) => (
              <button
                key={app.id}
                onClick={() => setSelectedBankIndex(idx)}
                className={`card card-hover ${idx === selectedBankIndex ? 'card-sand border-orange' : ''} flex flex-col gap-3 p-4 cursor-pointer`}
              >
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-[10px] bg-orange-lt flex items-center justify-center">
                      <Landmark size={18} className="text-orange" />
                    </div>
                    <div>
                      <h3 className="text-sm font-extrabold text-navy">{app.bankName}</h3>
                      <div className="text-[11px] text-tertiary">{app.bankType}</div>
                    </div>
                  </div>
                  <Badge
                    variant={
                      app.status === 'approved'
                        ? 'success'
                        : app.status === 'pre_approved'
                        ? 'info'
                        : 'warning'
                    }
                  >
                    {app.status === 'approved'
                      ? 'Active & Verified'
                      : app.status === 'pre_approved'
                      ? 'Pre-Approved (98% Odds)'
                      : 'Under Review'}
                  </Badge>
                </div>

                <div className="card card-sand p-3 flex flex-col gap-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-tertiary">Target Entity:</span>
                    <strong className="text-navy">{app.targetEntityName}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-tertiary">Account / IBAN:</span>
                    <strong className="text-navy font-mono">{app.ibanOrAccount}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-tertiary">Turnaround SLA:</span>
                    <span>{app.turnaroundDays}</span>
                  </div>
                </div>

                {idx === selectedBankIndex && (
                  <div className="flex items-center gap-1 text-xs font-bold text-orange">
                    <CheckCircle2 size={14} />
                    Selected
                  </div>
                )}
              </button>
            ))}
          </div>
        );

      case 1:
        return (
          <div className="flex flex-col gap-3 animate-slide-up">
            <div className="section-title">Banker Pre-Flight Verification</div>
            <p className="text-xs text-secondary">
              Ensuring 100% first-attempt approval with global fintech and UAE tier-1 banks.
            </p>
            <div className="flex flex-col gap-2">
              {preFlightItems.map((item, idx) => (
                <div key={idx} className="card flex items-center gap-2.5 p-2.5">
                  <CheckCircle2 size={16} className="text-success shrink-0" />
                  <div>
                    <div className="text-xs font-bold text-navy">{item.title}</div>
                    <div className="text-[11px] text-tertiary">{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="flex flex-col gap-4 animate-slide-up">
            <div className="section-title">Application Status</div>
            {selected && (
              <Card padding="md">
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-[10px] bg-orange-lt flex items-center justify-center">
                      <Landmark size={18} className="text-orange" />
                    </div>
                    <div>
                      <h3 className="text-sm font-extrabold text-navy">{selected.bankName}</h3>
                      <div className="text-[11px] text-tertiary">{selected.bankType}</div>
                    </div>
                  </div>
                  <Badge
                    variant={
                      selected.status === 'approved'
                        ? 'success'
                        : selected.status === 'pre_approved'
                        ? 'info'
                        : 'warning'
                    }
                  >
                    {selected.status === 'approved'
                      ? 'Active & Verified'
                      : selected.status === 'pre_approved'
                      ? 'Pre-Approved'
                      : 'Under Review'}
                  </Badge>
                </div>

                <div className="card card-sand p-3 flex flex-col gap-1.5 text-xs mb-3">
                  <div className="flex justify-between">
                    <span className="text-tertiary">Target Entity:</span>
                    <strong className="text-navy">{selected.targetEntityName}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-tertiary">Account / IBAN:</span>
                    <strong className="text-navy font-mono">{selected.ibanOrAccount}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-tertiary">Turnaround SLA:</span>
                    <span>{selected.turnaroundDays}</span>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-2 border-t border-border">
                  <div className="text-[11px] text-secondary">
                    <strong>Next Action:</strong> {selected.nextStep}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedBank(selected);
                      setIsUploadModalOpen(true);
                    }}
                    className="btn btn-secondary btn-sm"
                  >
                    <span>Banker Dossier</span>
                    <ArrowRight size={13} />
                  </button>
                </div>
              </Card>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  const canProceed =
    (currentStep === 0 && canProceedStep0) ||
    (currentStep === 1 && canProceedStep1) ||
    currentStep === 2;

  return (
    <div className="flex flex-col gap-5 pb-24">
      <PageHeader
        eyebrow="BANKING ONBOARDING ENGINE"
        title="Multi-Currency Corporate Banking Hub"
        subtitle="Track real-time bank onboarding across Airwallex, Wio Bank, Wise, and Emirates NBD with automated compliance dispatch."
      />

      <div className="flex gap-2 mb-1">
        <Badge variant="navy">100% APPROVAL GUARANTEE</Badge>
      </div>

      <div className="card card-sand px-4 py-3">
        <ProgressSteps steps={WIZARD_STEPS} currentStep={currentStep} />
      </div>

      {renderStep()}

      <StickyFooter
        primaryLabel={isLastStep ? 'Done' : 'Next'}
        primaryAction={() => {
          if (!isLastStep && canProceed) setCurrentStep((s) => s + 1);
        }}
        primaryDisabled={!canProceed}
        primaryIcon={isLastStep ? <CheckCircle2 size={16} /> : <ArrowRight size={16} />}
        secondaryLabel={isFirstStep ? undefined : 'Back'}
        secondaryAction={isFirstStep ? undefined : () => setCurrentStep((s) => s - 1)}
      />

      <Modal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        title={`Banker Dossier: ${selectedBank?.bankName}`}
        badge="1-CLICK DISPATCH"
        badgeVariant="orange"
      >
        <div className="flex flex-col gap-3.5">
          <p className="text-[13px] text-secondary leading-relaxed">
            Your legal formation package, Nominee PoA, and KYC verification records are bundled for direct banker review.
          </p>
          <div className="card card-sand p-3 flex justify-between items-center gap-2">
            <span className="text-[11px] font-mono text-navy overflow-hidden text-ellipsis whitespace-nowrap">
              https://gccstartup.com/bank-onboarding/upload?token=b_84920
            </span>
            <button onClick={handleCopyBankerLink} className="btn btn-primary btn-sm shrink-0">
              {copiedBankerLink ? <Check size={14} /> : <Copy size={14} />}
              <span>{copiedBankerLink ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
