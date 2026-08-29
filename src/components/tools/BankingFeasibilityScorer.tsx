'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Landmark, CheckCircle2, ArrowRight, ShieldCheck } from 'lucide-react';

export default function BankingFeasibilityScorer() {
  const [businessType, setBusinessType] = useState('ecommerce');
  const [targetEntity, setTargetEntity] = useState('hk');
  const [monthlyVolume, setMonthlyVolume] = useState('50k_200k');

  const getFeasibilityResults = () => {
    if (targetEntity === 'hk' || targetEntity === 'singapore') {
      return [
        { bank: 'Airwallex (Multi-Currency)', odds: 98, status: 'Pre-Approved', time: '5-7 Days', type: 'Fintech / Global ACH' },
        { bank: 'Wise Business', odds: 95, status: 'Pre-Approved', time: '3-5 Days', type: 'Cross-Border IBAN' },
        { bank: 'Statrys / Payoneer', odds: 92, status: 'Eligible', time: '7-10 Days', type: 'E-Commerce Merchant' },
        { bank: 'HSBC / Standard Chartered', odds: 65, status: 'Requires In-Person Visit', time: '30-45 Days', type: 'Tier 1 Physical' },
      ];
    } else {
      return [
        { bank: 'Wio Bank (UAE Digital)', odds: 96, status: 'Fast-Track', time: '3-5 Days', type: 'Instant Corporate AED/USD' },
        { bank: 'Emirates NBD Business', odds: 88, status: 'Physical Banker Interview', time: '15-20 Days', type: 'Tier 1 UAE National' },
        { bank: 'FAB / RAK Bank', odds: 84, status: 'Eligible', time: '20-25 Days', type: 'GCC Regional' },
        { bank: 'Airwallex International', odds: 95, status: 'Pre-Approved', time: '5-7 Days', type: 'Global Collections' },
      ];
    }
  };

  const results = getFeasibilityResults();

  return (
    <div className="card bank-card">
      <div className="bank-header">
        <div className="badge badge-blue">
          <Landmark className="w-3.5 h-3.5" />
          <span>CROSS-BORDER BANKING MATCH ENGINE</span>
        </div>
        <h2 className="title display-font">
          Corporate Banking <span className="text-orange">Feasibility & Approval</span> Scorer
        </h2>
        <p className="subtitle">
          Test your approval odds across 10+ international fintech & physical banks before paying for company formation.
        </p>
      </div>

      {/* 3 Config Selectors */}
      <div className="selectors-grid">
        <div className="select-box">
          <label className="input-label">1. Primary Business Activity:</label>
          <select
            value={businessType}
            onChange={(e) => setBusinessType(e.target.value)}
            className="input-field"
          >
            <option value="ecommerce">E-Commerce / Amazon FBA / Shopify</option>
            <option value="saas">SaaS & Software Services</option>
            <option value="consulting">Agency / Digital Marketing / Consulting</option>
            <option value="crypto">Web3 / Crypto Advisory</option>
            <option value="trading">General International Trading</option>
          </select>
        </div>

        <div className="select-box">
          <label className="input-label">2. Target Company Jurisdiction:</label>
          <select
            value={targetEntity}
            onChange={(e) => setTargetEntity(e.target.value)}
            className="input-field"
          >
            <option value="hk">Hong Kong (Fast Fintech Setup)</option>
            <option value="uae">UAE Freezone (Wio + Emirates NBD)</option>
            <option value="singapore">Singapore (ACRA + Airwallex)</option>
            <option value="bahrain">Bahrain (0% Regional Gateway)</option>
          </select>
        </div>

        <div className="select-box">
          <label className="input-label">3. Expected Monthly Volume:</label>
          <select
            value={monthlyVolume}
            onChange={(e) => setMonthlyVolume(e.target.value)}
            className="input-field"
          >
            <option value="sub_50k">&lt; $50,000 / month</option>
            <option value="50k_200k">$50,000 – $200,000 / month</option>
            <option value="200k_1m">$200,000 – $1,000,000 / month</option>
            <option value="1m_plus">$1,000,000+ / month (Enterprise)</option>
          </select>
        </div>
      </div>

      {/* Results Bank Odds Matrix */}
      <div className="bank-results-grid">
        {results.map((r, i) => (
          <div key={i} className="bank-item card card-hover">
            <div className="bank-item-top">
              <span className="bank-name display-font">{r.bank}</span>
              <span className="badge badge-orange">{r.odds}% ODDS</span>
            </div>
            <div className="bank-details">
              <span><strong>Type:</strong> {r.type}</span>
              <span><strong>Turnaround:</strong> {r.time}</span>
              <span className="text-navy font-bold"><strong>Status:</strong> {r.status}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Guarantee Footnote & Action */}
      <div className="bank-footer card-sand">
        <div className="guarantee-text">
          <ShieldCheck className="w-5 h-5 text-success inline mr-2" />
          <span>
            <strong>Money-Back Bank Guarantee:</strong> We guarantee opening of at least 1 verified business banking account or refund your banking setup fee.
          </span>
        </div>
        <Link href={`/setup?country=${targetEntity}&banking=true`} className="btn btn-primary">
          <span>Apply with Guaranteed Banking</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      <style jsx>{`
        .bank-card {
          padding: 36px 32px;
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .bank-header {
          text-align: center;
          max-width: 680px;
          margin: 0 auto;
        }

        .title {
          font-size: 2rem;
          font-weight: 700;
          color: var(--navy);
          margin: 8px 0;
        }

        .subtitle {
          color: var(--text-secondary);
          font-size: 15px;
        }

        .selectors-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 14px;
        }

        .bank-results-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
        }

        @media (max-width: 768px) {
          .bank-results-grid {
            grid-template-columns: 1fr;
          }
        }

        .bank-item {
          padding: 18px;
          border-radius: var(--radius);
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .bank-item-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .bank-name {
          font-weight: 700;
          font-size: 15px;
          color: var(--navy);
        }

        .bank-details {
          display: flex;
          flex-direction: column;
          gap: 4px;
          font-size: 13px;
          color: var(--text-secondary);
        }

        .font-bold {
          font-weight: 700;
        }

        .bank-footer {
          padding: 20px 24px;
          border-radius: var(--radius);
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
        }

        @media (max-width: 768px) {
          .bank-footer {
            flex-direction: column;
            text-align: center;
          }
        }

        .guarantee-text {
          font-size: 14px;
          color: var(--navy);
          max-width: 620px;
        }
      `}</style>
    </div>
  );
}
