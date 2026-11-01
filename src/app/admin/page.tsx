'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { Search, Plus, RefreshCw, X, ShieldCheck, ChevronRight } from 'lucide-react';
import { PageHeader } from '@/components/admin/PageHeader';
import {
  STATUS_SELECT_OPTIONS,
  filterItems,
  formatAmount,
  groupByStage,
  isTempPhone,
  jurisdictionInfo,
  nextStage,
  paymentTone,
  slaBadge,
  tierLabel,
  totalPipelineValue,
} from '@/lib/admin-ui/pipeline';
import styles from './pipeline.module.css';

interface CompanyPipelineItem {
  id: string;
  company_name: string;
  jurisdiction: string;
  tier: string;
  track_type: string | null;
  status: string;
  official_kyc_completed: boolean;
  trade_license_number: string | null;
  created_at: string;
  updated_at: string;
  client_id: string | null;
  client_name: string | null;
  client_email: string | null;
  client_phone: string | null;
  assigned_id: string | null;
  assigned_name: string | null;
  assigned_avatar: string | null;
  daysInStage: number;
  slaStatus: 'green' | 'yellow' | 'red';
  order: {
    amount_total: number;
    currency: string;
    payment_status: string;
  } | null;
}

export default function AdminDashboard() {
  const [items, setItems] = useState<CompanyPipelineItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [jurisdictionFilter, setJurisdictionFilter] = useState('all');
  const [activeStage, setActiveStage] = useState('intake');
  const [showNewModal, setShowNewModal] = useState(false);
  const [submittingNew, setSubmittingNew] = useState(false);

  // New Order Form state
  const [formCompanyName, setFormCompanyName] = useState('');
  const [formJurisdiction, setFormJurisdiction] = useState('uae');
  const [formTier, setFormTier] = useState('tier_1_self');
  const [formClientName, setFormClientName] = useState('');
  const [formClientEmail, setFormClientEmail] = useState('');
  const [formClientPhone, setFormClientPhone] = useState('');
  const [formStatus, setFormStatus] = useState('lead');

  const fetchPipeline = async () => {
    try {
      setLoading(true);
      setLoadError(false);
      const res = await fetch('/api/admin/pipeline');
      if (res.ok) {
        const data = await res.json();
        setItems(data.companies || []);
      } else {
        setLoadError(true);
      }
    } catch (err) {
      console.error('Failed to load pipeline:', err);
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPipeline();
  }, []);

  const handleUpdateStatus = async (companyId: string, newStatus: string) => {
    try {
      setUpdatingId(companyId);
      const res = await fetch('/api/admin/pipeline', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyId, status: newStatus }),
      });
      if (res.ok) {
        setItems((prev) =>
          prev.map((c) =>
            c.id === companyId
              ? {
                  ...c,
                  status: newStatus,
                  daysInStage: 0,
                  slaStatus: 'green',
                  updated_at: new Date().toISOString(),
                }
              : c
          )
        );
      }
    } catch (err) {
      console.error('Failed to advance company stage:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formCompanyName.trim()) return;

    try {
      setSubmittingNew(true);
      const res = await fetch('/api/admin/pipeline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName: formCompanyName.trim(),
          jurisdiction: formJurisdiction,
          tier: formTier,
          clientName: formClientName.trim() || undefined,
          clientEmail: formClientEmail.trim() || undefined,
          clientPhone: formClientPhone.trim() || undefined,
          status: formStatus,
        }),
      });

      if (res.ok) {
        setShowNewModal(false);
        setFormCompanyName('');
        setFormClientName('');
        setFormClientEmail('');
        setFormClientPhone('');
        fetchPipeline();
      }
    } catch (err) {
      console.error('Failed to create company order:', err);
    } finally {
      setSubmittingNew(false);
    }
  };

  const filteredItems = useMemo(
    () => filterItems(items, jurisdictionFilter, searchQuery),
    [items, jurisdictionFilter, searchQuery]
  );
  const columns = useMemo(() => groupByStage(filteredItems), [filteredItems]);
  const totalPipelineRevenue = useMemo(() => totalPipelineValue(items), [items]);

  return (
    <div className="wrap admin-page">
      <PageHeader
        eyebrow="Operations"
        title="Operations Pipeline"
        subtitle="Live operational flow across global registries: Intake, KYC compliance, Registry filing & Bank opening."
        actions={
          <>
            <button
              type="button"
              className="btn btn-outline"
              onClick={fetchPipeline}
              disabled={loading}
              aria-label="Refresh pipeline"
            >
              <RefreshCw size={16} />
            </button>
            <button type="button" className="btn btn-primary" onClick={() => setShowNewModal(true)}>
              <Plus size={16} /> New Order
            </button>
          </>
        }
      />

      <div className={`${styles.badges} ${styles.summary}`}>
        <span className="badge badge-info">{items.length} Total Cases</span>
        {totalPipelineRevenue > 0 && (
          <span className="badge badge-success">{formatAmount(totalPipelineRevenue)} Pipeline Vol.</span>
        )}
      </div>

      <div className="cl-toolbar">
        <label className="cl-search">
          <Search size={16} aria-hidden="true" />
          <input
            type="text"
            placeholder="Search company, client, phone..."
            aria-label="Search company, client or phone"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </label>
        {searchQuery && (
          <button type="button" className="btn btn-outline" onClick={() => setSearchQuery('')}>
            <X size={16} /> Clear search
          </button>
        )}
        <select
          className="cl-select"
          aria-label="Filter by jurisdiction"
          value={jurisdictionFilter}
          onChange={(e) => setJurisdictionFilter(e.target.value)}
        >
          <option value="all">All Jurisdictions</option>
          <option value="uae">🇦🇪 UAE</option>
          <option value="hong-kong">🇭🇰 Hong Kong</option>
          <option value="singapore">🇸🇬 Singapore</option>
          <option value="bahrain">🇧🇭 Bahrain</option>
          <option value="ireland">🇮🇪 Ireland</option>
          <option value="bvi">🇻🇬 BVI / Cayman</option>
        </select>
        <div className={`cl-chips ${styles.chips}`} role="group" aria-label="Pipeline stage">
          {columns.map((col) => (
            <button
              key={col.key}
              type="button"
              className={`cl-chip${activeStage === col.key ? ' is-on' : ''}`}
              aria-pressed={activeStage === col.key}
              onClick={() => setActiveStage(col.key)}
            >
              {col.title} <span className="cl-chip-count">{col.count}</span>
            </button>
          ))}
        </div>
      </div>

      {loading && items.length === 0 ? (
        <div className="admin-state" role="status">
          Loading pipeline…
        </div>
      ) : loadError ? (
        <div className="cl-empty is-error" role="alert">
          <p>Could not load the pipeline. Check your connection and try again.</p>
        </div>
      ) : (
        <div className={styles.board}>
          {columns.map((col) => (
            <section
              key={col.key}
              aria-labelledby={`stage-${col.key}`}
              className={`${styles.column} ${activeStage === col.key ? styles.columnOn : ''}`}
            >
              <div className={styles.columnHead}>
                <h2 id={`stage-${col.key}`} className={styles.columnTitle}>
                  {col.title}
                </h2>
                <span className={`badge ${col.tone}`}>{col.count}</span>
              </div>
              {col.items.length === 0 ? (
                <div className="cl-empty">
                  <p>No companies currently in this stage.</p>
                </div>
              ) : (
                <div className={styles.stack}>
                  {col.items.map((card) => (
                    <CaseCard
                      key={card.id}
                      card={card}
                      isUpdating={updatingId === card.id}
                      onUpdateStatus={handleUpdateStatus}
                    />
                  ))}
                </div>
              )}
            </section>
          ))}
        </div>
      )}

      {showNewModal && (
        <div className="admin-modal-overlay">
          <div className="admin-modal" role="dialog" aria-modal="true" aria-labelledby="new-order-title">
            <button
              type="button"
              className="admin-modal-close"
              onClick={() => setShowNewModal(false)}
              aria-label="Close"
            >
              <X size={18} />
            </button>
            <h2 id="new-order-title" className="admin-modal-title">
              Create Company Order
            </h2>

            <form onSubmit={handleCreateOrder} className="admin-form-stack">
              <div className="field">
                <label htmlFor="po-company">Company Name *</label>
                <input
                  id="po-company"
                  type="text"
                  required
                  placeholder="e.g. Apex Horizon FZE"
                  value={formCompanyName}
                  onChange={(e) => setFormCompanyName(e.target.value)}
                />
              </div>

              <div className="admin-form-grid-2">
                <div className="field">
                  <label htmlFor="po-jurisdiction">Jurisdiction</label>
                  <select
                    id="po-jurisdiction"
                    value={formJurisdiction}
                    onChange={(e) => setFormJurisdiction(e.target.value)}
                  >
                    <option value="uae">🇦🇪 United Arab Emirates</option>
                    <option value="hong-kong">🇭🇰 Hong Kong</option>
                    <option value="singapore">🇸🇬 Singapore</option>
                    <option value="bahrain">🇧🇭 Bahrain</option>
                    <option value="ireland">🇮🇪 Ireland</option>
                    <option value="bvi">🇻🇬 BVI / Cayman</option>
                  </select>
                </div>
                <div className="field">
                  <label htmlFor="po-tier">Tier</label>
                  <select id="po-tier" value={formTier} onChange={(e) => setFormTier(e.target.value)}>
                    <option value="tier_1_self">Tier 1: Self UBO</option>
                    <option value="tier_2_nominee">Tier 2: Nominee UBO</option>
                    <option value="tier_3_shelf">Tier 3: Shelf Entity</option>
                  </select>
                </div>
                <div className="field">
                  <label htmlFor="po-stage">Initial Stage</label>
                  <select id="po-stage" value={formStatus} onChange={(e) => setFormStatus(e.target.value)}>
                    <option value="lead">1. New Lead</option>
                    <option value="onboarding">2. Onboarding</option>
                    <option value="official_kyc_pending">3. KYC Review</option>
                    <option value="filing_in_progress">4. Govt Filing</option>
                    <option value="bank_opening">5. Bank Opening</option>
                    <option value="active">6. Active & Complete</option>
                  </select>
                </div>
                <div className="field">
                  <label htmlFor="po-client">Client Full Name</label>
                  <input
                    id="po-client"
                    type="text"
                    placeholder="e.g. Tariq Mansoor"
                    value={formClientName}
                    onChange={(e) => setFormClientName(e.target.value)}
                  />
                </div>
                <div className="field">
                  <label htmlFor="po-email">Client Email</label>
                  <input
                    id="po-email"
                    type="email"
                    placeholder="client@domain.com"
                    value={formClientEmail}
                    onChange={(e) => setFormClientEmail(e.target.value)}
                  />
                </div>
                <div className="field">
                  <label htmlFor="po-phone">Client WhatsApp</label>
                  <input
                    id="po-phone"
                    type="text"
                    placeholder="+971501234567"
                    value={formClientPhone}
                    onChange={(e) => setFormClientPhone(e.target.value)}
                  />
                </div>
              </div>

              <div className="admin-modal-actions">
                <button type="button" className="btn btn-outline" onClick={() => setShowNewModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submittingNew}>
                  {submittingNew ? 'Creating...' : 'Create Order Card'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function CaseCard({
  card,
  isUpdating,
  onUpdateStatus,
}: {
  card: CompanyPipelineItem;
  isUpdating: boolean;
  onUpdateStatus: (id: string, status: string) => void;
}) {
  const jInfo = jurisdictionInfo(card.jurisdiction);
  const next = nextStage(card.status);
  const sla = slaBadge(card.slaStatus, card.daysInStage);

  return (
    <article className={`card ${styles.case}${isUpdating ? ` ${styles.updating}` : ''}`}>
      <div className={styles.caseTop}>
        <h3 className={styles.caseName}>{card.company_name}</h3>
        <span className={`badge ${sla.tone}`}>{sla.label}</span>
      </div>

      <div className={styles.badges}>
        <span className="badge">
          {jInfo.flag} {jInfo.label}
        </span>
        <span className="badge badge-info">{tierLabel(card.tier)}</span>
        {card.official_kyc_completed && (
          <span className="badge badge-success">
            <ShieldCheck size={12} aria-hidden="true" />
            &nbsp;KYC Verified
          </span>
        )}
      </div>

      <div className={styles.meta}>
        <span>{card.client_name || 'No client name'}</span>
        {!isTempPhone(card.client_phone) && <span>{card.client_phone}</span>}
        {card.order && (
          <div className={styles.metaRow}>
            <span>Order value</span>
            <span>
              {formatAmount(card.order.amount_total)}{' '}
              <span className={`badge ${paymentTone(card.order.payment_status)}`}>
                {card.order.payment_status}
              </span>
            </span>
          </div>
        )}
      </div>

      <div className={styles.foot}>
        <span className={styles.meta}>{card.assigned_name || 'Unassigned'}</span>
        <div className={styles.actions}>
          {next && (
            <button
              type="button"
              className="btn btn-primary"
              title="Advance to next stage"
              onClick={() => onUpdateStatus(card.id, next)}
            >
              Advance <ChevronRight size={14} aria-hidden="true" />
            </button>
          )}
          <select
            className={`cl-select ${styles.jump}`}
            aria-label={`Move ${card.company_name} to stage`}
            value={card.status}
            onChange={(e) => {
              if (e.target.value !== card.status) onUpdateStatus(card.id, e.target.value);
            }}
          >
            {!STATUS_SELECT_OPTIONS.some((o) => o.value === card.status) && (
              <option value={card.status} disabled>
                {card.status}
              </option>
            )}
            {STATUS_SELECT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </article>
  );
}
