'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePortalStore } from '@/lib/store';
import PageHeader from '@/components/design-system/PageHeader';
import ProgressSteps from '@/components/design-system/ProgressSteps';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import StickyFooter from '@/components/ui/StickyFooter';
import CountryFlag from '@/components/ui/CountryFlag';
import {
  Shield,
  Bell,
  Smartphone,
  Mail,
  Key,
  Building2,
  LogOut,
  ChevronRight,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
} from 'lucide-react';

const WIZARD_STEPS = [
  { label: 'Profile' },
  { label: 'Entities' },
  { label: 'Notifications' },
];

export default function SettingsPage() {
  const { userProfile, updateUserProfile, entities, activeEntityId, setActiveEntityId } = usePortalStore();
  const [currentStep, setCurrentStep] = useState(0);

  const totalSteps = WIZARD_STEPS.length;
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === totalSteps - 1;

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="flex flex-col gap-4 animate-slide-up">
            <div className="section-title">Profile Information</div>
            <Card padding="md">
              <div className="flex items-center gap-3.5 mb-4">
                <div className="w-12 h-12 rounded-full bg-orange-lt text-orange border-2 border-orange/30 flex items-center justify-center font-extrabold text-lg">
                  {userProfile.name.charAt(0)}
                </div>
                <div>
                  <h2 className="text-[15px] font-extrabold text-navy">{userProfile.name}</h2>
                  <div className="text-xs text-tertiary">{userProfile.role}</div>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex justify-between text-[13px] py-2 border-b border-border">
                  <span className="text-tertiary">Email Address:</span>
                  <strong className="text-navy">{userProfile.email}</strong>
                </div>
                <div className="flex justify-between text-[13px] py-2 border-b border-border">
                  <span className="text-tertiary">WhatsApp Phone:</span>
                  <strong className="text-navy">{userProfile.phone}</strong>
                </div>
                <div className="flex justify-between text-[13px] py-2">
                  <span className="text-tertiary">Country:</span>
                  <strong className="text-navy">{userProfile.country}</strong>
                </div>
              </div>
            </Card>
          </div>
        );

      case 1:
        return (
          <div className="flex flex-col gap-3 animate-slide-up">
            <div className="flex justify-between items-center">
              <div className="section-title mb-0">Entity Portfolio</div>
              <Badge variant="info">{entities.length} Companies</Badge>
            </div>

            <div className="flex flex-col gap-2">
              {entities.map((ent) => (
                <button
                  key={ent.id}
                  onClick={() => setActiveEntityId(ent.id)}
                  className={`card card-hover ${ent.id === activeEntityId ? 'card-sand border-orange' : ''} flex items-center justify-between p-3 cursor-pointer`}
                >
                  <div className="flex items-center gap-2.5">
                    <CountryFlag country={ent.countryCode} size="md" />
                    <div className="text-left">
                      <div className="text-[13px] font-bold text-navy">{ent.name}</div>
                      <div className="text-[11px] text-tertiary">{ent.jurisdiction} - {ent.stageName}</div>
                    </div>
                  </div>
                  {ent.id === activeEntityId && <Badge variant="orange">ACTIVE</Badge>}
                </button>
              ))}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="flex flex-col gap-3 animate-slide-up">
            <div className="section-title">Notification Channels</div>

            <Card padding="md">
              <div className="flex justify-between items-center py-2 border-b border-border">
                <div className="flex items-center gap-2.5">
                  <div className="w-[34px] h-[34px] rounded-lg bg-[rgba(37,211,102,0.15)] flex items-center justify-center">
                    <Smartphone size={16} className="text-whatsapp" />
                  </div>
                  <div>
                    <div className="text-[13px] font-bold text-navy">WhatsApp Filing Bot</div>
                    <div className="text-[11px] text-tertiary">Real-time registry status alerts</div>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={userProfile.whatsappAlerts}
                  onChange={(e) => updateUserProfile({ whatsappAlerts: e.target.checked })}
                  className="w-[18px] h-[18px] accent-orange cursor-pointer"
                />
              </div>

              <div className="flex justify-between items-center py-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-[34px] h-[34px] rounded-lg bg-blue-lt flex items-center justify-center">
                    <Mail size={16} className="text-blue" />
                  </div>
                  <div>
                    <div className="text-[13px] font-bold text-navy">Email PDF Receipts & MoA</div>
                    <div className="text-[11px] text-tertiary">Direct dispatch to {userProfile.email}</div>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={userProfile.emailAlerts}
                  onChange={(e) => updateUserProfile({ emailAlerts: e.target.checked })}
                  className="w-[18px] h-[18px] accent-orange cursor-pointer"
                />
              </div>
            </Card>

            <Link href="/admin/clients" style={{ textDecoration: 'none' }}>
              <Card className="flex justify-between items-center p-3.5 cursor-pointer">
                <div className="flex items-center gap-2.5">
                  <ShieldCheck size={18} className="text-orange" />
                  <div>
                    <div className="text-[13px] font-bold text-navy">Operations Console</div>
                    <div className="text-[11px] text-tertiary">Access internal CRM & filing queue</div>
                  </div>
                </div>
                <Badge variant="navy">STAFF ONLY</Badge>
              </Card>
            </Link>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col gap-5 pb-24">
      <PageHeader
        eyebrow="ACCOUNT & PREFERENCES"
        title="Portal Settings"
        subtitle="Manage your founder profile, active corporate entities, and notification channels."
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
