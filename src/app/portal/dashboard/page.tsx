'use client';

import React, { Suspense } from 'react';
import Link from 'next/link';
import { usePortalStore } from '@/lib/store';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Stepper from '@/components/ui/Stepper';
import AlertBanner from '@/components/ui/AlertBanner';
import {
  ShieldCheck,
  ArrowRight,
  FileText,
  AlertCircle,
  Phone,
  ChevronRight,
  Download,
  Calendar,
} from 'lucide-react';

function DashboardContent() {
  const { entities, activeEntityId, setActiveEntityId } = usePortalStore();
  const activeCompany = entities.find((e) => e.id === activeEntityId) || entities[0];

  const stages = [
    { number: 1, label: 'Order Paid', subLabel: 'Day 1' },
    { number: 2, label: 'Official KYC', subLabel: 'Day 1-2' },
    { number: 3, label: 'Registry Filing', subLabel: 'Day 3-5' },
    { number: 4, label: 'License Issued', subLabel: 'Day 5-7' },
    { number: 5, label: 'Bank Setup', subLabel: 'Day 7-18' },
    { number: 6, label: 'Operational', subLabel: 'Day 18' },
  ];

  if (!activeCompany) {
    return <div className="text-center py-20">No active entity found.</div>;
  }

  return (
    <div className="dashboard-container">
      {/* Welcome Banner */}
      <Card variant="sand" padding="md" className="welcome-banner">
        <div className="welcome-left">
          <div className="badge-row">
            <Badge variant="navy" icon={<ShieldCheck className="w-3.5 h-3.5" />}>
              CLIENT COCKPIT • SECURE WORKSPACE
            </Badge>
            <Badge variant="blue">{activeCompany.jurisdiction}</Badge>
          </div>
          <h1 className="welcome-title display-font">
            Welcome back, <span className="text-orange">Alex</span>
          </h1>
          <p className="welcome-sub">
            Your file for <strong>{activeCompany.name}</strong> is allocated to {activeCompany.assignedSpecialist}.
          </p>
        </div>

        <div className="welcome-actions">
          <Link href="/portal/vault" className="btn btn-primary btn-sm">
            <span>Open KYC & Document Vault</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </Card>

      {/* Multi-Entity Switcher */}
      <div className="entity-carousel">
        {entities.map((ent) => (
          <button
            key={ent.id}
            onClick={() => setActiveEntityId(ent.id)}
            className={`entity-pill card ${ent.id === activeCompany.id ? 'active' : ''}`}
          >
            <span>{ent.flag}</span>
            <strong className="text-navy text-sm">{ent.name}</strong>
            <Badge variant={ent.currentStage === 6 ? 'success' : 'orange'}>
              Stage {ent.currentStage}: {ent.stageName}
            </Badge>
          </button>
        ))}

        <Link href="/setup" className="add-entity-pill">
          <span>+ Form Another Entity</span>
        </Link>
      </div>

      {/* Milestone Card */}
      <Card variant="surface" padding="lg" className="milestone-card">
        <div className="milestone-header">
          <div>
            <span className="milestone-sub text-tertiary">LIVE REGISTRY PIPELINE</span>
            <h2 className="milestone-title display-font">Incorporation Milestone Progress</h2>
          </div>
          <Badge variant={activeCompany.currentStage === 6 ? 'success' : 'orange'}>
            STAGE {activeCompany.currentStage} OF 6 • {activeCompany.stageName.toUpperCase()}
          </Badge>
        </div>

        {/* 6-Stage Stepper */}
        <Stepper
          steps={stages}
          currentStage={activeCompany.currentStage}
        />

        {/* Action Callout if KYC is pending */}
        {activeCompany.currentStage === 2 && (
          <AlertBanner
            type="warning"
            title="Official Portal Identity KYC Required"
            description="Please complete your identity and passport scan directly on the official authority portal, then mark it complete in your vault."
            action={{
              label: 'Complete on Official Portal ➔',
              href: '/portal/vault',
            }}
          />
        )}
      </Card>

      {/* 2-Column Grid */}
      <div className="dashboard-grid">
        {/* Left Column: Locker */}
        <Card variant="surface" padding="md" className="dash-card">
          <div className="dash-card-header">
            <div>
              <h3 className="dash-card-title display-font">Corporate Kit Locker</h3>
              <span className="text-xs text-tertiary">Cloudflare R2 Permanent Storage</span>
            </div>
            <Link href="/portal/vault" className="link-text">
              View All Vault Files <ChevronRight className="w-3.5 h-3.5 inline" />
            </Link>
          </div>

          <div className="docs-list">
            {activeCompany.documents.map((doc) => (
              <div key={doc.id} className="doc-item card-sand">
                <div className="doc-info">
                  <FileText className="w-5 h-5 text-orange shrink-0" />
                  <div>
                    <strong className="block text-sm text-navy">{doc.title}</strong>
                    <span className="text-xs text-tertiary">{doc.type} • {doc.size}</span>
                  </div>
                </div>

                <Badge variant={doc.isReady ? 'success' : 'sand'}>
                  {doc.isReady ? 'Ready in Locker' : 'Pending Issue'}
                </Badge>
              </div>
            ))}
          </div>
        </Card>

        {/* Right Column: Compliance & Quick Actions */}
        <Card variant="surface" padding="md" className="dash-card">
          <div className="dash-card-header">
            <div>
              <h3 className="dash-card-title display-font">Compliance & Operations Hub</h3>
              <span className="text-xs text-tertiary">Annual Continuity Oversight</span>
            </div>
          </div>

          <div className="compliance-items">
            <div className="comp-box card-sand">
              <div className="comp-top">
                <span className="text-xs font-bold text-tertiary">ANNUAL NOMINEE & LICENSE RENEWAL</span>
                <Badge variant={activeCompany.renewalDaysLeft <= 90 ? 'warning' : 'success'}>
                  {activeCompany.renewalDaysLeft} Days Left
                </Badge>
              </div>
              <strong className="block text-navy text-sm mt-1">
                Due Date: {activeCompany.licenseExpiryDate}
              </strong>
              <Link href="/portal/renewals" className="text-xs text-orange font-bold hover:underline mt-1 block">
                Manage License Renewal ➔
              </Link>
            </div>

            <div className="comp-box card-sand">
              <div className="comp-top">
                <span className="text-xs font-bold text-tertiary">UAE CORPORATE TAX (9% FTA)</span>
                <Badge variant="blue">First Return</Badge>
              </div>
              <strong className="block text-navy text-sm mt-1">
                TRN: 100482910400003
              </strong>
              <Link href="/portal/tax-compliance" className="text-xs text-orange font-bold hover:underline mt-1 block">
                Open Corporate Tax & VAT Manager ➔
              </Link>
            </div>
          </div>

          <div className="whatsapp-help-box card-sand">
            <Phone className="w-4 h-4 text-orange" />
            <span className="text-xs text-secondary">
              Assigned Specialist WhatsApp: <strong className="text-navy">{activeCompany.specialistPhone}</strong>
            </span>
          </div>
        </Card>
      </div>

      <style jsx>{`
        .dashboard-container {
          display: flex;
          flex-direction: column;
          gap: 24px;
          width: 100%;
        }

        .welcome-banner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
        }

        @media (max-width: 768px) {
          .welcome-banner {
            flex-direction: column;
            text-align: center;
          }
        }

        .badge-row {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 4px;
        }

        .welcome-title {
          font-size: 2rem;
          font-weight: 700;
          margin: 6px 0;
          color: var(--navy);
        }

        .welcome-sub {
          color: var(--text-secondary);
          font-size: 15px;
        }

        .entity-carousel {
          display: flex;
          align-items: center;
          gap: 12px;
          overflow-x: auto;
          padding-bottom: 4px;
        }

        .entity-pill {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 18px;
          border-radius: var(--radius-pill);
          cursor: pointer;
          white-space: nowrap;
          background: var(--surface);
          border: 1px solid var(--border);
          transition: all 0.2s;
        }

        .entity-pill.active {
          border-color: var(--orange);
          background: var(--orange-lt);
        }

        .add-entity-pill {
          padding: 10px 18px;
          background: var(--surface);
          border: 1px dashed var(--border);
          border-radius: var(--radius-pill);
          color: var(--text-secondary);
          font-size: 13px;
          font-weight: 700;
          text-decoration: none;
          white-space: nowrap;
        }

        .milestone-card {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .milestone-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        @media (max-width: 640px) {
          .milestone-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 8px;
          }
        }

        .milestone-title {
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--navy);
        }

        .dashboard-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
        }

        @media (max-width: 860px) {
          .dashboard-grid {
            grid-template-columns: 1fr;
          }
        }

        .dash-card {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .dash-card-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }

        .dash-card-title {
          font-size: 1.25rem;
          font-weight: 700;
          color: var(--navy);
        }

        .link-text {
          font-size: 13px;
          color: var(--navy);
          text-decoration: none;
          font-weight: 700;
        }

        .docs-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .doc-item {
          padding: 14px 16px;
          border-radius: var(--radius);
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }

        .doc-info {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .compliance-items {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .comp-box {
          padding: 16px;
          border-radius: var(--radius);
        }

        .comp-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .whatsapp-help-box {
          padding: 12px 16px;
          border-radius: var(--radius);
          display: flex;
          align-items: center;
          gap: 10px;
        }
      `}</style>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="text-center py-20 text-muted">Loading Client Workspace...</div>}>
      <DashboardContent />
    </Suspense>
  );
}
