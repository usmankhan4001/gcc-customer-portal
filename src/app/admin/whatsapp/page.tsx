'use client';

import React, { useState } from 'react';
import { usePortalStore } from '@/lib/store';
import { useToast } from '@/components/ui/Toast';
import {
  Send,
  Phone,
  MessageSquare,
  CheckCheck,
  Clock,
  Wifi,
  WifiOff,
} from 'lucide-react';

const TEMPLATES: Record<string, string> = {
  order_confirmed_template:
    '🎉 Order Confirmation: Your entity formation order is confirmed! Your designated lead is Abdullah K. Access your KYC Vault here: https://gccstartup.com/portal/vault',
  official_kyc_reminder:
    '📋 Action Required: Please complete your identity & passport verification on the official authority portal to initiate Stage 3 Government Filing.',
  stage_3_filing_active:
    '🏛️ Filing Update: Your Electronic Memorandum of Association (E-MoA) has been submitted to the government registry. Estimated license issuance in 3-5 days.',
  trade_license_issued:
    '🏆 Milestone Unlocked: Your official Commercial Trade License has been issued! You can download your full corporate kit from your Cloud Locker.',
  banking_pre_approved:
    '🏦 Banking Approval: Airwallex & Wio Bank pre-approvals are ready for final corporate dispatch. Open Banking Hub to verify.',
};

const TEMPLATE_OPTIONS = [
  { value: 'order_confirmed_template', label: 'Order Confirmed (Welcome)' },
  { value: 'official_kyc_reminder', label: 'KYC Reminder' },
  { value: 'stage_3_filing_active', label: 'Filing Active' },
  { value: 'trade_license_issued', label: 'License Issued' },
  { value: 'banking_pre_approved', label: 'Banking Pre-Approval' },
];

