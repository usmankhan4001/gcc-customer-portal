"use client";

import React, { useState } from "react";
import Link from "next/link";
import BannerHeader from '@/components/portal/BannerHeader';
import { CheckCircle, WarningCircle, ArrowRight } from "@phosphor-icons/react";
import {
  VAT_BUSINESS_TYPE_OPTIONS,
  VAT_THRESHOLD_MANDATORY,
  VAT_THRESHOLD_VOLUNTARY,
  VatResultSuccess,
  evaluateVat,
  formatAED,
} from "@/lib/tools/vat-scorer";
import ContactCaptureGate from "@/components/portal/ContactCaptureGate";
import s from '../tools.module.css';

export default function VATScorer() {
  const [revenue, setRevenue] = useState<string>("400000");
  const [businessType, setBusinessType] = useState<string>("B2B_Foreign");
  const [result, setResult] = useState<VatResultSuccess | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleScore = (e: React.FormEvent) => {
    e.preventDefault();
    const evaluation = evaluateVat(revenue, businessType);
    if (!evaluation.success) {
      setError(evaluation.error);
      setResult(null);
      return;
    }
    setError(null);
    setResult(evaluation);
  };

  return (
    <>
      <BannerHeader
        title="UAE VAT Threshold Scorer"
        subtitle="Under UAE VAT Law (Federal Decree-Law No. 8/2017), taxable supplies in the UAE dictate registration deadlines."
      />

      <main className={`wrap ${s.main}`}>
        <div className={`${s.stack} ${s.narrow}`}>
          <form onSubmit={handleScore} className="card admin-form-card">
            <div className="admin-form-stack">
              <div className="field">
                <label htmlFor="revenue">Annual taxable revenue (AED)</label>
                <input
                  type="number"
                  inputMode="decimal"
                  id="revenue"
                  min="0"
                  value={revenue}
                  onChange={(e) => {
                    setRevenue(e.target.value);
                    setResult(null);
                    setError(null);
                  }}
                  placeholder="375000"
                  required
                />
              </div>

              <div className="field">
                <label htmlFor="businessType">Primary client type</label>
                <select
                  id="businessType"
                  value={businessType}
                  onChange={(e) => {
                    setBusinessType(e.target.value);
                    setResult(null);
                    setError(null);
                  }}
                >
                  {VAT_BUSINESS_TYPE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="admin-form-actions">
              <button type="submit" className="btn btn-primary">Evaluate VAT status</button>
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
              <div className={`card ${result.isMandatory ? s.cardWarn : s.cardGood}`}>
                <div className={s.rowStart}>
                  {result.isMandatory ? <WarningCircle size={22} className={s.warn} /> : <CheckCircle size={22} className={s.good} />}
                  <h2 className={s.h3}>{result.title}</h2>
                </div>

                <div className={s.cells} style={{ margin: 'var(--space-4) 0' }}>
                  <div className={s.cell}>
                    <span className={s.metricLabel}>Mandatory threshold</span>
                    <strong>{formatAED(VAT_THRESHOLD_MANDATORY)}</strong>
                  </div>
                  <div className={s.cell}>
                    <span className={s.metricLabel}>Voluntary threshold</span>
                    <strong>{formatAED(VAT_THRESHOLD_VOLUNTARY)}</strong>
                  </div>
                </div>

                <p className={s.body}>{result.description}</p>

                <div className={s.cta}>
                  <span className={s.muted}>Need VAT registration filing &amp; TRN?</span>
                  <Link href="/services" className={s.link}>
                    Book VAT service <ArrowRight size={16} />
                  </Link>
                </div>
              </div>

              <ContactCaptureGate
                sourceTool="vat_scorer"
                toolInput={{ revenue: Number(revenue), businessType }}
                toolResult={result as unknown as Record<string, unknown>}
              />
            </>
          )}
        </div>
      </main>
    </>
  );
}
