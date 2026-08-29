'use client';

import React, { useState } from 'react';
import { usePortalStore } from '@/lib/store';
import { useToast } from '@/components/ui/Toast';
import Modal from '@/components/ui/Modal';
import {
  Search,
  Download,
  Building,
  MapPin,
  User,
  Calendar,
  FileText,
  ExternalLink,
  X,
} from 'lucide-react';

export default function AdminClientsPage() {
  const { entities } = usePortalStore();
  const { showToast } = useToast();
  const [search, setSearch] = useState('');
  const [selectedEntity, setSelectedEntity] = useState<typeof entities[0] | null>(null);

  const filtered = entities.filter(
    (e) =>
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.jurisdiction.toLowerCase().includes(search.toLowerCase()) ||
      e.status.toLowerCase().includes(search.toLowerCase())
  );

  const statusBadge = (status: string) => {
    const map: Record<string, { bg: string; fg: string }> = {
      paid: { bg: 'var(--color-info-light)', fg: 'var(--color-info)' },
      official_kyc_pending: { bg: 'var(--color-warning-light)', fg: 'var(--color-warning)' },
      filing: { bg: 'var(--color-orange-light)', fg: 'var(--color-orange)' },
      license_issued: { bg: 'var(--color-success-light)', fg: 'var(--color-success)' },
      banking_setup: { bg: 'var(--color-info-light)', fg: 'var(--color-info)' },
      active: { bg: 'var(--color-success-light)', fg: 'var(--color-success)' },
    };
    return map[status] || { bg: 'var(--color-navy-subtle)', fg: 'var(--color-navy)' };
  };

  const statusLabel = (status: string) => {
    const map: Record<string, string> = {
      paid: 'Paid',
      official_kyc_pending: 'KYC Pending',
      filing: 'Filing',
      license_issued: 'License Issued',
      banking_setup: 'Bank Setup',
      active: 'Active',
    };
    return map[status] || status;
  };

  return (
    <div className="admin-clients">
      {/* Header */}
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Client Directory</h1>
          <p className="admin-page-subtitle">{entities.length} total entities registered</p>
        </div>
        <button
          className="btn btn-secondary btn-sm"
          onClick={() => showToast('success', 'Download initiated. The export will be emailed to you.')}
        >
          <Download size={15} />
          <span>Download All</span>
        </button>
      </div>

      {/* Search */}
      <div className="admin-search-bar">
        <Search size={16} className="admin-search-icon" />
        <input
          type="text"
          placeholder="Search clients by name, jurisdiction, or status..."
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

      {/* Client List */}
      <div className="admin-client-list">
        {filtered.length === 0 && (
          <div className="admin-empty">
            <div className="admin-empty-icon">
              <Search size={28} />
            </div>
            <h3 className="admin-empty-title">No clients found</h3>
            <p className="admin-empty-desc">Try a different search term.</p>
          </div>
        )}

        {filtered.map((ent) => {
          const badge = statusBadge(ent.status);
          return (
            <button
              key={ent.id}
              className="admin-client-card"
              onClick={() => setSelectedEntity(ent)}
            >
              <div className="admin-client-left">
                <span className="admin-client-flag">{ent.flag}</span>
                <div className="admin-client-info">
                  <div className="admin-client-name">{ent.name}</div>
                  <div className="admin-client-meta">
                    <span className="admin-client-jurisdiction">
                      <MapPin size={12} />
                      {ent.jurisdiction}
                    </span>
                    <span className="admin-client-date">
                      <Calendar size={12} />
                      {ent.incorporationDate}
                    </span>
                  </div>
                </div>
              </div>
              <div className="admin-client-right">
                <span
                  className="admin-status-badge"
                  style={{ background: badge.bg, color: badge.fg }}
                >
                  {statusLabel(ent.status)}
                </span>
                <span className="admin-client-specialist">
                  <User size={12} />
                  {ent.assignedSpecialist.split('(')[0].trim()}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Detail Modal */}
      <Modal
        isOpen={!!selectedEntity}
        onClose={() => setSelectedEntity(null)}
        title={selectedEntity?.name || ''}
      >
        {selectedEntity && (
          <div className="admin-modal-body">
            <div className="admin-modal-header-row">
              <span className="admin-modal-flag">{selectedEntity.flag}</span>
              <div>
                <span
                  className="admin-status-badge"
                  style={{
                    background: statusBadge(selectedEntity.status).bg,
                    color: statusBadge(selectedEntity.status).fg,
                  }}
                >
                  {statusLabel(selectedEntity.status)}
                </span>
              </div>
            </div>

            <div className="admin-modal-grid">
              <div className="admin-modal-field">
                <span className="admin-modal-label">Jurisdiction</span>
                <span className="admin-modal-value">{selectedEntity.jurisdiction}</span>
              </div>
              <div className="admin-modal-field">
                <span className="admin-modal-label">Tier</span>
                <span className="admin-modal-value">{selectedEntity.tierTitle}</span>
              </div>
              <div className="admin-modal-field">
                <span className="admin-modal-label">Trade License</span>
                <span className="admin-modal-value">{selectedEntity.tradeLicenseNo || 'Pending'}</span>
              </div>
              <div className="admin-modal-field">
                <span className="admin-modal-label">Incorporation Date</span>
                <span className="admin-modal-value">{selectedEntity.incorporationDate}</span>
              </div>
              <div className="admin-modal-field">
                <span className="admin-modal-label">License Expiry</span>
                <span className="admin-modal-value">{selectedEntity.licenseExpiryDate}</span>
              </div>
              <div className="admin-modal-field">
                <span className="admin-modal-label">Renewal In</span>
                <span className="admin-modal-value">{selectedEntity.renewalDaysLeft} days</span>
              </div>
              <div className="admin-modal-field">
                <span className="admin-modal-label">Assigned Specialist</span>
                <span className="admin-modal-value">{selectedEntity.assignedSpecialist}</span>
              </div>
              <div className="admin-modal-field">
                <span className="admin-modal-label">Current Stage</span>
                <span className="admin-modal-value">Stage {selectedEntity.currentStage}: {selectedEntity.stageName}</span>
              </div>
              {selectedEntity.kycReferenceNumber && (
                <div className="admin-modal-field">
                  <span className="admin-modal-label">KYC Reference</span>
                  <span className="admin-modal-value" style={{ fontFamily: 'monospace' }}>
                    {selectedEntity.kycReferenceNumber}
                  </span>
                </div>
              )}
            </div>

            <div className="admin-modal-section-title">Documents</div>
            <div className="admin-modal-docs">
              {selectedEntity.documents.map((doc) => (
                <div key={doc.id} className="admin-modal-doc">
                  <FileText size={14} style={{ color: doc.isReady ? 'var(--color-success)' : 'var(--color-text-muted)', flexShrink: 0 }} />
                  <div className="admin-modal-doc-info">
                    <span className="admin-modal-doc-title">{doc.title}</span>
                    <span className="admin-modal-doc-meta">{doc.type} &middot; {doc.size}</span>
                  </div>
                  <span
                    className="admin-doc-status"
                    style={{ color: doc.isReady ? 'var(--color-success)' : 'var(--color-warning)' }}
                  >
                    {doc.isReady ? 'Ready' : 'Pending'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>

      <style>{`
        .admin-clients {
          display: flex;
          flex-direction: column;
          gap: 20px;
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
          border: 1.5px solid var(--color-border);
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
          background: var(--color-border);
          border-radius: 50%;
          color: var(--color-text-secondary);
          cursor: pointer;
        }

        .admin-client-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .admin-client-card {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          padding: 14px 16px;
          background: var(--color-card);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          cursor: pointer;
          transition: all 0.15s ease;
          text-align: left;
          font-family: var(--font-sans);
          width: 100%;
        }

        .admin-client-card:hover {
          border-color: var(--color-border-hover);
          box-shadow: var(--shadow-sm);
        }

        .admin-client-left {
          display: flex;
          align-items: center;
          gap: 12px;
          min-width: 0;
          flex: 1;
        }

        .admin-client-flag {
          font-size: 24px;
          flex-shrink: 0;
        }

        .admin-client-info {
          min-width: 0;
        }

        .admin-client-name {
          font-family: var(--font-heading);
          font-size: 14px;
          font-weight: 700;
          color: var(--color-text);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .admin-client-meta {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-top: 2px;
        }

        .admin-client-jurisdiction,
        .admin-client-date {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 11px;
          color: var(--color-text-tertiary);
        }

        .admin-client-right {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 6px;
          flex-shrink: 0;
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
        }

        .admin-client-specialist {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 11px;
          color: var(--color-text-tertiary);
        }

        /* Empty state */
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

        /* Modal */
        .admin-modal-body {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .admin-modal-header-row {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .admin-modal-flag {
          font-size: 32px;
        }

        .admin-modal-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
        }

        @media (max-width: 480px) {
          .admin-modal-grid {
            grid-template-columns: 1fr;
          }
        }

        .admin-modal-field {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .admin-modal-label {
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: var(--color-text-tertiary);
        }

        .admin-modal-value {
          font-size: 13px;
          font-weight: 600;
          color: var(--color-text);
        }

        .admin-modal-section-title {
          font-family: var(--font-heading);
          font-size: 13px;
          font-weight: 700;
          color: var(--color-text);
          padding-bottom: 8px;
          border-bottom: 1px solid var(--color-border);
        }

        .admin-modal-docs {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .admin-modal-doc {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 12px;
          background: var(--color-surface-alt);
          border-radius: var(--radius-sm);
        }

        .admin-modal-doc-info {
          flex: 1;
          min-width: 0;
        }

        .admin-modal-doc-title {
          display: block;
          font-size: 12px;
          font-weight: 600;
          color: var(--color-text);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .admin-modal-doc-meta {
          font-size: 11px;
          color: var(--color-text-tertiary);
        }

        .admin-doc-status {
          font-size: 11px;
          font-weight: 700;
          flex-shrink: 0;
        }
      `}</style>
    </div>
  );
}
