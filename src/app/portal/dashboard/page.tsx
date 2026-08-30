'use client';

import React, { Suspense, useState } from 'react';
import Link from 'next/link';
import { usePortalStore } from '@/lib/store';
import PageHeader from '@/components/design-system/PageHeader';
import StatusCard from '@/components/design-system/StatusCard';
import ListItem from '@/components/design-system/ListItem';
import ProgressSteps from '@/components/design-system/ProgressSteps';
import StickyFooter from '@/components/ui/StickyFooter';
import CountryFlag from '@/components/ui/CountryFlag';
import Badge from '@/components/ui/Badge';
import Card from '@/components/ui/Card';
import {
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
  FileText,
  Phone,
  Clock,
  Landmark,
  Building2,
  AlertCircle,
  Receipt,
  CheckCircle2,
  MessageSquare,
  ChevronRight,
} from 'lucide-react';

const WIZARD_STEPS = [
  { label: 'Entity' },
  { label: 'Status' },
  { label: 'Actions' },
];

function DashboardContent() {
  const { entities, activeEntityId, setActiveEntityId, userProfile } = usePortalStore();
  const [currentStep, setCurrentStep] = useState(0);
  const activeCompany = entities.find((e) => e.id === activeEntityId) || entities[0];

  if (!activeCompany) {
    return (
      <div className="flex flex-col items-center text-center py-16 px-6">
        <Building2 size={48} className="text-muted mb-4" />
        <h3 className="text-lg font-bold text-navy mb-1">No Active Entity</h3>
        <p className="text-sm text-tertiary mb-5">Start a company formation to access your portal workspace.</p>
        <Link href="/setup" className="btn btn-primary">Start Company Setup</Link>
      </div>
    );
  }

  const stages = [
    { label: 'Paid' },
    { label: 'KYC' },
    { label: 'Filed' },
    { label: 'License' },
    { label: 'Bank' },
    { label: 'Live' },
  ];

  const progress = Math.round((activeCompany.currentStage / 6) * 100);
  const totalSteps = WIZARD_STEPS.length;
  const isLastStep = currentStep === totalSteps - 1;
  const isFirstStep = currentStep === 0;

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
                className={`card card-hover ${ent.id === activeCompany.id ? 'card-sand border-orange' : ''} flex items-center gap-3 p-3 cursor-pointer`}
              >
                <CountryFlag country={ent.countryCode} size="md" />
                <div className="flex-1 text-left">
                  <div className="text-sm font-bold text-navy">{ent.name}</div>
                  <div className="text-xs text-tertiary">{ent.jurisdiction} - {ent.stageName}</div>
                </div>
                {ent.id === activeCompany.id && <Badge variant="orange" size="sm">ACTIVE</Badge>}
                <ChevronRight size={16} className="text-muted" />
              </button>
            ))}
            <Link href="/setup" className="btn btn-secondary w-full border-dashed text-sm mt-1">
              + Add Entity
            </Link>
          </div>
        );

      case 1:
        return (
          <div className="flex flex-col gap-4 animate-slide-up">
            <div className="section-title">Status Overview</div>
            <div className="grid grid-cols-2 gap-2.5">
              <StatusCard
                title="Incorporation Status"
                value={`Stage ${activeCompany.currentStage}`}
                subtitle={activeCompany.stageName}
                variant={activeCompany.currentStage === 6 ? 'success' : 'orange'}
              />
              <StatusCard
                title="License Validity"
                value={`${activeCompany.renewalDaysLeft}d`}
                subtitle={`Exp: ${activeCompany.licenseExpiryDate}`}
                variant={activeCompany.renewalDaysLeft <= 90 ? 'orange' : 'blue'}
              />
            </div>

            <Card padding="md">
              <div className="flex justify-between items-center mb-3">
                <div className="text-[11px] font-extrabold text-muted tracking-widest uppercase">
                  Registry Pipeline
                </div>
                <Badge variant="orange">{progress}% COMPLETED</Badge>
              </div>
              <ProgressSteps steps={stages} currentStep={activeCompany.currentStage - 1} />
              <div className="mt-3">
                <div className="progress-track">
                  <div className="progress-fill" style={{ width: `${progress}%` }} />
                </div>
                <div className="flex justify-between text-[11px] text-tertiary mt-1.5">
                  <span>Stage {activeCompany.currentStage}: {activeCompany.stageName}</span>
                  <span>Target: Active &amp; Operational</span>
                </div>
              </div>
            </Card>
          </div>
        );

      case 2:
        return (
          <div className="flex flex-col gap-4 animate-slide-up">
            <div className="section-title">Action Items</div>

            {activeCompany.currentStage === 2 && (
              <div className="card card-sand p-4 border-l-4 border-l-orange flex gap-3 items-start">
                <AlertCircle size={22} className="text-orange shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="text-sm font-extrabold text-navy mb-0.5">Action Required: Official Registry KYC Handshake</div>
                  <div className="text-[13px] text-secondary leading-relaxed mb-2.5">
                    Complete identity scan on the official government portal, then confirm your reference number to advance to Stage 3 Filing.
                  </div>
                  <Link href="/portal/vault" className="btn btn-primary btn-sm">
                    Open Document Vault &amp; KYC <ArrowRight size={13} />
                  </Link>
                </div>
              </div>
            )}

            <div className="section-title">Corporate File &amp; Operations</div>
            <div className="flex flex-col gap-2">
              <ListItem
                icon={<FileText size={18} className="text-orange" />}
                iconBg="var(--orange-lt)"
                title="Document Vault & KYC"
                description="Official trade license, MoA, and nominee deeds"
                href="/portal/vault"
              />
              <ListItem
                icon={<Landmark size={18} className="text-blue" />}
                iconBg="var(--blue-lt)"
                title="Corporate Banking Hub"
                description="Airwallex, Wio Bank & Wise pre-approved accounts"
                href="/portal/banking"
              />
              <ListItem
                icon={<Receipt size={18} className="text-success" />}
                iconBg="var(--success-lt)"
                title="Tax & 9% FTA Compliance"
                description="Corporate tax exemptions, expense ledger & VAT returns"
                href="/portal/tax-compliance"
              />
              <ListItem
                icon={<Clock size={18} className="text-orange" />}
                iconBg="var(--orange-lt)"
                title="Annual License Renewals"
                description={`${activeCompany.renewalDaysLeft} days until license renewal expiration`}
                href="/portal/renewals"
                badge={
                  activeCompany.renewalDaysLeft <= 90 ? (
                    <Badge variant="orange" size="sm">DUE SOON</Badge>
                  ) : undefined
                }
              />
            </div>

            <Card className="flex items-center justify-between gap-3 p-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-full bg-navy text-white flex items-center justify-center font-extrabold text-sm">
                  AK
                </div>
                <div>
                  <div className="text-[13px] font-bold text-navy">{activeCompany.assignedSpecialist}</div>
                  <div className="text-[11px] text-tertiary">Dedicated Legal Concierge - {activeCompany.specialistPhone}</div>
                </div>
              </div>
              <a
                href={`https://wa.me/971501234567?text=Hello,%20I%20have%20an%20inquiry%20regarding%20${encodeURIComponent(activeCompany.name)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary btn-sm"
              >
                <MessageSquare size={14} />
                WhatsApp
              </a>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col gap-5 pb-24">
      <PageHeader
        eyebrow="CLIENT PORTAL"
        title={`Welcome back, ${userProfile.name.split(' ')[0]}`}
        subtitle={`Active formation file for ${activeCompany.name}`}
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
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="text-center py-16 px-6 text-muted">Loading your workspace...</div>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}
