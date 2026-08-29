'use client';

import React, { Suspense } from 'react';
import Link from 'next/link';
import { usePortalStore } from '@/lib/store';
import PageHeader from '@/components/design-system/PageHeader';
import StatusCard from '@/components/design-system/StatusCard';
import ListItem from '@/components/design-system/ListItem';
import ProgressSteps from '@/components/design-system/ProgressSteps';
import CountryFlag from '@/components/ui/CountryFlag';
import {
  ShieldCheck,
  ArrowRight,
  FileText,
  Phone,
  Clock,
  Landmark,
  Building2,
  AlertCircle,
  Receipt,
  CheckCircle2,
  MessageSquare,
  Sparkles,
} from 'lucide-react';

function DashboardContent() {
  const { entities, activeEntityId, setActiveEntityId, userProfile } = usePortalStore();
  const activeCompany = entities.find((e) => e.id === activeEntityId) || entities[0];

  if (!activeCompany) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 24px' }}>
        <Building2 size={48} color="var(--text-muted)" style={{ margin: '0 auto 16px' }} />
        <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.1rem', color: 'var(--navy)', marginBottom: 4 }}>
          No Active Entity
        </h3>
        <p style={{ fontSize: 14, color: 'var(--text-tertiary)', marginBottom: 20 }}>
          Start a company formation to access your portal workspace.
        </p>
        <Link href="/setup" className="btn btn-primary" style={{ padding: '10px 24px' }}>
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
        title={`Welcome back, ${userProfile.name.split(' ')[0]}`}
        subtitle={`Active formation file for ${activeCompany.name}`}
      />

      {/* Entity Switcher Carousel (CountryFlag SVG) */}
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
        {entities.map((ent) => (
          <button
            key={ent.id}
            onClick={() => setActiveEntityId(ent.id)}
            className={`btn ${ent.id === activeCompany.id ? 'btn-primary' : 'btn-secondary'}`}
            style={{ flexShrink: 0, gap: 8, fontSize: 13, padding: '8px 16px' }}
          >
            <CountryFlag country={ent.countryCode} size="sm" />
            <span style={{ maxWidth: 130, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {ent.name}
            </span>
          </button>
        ))}
        <Link href="/setup" className="btn btn-secondary" style={{ flexShrink: 0, borderStyle: 'dashed', fontSize: 13 }}>
          + Add Entity
        </Link>
      </div>

      {/* Status Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
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

      {/* Progress & Incorporation Pipeline */}
      <div className="card app-card" style={{ padding: 18 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.1em' }}>
            REGISTRY PIPELINE
          </div>
          <span className="badge badge-orange">{progress}% COMPLETED</span>
        </div>

        <ProgressSteps steps={stages} currentStep={activeCompany.currentStage - 1} />

        <div style={{ marginTop: 14 }}>
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${progress}%` }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-tertiary)', marginTop: 6 }}>
            <span>Stage {activeCompany.currentStage}: {activeCompany.stageName}</span>
            <span>Target: Active & Operational</span>
          </div>
        </div>
      </div>

      {/* Action Required Alert (If Stage 2 KYC is pending) */}
      {activeCompany.currentStage === 2 && (
        <div
          className="card card-sand"
          style={{
            padding: 16,
            borderLeft: '4px solid var(--orange)',
            display: 'flex',
            gap: 12,
            alignItems: 'flex-start',
          }}
        >
          <AlertCircle size={22} color="var(--orange)" style={{ flexShrink: 0, marginTop: 2 }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--navy)', marginBottom: 2 }}>
              Action Required: Official Registry KYC Handshake
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.45, marginBottom: 10 }}>
              Complete identity scan on the official government portal, then confirm your reference number to advance to Stage 3 Filing.
            </div>
            <Link href="/portal/vault" className="btn btn-primary btn-sm">
              Open Document Vault & KYC →
            </Link>
          </div>
        </div>
      )}

      {/* Quick Action Navigation Tiles */}
      <div>
        <div className="section-title">Corporate File & Operations</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <ListItem
            icon={<FileText size={18} color="var(--orange)" />}
            iconBg="var(--orange-lt)"
            title="Document Vault & KYC"
            description="Official trade license, MoA, and nominee deeds"
            href="/portal/vault"
          />
          <ListItem
            icon={<Landmark size={18} color="var(--blue)" />}
            iconBg="var(--blue-lt)"
            title="Corporate Banking Hub"
            description="Airwallex, Wio Bank & Wise pre-approved accounts"
            href="/portal/banking"
          />
          <ListItem
            icon={<Receipt size={18} color="var(--success)" />}
            iconBg="var(--success-lt)"
            title="Tax & 9% FTA Compliance"
            description="Corporate tax exemptions, expense ledger & VAT returns"
            href="/portal/tax-compliance"
          />
          <ListItem
            icon={<Clock size={18} color="var(--orange)" />}
            iconBg="var(--orange-lt)"
            title="Annual License Renewals"
            description={`${activeCompany.renewalDaysLeft} days until license renewal expiration`}
            href="/portal/renewals"
            badge={
              activeCompany.renewalDaysLeft <= 90 ? (
                <span className="badge badge-orange">DUE SOON</span>
              ) : undefined
            }
          />
        </div>
      </div>

      {/* Assigned Concierge Specialist Card */}
      <div
        className="card card-sand"
        style={{
          padding: 16,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              background: 'var(--navy)',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: 14,
            }}
          >
            AK
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--navy)' }}>
              {activeCompany.assignedSpecialist}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
              Dedicated Legal Concierge • {activeCompany.specialistPhone}
            </div>
          </div>
        </div>

        <a
          href={`https://wa.me/971501234567?text=Hello,%20I%20have%20an%20inquiry%20regarding%20${encodeURIComponent(activeCompany.name)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-primary btn-sm"
          style={{ background: 'var(--whatsapp)', borderColor: 'var(--whatsapp)' }}
        >
          <MessageSquare size={14} />
          WhatsApp
        </a>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div style={{ textAlign: 'center', padding: '60px 24px', color: 'var(--text-muted)' }}>
          Loading your workspace...
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}
