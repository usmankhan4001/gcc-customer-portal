'use client';

import React, { useState } from 'react';
import { usePortalStore } from '@/lib/store';
import { useToast } from '@/components/ui/Toast';
import CountryFlag from '@/components/ui/CountryFlag';
import {
  Search,
  CheckCircle2,
  Bell,
  Clock,
  User,
  MapPin,
  X,
} from 'lucide-react';

type FilterType = 'all' | 'kyc_pending' | 'filing' | 'action_needed';

const filterChips: { key: FilterType; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'kyc_pending', label: 'KYC Pending' },
  { key: 'filing', label: 'Filing' },
  { key: 'action_needed', label: 'Action Needed' },
];

export default function FilingQueuePage() {
  const { entities, advanceEntityStage, sendWhatsAppAlert } = usePortalStore();
  const { showToast } = useToast();
  const [filter, setFilter] = useState<FilterType>('all');
  const [search, setSearch] = useState('');

  const filtered = entities.filter((e) => {
    const matchesSearch =
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.jurisdiction.toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;
    if (filter === 'all') return true;
    if (filter === 'kyc_pending') return e.status === 'official_kyc_pending';
    if (filter === 'filing') return e.status === 'filing';
    if (filter === 'action_needed') return e.renewalDaysLeft < 90 || e.status === 'banking_setup';
    return true;
  });

  const pendingCount = entities.filter(
    (e) => e.status === 'official_kyc_pending' || e.status === 'filing'
  ).length;

  const handleApprove = (entId: string, entName: string) => {
    advanceEntityStage(entId, 3);
    showToast('success', `Registry handshake verified for ${entName}. Filed for license issuance.`);
  };

  const handleNudge = (entName: string) => {
    sendWhatsAppAlert(
      '+31 6 12345678',
      'kyc_reminder_sms',
      `Reminder: Please complete your biometric identity verification for ${entName}.`
    );
    showToast('info', `WhatsApp nudge sent for ${entName}.`);
  };

  const actionLabel = (ent: typeof entities[0]) => {
    if (ent.status === 'official_kyc_pending' && ent.kycReferenceNumber) return 'Approve & Advance';
    if (ent.status === 'official_kyc_pending') return 'Nudge Client';
    if (ent.status === 'filing') return 'View Filing';
    if (ent.renewalDaysLeft < 90) return 'Send Renewal Reminder';
    return 'Review';
  };

  return (
    <div className="admin-filing">
      {/* Header */}
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Filing Queue</h1>
          <p className="admin-page-subtitle">{pendingCount} items pending action</p>
        </div>
      </div>

      {/* Filter Chips */}
      <div className="admin-chips">
        {filterChips.map((chip) => (
          <button
            key={chip.key}
            className={`admin-chip ${filter === chip.key ? 'admin-chip-active' : ''}`}
            onClick={() => setFilter(chip.key)}
          >
            {chip.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="admin-search-bar">
        <Search size={16} className="admin-search-icon" />
        <input
          type="text"
          placeholder="Search by company name or jurisdiction..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="admin-search-input"
        />
        {search && (
          <button className="admin-search-clear" onClick={() => setSearch('')}>
            <X size={14} />
          </button>
        )}
      </div>

      {/* Queue List */}
      <div className="admin-queue-list">
        {filtered.length === 0 && (
          <div className="admin-empty">
            <div className="admin-empty-icon">
              <CheckCircle2 size={28} />
            </div>
            <h3 className="admin-empty-title">Queue is clear</h3>
            <p className="admin-empty-desc">No items match the current filter.</p>
          </div>
        )}

        {filtered.map((ent) => {
          const isKycPending = ent.status === 'official_kyc_pending';
          const hasRef = !!ent.kycReferenceNumber;
          const isRenewal = ent.renewalDaysLeft < 90;

          return (
            <div key={ent.id} className="admin-queue-card">
              <div className="admin-queue-card-top">
                <div className="admin-queue-left">
                  <CountryFlag country={ent.countryCode || ent.flag} size="md" />
                  <div>
                    <div className="admin-queue-name">{ent.name}</div>
                    <div className="admin-queue-meta">
                      <MapPin size={12} />
                      {ent.jurisdiction}
                    </div>
                  </div>
                </div>
                <span
                  className="admin-status-badge"
                  style={{
                    background: isKycPending
                      ? 'var(--color-warning-light)'
                      : isRenewal
                      ? 'var(--color-error-light)'
                      : 'var(--color-info-light)',
                    color: isKycPending
                      ? 'var(--color-warning)'
                      : isRenewal
                      ? 'var(--color-error)'
                      : 'var(--color-info)',
                  }}
                >
                  {isKycPending ? 'KYC Pending' : isRenewal ? 'Renewal Due' : 'Filing'}
                </span>
              </div>

              <div className="admin-queue-details">
                <div className="admin-queue-detail">
                  <span className="admin-queue-detail-label">Stage</span>
                  <span className="admin-queue-detail-value">
                    Stage {ent.currentStage}: {ent.stageName}
                  </span>
                </div>
                <div className="admin-queue-detail">
                  <span className="admin-queue-detail-label">Assigned</span>
                  <span className="admin-queue-detail-value">
                    {ent.assignedSpecialist.split('(')[0].trim()}
                  </span>
                </div>
                <div className="admin-queue-detail">
                  <span className="admin-queue-detail-label">Action Needed</span>
                  <span className="admin-queue-detail-value">
                    {isKycPending && !hasRef && 'Client biometric verification pending'}
                    {isKycPending && hasRef && 'Verify reference & advance to filing'}
                    {isRenewal && 'Send renewal reminder'}
                    {!isKycPending && !isRenewal && 'Review filing progress'}
                  </span>
                </div>
              </div>

              <div className="admin-queue-card-footer">
                <span className="admin-queue-date">
                  <Clock size={12} />
                  Registered: {ent.incorporationDate}
                </span>
                <div className="admin-queue-actions">
                  {isKycPending && !hasRef ? (
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleNudge(ent.name)}
                    >
                      <Bell size={14} />
                      <span>Nudge</span>
                    </button>
                  ) : (
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => {
                        if (isKycPending && hasRef) {
                          handleApprove(ent.id, ent.name);
                        } else {
                          showToast('success', `Action completed for ${ent.name}.`);
                        }
                      }}
                    >
                      <CheckCircle2 size={14} />
                      <span>{actionLabel(ent)}</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <style>{`
        .admin-filing {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .admin-page-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
          flex-wrap: wrap;
        }

        .admin-page-title {
          font-family: var(--font-heading);
          font-size: 1.6rem;
          font-weight: 700;
          color: var(--color-text);
          margin: 0;
        }

        .admin-page-subtitle {
          font-size: 13px;
          color: var(--color-text-tertiary);
          margin: 4px 0 0;
        }

        .admin-chips {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .admin-chip {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 7px 14px;
          border-radius: var(--radius-pill);
          font-size: 13px;
          font-weight: 600;
          background: var(--color-surface);
          color: var(--color-text-secondary);
          border: 1.5px solid var(--border);
          cursor: pointer;
          transition: all 0.15s ease;
          font-family: var(--font-sans);
        }

        .admin-chip:hover {
          border-color: var(--color-line-hover);
          background: var(--color-surface-alt);
        }

        .admin-chip-active {
          background: var(--color-navy);
          color: #fff;
          border-color: var(--color-navy);
        }

        .admin-chip-active:hover {
          background: var(--color-navy-light);
          border-color: var(--color-navy-light);
        }

        .admin-search-bar {
          position: relative;
        }

        .admin-search-icon {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--color-text-muted);
          pointer-events: none;
        }

        .admin-search-input {
          width: 100%;
          height: 44px;
          padding: 0 40px 0 40px;
          background: var(--color-surface-alt);
          border: 1.5px solid var(--border);
          border-radius: var(--radius-md);
          font-size: 13px;
          font-family: var(--font-sans);
          color: var(--color-text);
          outline: none;
          transition: border-color 0.15s ease, box-shadow 0.15s ease;
        }

        .admin-search-input:focus {
          border-color: var(--color-orange);
          box-shadow: 0 0 0 3px rgba(242,101,34,0.1);
        }

        .admin-search-input::placeholder {
          color: var(--color-text-muted);
        }

        .admin-search-clear {
          position: absolute;
          right: 10px;
          top: 50%;
          transform: translateY(-50%);
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: none;
          background: var(--border);
          border-radius: 50%;
          color: var(--color-text-secondary);
          cursor: pointer;
        }

        .admin-queue-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .admin-queue-card {
          background: var(--card);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .admin-queue-card-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }

        .admin-queue-left {
          display: flex;
          align-items: center;
          gap: 10px;
          min-width: 0;
        }

        .admin-queue-flag {
          font-size: 22px;
          flex-shrink: 0;
        }

        .admin-queue-name {
          font-family: var(--font-heading);
          font-size: 14px;
          font-weight: 700;
          color: var(--color-text);
        }

        .admin-queue-meta {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 11px;
          color: var(--color-text-tertiary);
          margin-top: 1px;
        }

        .admin-status-badge {
          display: inline-flex;
          align-items: center;
          padding: 3px 10px;
          border-radius: var(--radius-pill);
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.01em;
          white-space: nowrap;
          flex-shrink: 0;
        }

        .admin-queue-details {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 10px;
          padding: 12px;
          background: var(--color-surface-alt);
          border-radius: var(--radius-sm);
        }

        .admin-queue-detail {
          display: flex;
          flex-direction: column;
          gap: 1px;
        }

        .admin-queue-detail-label {
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: var(--color-text-tertiary);
        }

        .admin-queue-detail-value {
          font-size: 12px;
          font-weight: 600;
          color: var(--color-text);
        }

        .admin-queue-card-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding-top: 10px;
          border-top: 1px solid var(--border);
          flex-wrap: wrap;
        }

        .admin-queue-date {
          display: flex;
          align-items: center;
          gap: 5px;
          font-size: 11px;
          color: var(--color-text-tertiary);
        }

        .admin-queue-actions {
          display: flex;
          gap: 8px;
        }

        .admin-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 48px 24px;
          text-align: center;
        }

        .admin-empty-icon {
          width: 64px;
          height: 64px;
          border-radius: 50%;
          background: var(--color-surface-alt);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 16px;
          color: var(--color-text-muted);
        }

        .admin-empty-title {
          font-family: var(--font-heading);
          font-size: 1.05rem;
          font-weight: 700;
          color: var(--color-text);
          margin: 0 0 4px;
        }

        .admin-empty-desc {
          font-size: 13px;
          color: var(--color-text-tertiary);
          margin: 0;
        }
      `}</style>
    </div>
  );
}
