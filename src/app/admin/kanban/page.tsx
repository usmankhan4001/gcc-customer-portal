'use client';

import React from 'react';
import { usePortalStore } from '@/lib/store';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import {
  Kanban,
  Building,
  ArrowRight,
  ShieldCheck,
  Clock,
  Phone,
} from 'lucide-react';

export default function AdminKanbanPage() {
  const { entities, advanceEntityStage } = usePortalStore();

  const stages = [
    { num: 1, name: '1. Order Paid', badge: 'paid' },
    { num: 2, name: '2. Official KYC', badge: 'official_kyc_pending' },
    { num: 3, name: '3. Registry Filing', badge: 'filing' },
    { num: 4, name: '4. License Issued', badge: 'license_issued' },
    { num: 5, name: '5. Bank Setup', badge: 'banking_setup' },
    { num: 6, name: '6. Active & Operational', badge: 'active' },
  ];

  return (
    <div className="kanban-page-container">
      {/* Header */}
      <Card variant="navy" padding="md" className="kanban-header">
        <div className="header-badge-row">
          <Badge variant="orange" icon={<Kanban className="w-3.5 h-3.5" />}>
            OPERATIONS COMMAND CENTER
          </Badge>
          <span className="text-xs text-white-muted">Internal Operations & Filing Orchestrator</span>
        </div>
        <h1 className="header-title display-font text-white">
          Company Formation <span className="text-orange">Filing Kanban</span>
        </h1>
        <p className="header-desc text-white-muted">
          Manage entity lifecycles, review government filing queues, and trigger automatic client milestones across all 6 stages.
        </p>
      </Card>

      {/* 6-Column Kanban Board */}
      <div className="kanban-board-container">
        {stages.map((stage) => {
          const stageEntities = entities.filter((e) => e.currentStage === stage.num);

          return (
            <div key={stage.num} className="kanban-column card-sand">
              <div className="column-header">
                <strong className="column-title display-font text-navy">{stage.name}</strong>
                <span className="count-pill">{stageEntities.length}</span>
              </div>

              <div className="column-cards-list">
                {stageEntities.map((ent) => (
                  <Card key={ent.id} variant="surface" padding="sm" className="entity-kanban-card card-hover">
                    <div className="card-top">
                      <span className="text-lg">{ent.flag}</span>
                      <Badge variant={stage.num === 6 ? 'success' : 'orange'}>
                        Stage {stage.num}
                      </Badge>
                    </div>

                    <h3 className="card-entity-name display-font">{ent.name}</h3>
                    <span className="text-xs text-tertiary">{ent.jurisdiction}</span>

                    <div className="card-meta card-sand">
                      <span className="text-xs"><strong>Tier:</strong> {ent.tier.toUpperCase()}</span>
                      {ent.kycReferenceNumber && (
                        <span className="text-xs text-navy font-mono">
                          KYC Ref: {ent.kycReferenceNumber}
                        </span>
                      )}
                    </div>

                    {/* Progression Actions */}
                    <div className="card-actions">
                      {stage.num < 6 ? (
                        <Button
                          variant="primary"
                          size="sm"
                          className="w-full"
                          onClick={() => advanceEntityStage(ent.id, stage.num + 1)}
                        >
                          <span>Advance to Stage {stage.num + 1}</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Button>
                      ) : (
                        <div className="text-center text-xs text-success font-bold py-1">
                          ✅ Complete & Handed Over
                        </div>
                      )}
                    </div>
                  </Card>
                ))}

                {stageEntities.length === 0 && (
                  <div className="empty-column-box">
                    <span className="text-xs text-tertiary">No active files in this stage</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <style jsx>{`
        .kanban-page-container {
          display: flex;
          flex-direction: column;
          gap: 24px;
          width: 100%;
        }

        .kanban-header {
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

        .kanban-board-container {
          display: grid;
          grid-template-columns: repeat(6, minmax(240px, 1fr));
          gap: 14px;
          overflow-x: auto;
          padding-bottom: 16px;
        }

        .kanban-column {
          padding: 16px;
          border-radius: var(--radius);
          display: flex;
          flex-direction: column;
          gap: 12px;
          min-height: 520px;
        }

        .column-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-bottom: 8px;
          border-bottom: 1px solid var(--border);
        }

        .column-title {
          font-size: 13px;
        }

        .count-pill {
          font-size: 11px;
          font-weight: 700;
          padding: 2px 6px;
          border-radius: var(--radius-pill);
          background: var(--surface);
          color: var(--navy);
        }

        .column-cards-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .entity-kanban-card {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .card-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .card-entity-name {
          font-size: 14px;
          color: var(--navy);
        }

        .card-meta {
          padding: 8px 10px;
          border-radius: var(--radius-sm);
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .card-actions {
          margin-top: 4px;
        }

        .empty-column-box {
          padding: 32px 12px;
          text-align: center;
          border: 1px dashed var(--border);
          border-radius: var(--radius-sm);
        }
      `}</style>
    </div>
  );
}
