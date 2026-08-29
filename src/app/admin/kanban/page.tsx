'use client';

import React from 'react';
import { usePortalStore } from '@/lib/store';
import { useToast } from '@/components/ui/Toast';
import {
  ArrowRight,
  Clock,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

const KANBAN_STAGES = [
  { num: 1, name: 'New Lead', color: '#2563EB', bg: '#DBEAFE' },
  { num: 2, name: 'Onboarding', color: '#2563EB', bg: '#DBEAFE' },
  { num: 3, name: 'KYC Pending', color: '#D97706', bg: '#FEF3C7' },
  { num: 4, name: 'Filing', color: '#D97706', bg: '#FEF3C7' },
  { num: 5, name: 'License Issued', color: '#D97706', bg: '#FEF3C7' },
  { num: 6, name: 'Bank Opening', color: '#16A34A', bg: '#DCFCE7' },
  { num: 7, name: 'Active', color: '#16A34A', bg: '#DCFCE7' },
  { num: 8, name: 'Renewal Due', color: '#DC2626', bg: '#FEE2E2' },
  { num: 9, name: 'Action Needed', color: '#DC2626', bg: '#FEE2E2' },
  { num: 10, name: 'Archived', color: '#8C93A7', bg: '#F1F3F7' },
];

export default function AdminKanbanPage() {
  const { entities, advanceEntityStage } = usePortalStore();
  const { showToast } = useToast();

  const getEntitiesForStage = (stageNum: number) => {
    if (stageNum <= 6) {
      return entities.filter((e) => e.currentStage === stageNum);
    }
    if (stageNum === 7) return [];
    if (stageNum === 8) return entities.filter((e) => e.renewalDaysLeft < 90 && e.currentStage === 6);
    if (stageNum === 9) return entities.filter((e) => e.status === 'banking_setup');
    if (stageNum === 10) return [];
    return [];
  };

  const handleAdvance = (entId: string, currentStage: number) => {
    const next = Math.min(currentStage + 1, 6);
    advanceEntityStage(entId, next);
    showToast('success', `Entity advanced to Stage ${next}.`);
  };

  return (
    <div className="admin-kanban">
      {/* Header */}
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Pipeline Board</h1>
          <p className="admin-page-subtitle">{entities.length} entities across all stages</p>
        </div>
      </div>

      {/* Board */}
      <div className="admin-kanban-board">
        {KANBAN_STAGES.map((stage) => {
          const stageEntities = getEntitiesForStage(stage.num);
          return (
            <div key={stage.num} className="admin-kanban-col">
              <div
                className="admin-kanban-col-header"
                style={{ borderBottomColor: stage.color }}
              >
                <span className="admin-kanban-col-name">{stage.name}</span>
                <span
                  className="admin-kanban-col-count"
                  style={{ background: stage.bg, color: stage.color }}
                >
                  {stageEntities.length}
                </span>
              </div>

              <div className="admin-kanban-col-body">
                {stageEntities.map((ent) => {
                  const daysInStage = Math.floor(
                    (Date.now() - new Date(ent.incorporationDate).getTime()) / (1000 * 60 * 60 * 24)
                  );

                  return (
                    <div key={ent.id} className="admin-kanban-card">
                      <div className="admin-kanban-card-top">
                        <span className="admin-kanban-card-flag">{ent.flag}</span>
                        <span className="admin-kanban-card-days">
                          <Clock size={11} />
                          {daysInStage}d
                        </span>
                      </div>
                      <div className="admin-kanban-card-name">{ent.name}</div>
                      <div className="admin-kanban-card-jurisdiction">{ent.jurisdiction}</div>
                      {stage.num < 6 && (
                        <button
                          className="admin-kanban-advance"
                          onClick={() => handleAdvance(ent.id, ent.currentStage)}
                        >
                          Advance
                          <ArrowRight size={12} />
                        </button>
                      )}
                      {stage.num === 6 && (
                        <div className="admin-kanban-complete">Complete</div>
                      )}
                    </div>
                  );
                })}

                {stageEntities.length === 0 && (
                  <div className="admin-kanban-empty">No items</div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <style>{`
        .admin-kanban {
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

        .admin-kanban-board {
          display: flex;
          gap: 12px;
          overflow-x: auto;
          padding-bottom: 16px;
          scrollbar-width: thin;
          scrollbar-color: var(--color-border-hover) transparent;
        }

        .admin-kanban-board::-webkit-scrollbar {
          height: 6px;
        }

        .admin-kanban-board::-webkit-scrollbar-thumb {
          background: var(--color-border-hover);
          border-radius: 3px;
        }

        .admin-kanban-col {
          min-width: 220px;
          max-width: 260px;
          flex-shrink: 0;
          display: flex;
          flex-direction: column;
          background: var(--color-surface-alt);
          border-radius: var(--radius-md);
          border: 1px solid var(--color-border);
          overflow: hidden;
        }

        .admin-kanban-col-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 14px;
          border-bottom: 2px solid var(--color-border);
          background: var(--color-card);
        }

        .admin-kanban-col-name {
          font-family: var(--font-heading);
          font-size: 12px;
          font-weight: 700;
          color: var(--color-text);
        }

        .admin-kanban-col-count {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 22px;
          height: 22px;
          padding: 0 6px;
          border-radius: var(--radius-pill);
          font-size: 11px;
          font-weight: 700;
        }

        .admin-kanban-col-body {
          display: flex;
          flex-direction: column;
          gap: 8px;
          padding: 10px;
          min-height: 200px;
          flex: 1;
        }

        .admin-kanban-card {
          background: var(--color-card);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-sm);
          padding: 12px;
          display: flex;
          flex-direction: column;
          gap: 6px;
          transition: box-shadow 0.15s ease;
        }

        .admin-kanban-card:hover {
          box-shadow: var(--shadow-sm);
        }

        .admin-kanban-card-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .admin-kanban-card-flag {
          font-size: 18px;
        }

        .admin-kanban-card-days {
          display: flex;
          align-items: center;
          gap: 3px;
          font-size: 10px;
          font-weight: 600;
          color: var(--color-text-tertiary);
        }

        .admin-kanban-card-name {
          font-family: var(--font-heading);
          font-size: 13px;
          font-weight: 700;
          color: var(--color-text);
        }

        .admin-kanban-card-jurisdiction {
          font-size: 11px;
          color: var(--color-text-tertiary);
        }

        .admin-kanban-advance {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 4px;
          margin-top: 4px;
          padding: 5px 10px;
          border-radius: var(--radius-pill);
          font-size: 11px;
          font-weight: 600;
          font-family: var(--font-sans);
          background: var(--color-orange);
          color: #fff;
          border: none;
          cursor: pointer;
          transition: background 0.15s ease;
          width: 100%;
        }

        .admin-kanban-advance:hover {
          background: var(--color-orange-hover);
        }

        .admin-kanban-complete {
          margin-top: 4px;
          padding: 5px 10px;
          text-align: center;
          font-size: 11px;
          font-weight: 700;
          color: var(--color-success);
          background: var(--color-success-light);
          border-radius: var(--radius-pill);
        }

        .admin-kanban-empty {
          padding: 24px 12px;
          text-align: center;
          font-size: 11px;
          color: var(--color-text-muted);
          border: 1px dashed var(--color-border);
          border-radius: var(--radius-sm);
        }
      `}</style>
    </div>
  );
}
