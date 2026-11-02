"use client";

import React, { useState } from "react";
import Link from "next/link";
import BannerHeader from "@/components/portal/BannerHeader";
import {
  calculateBankingOddsForIndustry,
  BANKING_INDUSTRY_OPTIONS,
  type BankOddsResult,
} from "@/lib/tools/banking-odds";
import ContactCaptureGate from "@/components/portal/ContactCaptureGate";
import s from "../tools.module.css";

export default function BankingOddsMatcher() {
  const [industry, setIndustry] = useState("");
  const [turnover, setTurnover] = useState<number | "">("");
  const [results, setResults] = useState<BankOddsResult[] | null>(null);

  const handleCalculate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!industry || turnover === "") return;
    setResults(calculateBankingOddsForIndustry(industry, Number(turnover)));
  };

  const handleIndustryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setIndustry(e.target.value);
    setResults(null);
  };

  const handleTurnoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTurnover(e.target.value === "" ? "" : Number(e.target.value));
    setResults(null);
  };

  return (
    <>
      <BannerHeader title="Banking Odds" subtitle="Estimate your corporate bank account approval odds." />

      <main className={`wrap ${s.main}`}>
        <form onSubmit={handleCalculate} className={`card admin-form-card ${s.narrow}`}>
          <div className="admin-form-stack">
            <div className="field">
              <label htmlFor="industry">Industry</label>
              <select id="industry" value={industry} onChange={handleIndustryChange}>
                <option value="">Select industry</option>
                {BANKING_INDUSTRY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="field">
              <label htmlFor="turnover">Annual turnover ($)</label>
              <input
                id="turnover"
                type="number"
                inputMode="decimal"
                value={turnover}
                onChange={handleTurnoverChange}
                placeholder="150000"
              />
            </div>
          </div>

          <div className="admin-form-actions">
            <button type="submit" disabled={!industry || turnover === ""} className="btn btn-primary">
              Calculate approval odds
            </button>
          </div>
        </form>

        {results && (
          <div className={`${s.stack} ${s.medium}`}>
            <h2 className={s.h2}>Your bank approval estimates</h2>

            <div className={s.grid}>
              {results.map((result, idx) => (
                <div key={idx} className={`card ${s.row}`}>
                  <div>
                    <h3 className={s.h3}>{result.bank}</h3>
                    <p className={s.muted}>Corporate account</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span className={s.metricValue}>{result.odds}%</span>
                    <span className={`badge ${result.odds > 80 ? 'badge-success' : result.odds > 50 ? 'badge-accent' : 'badge-danger'}`}>
                      {result.label}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="card">
              <h3 className={s.h3}>Need guaranteed banking support?</h3>
              <p className={s.muted} style={{ margin: 'var(--space-2) 0 var(--space-3)' }}>
                Our banking compliance officers manage relationship officer submissions, compliance files, and fast-track opening.
              </p>
              <Link href="/services" className="btn btn-primary">
                Explore Banking Concierge
              </Link>
            </div>

            <ContactCaptureGate
              sourceTool="banking_odds"
              toolInput={{ industry, turnover: Number(turnover) }}
              toolResult={{ results }}
            />
          </div>
        )}
      </main>
    </>
  );
}
