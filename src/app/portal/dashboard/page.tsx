'use client';

import React, { Suspense } from 'react';
import Link from 'next/link';
import { usePortalStore } from '@/lib/store';
import type { CompanyEntity } from '@/lib/store';
import {
  Building2,
  FileText,
  Landmark,
  Receipt,
  Clock,
  ArrowRight,
  AlertTriangle,
  CheckCircle2,
  MessageSquare,
  ChevronRight,
  ShieldCheck,
  Sparkles,
  Bell,
} from 'lucide-react';

/* ─── Helpers ─── */

const STAGE_LABELS = ['Paid', 'KYC', 'Filed', 'License', 'Bank', 'Live'];

function statusColor(s: CompanyEntity['status']) {
  switch (s) {
    case 'active': return 'status-dot-active';
    case 'license_issued': return 'status-dot-active';
    case 'banking_setup': return 'status-dot-info';
    case 'filing': return 'status-dot-info';
    case 'official_kyc_pending': return 'status-dot-pending';
    case 'paid': return 'status-dot-pending';
    default: return 'status-dot-pending';
  }
}

function statusLabel(s: CompanyEntity['status']) {
  switch (s) {
    case 'active': return 'Active & Operational';
    case 'license_issued': return 'License Issued';
    case 'banking_setup': return 'Banking Setup';
    case 'filing': return 'Government Filing';
    case 'official_kyc_pending': return 'KYC Pending';
    case 'paid': return 'Order Paid';
    default: return s;
  }
}

function tierBadge(tier: CompanyEntity['tier']) {
  switch (tier) {
    case 'tier1': return 'badge-success';
    case 'tier2': return 'badge-orange';
    case 'tier3': return 'badge-info';
    default: return 'badge-navy';
  }
}

