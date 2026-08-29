'use client';

import React, { useState } from 'react';
import { usePortalStore } from '@/lib/store';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import {
  Users,
  Search,
  Building,
  ShieldCheck,
  Calendar,
  ExternalLink,
  Download,
  CreditCard,
} from 'lucide-react';

export default function AdminClientsPage() {
  const { entities, orders } = usePortalStore();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredEntities = entities.filter(
    (e) =>
      e.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.jurisdiction.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="clients-page-container">
      {/* Header */}
      <Card variant="navy" padding="md" className="clients-header">
        <div className="header-badge-row">
          <Badge variant="orange" icon={<Users className="w-3.5 h-3.5" />}>
            CLIENTS & ENTITIES DIRECTORY
          </Badge>
          <span className="text-xs text-white-muted">Master Client Records & Corporate File Vault</span>
        </div>
        <h1 className="header-title display-font text-white">
          Client Corporate <span className="text-orange">Registry & Files</span>
        </h1>
        <p className="header-desc text-white-muted">
          Access complete incorporation history, active license validity, nominee agreements, and Cloudflare R2 file downloads for every client.
        </p>
      </Card>

      {/* Search Bar */}
      <Card variant="surface" padding="sm">
        <div className="search-bar-wrap">
          <Search className="w-4 h-4 text-tertiary" />
          <input
            type="text"
            placeholder="Search by company name, jurisdiction, or status..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field"
          />
        </div>
      </Card>

      {/* Clients & Entities Table */}
      <div className="entities-table-list">
        {filteredEntities.map((ent) => (
          <Card key={ent.id} variant="surface" padding="md" className="client-entity-row">
            <div className="row-top">
              <div className="row-left">
                <span className="text-3xl">{ent.flag}</span>
                <div>
                  <h3 className="client-entity-title display-font">{ent.name}</h3>
                  <span className="text-xs text-secondary">{ent.jurisdiction} • {ent.tierTitle}</span>
                </div>
              </div>

              <div className="row-status-badges">
                <Badge variant={ent.currentStage === 6 ? 'success' : 'orange'}>
                  Stage {ent.currentStage}: {ent.stageName}
                </Badge>
                <Badge variant="sand">Renewal: {ent.renewalDaysLeft}d</Badge>
              </div>
            </div>

            <div className="row-details-grid card-sand">
              <div className="detail-item">
                <span className="text-xs text-tertiary">TRADE LICENSE NO:</span>
                <strong className="text-navy font-mono text-xs">{ent.tradeLicenseNo || 'Pending'}</strong>
              </div>
              <div className="detail-item">
                <span className="text-xs text-tertiary">INCORPORATION DATE:</span>
                <strong className="text-navy text-xs">{ent.incorporationDate}</strong>
              </div>
              <div className="detail-item">
                <span className="text-xs text-tertiary">ASSIGNED LEAD:</span>
                <strong className="text-navy text-xs">{ent.assignedSpecialist}</strong>
              </div>
              <div className="detail-item">
                <span className="text-xs text-tertiary">VAULT FILES:</span>
                <strong className="text-navy text-xs">{ent.documents.filter((d) => d.isReady).length} / {ent.documents.length} Ready</strong>
              </div>
            </div>

            <div className="row-footer">
              <div className="docs-chips-list">
                {ent.documents.map((doc) => (
                  <span key={doc.id} className={`doc-chip ${doc.isReady ? 'ready' : 'pending'}`}>
                    {doc.isReady ? '📄' : '⏳'} {doc.title.slice(0, 24)}...
                  </span>
                ))}
              </div>

              <Button
                variant="secondary"
                size="sm"
                leftIcon={<Download className="w-3.5 h-3.5" />}
              >
                <span>Download All Zip</span>
              </Button>
            </div>
          </Card>
        ))}
      </div>

      <style jsx>{`
        .clients-page-container {
          display: flex;
          flex-direction: column;
          gap: 24px;
          width: 100%;
        }

        .clients-header {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .header-badge-row {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .header-title {
          font-size: 2.2rem;
          font-weight: 700;
        }

        .text-white-muted {
          color: rgba(255, 255, 255, 0.8);
        }

        .search-bar-wrap {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .entities-table-list {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .client-entity-row {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .row-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .row-left {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .client-entity-title {
          font-size: 1.3rem;
          color: var(--navy);
        }

        .row-status-badges {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .row-details-grid {
          padding: 14px 18px;
          border-radius: var(--radius);
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 12px;
        }

        .detail-item {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .row-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: 10px;
          border-top: 1px solid var(--border);
        }

        @media (max-width: 768px) {
          .row-footer {
            flex-direction: column;
            align-items: flex-start;
            gap: 10px;
          }
        }

        .docs-chips-list {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }

        .doc-chip {
          font-size: 11px;
          padding: 3px 8px;
          border-radius: var(--radius-pill);
          background: var(--sand);
          color: var(--navy);
          font-weight: 600;
        }

        .doc-chip.ready {
          background: var(--blue-lt);
          color: var(--blue);
        }
      `}</style>
    </div>
  );
}
