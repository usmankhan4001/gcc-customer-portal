'use client';

import React, { useState } from 'react';
import { usePortalStore } from '@/lib/store';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Input from '@/components/ui/Input';
import CountryFlag from '@/components/ui/CountryFlag';
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

export default function VaultPage() {
  const { entities, activeEntityId, setActiveEntityId, submitKycHandshake } = usePortalStore();
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
    }, 800);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(`https://gccstartup.com/v/${activeEntity?.id || 'doc'}-vault?token=sec_9842f`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!activeEntity) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 24px' }}>
        <FolderOpen size={40} color="var(--text-muted)" style={{ margin: '0 auto 12px' }} />
        <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--navy)' }}>No Active Entity</h3>
        <p style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>Set up a company to access your document vault.</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div>
        <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          SECURE CORPORATE KIT LOCKER
        </div>
        <h1
          style={{
            fontFamily: 'var(--font-heading)',
            fontSize: '1.65rem',
            fontWeight: 800,
            color: 'var(--navy)',
            letterSpacing: '-0.02em',
            marginTop: 2,
          }}
        >
          Document <span style={{ color: 'var(--orange)' }}>Vault</span>
        </h1>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>
          Encrypted statutory repository — manage official commercial certificates and nominee deeds.
        </p>
      </div>

      {/* Entity Selector Pills */}
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
        {entities.map((ent) => (
          <button
            key={ent.id}
            onClick={() => setActiveEntityId(ent.id)}
            className={`btn ${ent.id === activeEntity.id ? 'btn-primary' : 'btn-secondary'}`}
            style={{ flexShrink: 0, gap: 8, fontSize: 13, padding: '8px 16px' }}
          >
            <CountryFlag country={ent.countryCode} size="sm" />
            <span style={{ maxWidth: 130, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {ent.name}
            </span>
          </button>
        ))}
      </div>

      {/* Document Grid */}
      <div className="card app-card" style={{ padding: 18 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div className="section-title" style={{ marginBottom: 0 }}>Issued Statutory Files</div>
          <span className="badge badge-sand">{activeEntity.documents.length} Files</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 }}>
          {activeEntity.documents.map((doc) => (
            <div
              key={doc.id}
              className="card card-hover"
              style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 8 }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ width: 34, height: 34, borderRadius: 8, background: 'var(--orange-lt)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FileText size={18} color="var(--orange)" />
                </div>
                <span className={`badge ${doc.isReady ? 'badge-success' : 'badge-warning'}`}>
                  {doc.isReady ? 'READY' : 'PENDING'}
                </span>
              </div>

              <div>
                <h4 style={{ fontSize: 13, fontWeight: 800, color: 'var(--navy)', lineHeight: 1.3 }}>
                  {doc.title}
                </h4>
                <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2 }}>
                  {doc.type} • {doc.size}
                </div>
              </div>

              <div style={{ marginTop: 'auto', paddingTop: 8, borderTop: '1px solid var(--border)' }}>
                {doc.isReady ? (
                  <button
                    type="button"
                    onClick={() => alert(`Downloading verified copy of ${doc.title}`)}
                    className="btn btn-secondary btn-sm"
                    style={{ width: '100%', fontSize: 12 }}
                  >
                    <Download size={13} />
                    <span>Download PDF</span>
                  </button>
                ) : (
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', padding: '4px 0' }}>
                    Auto-delivers upon Stage 4
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* KYC Handshake Card */}
      <div className="card card-sand" style={{ padding: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              background: handshakeDone ? 'var(--success-lt)' : 'var(--orange-lt)',
              color: handshakeDone ? 'var(--success)' : 'var(--orange)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {handshakeDone ? <CheckCircle2 size={20} /> : <ShieldCheck size={20} />}
          </div>
          <div>
            <h3 style={{ fontSize: 14, fontWeight: 800, color: 'var(--navy)' }}>
              {handshakeDone ? 'Government Verification Confirmed' : 'Official Portal Identity Handshake'}
            </h3>
            <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
              {handshakeDone
                ? `Registry Reference: ${referenceNumber || activeEntity.kycReferenceNumber}`
                : 'Enter your confirmation reference to advance to Stage 3 Registry Filing'}
            </div>
          </div>
        </div>

        {!handshakeDone ? (
          <form onSubmit={handleKycSubmit} style={{ display: 'flex', gap: 8 }}>
            <input
              type="text"
              placeholder="e.g. IFZA-KYC-2026-849201"
              value={referenceNumber}
              onChange={(e) => setReferenceNumber(e.target.value)}
              className="input-field"
              required
            />
            <button type="submit" disabled={isSubmitting} className="btn btn-primary" style={{ flexShrink: 0 }}>
              <span>{isSubmitting ? 'Verifying...' : 'Verify'}</span>
              <ArrowRight size={14} />
            </button>
          </form>
        ) : (
          <div
            style={{
              padding: '10px 14px',
              borderRadius: 10,
              background: 'var(--surface)',
              borderLeft: '4px solid var(--success)',
              fontSize: 12,
              color: 'var(--text-secondary)',
            }}
          >
            Confirmed Reference: <strong style={{ color: 'var(--navy)' }}>{referenceNumber || activeEntity.kycReferenceNumber}</strong> — Stage 3 is active.
          </div>
        )}
      </div>

      {/* Share Button */}
      <button
        type="button"
        onClick={() => setShareModalOpen(true)}
        className="btn btn-secondary"
        style={{ width: '100%', height: 44, fontSize: 13 }}
      >
        <Share2 size={16} color="var(--orange)" />
        <span>Generate Encrypted Banker Share Link</span>
      </button>

      {/* Share Modal */}
      <Modal
        isOpen={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        title="Encrypted Banker Share Link"
        badge="SECURE DOSSIER"
        badgeVariant="orange"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.4 }}>
            Generate a time-limited 72-hour encrypted viewer link for your corporate banker.
          </p>

          <div className="card card-sand" style={{ padding: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 11, fontFamily: 'monospace', color: 'var(--navy)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              https://gccstartup.com/v/{activeEntity.id}-vault?token=sec_9842f
            </span>
            <button onClick={handleCopy} className="btn btn-primary btn-sm" style={{ flexShrink: 0 }}>
              {copied ? <Check size={14} /> : <Copy size={14} />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
