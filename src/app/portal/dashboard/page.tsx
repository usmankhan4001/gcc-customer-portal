'use client';

import React, { Suspense } from 'react';
import Link from 'next/link';
import { usePortalStore } from '@/lib/store';
import PageHeader from '@/components/design-system/PageHeader';
import StatusCard from '@/components/design-system/StatusCard';
import ListItem from '@/components/design-system/ListItem';
import ProgressSteps from '@/components/design-system/ProgressSteps';
import {
  ShieldCheck,
  ArrowRight,
  FileText,
  Phone,
  Download,
  Calendar,
  Clock,
  Landmark,
  ChevronRight,
  Building2,
  AlertCircle,
} from 'lucide-react';

function DashboardContent() {
  const { entities, activeEntityId, setActiveEntityId } = usePortalStore();
  const activeCompany = entities.find((e) => e.id === activeEntityId) || entities[0];

  if (!activeCompany) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 24px' }}>
        <Building2 size={48} color="var(--color-text-muted)" style={{ margin: '0 auto 16px' }} />
        <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.1rem', color: 'var(--color-brand-navy)', marginBottom: 4 }}>
          No Active Entity
        </h3>
        <p style={{ fontSize: 14, color: 'var(--color-text-tertiary)', marginBottom: 20 }}>
          Start a company formation to see your dashboard.
        </p>
        <Link href="/setup" className="pill pill-primary" style={{ padding: '10px 24px' }}>
          Start Company Setup
        </Link>
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <PageHeader
        eyebrow="CLIENT PORTAL"
        title={`Welcome back, Alex`}
        subtitle={`Your file for ${activeCompany.name}`}
      />

      {/* Entity Switcher */}
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
        {entities.map((ent) => (
          <button
            key={ent.id}
            onClick={() => setActiveEntityId(ent.id)}
            className={`pill ${ent.id === activeCompany.id ? 'pill-primary' : 'pill-secondary'}`}
            style={{ flexShrink: 0, gap: 6 }}
          >
            <span>{ent.flag}</span>
            <span style={{ maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {ent.name}
            </span>
          </button>
        ))}
        <Link href="/setup" className="pill pill-secondary" style={{ flexShrink: 0, borderStyle: 'dashed' }}>
          + Add
        </Link>
      </div>

      {/* Status Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <StatusCard
          title="Status"
          value={`Stage ${activeCompany.currentStage}`}
          subtitle={activeCompany.stageName}
          variant={activeCompany.currentStage === 6 ? 'success' : 'orange'}
        />
        <StatusCard
          title="Renewal"
          value={`${activeCompany.renewalDaysLeft}d`}
          subtitle={`Exp: ${activeCompany.licenseExpiryDate}`}
          variant={activeCompany.renewalDaysLeft <= 90 ? 'orange' : 'blue'}
        />
      </div>

      {/* Progress Steps */}
      <div className="app-card" style={{ padding: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-muted)', letterSpacing: '0.1em', marginBottom: 12 }}>
          INCORPORATION PIPELINE
        </div>
        <ProgressSteps steps={stages} currentStep={activeCompany.currentStage - 1} />
        <div style={{ marginTop: 12 }}>
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${progress}%` }} />
          </div>
          <div style={{ fontSize: 11, color: 'var(--color-text-tertiary)', marginTop: 6, textAlign: 'right' }}>
            {progress}% complete
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <div className="section-title">Quick Actions</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <ListItem
            icon={<FileText size={18} color="var(--color-brand-orange)" />}
            iconBg="var(--color-brand-orange-lt)"
            title="Document Vault"
            description="KYC, licenses, certificates"
            href="/portal/vault"
          />
          <ListItem
            icon={<Clock size={18} color="var(--color-brand-blue)" />}
            iconBg="var(--color-brand-blue-lt)"
            title="License Renewals"
            description={`${activeCompany.renewalDaysLeft} days until renewal`}
            href="/portal/renewals"
            badge={
              activeCompany.renewalDaysLeft <= 90 ? (
                <span className="chip chip-orange">DUE SOON</span>
              ) : undefined
            }
          />
          <ListItem
            icon={<Landmark size={18} color="var(--color-success)" />}
            iconBg="var(--color-success-lt)"
            title="Banking Hub"
            description="Multi-currency accounts"
            href="/portal/banking"
          />
        </div>
      </div>

      {/* Pending Action Alert */}
      {activeCompany.currentStage === 2 && (
        <div
          className="app-card"
          style={{
            padding: 16,
            background: 'var(--color-warning-lt)',
            border: '1px solid #FDE68A',
            display: 'flex',
            gap: 12,
            alignItems: 'flex-start',
          }}
        >
          <AlertCircle size={20} color="var(--color-warning)" style={{ flexShrink: 0, marginTop: 2 }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-brand-navy)', marginBottom: 2 }}>
              Action Required: KYC
            </div>
            <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', lineHeight: 1.4, marginBottom: 10 }}>
              Complete your identity verification on the official portal.
            </div>
            <Link href="/portal/vault" className="pill pill-primary" style={{ fontSize: 12, padding: '6px 14px' }}>
              Complete Now
            </Link>
          </div>
        </div>
      )}

      {/* Contact */}
      <div
        className="app-card"
        style={{
          padding: 14,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          background: 'var(--color-brand-sand)',
          borderColor: 'var(--color-brand-sand-dk)',
        }}
      >
        <Phone size={16} color="var(--color-brand-orange)" />
        <span style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>
          Specialist: <strong style={{ color: 'var(--color-brand-navy)' }}>{activeCompany.specialistPhone}</strong>
        </span>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div style={{ textAlign: 'center', padding: '60px 24px', color: 'var(--color-text-muted)' }}>
          Loading...
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}
