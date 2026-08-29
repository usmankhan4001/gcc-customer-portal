'use client';

import React from 'react';
import Link from 'next/link';
import { usePortalStore } from '@/lib/store';
import CountryFlag from '@/components/ui/CountryFlag';
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Page Header */}
      <div>
        <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          ACCOUNT & PREFERENCES
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
          Portal <span style={{ color: 'var(--orange)' }}>Settings</span>
        </h1>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>
          Manage your founder profile, active corporate entities, and notification channels.
        </p>
      </div>

      {/* Profile Card */}
      <div className="card app-card" style={{ padding: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: '50%',
              background: 'var(--orange-lt)',
              color: 'var(--orange)',
              border: '2px solid rgba(242,101,34,0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: 18,
            }}
          >
            {userProfile.name.charAt(0)}
          </div>
          <div>
            <h2 style={{ fontSize: 15, fontWeight: 800, color: 'var(--navy)' }}>
              {userProfile.name}
            </h2>
            <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
              {userProfile.role}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
            <span style={{ color: 'var(--text-tertiary)' }}>Email Address:</span>
            <strong style={{ color: 'var(--navy)' }}>{userProfile.email}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
            <span style={{ color: 'var(--text-tertiary)' }}>WhatsApp Phone:</span>
            <strong style={{ color: 'var(--navy)' }}>{userProfile.phone}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '8px 0' }}>
            <span style={{ color: 'var(--text-tertiary)' }}>Country:</span>
            <strong style={{ color: 'var(--navy)' }}>{userProfile.country}</strong>
          </div>
        </div>
      </div>

      {/* Entity Portfolio */}
      <div className="card app-card" style={{ padding: 18 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div className="section-title" style={{ marginBottom: 0 }}>Active Entity Portfolio</div>
          <span className="badge badge-sand">{entities.length} Companies</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {entities.map((ent) => (
            <div
              key={ent.id}
              onClick={() => setActiveEntityId(ent.id)}
              className={`card card-hover ${ent.id === activeEntityId ? 'card-sand' : ''}`}
              style={{
                cursor: 'pointer',
                padding: 12,
                border: ent.id === activeEntityId ? '1.5px solid var(--orange)' : undefined,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <CountryFlag country={ent.countryCode} size="md" />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--navy)' }}>{ent.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{ent.jurisdiction} • {ent.stageName}</div>
                </div>
              </div>

              {ent.id === activeEntityId && <span className="badge badge-orange">ACTIVE</span>}
            </div>
          ))}
        </div>
      </div>

      {/* Notification Preferences */}
      <div className="card app-card" style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div className="section-title">Notification Channels</div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: 8, background: 'rgba(37,211,102,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Smartphone size={16} color="var(--whatsapp)" />
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--navy)' }}>WhatsApp Filing Bot</div>
              <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>Real-time registry status alerts</div>
            </div>
          </div>
          <input
            type="checkbox"
            checked={userProfile.whatsappAlerts}
            onChange={(e) => updateUserProfile({ whatsappAlerts: e.target.checked })}
            style={{ width: 18, height: 18, accentColor: 'var(--orange)', cursor: 'pointer' }}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: 8, background: 'var(--blue-lt)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Mail size={16} color="var(--blue)" />
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--navy)' }}>Email PDF Receipts & MoA</div>
              <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>Direct dispatch to {userProfile.email}</div>
            </div>
          </div>
          <input
            type="checkbox"
            checked={userProfile.emailAlerts}
            onChange={(e) => updateUserProfile({ emailAlerts: e.target.checked })}
            style={{ width: 18, height: 18, accentColor: 'var(--orange)', cursor: 'pointer' }}
          />
        </div>
      </div>

      {/* Admin Operations Console Switcher */}
      <Link href="/admin/clients" style={{ textDecoration: 'none' }}>
        <div className="card card-sand" style={{ padding: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <ShieldCheck size={18} color="var(--orange)" />
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--navy)' }}>Operations Console</div>
              <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>Access internal CRM & filing queue</div>
            </div>
          </div>
          <span className="badge badge-navy">STAFF ONLY →</span>
        </div>
      </Link>
    </div>
  );
}
