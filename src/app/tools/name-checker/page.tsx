"use client";

import React, { useState } from "react";
import BannerHeader from "@/components/portal/BannerHeader";
import { CheckCircle, XCircle, ArrowRight } from "@phosphor-icons/react";
import Link from "next/link";
import { checkAvailability, type CheckResult } from "@/lib/tools/name-checker";
import ContactCaptureGate from "@/components/portal/ContactCaptureGate";
import s from "../tools.module.css";

export default function NameChecker() {
  const [name, setName] = useState("");
  const [result, setResult] = useState<CheckResult | null>(null);

  const handleCheck = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setResult(checkAvailability(name));
  };

  return (
    <>
      <BannerHeader
        title="Company Name Availability Checker"
        subtitle="Instantly test your desired corporate entity name against UAE and GCC registry conventions."
      />

      <main className={`wrap ${s.main}`}>
        <div className={`${s.stack} ${s.narrow}`}>
          <form onSubmit={handleCheck} className="card admin-form-card">
            <div className="admin-form-stack">
              <div className="field">
                <label htmlFor="companyName">Desired company name</label>
                <input
                  type="text"
                  id="companyName"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    setResult(null);
                  }}
                  placeholder="e.g. Apex Frontier Solutions"
                />
              </div>
            </div>
            <div className="admin-form-actions">
              <button type="submit" disabled={!name.trim()} className="btn btn-primary">
                Check availability
              </button>
            </div>
          </form>

          {result && (
            <>
              <div className={`card ${result.isAvailable ? s.cardGood : s.cardWarn}`}>
                <div className={s.rowStart}>
                  {result.isAvailable ? <CheckCircle size={22} className={s.good} /> : <XCircle size={22} className={s.warn} />}
                  <h2 className={s.h3}>
                    {result.isAvailable ? 'Name is likely available' : 'Requires approval / restricted words found'}
                  </h2>
                </div>

                <p className={s.body} style={{ margin: 'var(--space-3) 0' }}>{result.reason}</p>

                <div className={s.cell}>
                  <span className={s.metricLabel}>Recommended available formats &amp; alternatives</span>
                  <div className={s.chips} style={{ marginTop: 'var(--space-2)' }}>
                    {result.alternatives.map((alt, i) => (
                      <span key={i} className={s.chip}>{alt}</span>
                    ))}
                  </div>
                </div>

                <div className={s.cta}>
                  <span className={s.muted}>Ready to reserve this name?</span>
                  <Link href="/services" className={s.link}>
                    Reserve with company formation <ArrowRight size={16} />
                  </Link>
                </div>
              </div>

              <ContactCaptureGate
                sourceTool="name_checker"
                toolInput={{ name }}
                toolResult={result as unknown as Record<string, unknown>}
              />
            </>
          )}
        </div>
      </main>
    </>
  );
}