function daysUntil(dateStr: string) {
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

function formatTimestamp(ts: string) {
  try {
    const d = new Date(ts.replace(' ', 'T'));
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffH = Math.floor(diffMin / 60);
    if (diffH < 24) return `${diffH}h ago`;
    const diffD = Math.floor(diffH / 24);
    return `${diffD}d ago`;
  } catch {
    return ts;
  }
}

/* ─── Section 1: Entity Switcher ─── */

function EntitySwitcher({
  entities,
  activeId,
  onSelect,
}: {
  entities: CompanyEntity[];
  activeId: string;
  onSelect: (id: string) => void;
}) {
  if (entities.length <= 1) return null;

  return (
    <div className="section-gap" style={{ animationDelay: '0ms' }}>
      <div className="h-scroll" style={{ gap: 8 }}>
        {entities.map((ent) => (
          <button
            key={ent.id}
            onClick={() => onSelect(ent.id)}
            className={`chip ${ent.id === activeId ? 'chip active' : ''}`}
            style={{ flexShrink: 0, gap: 6 }}
          >
            <span>{ent.flag}</span>
            <span
              className="truncate"
              style={{ maxWidth: 110, fontSize: 13 }}
            >
              {ent.name}
            </span>
          </button>
        ))}
        <Link
          href="/setup"
          className="chip"
          style={{ flexShrink: 0, borderStyle: 'dashed' }}
        >
          + Add
        </Link>
      </div>
    </div>
  );
}

/* ─── Section 2: Active Entity Hero Card ─── */

function EntityHeroCard({ entity }: { entity: CompanyEntity }) {
  const progress = Math.round((entity.currentStage / 6) * 100);

  return (
    <div className="entity-card section-gap animate-slide-up" style={{ animationDelay: '40ms' }}>
      {/* Header */}
      <div className="entity-card-header">
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ minWidth: 0 }}>
            <h2
              className="font-heading"
              style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-text)', lineHeight: 1.2 }}
            >
              {entity.name}
            </h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
              <span style={{ fontSize: 16 }}>{entity.flag}</span>
              <span style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>{entity.jurisdiction}</span>
            </div>
          </div>
          <span className={`badge badge-sm ${tierBadge(entity.tier)}`}>
            {entity.tier.replace('tier', 'T')}
          </span>
        </div>

        {/* Status Row */}
        <div className="status-row" style={{ gap: 8 }}>
          <span className={`status-dot ${statusColor(entity.status)}`} />
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-secondary)' }}>
            {statusLabel(entity.status)}
          </span>
          <span style={{ fontSize: 12, color: 'var(--color-text-muted)', marginLeft: 'auto' }}>
            {progress}%
          </span>
        </div>

        {/* Progress Bar */}
        <div className="progress-track">
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>

        {/* Stage Timeline */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 0, justifyContent: 'space-between' }}>
          {STAGE_LABELS.map((label, i) => {
            const stageNum = i + 1;
            const isCompleted = stageNum < entity.currentStage;
            const isCurrent = stageNum === entity.currentStage;
            const isUpcoming = stageNum > entity.currentStage;

            return (
              <div key={label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                {/* Dot */}
                <div
                  style={{
                    width: isCurrent ? 14 : 10,
                    height: isCurrent ? 14 : 10,
                    borderRadius: '50%',
                    background: isCompleted
                      ? 'var(--color-orange)'
                      : isCurrent
                      ? 'var(--color-orange)'
                      : 'var(--color-border)',
                    boxShadow: isCurrent
                      ? '0 0 0 4px rgba(242,101,34,0.18), 0 0 12px rgba(242,101,34,0.3)'
                      : 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.3s ease',
                  }}
                >
                  {isCompleted && (
                    <CheckCircle2 size={8} color="#fff" style={{ strokeWidth: 3 }} />
                  )}
                  {isCurrent && (
                    <div
                      style={{
                        width: 5,
                        height: 5,
                        borderRadius: '50%',
                        background: '#fff',
                      }}
                    />
                  )}
                </div>
                {/* Connector line (except last) */}
                {i < 5 && (
                  <div
                    style={{
                      position: 'absolute',
                      width: '100%',
                      height: 2,
                      top: isCurrent ? 6 : 4,
                    }}
                  />
                )}
                {/* Label */}
                <span
                  style={{
                    fontSize: 9,
                    fontWeight: isCurrent ? 700 : 600,
                    color: isCompleted
                      ? 'var(--color-orange)'
                      : isCurrent
                      ? 'var(--color-orange)'
                      : 'var(--color-text-muted)',
                    marginTop: 6,
                    textAlign: 'center',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick Stats Row */}
      <div
        className="entity-card-body"
        style={{ borderTop: '1px solid var(--color-border)', paddingTop: 16, gap: 0 }}
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-text-muted)', letterSpacing: '0.05em', marginBottom: 4 }}>
              TRADE LICENSE
            </div>
            <div
              className="truncate"
              style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)' }}
            >
              {entity.tradeLicenseNo || 'Pending'}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-text-muted)', letterSpacing: '0.05em', marginBottom: 4 }}>
              RENEWAL IN
            </div>
            <div
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: entity.renewalDaysLeft <= 90 ? 'var(--color-error)' : 'var(--color-text)',
              }}
            >
              {entity.renewalDaysLeft}d
            </div>
          </div>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-text-muted)', letterSpacing: '0.05em', marginBottom: 4 }}>
              ASSIGNED
            </div>
            <div
              className="truncate"
              style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)' }}
            >
              {entity.assignedSpecialist.split('(')[0].trim()}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="entity-card-footer">
        <Link
          href={`/portal/entity/${entity.id}`}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 13,
            fontWeight: 600,
            color: 'var(--color-orange)',
            textDecoration: 'none',
          }}
        >
          View Full Details
          <ArrowRight size={14} />
        </Link>
      </div>
    </div>
  );
}

/* ─── Section 3: Quick Actions Grid ─── */

function QuickActions() {
  const actions = [
    {
      label: 'Documents',
      desc: 'Vault & KYC',
      href: '/portal/vault',
      icon: <FileText size={22} />,
      bg: 'var(--color-orange-light)',
      color: 'var(--color-orange)',
    },
    {
      label: 'Renewals',
      desc: 'License expiry',
      href: '/portal/renewals',
      icon: <Clock size={22} />,
      bg: 'var(--color-warning-light)',
      color: 'var(--color-warning)',
    },
    {
      label: 'Banking',
      desc: 'Corporate accounts',
      href: '/portal/banking',
      icon: <Landmark size={22} />,
      bg: 'var(--color-info-light)',
      color: 'var(--color-info)',
    },
    {
      label: 'Tax',
      desc: 'Filing & compliance',
      href: '/portal/tax-compliance',
      icon: <Receipt size={22} />,
      bg: 'var(--color-success-light)',
      color: 'var(--color-success)',
    },
  ];

  return (
    <div className="section-gap animate-slide-up" style={{ animationDelay: '120ms' }}>
      <div className="section-header">
        <span className="section-title">Quick Actions</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {actions.map((a) => (
          <Link
            key={a.label}
            href={a.href}
            className="card card-interactive card-padded"
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
              textDecoration: 'none',
            }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 'var(--radius-md)',
                background: a.bg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: a.color,
              }}
            >
              {a.icon}
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)' }}>
                {a.label}
              </div>
              <div style={{ fontSize: 11, color: 'var(--color-text-tertiary)', marginTop: 2 }}>
                {a.desc}
              </div>
            </div>
            <ChevronRight
              size={14}
              style={{ color: 'var(--color-text-muted)', marginTop: 'auto', alignSelf: 'flex-end' }}
            />
          </Link>
        ))}
      </div>
    </div>
  );
}

