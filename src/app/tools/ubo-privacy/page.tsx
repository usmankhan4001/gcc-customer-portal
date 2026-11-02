"use client";

import React, { useState } from "react";
import Link from "next/link";
import BannerHeader from '@/components/portal/BannerHeader';
import { ShieldCheck, ShieldWarning, ArrowRight } from "@phosphor-icons/react";
import {
  checkExposure,
  type PrivacyResult,
  UBO_JURISDICTION_OPTIONS,
} from '@/lib/tools/ubo-privacy';
import ContactCaptureGate from '@/components/portal/ContactCaptureGate';
import s from '../tools.module.css';

export default function UBOPrivacyChecker() {
  const [jurisdiction, setJurisdiction] = useState("uae");
  const [result, setResult] = useState<PrivacyResult | null>(null);

  const checkPrivacy = (e: React.FormEvent) => {
    e.preventDefault();
    setResult(checkExposure(jurisdiction));
  };

  const isLow = result?.exposureLevel === 'low';

  return (
    <>
      <BannerHeader
        title="UBO Privacy & Registry Checker"
        subtitle="Check whether your identity, address, and shareholding will be visible on public government registries."
      />

      <main className={`wrap ${s.main}`}>
        <div className={`${s.stack} ${s.narrow}`}>
          <form onSubmit={checkPrivacy} className="card admin-form-card">
            <div className="admin-form-stack">
              <div className="field">
                <label htmlFor="jurisdiction">Target formation</label>
                <select
                  id="jurisdiction"
                  value={jurisdiction}
                  onChange={(e) => {
                    setJurisdiction(e.target.value);
                    setResult(null);
                  }}
                >
                  {UBO_JURISDICTION_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="admin-form-actions">
              <button type="submit" className="btn btn-primary">Analyze public exposure risk</button>
            </div>
          </form>

          {result && (
            <>
              <div className="card">
                <div className={s.row}>
                  <div className={s.rowStart}>
                    {isLow ? <ShieldCheck size={24} className={s.good} /> : <ShieldWarning size={24} className={s.warn} />}
                    <h2 className={s.h3}>{result.jurisdiction}</h2>
                  </div>
                  <span className={`badge ${isLow ? 'badge-success' : 'badge-danger'}`}>{result.exposureLabel}</span>
                </div>

                <div className={s.cells} style={{ margin: 'var(--space-4) 0' }}>
                  <div className={s.cell}>
                    <span className={s.metricLabel}>Public online registry</span>
                    <strong>
                      {result.publicRegistryLabel ?? (result.publicRegistry ? "Yes (publicly searchable)" : "No (confidential)")}
                    </strong>
                  </div>
                  <div className={s.cell}>
                    <span className={s.metricLabel}>UBO protection</span>
                    <strong>
                      {result.uboProtectionLabel ?? (result.uboConfidential ? "Protected" : "Disclosed online")}
                    </strong>
                  </div>
                </div>

                <p className={s.body}>{result.recommendation}</p>

                <div className={s.cta}>
                  <span className={s.muted}>Need nominee director or holding privacy?</span>
                  <Link href="/services" className={s.link}>
                    Explore nominee &amp; holding tier <ArrowRight size={16} />
                  </Link>
                </div>
              </div>

              <ContactCaptureGate
                sourceTool="ubo_privacy"
                toolInput={{ jurisdiction }}
                toolResult={result as unknown as Record<string, unknown>}
              />
            </>
          )}
        </div>
      </main>
    </>
  );
}
