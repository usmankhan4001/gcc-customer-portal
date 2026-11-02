"use client";

import React, { useState } from "react";
import BannerHeader from "@/components/portal/BannerHeader";
import { ArrowRight, ShieldCheck, Warning } from "@phosphor-icons/react";
import Link from "next/link";
import {
  evaluateQFZPEligibility,
  QFZP_ACTIVITIES,
  type QFZPActivity,
} from "@/lib/tools/qfzp-eligibility";
import ContactCaptureGate from "@/components/portal/ContactCaptureGate";
import s from "../tools.module.css";

export default function QFZPEligibilityChecker() {
  const [activity, setActivity] = useState<QFZPActivity>("Tech");
  const [hasSubstance, setHasSubstance] = useState(true);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  const handleActivityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setActivity(e.target.value as QFZPActivity);
    setSubmitted(false);
  };

  const handleSubstanceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setHasSubstance(e.target.checked);
    setSubmitted(false);
  };

  const result = evaluateQFZPEligibility({ activity, hasSubstance });

  return (
    <>
      <BannerHeader
        title="0% Corporate Tax (QFZP) Checker"
        subtitle="Under UAE Cabinet Decision No. 55/2023, qualifying free zone income is subject to 0% Corporate Tax."
      />

      <main className={`wrap ${s.main}`}>
        <div className={`${s.stack} ${s.narrow}`}>
          <form onSubmit={handleSubmit} className="card admin-form-card">
            <div className="admin-form-stack">
              <div className="field">
                <label htmlFor="activity">Business activity</label>
                <select id="activity" value={activity} onChange={handleActivityChange}>
                  {QFZP_ACTIVITIES.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <label className={s.check}>
                <input type="checkbox" checked={hasSubstance} onChange={handleSubstanceChange} />
                <span>Will maintain physical/flexi office lease in a UAE Free Zone (adequate substance)</span>
              </label>
            </div>
            <div className="admin-form-actions">
              <button type="submit" className="btn btn-primary">Evaluate 0% tax eligibility</button>
            </div>
          </form>

          {submitted && (
            <>
              <div className={`card ${result.isLikelyEligible ? s.cardGood : s.cardWarn}`}>
                <div className={s.rowStart}>
                  {result.isLikelyEligible ? (
                    <ShieldCheck size={28} className={s.good} />
                  ) : (
                    <Warning size={28} className={s.warn} />
                  )}
                  <div className={s.grow}>
                    <h2 className={s.h3}>{result.headline}</h2>
                    <p className={s.body} style={{ marginTop: 'var(--space-2)' }}>{result.description}</p>
                  </div>
                </div>

                <div className={s.cta}>
                  <span className={s.muted}>Need help structuring your 0% corporate tax return?</span>
                  <Link href="/services" className={s.link}>
                    Consult tax specialist <ArrowRight size={16} />
                  </Link>
                </div>
              </div>

              <ContactCaptureGate
                sourceTool="qfzp_eligibility"
                toolInput={{ activity, hasSubstance }}
                toolResult={result as unknown as Record<string, unknown>}
              />
            </>
          )}
        </div>
      </main>
    </>
  );
}