/* ─── Section 4: Recent Activity ─── */

function RecentActivity({ logs }: { logs: { id: string; messageText: string; sentAt: string; status: string; templateName: string }[] }) {
  const recent = logs.slice(0, 5);

  if (recent.length === 0) return null;

  return (
    <div className="section-gap animate-slide-up" style={{ animationDelay: '160ms' }}>
      <div className="section-header">
        <span className="section-title">Recent Activity</span>
      </div>
      <div className="card card-bordered" style={{ overflow: 'hidden' }}>
        {recent.map((item, idx) => (
          <div
            key={item.id}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 12,
              padding: '14px 16px',
              borderBottom: idx < recent.length - 1 ? '1px solid var(--color-border)' : 'none',
            }}
          >
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 'var(--radius-sm)',
                background: item.templateName.includes('banking')
                  ? 'var(--color-info-light)'
                  : item.templateName.includes('kyc')
                  ? 'var(--color-warning-light)'
                  : 'var(--color-success-light)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                color: item.templateName.includes('banking')
                  ? 'var(--color-info)'
                  : item.templateName.includes('kyc')
                  ? 'var(--color-warning)'
                  : 'var(--color-success)',
              }}
            >
              {item.templateName.includes('banking') ? (
                <Landmark size={16} />
              ) : item.templateName.includes('kyc') ? (
                <ShieldCheck size={16} />
              ) : (
                <CheckCircle2 size={16} />
              )}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                className="truncate"
                style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text)', lineHeight: 1.4 }}
              >
                {item.messageText.length > 80
                  ? item.messageText.slice(0, 80) + '...'
                  : item.messageText}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                  {formatTimestamp(item.sentAt)}
                </span>
                <span
                  className={`status-dot ${
                    item.status === 'read'
                      ? 'status-dot-active'
                      : item.status === 'delivered'
                      ? 'status-dot-info'
                      : 'status-dot-pending'
                  }`}
                  style={{ width: 6, height: 6 }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Section 5: Upcoming Deadlines ─── */

function UpcomingDeadlines({
  entities,
  taxRecords,
}: {
  entities: CompanyEntity[];
  taxRecords: { id: string; title: string; dueDate: string; status: string }[];
}) {
  const renewalWarnings = entities.filter((e) => e.renewalDaysLeft < 90);
  const upcomingTax = taxRecords.find(
    (t) => t.status === 'upcoming' || t.status === 'ready_to_file'
  );

  const hasDeadlines = renewalWarnings.length > 0 || !!upcomingTax;
  if (!hasDeadlines) return null;

  return (
    <div className="section-gap animate-slide-up" style={{ animationDelay: '200ms' }}>
      <div className="section-header">
        <span className="section-title">Upcoming Deadlines</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {renewalWarnings.map((e) => (
          <div
            key={e.id}
            className="card card-padded"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              borderLeft: '4px solid var(--color-error)',
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 'var(--radius-sm)',
                background: 'var(--color-error-light)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                color: 'var(--color-error)',
              }}
            >
              <AlertTriangle size={18} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)' }}>
                License Renewal — {e.name}
              </div>
              <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 2 }}>
                Expires in{' '}
                <span style={{ fontWeight: 700, color: 'var(--color-error)' }}>
                  {e.renewalDaysLeft} days
                </span>
                {' '}({e.licenseExpiryDate})
              </div>
            </div>
            <Link
              href="/portal/renewals"
              style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-orange)', textDecoration: 'none', flexShrink: 0 }}
            >
              Renew →
            </Link>
          </div>
        ))}

        {upcomingTax && (
          <div
            className="card card-padded"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              borderLeft: '4px solid var(--color-warning)',
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 'var(--radius-sm)',
                background: 'var(--color-warning-light)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                color: 'var(--color-warning)',
              }}
            >
              <Receipt size={18} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)' }}>
                {upcomingTax.title}
              </div>
              <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 2 }}>
                Due{' '}
                <span style={{ fontWeight: 700 }}>{upcomingTax.dueDate}</span>
              </div>
            </div>
            <Link
              href="/portal/tax-compliance"
              style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-orange)', textDecoration: 'none', flexShrink: 0 }}
            >
              File →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Stage-Specific Alert Banner ─── */

