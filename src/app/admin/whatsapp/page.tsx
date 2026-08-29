'use client';

import React, { useState } from 'react';
import { usePortalStore } from '@/lib/store';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import {
  MessageSquare,
  Send,
  ShieldCheck,
  CheckCheck,
  Clock,
  Phone,
  Sparkles,
} from 'lucide-react';

export default function AdminWhatsAppPage() {
  const { whatsappLogs, sendWhatsAppAlert, entities } = usePortalStore();

  const [phone, setPhone] = useState('+31 6 12345678');
  const [template, setTemplate] = useState('order_confirmed_template');
  const [customMsg, setCustomMsg] = useState('');
  const [isSending, setIsSending] = useState(false);

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

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSending(true);

    setTimeout(() => {
      const messageBody = customMsg || TEMPLATES[template];
      sendWhatsAppAlert(phone, template, messageBody);
      setIsSending(false);
      setCustomMsg('');
    }, 600);
  };

  return (
    <div className="whatsapp-page-container">
      {/* Header */}
      <Card variant="navy" padding="md" className="wa-header">
        <div className="header-badge-row">
          <Badge variant="orange" icon={<MessageSquare className="w-3.5 h-3.5" />}>
            META CLOUD API DISPATCHER
          </Badge>
          <span className="text-xs text-white-muted">Automated Client Milestone Messenger</span>
        </div>
        <h1 className="header-title display-font text-white">
          Meta WhatsApp <span className="text-orange">Cloud API Simulator</span>
        </h1>
        <p className="header-desc text-white-muted">
          Broadcast approved WhatsApp templates and custom structuring advisor notifications directly to client mobile devices.
        </p>
      </Card>

      {/* 2-Column Dispatcher Grid */}
      <div className="dispatcher-grid">
        {/* Left Column: Form */}
        <Card variant="surface" padding="md" className="dispatcher-form-card">
          <h2 className="section-title display-font">Send Template Message</h2>

          <form onSubmit={handleSend} className="wa-form">
            <Input
              label="Recipient WhatsApp Phone Number:"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+31 6 12345678"
              required
            />

            <Select
              label="Select Pre-Approved Meta Template:"
              value={template}
              onChange={(e) => {
                setTemplate(e.target.value);
                setCustomMsg(TEMPLATES[e.target.value]);
              }}
              options={[
                { value: 'order_confirmed_template', label: '1. Order Confirmed (Welcome & Lead Assignment)' },
                { value: 'official_kyc_reminder', label: '2. Official Authority KYC Reminder' },
                { value: 'stage_3_filing_active', label: '3. Stage 3 Registry Filing Active' },
                { value: 'trade_license_issued', label: '4. Trade License Issued & Locker Ready' },
                { value: 'banking_pre_approved', label: '5. Corporate Banking Pre-Approval Notification' },
              ]}
            />

            <div className="template-preview-box card-sand">
              <span className="text-xs font-bold text-navy uppercase">Message Content:</span>
              <p className="text-xs text-secondary mt-1">
                {customMsg || TEMPLATES[template]}
              </p>
            </div>

            <Button
              variant="primary"
              size="lg"
              className="w-full mt-2"
              isLoading={isSending}
              leftIcon={<Send className="w-4 h-4" />}
            >
              <span>Transmit via Meta Cloud API</span>
            </Button>
          </form>
        </Card>

        {/* Right Column: Live Logs */}
        <Card variant="surface" padding="md" className="logs-card">
          <div className="logs-header">
            <h3 className="section-title display-font">Live Notification Logs</h3>
            <Badge variant="success">Connected to Webhook</Badge>
          </div>

          <div className="logs-list">
            {whatsappLogs.map((log) => (
              <div key={log.id} className="log-item card-sand">
                <div className="log-item-top">
                  <span className="text-xs font-bold text-navy">{log.recipientPhone}</span>
                  <div className="log-status-row">
                    <span className="text-xs text-tertiary">{log.sentAt}</span>
                    <Badge variant={log.status === 'read' ? 'success' : 'blue'}>
                      {log.status.toUpperCase()}
                    </Badge>
                  </div>
                </div>
                <p className="text-xs text-secondary line-clamp-2">{log.messageText}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <style jsx>{`
        .whatsapp-page-container {
          display: flex;
          flex-direction: column;
          gap: 24px;
          width: 100%;
        }

        .wa-header {
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

        .dispatcher-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
        }

        @media (max-width: 860px) {
          .dispatcher-grid {
            grid-template-columns: 1fr;
          }
        }

        .dispatcher-form-card,
        .logs-card {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .section-title {
          font-size: 1.3rem;
          color: var(--navy);
        }

        .wa-form {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .template-preview-box {
          padding: 14px;
          border-radius: var(--radius);
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .logs-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .logs-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
          max-height: 440px;
          overflow-y: auto;
        }

        .log-item {
          padding: 14px;
          border-radius: var(--radius);
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .log-item-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .log-status-row {
          display: flex;
          align-items: center;
          gap: 8px;
        }
      `}</style>
    </div>
  );
}
