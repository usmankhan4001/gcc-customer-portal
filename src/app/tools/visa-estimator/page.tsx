'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import BannerHeader from '@/components/portal/BannerHeader';
import { ArrowRight, WarningCircle } from '@phosphor-icons/react';
import {
  VISA_JURISDICTION_OPTIONS,
  VisaEstimateSuccess,
  estimateVisaCosts,
  formatAED,
} from '@/lib/tools/visa-estimator';
import ContactCaptureGate from '@/components/portal/ContactCaptureGate';
import s from '../tools.module.css';

export default function VisaEstimator() {
  const [employees, setEmployees] = useState('2');
  const [jurisdiction, setJurisdiction] = useState('FreeZone');
  const [result, setResult] = useState<VisaEstimateSuccess | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const res = estimateVisaCosts(jurisdiction, employees);
    if (!res.success) {
      setError(res.error);
      setResult(null);
      return;
    }
    setError(null);
    setResult(res);
  };

  return (
    <>
      <BannerHeader
        title="UAE Residence Visa Estimator"
        subtitle="Includes entry permit, VIP medical fitness test, Emirates ID (2-year validity), and e-visa residency issuance."
      />

      <main className={`wrap ${s.main}`}>
        <div className={`${s.stack} ${s.narrow}`}>
          <form onSubmit={handleSubmit} className="card admin-form-card">
            <div className="admin-form-stack">
              <div className="field">
                <label htmlFor="jurisdiction">Entity type</label>
                <select
                  id="jurisdiction"
                  value={jurisdiction}
                  onChange={(e) => {
                    setJurisdiction(e.target.value);
                    setResult(null);
                    setError(null);
                  }}
                >
                  {VISA_JURISDICTION_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="field">
                <label htmlFor="employees">Number of visas needed</label>
                <input
                  type="number"
                  inputMode="numeric"
                  id="employees"
                  min="1"
                  max="50"
                  value={employees}
                  onChange={(e) => {
                    setEmployees(e.target.value);
                    setResult(null);
                    setError(null);
                  }}
                  required
                />
              </div>
            </div>
            <div className="admin-form-actions">
              <button type="submit" className="btn btn-primary">Calculate total visa package</button>
            </div>
          </form>

          {error && (
            <div role="alert" className="admin-callout is-error">
              <WarningCircle size={20} />
              <span>{error}</span>
            </div>
          )}

          {result && (
            <>
              <div className="card">
                <div className={s.row} style={{ marginBottom: 'var(--space-3)' }}>
                  <h2 className={s.h3}>Government &amp; medical fee schedule</h2>
                  <span className="badge badge-info">{result.count} visa(s)</span>
                </div>

                <div className={s.feeRow}>
                  <span>Entry permit / change of status</span>
                  <span className={s.mono}>{formatAED(result.fees.entryPermit)}</span>
                </div>
                <div className={s.feeRow}>
                  <span>Medical fitness test (VIP fast track)</span>
                  <span className={s.mono}>{formatAED(result.fees.medicalFitness)}</span>
                </div>
                <div className={s.feeRow}>
                  <span>Emirates ID biometrics (2 years)</span>
                  <span className={s.mono}>{formatAED(result.fees.emiratesId)}</span>
                </div>
                <div className={s.feeRow}>
                  <span>Residency stamping &amp; establishment issuance</span>
                  <span className={s.mono}>{formatAED(result.fees.visaStamping)}</span>
                </div>
                <div className={s.feeTotal}>
                  <span>Total estimated visa government cost</span>
                  <span className={s.mono}>{formatAED(result.fees.grandTotal)}</span>
                </div>

                <div className={s.cta}>
                  <span className={s.muted}>Need VIP PRO concierge processing?</span>
                  <Link href="/services" className={s.link}>
                    Book visa package <ArrowRight size={16} />
                  </Link>
                </div>
              </div>

              <ContactCaptureGate
                sourceTool="visa_estimator"
                toolInput={{ jurisdiction, employees: Number(employees) }}
                toolResult={result as unknown as Record<string, unknown>}
              />
            </>
          )}
        </div>
      </main>
    </>
  );
}
