'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import BannerHeader from '@/components/portal/BannerHeader';
import { ArrowRight, CircleNotch, TrendDown } from '@phosphor-icons/react';
import {
  CALCULATOR_COUNTRIES,
  CALCULATOR_TARGETS,
  mapCalculatorResponse,
  type CalculatorResult,
} from '@/lib/tools/tax-calculator';
import ContactCaptureGate from '@/components/portal/ContactCaptureGate';
import s from '../tools.module.css';

export default function TaxCalculator() {
  const [countryResidence, setCountryResidence] = useState('US');
  const [targetJurisdiction, setTargetJurisdiction] = useState('uae');
  const [annualProfit, setAnnualProfit] = useState<number | ''>(250000);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CalculatorResult | null>(null);
  const [error, setError] = useState('');

  const handleCalculate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!annualProfit || annualProfit <= 0) return;
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const res = await fetch('/api/calculator/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          country_residence: countryResidence,
          target_jurisdiction: targetJurisdiction,
          annual_profit: Number(annualProfit),
        }),
      });
      const mapped = res.ok ? mapCalculatorResponse(await res.json()) : null;
      if (mapped) setResult(mapped);
      else setError('We could not calculate your savings right now. Please try again.');
    } catch {
      setError('We could not calculate your savings right now. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fmtUSD = (n: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);

  return (
    <>
      <BannerHeader title="Tax Savings Calculator" subtitle="Compare your current tax bill with a new jurisdiction." />

      <main className={`wrap ${s.main}`}>
        <div className={`${s.stack} ${s.narrow}`}>
          <form onSubmit={handleCalculate} className="card admin-form-card">
            <div className="admin-form-stack">
              <div className="field">
                <label htmlFor="countryResidence">Current country of operations / tax residence</label>
                <select
                  id="countryResidence"
                  value={countryResidence}
                  onChange={(e) => {
                    setCountryResidence(e.target.value);
                    setResult(null);
                    setError('');
                  }}
                >
                  {CALCULATOR_COUNTRIES.map((c) => (
                    <option key={c.code} value={c.code}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="field">
                <label htmlFor="targetJurisdiction">Target relocation / formation jurisdiction</label>
                <select
                  id="targetJurisdiction"
                  value={targetJurisdiction}
                  onChange={(e) => {
                    setTargetJurisdiction(e.target.value);
                    setResult(null);
                    setError('');
                  }}
                >
                  {CALCULATOR_TARGETS.map((j) => (
                    <option key={j.code} value={j.code}>{j.name}</option>
                  ))}
                </select>
              </div>

              <div className="field">
                <label htmlFor="annualProfit">Estimated annual net business profit (USD)</label>
                <input
                  id="annualProfit"
                  type="number"
                  inputMode="decimal"
                  value={annualProfit}
                  onChange={(e) => {
                    setAnnualProfit(e.target.value === '' ? '' : Number(e.target.value));
                    setResult(null);
                    setError('');
                  }}
                  placeholder="250000"
                  required
                />
              </div>
            </div>

            <div className="admin-form-actions">
              <button type="submit" disabled={loading || !annualProfit} className="btn btn-primary">
                {loading ? <CircleNotch className={s.spin} /> : <TrendDown />}
                {loading ? 'Calculating taxes…' : 'Calculate potential savings'}
              </button>
            </div>
          </form>

          {error && (
            <div role="alert" className="admin-callout is-error">{error}</div>
          )}

          {result && (
            <>
              <div className="card">
                <span className={s.metricLabel}>Estimated annual tax savings</span>
                <div className={s.hero}>{fmtUSD(result.savings)}</div>
                <p className={s.muted}>Per year retained in your business treasury</p>
              </div>

              <div className={`admin-metrics-grid ${s.metrics}`}>
                <div className="card">
                  <span className={s.metricLabel}>Current home country tax</span>
                  <span className={s.metricValue}>{fmtUSD(result.currentTax)}</span>
                </div>
                <div className="card">
                  <span className={s.metricLabel}>New jurisdiction tax</span>
                  <span className={`${s.metricValue} ${s.good}`}>{fmtUSD(result.targetTax)}</span>
                </div>
              </div>

              <div className={`card ${s.row}`}>
                <div>
                  <h2 className={s.h3}>Form a tax-optimized entity</h2>
                  <p className={s.muted}>Fast-track incorporation in 3–5 working days</p>
                </div>
                <Link href="/services" className={s.link}>
                  View packages <ArrowRight size={16} />
                </Link>
              </div>

              <ContactCaptureGate
                sourceTool="tax_calculator"
                toolInput={{ countryResidence, targetJurisdiction, annualProfit: Number(annualProfit) }}
                toolResult={result as unknown as Record<string, unknown>}
              />
            </>
          )}
        </div>
      </main>
    </>
  );
}