function StageAlert({ entity }: { entity: CompanyEntity }) {
  if (entity.currentStage === 6) return null;

  let icon: React.ReactNode;
  let title: string;
  let desc: string;
  let cta: React.ReactNode;
  let accentColor: string;

  switch (entity.currentStage) {
    case 2:
      icon = <AlertTriangle size={20} />;
      title = 'Action Required: Complete KYC Identity Verification';
      desc = 'Complete your identity scan on the official government portal to advance to Stage 3.';
      cta = (
        <Link href="/portal/vault" className="btn btn-primary btn-sm">
          Open Vault & KYC →
        </Link>
      );
      accentColor = 'var(--color-warning)';
      break;
    case 3:
      icon = <Clock size={20} />;
      title = 'Filing in Progress';
      desc = 'Your Memorandum of Association is under government review. Expected license issuance in 3-5 business days.';
      accentColor = 'var(--color-info)';
      cta = null;
      break;
    case 5:
      icon = <Landmark size={20} />;
      title = 'Action Required: Banking Setup';
      desc = 'Complete your banking pre-approval forms to activate your corporate accounts.';
      cta = (
        <Link href="/portal/banking" className="btn btn-primary btn-sm">
          Open Banking Hub →
        </Link>
      );
      accentColor = 'var(--color-orange)';
      break;
    default:
      return null;
  }

  return (
    <div
      className="card card-padded animate-slide-up"
      style={{
        animationDelay: '80ms',
        borderLeft: `4px solid ${accentColor}`,
        display: 'flex',
        gap: 12,
        alignItems: 'flex-start',
        marginBottom: 0,
      }}
    >
      <div style={{ color: accentColor, flexShrink: 0, marginTop: 2 }}>{icon}</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)', marginBottom: 2 }}>
          {title}
        </div>
        <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', lineHeight: 1.45 }}>
          {desc}
        </div>
        {cta && <div style={{ marginTop: 10 }}>{cta}</div>}
      </div>
    </div>
  );
}

/* ─── Empty State ─── */

function EmptyState() {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">
        <Building2 size={32} />
      </div>
      <div className="empty-state-title">No Active Entity</div>
      <div className="empty-state-desc">
        Start a company formation to access your portal workspace.
      </div>
      <Link href="/setup" className="btn btn-primary">
        Start Company Setup
      </Link>
    </div>
  );
}

/* ─── Main Dashboard ─── */

function DashboardContent() {
  const {
    entities,
    activeEntityId,
    setActiveEntityId,
    userProfile,
    taxRecords,
    whatsappLogs,
  } = usePortalStore();

  const activeCompany =
    entities.find((e) => e.id === activeEntityId) || entities[0];

  if (!activeCompany) return <EmptyState />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Greeting */}
      <div className="animate-fade-in">
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text-muted)', letterSpacing: '0.08em', marginBottom: 4 }}>
          CLIENT PORTAL
        </div>
        <h1
          className="font-heading"
          style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--color-text)', lineHeight: 1.2 }}
        >
          Welcome back, {(userProfile.name || 'User').split(' ')[0]}
        </h1>
      </div>

      {/* Section 1: Entity Switcher */}
      <EntitySwitcher
        entities={entities}
        activeId={activeCompany.id}
        onSelect={setActiveEntityId}
      />

      {/* Section 2: Active Entity Hero Card */}
      <EntityHeroCard entity={activeCompany} />

      {/* Stage Alert */}
      <StageAlert entity={activeCompany} />

      {/* Section 3: Quick Actions */}
      <QuickActions />

      {/* Section 4: Recent Activity */}
      <RecentActivity logs={whatsappLogs} />

      {/* Section 5: Upcoming Deadlines */}
      <UpcomingDeadlines entities={entities} taxRecords={taxRecords} />
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div style={{ textAlign: 'center', padding: '60px 24px', color: 'var(--color-text-muted)' }}>
          Loading your workspace...
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}
