'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Receipt, AlertOctagon, CheckCircle2, ArrowRight, Clock } from 'lucide-react';

export default function VATThresholdScorer() {
  const [revenueAed, setRevenueAed] = useState(420000);

  const MANDATORY_LIMIT = 375000;
  const VOLUNTARY_LIMIT = 187500;

  const isMandatory = revenueAed >= MANDATORY_LIMIT;
  const isVoluntary = revenueAed >= VOLUNTARY_LIMIT && revenueAed < MANDATORY_LIMIT;

  return (
    <div className="card vat-card">
      <div className="vat-header">
        <div className="badge badge-navy">
          <Receipt className="w-3.5 h-3.5" />
          <span>UAE FEDERAL TAX AUTHORITY (FTA) COMPLIANCE</span>
        </div>
        <h2 className="title display-font">
          UAE VAT & Mandatory <span className="text-orange">TRN Threshold</span> Scorer
        </h2>
        <p className="subtitle">
          Calculate if your business is legally obligated to register for 5% VAT and obtain an official Tax Registration Number (TRN) to avoid AED 10,000 late penalties.
        </p>
      </div>

      {/* Interactive Revenue Slider */}
      <div className="slider-box card-sand">
        <div className="slider-top">
          <label className="input-label mb-0">Annual UAE Taxable Turnover & Supplies:</label>
          <div className="aed-display display-font text-navy">
            AED {revenueAed.toLocaleString()}
          </div>
        </div>

        <input
          type="range"
          min={50000}
          max={1200000}
          step={25000}
          value={revenueAed}
          onChange={(e) => setRevenueAed(Number(e.target.value))}
          className="w-full"
        />

        <div className="threshold-markers">
          <div className="marker" style={{ left: '15%' }}>
            <span className="marker-line" />
            <span className="marker-label">AED 187.5k (Voluntary)</span>
          </div>
          <div className="marker" style={{ left: '32%' }}>
            <span className="marker-line mandatory" />
            <span className="marker-label mandatory">AED 375k (Mandatory)</span>
          </div>
        </div>
      </div>

      {/* Result Status Banner */}
      <div className={`status-box ${isMandatory ? 'card-orange-lt' : isVoluntary ? 'card-sand' : 'card-blue-lt'}`}>
        <div className="status-icon">
          {isMandatory ? (
            <AlertOctagon className="w-8 h-8 text-orange" />
          ) : isVoluntary ? (
            <Clock className="w-8 h-8 text-navy" />
          ) : (
            <CheckCircle2 className="w-8 h-8 text-success" />
          )}
        </div>

        <div className="status-info">
          <span className="status-badge display-font text-navy">
            {isMandatory
              ? '⚠️ MANDATORY VAT REGISTRATION REQUIRED'
              : isVoluntary
              ? 'OPTIONAL / VOLUNTARY VAT REGISTRATION'
              : 'BELOW REGISTRATION THRESHOLD'}
          </span>
          <p className="status-text">
            {isMandatory
              ? 'Your turnover exceeds the statutory AED 375,000 threshold. You must submit your VAT registration to the FTA within 20 business days to avoid an immediate AED 10,000 late registration fine.'
              : isVoluntary
              ? 'You are eligible to voluntarily register for VAT (AED 187,500+) to claim input tax credits on commercial office leases and equipment expenses.'
              : 'Your revenue is below the voluntary threshold. You are not required to charge 5% VAT or register a TRN with the Federal Tax Authority.'}
          </p>
        </div>

        <Link
          href={`/setup?service=trn-vat&turnover=${revenueAed}`}
          className="btn btn-primary"
        >
          <span>{isMandatory ? 'Fast-Track TRN Registration ($350)' : 'Explore TRN Filing'}</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      <style jsx>{`
        .vat-card {
          padding: 36px 32px;
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .vat-header {
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

        .slider-box {
          padding: 24px 20px 36px 20px;
          border-radius: var(--radius);
          position: relative;
        }

        .slider-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .mb-0 {
          margin-bottom: 0;
        }

        .aed-display {
          font-size: 1.6rem;
          font-weight: 700;
        }

        .threshold-markers {
          position: relative;
          width: 100%;
          height: 20px;
          margin-top: 10px;
        }

        .marker {
          position: absolute;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .marker-line {
          width: 2px;
          height: 8px;
          background: var(--text-tertiary);
          margin-bottom: 4px;
        }

        .marker-line.mandatory {
          background: var(--orange);
        }

        .marker-label {
          font-size: 11px;
          font-weight: 600;
          color: var(--text-tertiary);
          white-space: nowrap;
        }

        .marker-label.mandatory {
          color: var(--orange);
          font-weight: 700;
        }

        .status-box {
          padding: 24px;
          border-radius: var(--radius);
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
        }

        @media (max-width: 768px) {
          .status-box {
            flex-direction: column;
            text-align: center;
          }
        }

        .status-badge {
          font-size: 1.15rem;
          font-weight: 700;
          display: block;
          margin-bottom: 4px;
        }

        .status-text {
          font-size: 14px;
          color: var(--text-secondary);
          line-height: 1.4;
        }
      `}</style>
    </div>
  );
}
