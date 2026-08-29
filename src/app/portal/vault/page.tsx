'use client';

import React, { useState } from 'react';
import { usePortalStore } from '@/lib/store';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import {
  FileText,
  Download,
  Share2,
  Copy,
  Check,
  Lock,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  FolderOpen,
} from 'lucide-react';

function EntitySelector({
  entities,
  activeId,
  onSelect,
}: {
  entities: { id: string; name: string; flag: string }[];
  activeId: string;
  onSelect: (id: string) => void;
}) {
  if (entities.length <= 1) return null;
  return (
    <div className="h-scroll" style={{ gap: 8, marginBottom: 20 }}>
      {entities.map((ent) => (
        <button
          key={ent.id}
          onClick={() => onSelect(ent.id)}
          className={`chip ${ent.id === activeId ? 'active' : ''}`}
          style={{ flexShrink: 0 }}
        >
          <span>{ent.flag}</span>
          <span className="truncate" style={{ maxWidth: 110 }}>
            {ent.name}
          </span>
        </button>
      ))}
    </div>
  );
}

export default function VaultPage() {
  const { entities, activeEntityId, setActiveEntityId, submitKycHandshake } = usePortalStore();
  const { showToast } = useToast();
  const activeEntity = entities.find((e) => e.id === activeEntityId) || entities[0];

  const [referenceNumber, setReferenceNumber] = useState(activeEntity?.kycReferenceNumber || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [handshakeDone, setHandshakeDone] = useState(Boolean(activeEntity?.kycReferenceNumber));
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleKycSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!referenceNumber.trim()) return;
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setHandshakeDone(true);
      if (activeEntity) submitKycHandshake(activeEntity.id, referenceNumber);
      showToast('success', 'KYC handshake verified — Stage 3 activated');
    }, 800);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(`https://gccstartup.com/v/${activeEntity?.id || 'doc'}-vault?token=sec_9842f`);
    setCopied(true);
    showToast('success', 'Share link copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  if (!activeEntity) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon"><FolderOpen size={32} /></div>
        <h3 className="empty-state-title">No Active Entity</h3>
        <p className="empty-state-desc">Set up a company to access your document vault.</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Page Header */}
      <div className="animate-fade-in">
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text-muted)', letterSpacing: '0.08em', marginBottom: 4 }}>
          SECURE CORPORATE KIT LOCKER
        </div>
        <h1
          className="font-heading"
          style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--color-text)', lineHeight: 1.2 }}
        >
          Document <span style={{ color: 'var(--color-orange)' }}>Vault</span>
        </h1>
        <p style={{ fontSize: 14, color: 'var(--color-text-secondary)', marginTop: 4 }}>
          Secure corporate kit locker — download official documents and manage KYC.
        </p>
      </div>

      {/* Entity Selector */}
      <EntitySelector
        entities={entities}
        activeId={activeEntity.id}
        onSelect={setActiveEntityId}
      />

      {/* Document Grid */}
      <div className="section-gap animate-slide-up" style={{ animationDelay: '40ms' }}>
        <div className="section-header">
          <span className="section-title">Issued Documents</span>
          <Badge variant="info" size="sm">{activeEntity.documents.length} files</Badge>
        </div>

        {activeEntity.documents.length === 0 ? (
          <div className="empty-state" style={{ padding: 32 }}>
            <div className="empty-state-icon"><FolderOpen size={28} /></div>
            <h3 className="empty-state-title" style={{ fontSize: '1rem' }}>No Documents Yet</h3>
            <p className="empty-state-desc" style={{ fontSize: 13 }}>
              Documents will appear here once your entity is issued.
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
            {activeEntity.documents.map((doc) => (
              <div key={doc.id} className="card card-padded" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <FileText size={20} style={{ color: 'var(--color-orange)' }} />
                  <Badge variant={doc.isReady ? 'success' : 'warning'} size="sm">
                    {doc.isReady ? 'Ready' : 'Pending'}
                  </Badge>
                </div>
                <div>
                  <h4
                    className="font-heading truncate"
                    style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text)' }}
                  >
                    {doc.title}
                  </h4>
                  <p style={{ fontSize: 12, color: 'var(--color-text-tertiary)', marginTop: 2 }}>
                    {doc.type} — {doc.size}
                  </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 'auto', paddingTop: 10, borderTop: '1px solid var(--color-border)' }}>
                  {doc.isReady ? (
                    <span className="status-dot status-dot-active" />
                  ) : (
                    <span className="status-dot status-dot-pending" />
                  )}
                  <span style={{ fontSize: 12, color: doc.isReady ? 'var(--color-success)' : 'var(--color-warning)', fontWeight: 600 }}>
                    {doc.isReady ? 'Ready to download' : 'Pending issuance'}
                  </span>
                </div>
                {doc.isReady ? (
                  <Button
                    variant="secondary"
                    size="sm"
                    fullWidth
                    leftIcon={<Download size={14} />}
                    onClick={() => showToast('info', 'Download will be available after backend integration')}
                  >
                    Download
                  </Button>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '8px 0' }}>
                    <Badge variant="warning" size="sm">Pending</Badge>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* KYC Handshake Section */}
      <div className="section-gap animate-slide-up" style={{ animationDelay: '80ms' }}>
        <div className="section-header">
          <span className="section-title">KYC Handshake</span>
        </div>
        <div className="card card-padded">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 'var(--radius-sm)',
              background: handshakeDone ? 'var(--color-success-light)' : 'var(--color-orange-light)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: handshakeDone ? 'var(--color-success)' : 'var(--color-orange)',
            }}>
              {handshakeDone ? <CheckCircle2 size={18} /> : <ShieldCheck size={18} />}
            </div>
            <div>
              <h3 className="font-heading" style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-text)' }}>
                {handshakeDone ? 'KYC Verified' : 'Submit Official Portal Reference'}
              </h3>
              <p style={{ fontSize: 12, color: 'var(--color-text-tertiary)' }}>
                {handshakeDone
                  ? `Ref: ${referenceNumber || activeEntity.kycReferenceNumber}`
                  : 'Enter your government portal reference number after completing identity verification'}
              </p>
            </div>
          </div>

          {!handshakeDone ? (
            <form onSubmit={handleKycSubmit} style={{ display: 'flex', gap: 10 }}>
              <div style={{ flex: 2 }}>
                <Input
                  placeholder="e.g. IFZA-KYC-2026-849201"
                  value={referenceNumber}
                  onChange={(e) => setReferenceNumber(e.target.value)}
                  icon={<Lock size={16} />}
                />
              </div>
              <Button variant="primary" isLoading={isSubmitting} style={{ flexShrink: 0 }}>
                <span>Verify & Activate</span>
                <ArrowRight size={14} />
              </Button>
            </form>
          ) : (
            <div
              className="card card-flat"
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '12px 16px', borderLeft: '3px solid var(--color-success)',
              }}
            >
              <CheckCircle2 size={18} style={{ color: 'var(--color-success)', flexShrink: 0 }} />
              <span style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>
                Confirmed Reference: <strong style={{ color: 'var(--color-text)' }}>{referenceNumber || activeEntity.kycReferenceNumber}</strong> — Stage 3 is active
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Share Section */}
      <div className="animate-slide-up" style={{ animationDelay: '120ms' }}>
        <Button
          variant="secondary"
          fullWidth
          leftIcon={<Share2 size={16} style={{ color: 'var(--color-orange)' }} />}
          onClick={() => setShareModalOpen(true)}
        >
          Share Documents
        </Button>
      </div>

      {/* Share Modal */}
      <Modal isOpen={shareModalOpen} onClose={() => setShareModalOpen(false)} title="Share Corporate Kit">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <p style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>
            Generate a temporary, encrypted link to securely share your trade license, MoA, and nominee pack.
          </p>
          <div
            className="card card-flat"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '12px 16px', borderRadius: 'var(--radius-pill)', gap: 10,
            }}
          >
            <span style={{ fontSize: 12, color: 'var(--color-text-secondary)', fontFamily: 'monospace', wordBreak: 'break-all', flex: 1 }}>
              https://gccstartup.com/v/{activeEntity.id}-vault?token=sec_9842f
            </span>
            <Button variant="primary" size="sm" onClick={handleCopy}>
              {copied ? <Check size={14} /> : <Copy size={14} />}
              <span>{copied ? 'Copied!' : 'Copy'}</span>
            </Button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, paddingTop: 10, borderTop: '1px solid var(--color-border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
              <span style={{ color: 'var(--color-text-secondary)' }}>Link Expiry</span>
              <strong style={{ color: 'var(--color-text)' }}>7 Days (Auto-Revokes)</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
              <span style={{ color: 'var(--color-text-secondary)' }}>Access Protection</span>
              <strong style={{ color: 'var(--color-success)' }}>256-Bit Encrypted + Audit Logged</strong>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
