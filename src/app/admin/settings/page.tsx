'use client';

import React from 'react';
import { usePortalStore } from '@/lib/store';
import { useToast } from '@/components/ui/Toast';
import {
  Shield,
  Bell,
  Users,
} from 'lucide-react';

export default function AdminSettingsPage() {
  const { userProfile } = usePortalStore();
  const { showToast } = useToast();

  const badgeStyle = (on: boolean): React.CSSProperties => ({
    background: on ? 'var(--color-success-light)' : 'var(--color-navy-subtle)',
    color: on ? 'var(--color-success)' : 'var(--color-text-tertiary)',
  });

  return (
    <div className="admin-settings">
      <div>
        <h1 className="admin-page-title">Settings</h1>
        <p className="admin-page-subtitle">Manage admin panel configuration</p>
      </div>

      <div className="admin-settings-section">
        <h2 className="admin-section-heading">
          <Shield size={16} />
          Security
        </h2>
        <div className="admin-settings-card">
          <div className="admin-settings-row">
            <div>
              <div className="admin-settings-label">Two-Factor Authentication</div>
              <div className="admin-settings-desc">Require 2FA for all admin logins</div>
            </div>
            <span className="admin-settings-badge" style={badgeStyle(userProfile.twoFactorEnabled)}>
              {userProfile.twoFactorEnabled ? 'Enabled' : 'Disabled'}
            </span>
          </div>
          <div className="admin-settings-row">
            <div>
              <div className="admin-settings-label">Active Sessions</div>
              <div className="admin-settings-desc">Currently logged in devices</div>
            </div>
            <span className="admin-settings-value">{userProfile.activeSessions}</span>
          </div>
        </div>
      </div>

      <div className="admin-settings-section">
        <h2 className="admin-section-heading">
          <Bell size={16} />
          Notifications
        </h2>
        <div className="admin-settings-card">
          <div className="admin-settings-row">
            <div>
              <div className="admin-settings-label">WhatsApp Alerts</div>
              <div className="admin-settings-desc">Receive WhatsApp notifications for admin actions</div>
            </div>
            <span className="admin-settings-badge" style={badgeStyle(userProfile.whatsappAlerts)}>
              {userProfile.whatsappAlerts ? 'On' : 'Off'}
            </span>
          </div>
          <div className="admin-settings-row">
            <div>
              <div className="admin-settings-label">Email Alerts</div>
              <div className="admin-settings-desc">Receive email digests for critical updates</div>
            </div>
            <span className="admin-settings-badge" style={badgeStyle(userProfile.emailAlerts)}>
              {userProfile.emailAlerts ? 'On' : 'Off'}
            </span>
          </div>
        </div>
      </div>

      <div className="admin-settings-section">
        <h2 className="admin-section-heading">
          <Users size={16} />
          Admin Profile
        </h2>
        <div className="admin-settings-card">
          <div className="admin-settings-row">
            <div>
              <div className="admin-settings-label">Name</div>
              <div className="admin-settings-desc">{userProfile.name}</div>
            </div>
          </div>
          <div className="admin-settings-row">
            <div>
              <div className="admin-settings-label">Email</div>
              <div className="admin-settings-desc">{userProfile.email}</div>
            </div>
          </div>
          <div className="admin-settings-row">
            <div>
              <div className="admin-settings-label">Role</div>
              <div className="admin-settings-desc">{userProfile.role}</div>
            </div>
          </div>
        </div>
      </div>

      <button
        className="btn btn-secondary"
        onClick={() => showToast('success', 'Settings saved successfully.')}
      >
        Save Changes
      </button>

      <style>{`
        .admin-settings {
          display: flex;
          flex-direction: column;
          gap: 28px;
          max-width: 640px;
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

        .admin-settings-section {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .admin-section-heading {
          display: flex;
          align-items: center;
          gap: 8px;
          font-family: var(--font-heading);
          font-size: 14px;
          font-weight: 700;
          color: var(--color-text);
          margin: 0;
        }

        .admin-settings-card {
          background: var(--color-card);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          overflow: hidden;
        }

        .admin-settings-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          padding: 14px 16px;
        }

        .admin-settings-row + .admin-settings-row {
          border-top: 1px solid var(--color-border);
        }

        .admin-settings-label {
          font-size: 13px;
          font-weight: 600;
          color: var(--color-text);
        }

        .admin-settings-desc {
          font-size: 12px;
          color: var(--color-text-tertiary);
          margin-top: 1px;
        }

        .admin-settings-badge {
          display: inline-flex;
          padding: 3px 10px;
          border-radius: var(--radius-pill);
          font-size: 11px;
          font-weight: 700;
          flex-shrink: 0;
        }

        .admin-settings-value {
          font-size: 14px;
          font-weight: 700;
          color: var(--color-text);
        }
      `}</style>
    </div>
  );
}
