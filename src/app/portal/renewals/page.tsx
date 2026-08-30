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
  Clock,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  Receipt,
  FileCheck,
  CreditCard,
} from 'lucide-react';

const WIZARD_STEPS = [
  { label: 'Overview' },
  { label: 'Payment' },
];

export default function RenewalsPortalPage() {
  const { entities, activeEntityId, setActiveEntityId, payRenewalInvoice } = usePortalStore();
  const [currentStep, setCurrentStep] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPaidSuccess, setIsPaidSuccess] = useState(false);

  const activeEntity = entities.find((e) => e.id === activeEntityId) || entities[0];

  const totalSteps = WIZARD_STEPS.length;
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === totalSteps - 1;

  const handlePayRenewal = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setIsPaidSuccess(true);
      if (activeEntity) payRenewalInvoice(activeEntity.id);
      setTimeout(() => setIsPaidSuccess(false), 2000);
    }, 1000);
  };

  if (!activeEntity) return null;

  const isDueSoon = activeEntity.renewalDaysLeft <= 90;

  const renewalCosts = [
    { title: 'Official Government Freezone License Renewal Fee', cost: '$1,200 USD', desc: 'Direct government regulatory charge' },
    { title: 'Registered Agent & Statutory Office Representation', cost: '$450 USD', desc: 'Mandatory statutory address & legal representative' },
    { title: 'Nominee Director & Trustee Shareholder Maintenance', cost: '$800 USD', desc: '12 months nominee deed extension & PoA renewal' },
    { title: 'Corporate Banking Good Standing Certificate', cost: 'Included', desc: 'Banker compliance confirmation' },
  ];

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="flex flex-col gap-4 animate-slide-up">
            <div className="section-title">Select Entity</div>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {entities.map((ent) => (
                <button
                  key={ent.id}
                  onClick={() => setActiveEntityId(ent.id)}
                  className={`btn ${ent.id === activeEntity.id ? 'btn-primary' : 'btn-secondary'} shrink-0 gap-2 text-[13px] py-2 px-4`}
                >
                  <CountryFlag country={ent.countryCode} size="sm" />
                  <span className="max-w-[130px] overflow-hidden text-ellipsis whitespace-nowrap">
                    {ent.name}
                  </span>
                </button>
              ))}
            </div>

            <Card
              padding="md"
              className={`border-l-4 ${isDueSoon ? 'border-l-orange' : 'border-l-success'}`}
            >
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-[44px] h-[44px] rounded-xl flex items-center justify-center ${
                      isDueSoon ? 'bg-orange-lt text-orange' : 'bg-success-lt text-success'
                    }`}
                  >
                    <Clock size={22} />
                  </div>
                  <div>
                    <div className="text-[11px] font-extrabold text-muted uppercase tracking-wider">
                      Renewal Countdown
                    </div>
                    <h3 className="text-base font-extrabold text-navy">
                      {activeEntity.renewalDaysLeft} Days Remaining
                    </h3>
                    <div className="text-xs text-tertiary">
                      Trade License Expiry: {activeEntity.licenseExpiryDate}
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            <div className="section-title">Annual Statutory Breakdown</div>
            <div className="flex flex-col gap-2">
              {renewalCosts.map((item, idx) => (
                <div key={idx} className="card flex justify-between items-center p-3">
                  <div>
                    <div className="text-[13px] font-bold text-navy">{item.title}</div>
                    <div className="text-[11px] text-tertiary">{item.desc}</div>
                  </div>
                  <strong className="text-[13px] text-orange">{item.cost}</strong>
                </div>
              ))}
            </div>
          </div>
        );

      case 1:
        return (
          <div className="flex flex-col gap-4 animate-slide-up">
            <div className="section-title">Renewal Payment</div>

            <Card padding="md">
              <p className="text-[13px] text-secondary leading-relaxed mb-3">
                Extend the commercial trade license for <strong className="text-navy">{activeEntity.name}</strong> for another 12 months with immediate government priority filing.
              </p>

              <div className="card card-sand p-3.5 flex justify-between items-center">
                <div>
                  <div className="text-[11px] text-tertiary">Total Annual Renewal Cost:</div>
                  <div className="text-xl font-extrabold text-orange">$2,450 USD</div>
                </div>
                <Badge variant="success">ALL FEES INCLUDED</Badge>
              </div>
            </Card>

            <div className="card card-sand p-4 border-l-4 border-l-orange">
              <div className="flex items-center gap-2 mb-2">
                <Clock size={16} className="text-orange" />
                <span className="text-xs font-extrabold text-navy">Renewal Details</span>
              </div>
              <div className="flex flex-col gap-1.5 text-xs text-secondary">
                <div className="flex justify-between">
                  <span className="text-tertiary">Entity:</span>
                  <strong className="text-navy">{activeEntity.name}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-tertiary">Current Expiry:</span>
                  <strong className="text-navy">{activeEntity.licenseExpiryDate}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-tertiary">Days Left:</span>
                  <strong className="text-navy">{activeEntity.renewalDaysLeft}</strong>
                </div>
              </div>
            </div>

            {isPaidSuccess && (
              <div className="card p-3 bg-success-lt border-l-4 border-l-success text-xs text-secondary flex items-center gap-2">
                <CheckCircle2 size={16} className="text-success shrink-0" />
                <span>Renewal confirmed! Your license has been extended for 12 months.</span>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col gap-5 pb-24">
      <PageHeader
        eyebrow="STATUTORY CONTINUITY"
        title="Annual License Renewals & Maintenance"
        subtitle="Ensure uninterrupted corporate legal standing, registered agent service, and banking validity."
      />

      <div className="flex gap-2 mb-1">
        <Badge variant="navy">ANNUAL COMPLIANCE</Badge>
      </div>

      <div className="card card-sand px-4 py-3">
        <ProgressSteps steps={WIZARD_STEPS} currentStep={currentStep} />
      </div>

      {renderStep()}

      <StickyFooter
        primaryLabel={isLastStep ? (isPaidSuccess ? 'Confirmed' : 'Authorize $2,450 USD') : 'Next'}
        primaryAction={() => {
          if (isLastStep && !isPaidSuccess) {
            handlePayRenewal();
          } else if (!isLastStep) {
            setCurrentStep((s) => s + 1);
          }
        }}
        primaryDisabled={isLastStep && (isProcessing || isPaidSuccess)}
        primaryLoading={isLastStep && isProcessing}
        primaryIcon={isLastStep ? <CreditCard size={16} /> : <ArrowRight size={16} />}
        secondaryLabel={isFirstStep ? undefined : 'Back'}
        secondaryAction={isFirstStep ? undefined : () => setCurrentStep((s) => s - 1)}
        priceLabel={isLastStep ? 'Total' : undefined}
        priceValue={isLastStep ? '$2,450' : undefined}
        priceSub={isLastStep ? 'All fees included' : undefined}
      />
    </div>
  );
}
