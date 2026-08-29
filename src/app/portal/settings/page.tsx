'use client';

import React from 'react';
import Link from 'next/link';
import { usePortalStore } from '@/lib/store';
import Avatar from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import {
  Shield,
  Bell,
  Smartphone,
  Mail,
  Key,
  Building2,
  LogOut,
  ChevronRight,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';

export default function SettingsPage() {
  const { userProfile, updateUserProfile, entities, activeEntityId, setActiveEntityId } = usePortalStore();
  const { showToast } = useToast();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Page Header */}
      <div className="animate-fade-in">
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text-muted)', letterSpacing: '0.08em', marginBottom: 4 }}>
          ACCOUNT & PREFERENCES
        </div>
        <h1 className="font-heading" style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--color-text)', lineHeight: 1.2 }}>
          Settings
        </h1>
        <p style={{ fontSize: 14, color: 'var(--color-text-secondary)', marginTop: 4 }}>
          Account & preferences — manage your profile, entities, and security.
        </p>
      </div>

      {/* Profile Section */}
      <div className="section-gap animate-slide-up" style={{ animationDelay: '40ms' }}>
        <div className="section-header">
          <span className="section-title">Profile</span>
        </div>
        <div className="card card-padded">
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
            <Avatar name={userProfile.name} size="lg" />
            <div>
              <h2 className="font-heading" style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-text)' }}>
                {userProfile.name}
              </h2>
              <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginTop: 2 }}>
                {userProfile.role}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { label: 'Email', value: userProfile.email, icon: <Mail size={16} /> },
              { label: 'Phone', value: userProfile.phone, icon: <Smartphone size={16} /> },
              { label: 'Country', value: userProfile.country, icon: <Building2 size={16} /> },
            ].map((field, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: i < 2 ? '1px solid var(--color-border)' : 'none' }}>
                <div style={{ width: 32, height: 32, borderRadius: 'var(--radius-sm)', background: 'var(--color-surface-alt)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)', flexShrink: 0 }}>
                  {field.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-muted)', letterSpacing: '0.06em' }}>{field.label}</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text)' }}>{field.value}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Entity Portfolio */}
      <div className="section-gap animate-slide-up" style={{ animationDelay: '80ms' }}>
        <div className="section-header">
          <span className="section-title">Entity Portfolio</span>
          <Badge variant="info" size="sm">{entities.length} Companies</Badge>
        </div>
        <div className="card card-bordered" style={{ overflow: 'hidden' }}>
          {entities.map((ent, i) => (
            <div
              key={ent.id}
              onClick={() => setActiveEntityId(ent.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px',
                cursor: 'pointer', borderBottom: i < entities.length - 1 ? '1px solid var(--color-border)' : 'none',
                background: ent.id === activeEntityId ? 'var(--color-orange-light)' : 'transparent',
                transition: 'background 0.15s ease',
              }}
            >
              <div style={{
                width: 38, height: 38, borderRadius: 'var(--radius-sm)',
                background: 'var(--color-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 20, flexShrink: 0,
              }}>
                {ent.flag}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span className="truncate" style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text)' }}>{ent.name}</span>
                  {ent.id === activeEntityId && <Badge variant="orange" size="sm">Active</Badge>}
                </div>
                <div style={{ fontSize: 12, color: 'var(--color-text-tertiary)', marginTop: 2 }}>
                  {ent.jurisdiction} — {ent.stageName}
                </div>
              </div>
              <ChevronRight size={16} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />
            </div>
          ))}
        </div>
      </div>

      {/* Notification Preferences */}
      <div className="section-gap animate-slide-up" style={{ animationDelay: '120ms' }}>
        <div className="section-header">
          <span className="section-title">Notification Preferences</span>
        </div>
        <div className="card card-padded" style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {[
            {
              icon: <Smartphone size={18} />,
              iconBg: 'rgba(37,211,102,0.12)',
              iconColor: 'var(--color-whatsapp)',
              title: 'WhatsApp Filing Bot',
              desc: `Live status alerts to ${userProfile.phone}`,
              checked: userProfile.whatsappAlerts,
              onChange: (v: boolean) => updateUserProfile({ whatsappAlerts: v }),
            },
            {
              icon: <Mail size={18} />,
              iconBg: 'var(--color-info-light)',
              iconColor: 'var(--color-info)',
              title: 'Email PDF Receipts & MoA',
              desc: `Encrypted legal packs to ${userProfile.email}`,
              checked: userProfile.emailAlerts,
              onChange: (v: boolean) => updateUserProfile({ emailAlerts: v }),
            },
          ].map((pref, i) => (
            <div
              key={i}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
                padding: '14px 0',
                borderBottom: i < 1 ? '1px solid var(--color-border)' : 'none',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 'var(--radius-sm)',
                  background: pref.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: pref.iconColor, flexShrink: 0,
                }}>
                  {pref.icon}
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)' }}>{pref.title}</div>
                  <div style={{ fontSize: 11, color: 'var(--color-text-tertiary)' }}>{pref.desc}</div>
                </div>
              </div>
              <label style={{ position: 'relative', width: 44, height: 24, cursor: 'pointer', flexShrink: 0 }}>
                <input
                  type="checkbox"
                  checked={pref.checked}
                  onChange={(e) => pref.onChange(e.target.checked)}
                  style={{ position: 'absolute', opacity: 0, width: 0, height: 0 }}
                />
                <div style={{
                  position: 'absolute', inset: 0,
                  background: pref.checked ? 'var(--color-orange)' : 'var(--color-border)',
                  borderRadius: 'var(--radius-pill)',
                  transition: 'background 0.2s ease',
                }} />
                <div style={{
                  position: 'absolute', top: 2,
                  left: pref.checked ? 22 : 2,
                  width: 20, height: 20,
                  background: '#FFFFFF', borderRadius: '50%',
                  boxShadow: 'var(--shadow-sm)',
                  transition: 'left 0.2s ease',
                }} />
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Security Section */}
      <div className="section-gap animate-slide-up" style={{ animationDelay: '160ms' }}>
        <div className="section-header">
          <span className="section-title">Security</span>
        </div>
        <div className="card card-padded" style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {[
            {
              icon: <Shield size={18} />,
              title: 'Two-Factor Authentication',
              right: <Badge variant={userProfile.twoFactorEnabled ? 'success' : 'warning'} size="sm">{userProfile.twoFactorEnabled ? 'ENABLED' : 'DISABLED'}</Badge>,
            },
            {
              icon: <Key size={18} />,
              title: 'Active Sessions',
              right: <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)' }}>{userProfile.activeSessions} devices</span>,
            },
          ].map((item, i) => (
            <div
              key={i}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
                padding: '14px 0',
                borderBottom: i < 1 ? '1px solid var(--color-border)' : 'none',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ color: 'var(--color-success)' }}>{item.icon}</div>
                <span style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>{item.title}</span>
              </div>
              {item.right}
            </div>
          ))}
        </div>
      </div>

      {/* Admin Link (role-based) */}
      {userProfile.role === 'admin' && (
        <div className="card card-navy animate-slide-up" style={{ animationDelay: '200ms', padding: 18, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Sparkles size={18} style={{ color: 'var(--color-orange)' }} />
              <span style={{ fontSize: 14, fontWeight: 700, color: '#FFFFFF' }}>Staff Operations Console</span>
            </div>
            <Badge variant="orange" size="sm">AGENT VIEW</Badge>
          </div>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', lineHeight: 1.4 }}>
            Access master client registries, filing queues, and live WhatsApp dispatchers.
          </p>
          <Link
            href="/admin/clients"
            className="btn btn-primary"
            style={{ width: '100%', height: 42, fontSize: 13, textDecoration: 'none' }}
          >
            Open Admin Operations Center
            <ChevronRight size={16} />
          </Link>
        </div>
      )}

      {/* Danger Zone */}
      <div className="animate-slide-up" style={{ animationDelay: '240ms' }}>
        <Button
          variant="secondary"
          fullWidth
          leftIcon={<LogOut size={16} style={{ color: 'var(--color-error)' }} />}
          onClick={() => showToast('info', 'Sign out will be available after backend integration')}
        >
          <span style={{ color: 'var(--color-error)' }}>Sign Out</span>
        </Button>
      </div>
    </div>
  );
}
