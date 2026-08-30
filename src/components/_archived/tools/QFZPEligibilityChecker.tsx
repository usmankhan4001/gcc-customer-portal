'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ShieldCheck, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';

export default function QFZPEligibilityChecker() {
  const [inFreezone, setInFreezone] = useState<boolean | null>(true);
  const [qualifyingActivity, setQualifyingActivity] = useState<boolean | null>(true);
  const [adequateSubstance, setAdequateSubstance] = useState<boolean | null>(true);
  const [deMinimisPass, setDeMinimisPass] = useState<boolean | null>(true);

  const isEligible = inFreezone && qualifyingActivity && adequateSubstance && deMinimisPass;

  return (
    <div className="card qfzp-container">
      <div className="qfzp-header">
        <div className="badge badge-blue">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>UAE CABINET DECISION NO. 55 COMPLIANCE</span>
        </div>
        <h2 className="title display-font">
          UAE Free Zone <span className="text-orange">0% Corporate Tax</span> Qualifier
        </h2>
        <p className="subtitle">
          Test if your UAE entity qualifies as a Qualifying Free Zone Person (QFZP) to enjoy a legally binding 0% Corporate Tax rate.
        </p>
      </div>

      {/* 4 Diagnostic Questions */}
      <div className="questions-grid">
        {/* Q1 */}
        <div className="question-box card-sand">
          <div className="q-title">
            <span>1. Registered in a Designated Free Zone?</span>
          </div>
          <p className="q-desc">Is your company registered in a recognized UAE Freezone (e.g. IFZA, DMCC, Meydan, DAFZA)?</p>
          <div className="btn-toggle-group">
            <button
              onClick={() => setInFreezone(true)}
              className={`toggle-btn ${inFreezone === true ? 'active-yes' : ''}`}
            >
              Yes (Freezone)
            </button>
            <button
              onClick={() => setInFreezone(false)}
              className={`toggle-btn ${inFreezone === false ? 'active-no' : ''}`}
            >
              No (Mainland)
            </button>
          </div>
        </div>

        {/* Q2 */}
        <div className="question-box card-sand">
          <div className="q-title">
            <span>2. Qualifying Activity Revenue?</span>
          </div>
          <p className="q-desc">Does revenue come from qualifying activities (e.g. holding shares, logistics, software, or trades with foreign persons)?</p>
          <div className="btn-toggle-group">
            <button
              onClick={() => setQualifyingActivity(true)}
              className={`toggle-btn ${qualifyingActivity === true ? 'active-yes' : ''}`}
            >
              Yes (Qualifying)
            </button>
            <button
              onClick={() => setQualifyingActivity(false)}
              className={`toggle-btn ${qualifyingActivity === false ? 'active-no' : ''}`}
            >
              No (Local Retail)
            </button>
          </div>
        </div>

        {/* Q3 */}
        <div className="question-box card-sand">
          <div className="q-title">
            <span>3. Adequate Economic Substance?</span>
          </div>
          <p className="q-desc">Do you maintain adequate assets, operating expenditure, and staff/directors in the UAE?</p>
          <div className="btn-toggle-group">
            <button
              onClick={() => setAdequateSubstance(true)}
              className={`toggle-btn ${adequateSubstance === true ? 'active-yes' : ''}`}
            >
              Yes (Verified)
            </button>
            <button
              onClick={() => setAdequateSubstance(false)}
              className={`toggle-btn ${adequateSubstance === false ? 'active-no' : ''}`}
            >
              No / Unsure
            </button>
          </div>
        </div>

        {/* Q4 */}
        <div className="question-box card-sand">
          <div className="q-title">
            <span>4. De Minimis Threshold Rule?</span>
          </div>
          <p className="q-desc">Is non-qualifying local revenue below 5% of total revenue or AED 5,000,000?</p>
          <div className="btn-toggle-group">
            <button
              onClick={() => setDeMinimisPass(true)}
              className={`toggle-btn ${deMinimisPass === true ? 'active-yes' : ''}`}
            >
              Yes (&lt;5% threshold)
            </button>
            <button
              onClick={() => setDeMinimisPass(false)}
              className={`toggle-btn ${deMinimisPass === false ? 'active-no' : ''}`}
            >
              Exceeds 5%
            </button>
          </div>
        </div>
      </div>

      {/* Result Certificate Box */}
      <div className={`score-card ${isEligible ? 'card-blue-lt' : 'card-sand'}`}>
        <div className="score-icon-box">
          {isEligible ? (
            <CheckCircle2 className="w-10 h-10 text-success" />
          ) : (
            <AlertTriangle className="w-10 h-10 text-warning" />
          )}
        </div>
        <div className="score-details">
          <span className="score-status display-font text-navy">
            {isEligible ? '100% QUALIFIED: 0% CORPORATE TAX' : 'STANDARD 9% CORPORATE TAX RATE'}
          </span>
          <p className="score-explanation">
            {isEligible
              ? 'Your proposed business structure meets all conditions under UAE Federal Decree-Law No. 47 of 2022 to maintain a legally verified 0% Corporate Tax status.'
              : 'One or more criteria triggers the standard 9% UAE rate on taxable profit exceeding AED 375,000. Our tax structuring directors can help optimize your setup to qualify.'}
          </p>
        </div>

        <Link href="/setup?country=uae&qfzp=true" className="btn btn-primary">
          <span>{isEligible ? 'Form 0% QFZP Company' : 'Structure for 0% Compliance'}</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      <style jsx>{`
        .qfzp-container {
          padding: 36px 32px;
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .qfzp-header {
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

        .questions-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 16px;
        }

        .question-box {
          padding: 20px;
          border-radius: var(--radius);
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          gap: 12px;
        }

        .q-title {
          font-weight: 700;
          font-size: 15px;
          color: var(--navy);
        }

        .q-desc {
          font-size: 13px;
          color: var(--text-secondary);
          line-height: 1.4;
        }

        .btn-toggle-group {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
        }

        .toggle-btn {
          padding: 9px 12px;
          border-radius: var(--radius-pill);
          font-size: 13px;
          font-weight: 700;
          background: var(--surface);
          border: 1px solid var(--border);
          color: var(--text-secondary);
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .toggle-btn.active-yes {
          background: var(--navy);
          border-color: var(--navy);
          color: #FFFFFF;
        }

        .toggle-btn.active-no {
          background: var(--error-lt);
          border-color: var(--error);
          color: var(--error);
        }

        .score-card {
          padding: 24px;
          border-radius: var(--radius);
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
        }

        @media (max-width: 768px) {
          .score-card {
            flex-direction: column;
            text-align: center;
          }
        }

        .score-status {
          font-size: 1.25rem;
          font-weight: 700;
          margin-bottom: 4px;
          display: block;
        }

        .score-explanation {
          font-size: 14px;
          color: var(--text-secondary);
          line-height: 1.4;
        }
      `}</style>
    </div>
  );
}
