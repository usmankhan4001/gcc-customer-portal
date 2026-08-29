'use client';

import React, { useState } from 'react';
import { usePortalStore } from '@/lib/store';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Search,
  ArrowRight,
  Clock,
} from 'lucide-react';

export default function FilingQueuePage() {
  const { entities, advanceEntityStage, sendWhatsAppAlert } = usePortalStore();

  const [filterQuery, setFilterQuery] = useState('');

  const pendingKycEntities = entities.filter(
    (e) =>
      e.name.toLowerCase().includes(filterQuery.toLowerCase()) ||
      (e.kycReferenceNumber && e.kycReferenceNumber.toLowerCase().includes(filterQuery.toLowerCase()))
  );

  const handleApproveHandshake = (entId: string, entName: string) => {
    advanceEntityStage(entId, 3);
    sendWhatsAppAlert(
      '+31 6 12345678',
      'kyc_approved_registry',
      `🏛️ Registry Handshake Verified for ${entName}. Electronic filing documents have been queued for Trade License issuance.`
    );
  };

  return (
    <div className="filing-queue-container">
      {/* Header */}
      <Card variant="navy" padding="md" className="queue-header">
        <div className="header-badge-row">
          <Badge variant="orange" icon={<ShieldCheck className="w-3.5 h-3.5" />}>
            OFFICIAL REGISTRY KYC REVIEWER
          </Badge>
          <span className="text-xs text-white-muted">Authority Reference Matching Queue</span>
        </div>
        <h1 className="header-title display-font text-white">
          Official Portal <span className="text-orange">KYC Intake & Matching</span>
        </h1>
        <p className="header-desc text-white-muted">
          Review confirmation reference numbers submitted by clients after completing biometric passport verification on official authority portals.
        </p>
      </Card>

      {/* Search Filter Box */}
      <Card variant="surface" padding="sm" className="filter-card">
        <div className="search-input-box">
          <Search className="w-4 h-4 text-tertiary" />
          <input
            type="text"
            placeholder="Search by company name or official reference number (e.g. IFZA-KYC)..."
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            className="input-field"
          />
        </div>
      </Card>

      {/* Queue List */}
      <div className="queue-list">
        {pendingKycEntities.map((ent) => (
          <Card key={ent.id} variant="surface" padding="md" className="queue-item-card">
            <div className="queue-item-top">
              <div className="queue-item-left">
                <span className="text-2xl">{ent.flag}</span>
                <div>
                  <h3 className="queue-entity-name display-font">{ent.name}</h3>
                  <span className="text-xs text-secondary">{ent.jurisdiction} • {ent.tierTitle}</span>
                </div>
              </div>

              <Badge variant={ent.kycReferenceNumber ? 'success' : 'warning'}>
                {ent.kycReferenceNumber ? 'Handshake Reference Submitted' : 'Awaiting Client Biometric'}
              </Badge>
            </div>

            <div className="queue-meta-grid card-sand">
              <div className="meta-col">
                <span className="text-xs text-tertiary">OFFICIAL REFERENCE NUMBER:</span>
                <strong className="text-navy font-mono text-sm">
                  {ent.kycReferenceNumber || 'None (Client has not marked completed)'}
                </strong>
              </div>
              <div className="meta-col">
                <span className="text-xs text-tertiary">CURRENT STAGE:</span>
                <strong className="text-navy text-sm">
                  Stage {ent.currentStage}: {ent.stageName}
                </strong>
              </div>
              <div className="meta-col">
                <span className="text-xs text-tertiary">ASSIGNED LEAD:</span>
                <strong className="text-navy text-sm">{ent.assignedSpecialist}</strong>
              </div>
            </div>

            <div className="queue-item-footer">
              <span className="text-xs text-secondary">
                Registered: {ent.incorporationDate}
              </span>

              <div className="footer-btns">
                {ent.kycReferenceNumber ? (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleApproveHandshake(ent.id, ent.name)}
                    leftIcon={<CheckCircle2 className="w-4 h-4" />}
                  >
                    <span>Verify & Advance to Stage 3 (Filing)</span>
                  </Button>
                ) : (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      sendWhatsAppAlert(
                        '+31 6 12345678',
                        'kyc_reminder_sms',
                        `📋 Reminder: Please finish your biometric identity verification on the government portal for ${ent.name}.`
                      );
                    }}
                  >
                    <span>Send WhatsApp KYC Nudge</span>
                  </Button>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      <style jsx>{`
        .filing-queue-container {
          display: flex;
          flex-direction: column;
          gap: 24px;
          width: 100%;
        }

        .queue-header {
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

        .filter-card {
          padding: 12px 18px;
        }

        .search-input-box {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .queue-list {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .queue-item-card {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .queue-item-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .queue-item-left {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .queue-entity-name {
          font-size: 1.25rem;
          color: var(--navy);
        }

        .queue-meta-grid {
          padding: 14px 18px;
          border-radius: var(--radius);
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 14px;
        }

        .meta-col {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .queue-item-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: 10px;
          border-top: 1px solid var(--border);
        }

        @media (max-width: 640px) {
          .queue-item-footer {
            flex-direction: column;
            align-items: flex-start;
            gap: 10px;
          }
        }

        .footer-btns {
          display: flex;
          gap: 8px;
        }
      `}</style>
    </div>
  );
}
