"use client";

import { use } from 'react';
import Link from 'next/link';
import { CheckCircle, Clock, Wallet } from '@phosphor-icons/react';
import { notFound } from 'next/navigation';
import BannerHeader from '@/components/portal/BannerHeader';
import CountryFlag from '@/components/ui/CountryFlag';
import { getJurisdiction } from '@/lib/jurisdictions';

export default function JurisdictionDetails({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const data = getJurisdiction(resolvedParams.id);
  if (!data) notFound();

  return (
    <div className="wrap admin-page pb-24">
      <BannerHeader title="Jurisdiction details" />

      <div className="card" style={{ display: 'grid', gap: 'var(--space-4)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
          <CountryFlag country={data.flagCode} size="xl" />
          <div style={{ display: 'grid', gap: 'var(--space-2)', justifyItems: 'start' }}>
            <h2 style={{ margin: 0, fontSize: 22 }}>{data.name}</h2>
            <span className="badge badge-accent">{data.tax}</span>
          </div>
        </div>
        <p style={{ margin: 0 }}>{data.description}</p>
      </div>

      <div className="admin-section-head" style={{ marginTop: 'var(--space-6)' }}>
        <h2>Fast facts</h2>
      </div>
      <div className="admin-metrics-grid">
        <div className="card">
          <Wallet size={20} weight="duotone" style={{ color: 'var(--text-tertiary)' }} />
          <p className="admin-form-note">Starting price</p>
          <strong style={{ fontSize: 18 }}>{data.price}</strong>
        </div>
        <div className="card">
          <Clock size={20} weight="duotone" style={{ color: 'var(--text-tertiary)' }} />
          <p className="admin-form-note">Timeline</p>
          <strong style={{ fontSize: 18 }}>{data.timeline}</strong>
        </div>
      </div>

      <div className="admin-section-head" style={{ marginTop: 'var(--space-6)' }}>
        <h2>What&apos;s included</h2>
      </div>
      <div style={{ display: 'grid', gap: 'var(--space-2)' }}>
        {data.features.map((feature: string, idx: number) => (
          <div
            key={idx}
            className="card"
            style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-3)', padding: 'var(--space-4)' }}
          >
            <CheckCircle size={18} weight="duotone" style={{ color: 'var(--green-dk)', flexShrink: 0, marginTop: 2 }} />
            <span>{feature}</span>
          </div>
        ))}
      </div>

      <div
        style={{
          position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 10,
          padding: 'var(--space-3) var(--space-4)',
          background: 'var(--surface)', borderTop: '1px solid var(--border)',
        }}
      >
        <Link href={`/checkout/${resolvedParams.id}`} className="btn btn-primary" style={{ width: '100%' }}>
          Start incorporation
        </Link>
      </div>
    </div>
  );
}
