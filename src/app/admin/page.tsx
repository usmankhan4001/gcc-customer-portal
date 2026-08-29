'use client';

import React from 'react';
import { usePortalStore } from '@/lib/store';
import Link from 'next/link';
import {
  Users,
  Clock,
  Kanban,
  MessageSquare,
  ArrowRight,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';

export default function AdminDashboardPage() {
  const { entities, whatsappLogs } = usePortalStore();

  const activeCount = entities.filter((e) => e.status === 'active').length;
  const pendingKyc = entities.filter((e) => e.status === 'official_kyc_pending').length;
  const filingCount = entities.filter((e) => e.status === 'filing').length;
  const renewalDue = entities.filter((e) => e.renewalDaysLeft < 90).length;

  const stats = [
    { label: 'Total Entities', value: entities.length, icon: Users, color: 'var(--color-navy)' },
    { label: 'Active', value: activeCount, icon: CheckCircle, color: 'var(--color-success)' },
    { label: 'KYC Pending', value: pendingKyc, icon: Clock, color: 'var(--color-warning)' },
    { label: 'Filing', value: filingCount, icon: Kanban, color: 'var(--color-orange)' },
    { label: 'Renewal Due', value: renewalDue, icon: AlertTriangle, color: 'var(--color-error)' },
    { label: 'Messages Sent', value: whatsappLogs.length, icon: MessageSquare, color: 'var(--color-info)' },
  ];

  const quickLinks = [
    { href: '/admin/clients', label: 'Client Directory', icon: Users, desc: 'View all entities' },
    { href: '/admin/filing-queue', label: 'Filing Queue', icon: Clock, desc: 'Pending actions' },
    { href: '/admin/kanban', label: 'Pipeline Board', icon: Kanban, desc: 'Stage management' },
    { href: '/admin/whatsapp', label: 'WhatsApp Engine', icon: MessageSquare, desc: 'Send notifications' },
  ];

  return (
    <div className="admin-dashboard">
      <div>
        <h1 className="admin-page-title">Dashboard</h1>
        <p className="admin-page-subtitle">Overview of all operations</p>
      </div>

      <div className="admin-stats-grid">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="admin-stat-card">
              <div className="admin-stat-icon" style={{ background: stat.color + '15', color: stat.color }}>
                <Icon size={18} />
              </div>
              <div className="admin-stat-value">{stat.value}</div>
              <div className="admin-stat-label">{stat.label}</div>
            </div>
          );
        })}
      </div>

      <div>
        <h2 className="admin-section-title">Quick Access</h2>
        <div className="admin-quick-grid">
          {quickLinks.map((link) => {
            const Icon = link.icon;
            return (
              <Link key={link.href} href={link.href} className="admin-quick-card">
                <div className="admin-quick-icon">
                  <Icon size={20} />
                </div>
                <div className="admin-quick-info">
                  <div className="admin-quick-label">{link.label}</div>
                  <div className="admin-quick-desc">{link.desc}</div>
                </div>
                <ArrowRight size={16} className="admin-quick-arrow" />
              </Link>
            );
          })}
        </div>
      </div>

      <div>
        <h2 className="admin-section-title">Recent Entities</h2>
        <div className="admin-recent-list">
          {entities.slice(0, 5).map((ent) => (
            <Link key={ent.id} href="/admin/clients" className="admin-recent-item">
              <span className="admin-recent-flag">{ent.flag}</span>
              <div className="admin-recent-info">
                <div className="admin-recent-name">{ent.name}</div>
                <div className="admin-recent-meta">{ent.jurisdiction} &middot; Stage {ent.currentStage}</div>
              </div>
              <ArrowRight size={14} className="admin-quick-arrow" />
            </Link>
          ))}
        </div>
      </div>

      <style>{`
        .admin-dashboard {
          display: flex;
          flex-direction: column;
          gap: 28px;
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

        .admin-stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
          gap: 12px;
        }

        .admin-stat-card {
          background: var(--color-card);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .admin-stat-icon {
          width: 36px;
          height: 36px;
          border-radius: var(--radius-sm);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .admin-stat-value {
          font-family: var(--font-heading);
          font-size: 1.6rem;
          font-weight: 800;
          color: var(--color-text);
          line-height: 1;
        }

        .admin-stat-label {
          font-size: 12px;
          font-weight: 600;
          color: var(--color-text-tertiary);
        }

        .admin-section-title {
          font-family: var(--font-heading);
          font-size: 14px;
          font-weight: 700;
          color: var(--color-text);
          margin: 0 0 12px;
        }

        .admin-quick-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
          gap: 10px;
        }

        .admin-quick-card {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px 16px;
          background: var(--color-card);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          text-decoration: none;
          transition: all 0.15s ease;
        }

        .admin-quick-card:hover {
          border-color: var(--color-orange);
          box-shadow: var(--shadow-sm);
        }

        .admin-quick-icon {
          width: 40px;
          height: 40px;
          border-radius: var(--radius-sm);
          background: var(--color-orange-light);
          color: var(--color-orange);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .admin-quick-info {
          flex: 1;
          min-width: 0;
        }

        .admin-quick-label {
          font-size: 13px;
          font-weight: 700;
          color: var(--color-text);
        }

        .admin-quick-desc {
          font-size: 11px;
          color: var(--color-text-tertiary);
        }

        .admin-quick-arrow {
          color: var(--color-text-muted);
          flex-shrink: 0;
        }

        .admin-recent-list {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .admin-recent-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 12px;
          border-radius: var(--radius-sm);
          text-decoration: none;
          transition: background 0.15s ease;
        }

        .admin-recent-item:hover {
          background: var(--color-surface-alt);
        }

        .admin-recent-flag {
          font-size: 20px;
          flex-shrink: 0;
        }

        .admin-recent-info {
          flex: 1;
          min-width: 0;
        }

        .admin-recent-name {
          font-size: 13px;
          font-weight: 600;
          color: var(--color-text);
        }

        .admin-recent-meta {
          font-size: 11px;
          color: var(--color-text-tertiary);
        }
      `}</style>
    </div>
  );
}