export default function AdminWhatsAppPage() {
  const { whatsappLogs, sendWhatsAppAlert } = usePortalStore();
  const { showToast } = useToast();
  const [phone, setPhone] = useState('+31 6 12345678');
  const [template, setTemplate] = useState('order_confirmed_template');
  const [sending, setSending] = useState(false);

  const isConnected = whatsappLogs.length > 0;

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);

    setTimeout(() => {
      sendWhatsAppAlert(phone, template, TEMPLATES[template]);
      setSending(false);
      showToast('success', 'Test message sent successfully.');
    }, 500);
  };

  return (
    <div className="admin-whatsapp">
      {/* Header */}
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">WhatsApp Engine</h1>
          <p className="admin-page-subtitle">Send test messages via Meta Cloud API</p>
        </div>
        <span
          className="admin-wa-status"
          style={{
            background: isConnected ? 'var(--color-success-light)' : 'var(--color-warning-light)',
            color: isConnected ? 'var(--color-success)' : 'var(--color-warning)',
          }}
        >
          {isConnected ? (
            <><Wifi size={13} /> Connected to Webhook</>
          ) : (
            <><WifiOff size={13} /> Simulator Mode</>
          )}
        </span>
      </div>

      <div className="admin-wa-grid">
        {/* Left: Form */}
        <div className="admin-wa-form-card">
          <h2 className="admin-wa-section-title">Send Test Message</h2>

          <form onSubmit={handleSend} className="admin-wa-form">
            <div>
              <label className="admin-input-label">Recipient Phone Number</label>
              <div className="admin-phone-input">
                <Phone size={16} className="admin-phone-icon" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+31 6 12345678"
                  required
                  className="admin-phone-field"
                />
              </div>
            </div>

            <div>
              <label className="admin-input-label">Template</label>
              <select
                value={template}
                onChange={(e) => setTemplate(e.target.value)}
                className="admin-select"
              >
                {TEMPLATE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="admin-input-label">Message Preview</label>
              <div className="admin-preview-box">
                {TEMPLATES[template]}
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-full"
              disabled={sending}
            >
              <Send size={15} />
              <span>{sending ? 'Sending...' : 'Send Test Message'}</span>
            </button>
          </form>
        </div>

        {/* Right: Logs */}
        <div className="admin-wa-logs-card">
          <div className="admin-wa-logs-header">
            <h2 className="admin-wa-section-title">Message Log</h2>
            <span className="admin-wa-log-count">{whatsappLogs.length} messages</span>
          </div>

          <div className="admin-wa-logs-list">
            {whatsappLogs.length === 0 && (
              <div className="admin-empty" style={{ padding: '32px 16px' }}>
                <MessageSquare size={24} style={{ color: 'var(--color-text-muted)', marginBottom: 8 }} />
                <p style={{ fontSize: 12, color: 'var(--color-text-muted)', margin: 0 }}>
                  No messages sent yet.
                </p>
              </div>
            )}

            {whatsappLogs.map((log) => (
              <div key={log.id} className="admin-wa-log-item">
                <div className="admin-wa-log-top">
                  <span className="admin-wa-log-phone">{log.recipientPhone}</span>
                  <div className="admin-wa-log-meta">
                    <span className="admin-wa-log-time">
                      <Clock size={11} />
                      {log.sentAt}
                    </span>
                    <span
                      className="admin-wa-log-status"
                      style={{
                        background: log.status === 'read' ? 'var(--color-success-light)' : 'var(--color-info-light)',
                        color: log.status === 'read' ? 'var(--color-success)' : 'var(--color-info)',
                      }}
                    >
                      {log.status === 'read' && <CheckCheck size={11} />}
                      {log.status.toUpperCase()}
                    </span>
                  </div>
                </div>
                <p className="admin-wa-log-text">{log.messageText}</p>
                <span className="admin-wa-log-template">{log.templateName}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        .admin-whatsapp {
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

        .admin-wa-status {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 5px 12px;
          border-radius: var(--radius-pill);
          font-size: 12px;
          font-weight: 700;
          white-space: nowrap;
          flex-shrink: 0;
        }

        .admin-wa-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }

        @media (max-width: 860px) {
          .admin-wa-grid {
            grid-template-columns: 1fr;
          }
        }

        .admin-wa-form-card,
        .admin-wa-logs-card {
          background: var(--color-card);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .admin-wa-section-title {
          font-family: var(--font-heading);
          font-size: 15px;
          font-weight: 700;
          color: var(--color-text);
          margin: 0;
        }

        .admin-wa-form {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .admin-input-label {
          display: block;
          font-size: 12px;
          font-weight: 600;
          color: var(--color-text);
          margin-bottom: 5px;
        }

        .admin-phone-input {
          position: relative;
        }

        .admin-phone-icon {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--color-text-muted);
          pointer-events: none;
        }

        .admin-phone-field {
          width: 100%;
          height: 42px;
          padding: 0 12px 0 38px;
          background: var(--color-surface);
          border: 1.5px solid var(--color-border);
          border-radius: var(--radius-sm);
          font-size: 13px;
          font-family: var(--font-sans);
          color: var(--color-text);
          outline: none;
          transition: border-color 0.15s ease, box-shadow 0.15s ease;
        }

        .admin-phone-field:focus {
          border-color: var(--color-orange);
          box-shadow: 0 0 0 3px rgba(242,101,34,0.1);
        }

        .admin-phone-field::placeholder {
          color: var(--color-text-muted);
        }

        .admin-select {
          width: 100%;
          height: 42px;
          padding: 0 12px;
          background: var(--color-surface);
          border: 1.5px solid var(--color-border);
          border-radius: var(--radius-sm);
          font-size: 13px;
          font-family: var(--font-sans);
          color: var(--color-text);
          outline: none;
          cursor: pointer;
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%238C93A7' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 12px center;
        }

        .admin-select:focus {
          border-color: var(--color-orange);
          box-shadow: 0 0 0 3px rgba(242,101,34,0.1);
        }

        .admin-preview-box {
          padding: 12px;
          background: var(--color-surface-alt);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-sm);
          font-size: 12px;
          line-height: 1.6;
          color: var(--color-text-secondary);
          min-height: 60px;
          white-space: pre-wrap;
        }

        /* Logs */
        .admin-wa-logs-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .admin-wa-log-count {
          font-size: 11px;
          font-weight: 600;
          color: var(--color-text-tertiary);
        }

        .admin-wa-logs-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
          max-height: 500px;
          overflow-y: auto;
        }

        .admin-wa-log-item {
          padding: 12px;
          background: var(--color-surface-alt);
          border-radius: var(--radius-sm);
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .admin-wa-log-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
        }

        .admin-wa-log-phone {
          font-size: 12px;
          font-weight: 700;
          color: var(--color-text);
          font-family: monospace;
        }

        .admin-wa-log-meta {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .admin-wa-log-time {
          display: flex;
          align-items: center;
          gap: 3px;
          font-size: 10px;
          color: var(--color-text-tertiary);
        }

        .admin-wa-log-status {
          display: inline-flex;
          align-items: center;
          gap: 3px;
          padding: 2px 7px;
          border-radius: var(--radius-pill);
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 0.04em;
        }

        .admin-wa-log-text {
          font-size: 12px;
          line-height: 1.5;
          color: var(--color-text-secondary);
          margin: 0;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .admin-wa-log-template {
          font-size: 10px;
          font-weight: 600;
          color: var(--color-text-muted);
        }

        .admin-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
        }
      `}</style>
    </div>
  );
}
