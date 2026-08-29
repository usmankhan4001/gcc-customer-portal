'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Eye, EyeOff, ShieldCheck, Lock, ArrowRight, Search } from 'lucide-react';

export default function UBOPrivacyChecker() {
  const [jurisdiction, setJurisdiction] = useState<'hk' | 'uae' | 'uk' | 'singapore'>('hk');
  const [tierSelection, setTierSelection] = useState<'tier1' | 'tier2'>('tier2');

  const registrySpecs = {
    hk: { name: 'Hong Kong Companies Registry (CR)', publicSearch: true, directorPublic: true, uboPublic: false },
    uk: { name: 'UK Companies House (PSC Register)', publicSearch: true, directorPublic: true, uboPublic: true },
    singapore: { name: 'Singapore ACRA BizFile+', publicSearch: true, directorPublic: true, uboPublic: false },
    uae: { name: 'UAE Freezone Registry (e.g. IFZA)', publicSearch: false, directorPublic: false, uboPublic: false },
  };

  return (
    <div className="card privacy-card">
      <div className="privacy-header">
        <div className="badge badge-blue">
          <Lock className="w-3.5 h-3.5" />
          <span>CORPORATE VEIL & REGISTRY VISIBILITY AUDIT</span>
        </div>
        <h2 className="title display-font">
          UBO Privacy & <span className="text-orange">Nominee Protection</span> Score
        </h2>
        <p className="subtitle">
          See how your identity appears on official public registries and how our Tier 2 Nominee Director & Shareholder structure provides 100% legal privacy.
        </p>
      </div>

      {/* Country Selection Tabs */}
      <div className="jurisdiction-tabs">
        {(Object.keys(registrySpecs) as Array<'hk' | 'uae' | 'uk' | 'singapore'>).map((k) => (
          <button
            key={k}
            onClick={() => setJurisdiction(k)}
            className={`tab-btn ${jurisdiction === k ? 'active' : ''}`}
          >
            {k.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Registry Specifications for Selected Jurisdiction */}
      <div className="registry-info card-sand">
        <div className="registry-title">{registrySpecs[jurisdiction].name}</div>
        <div className="registry-specs">
          <span className={`spec-item ${registrySpecs[jurisdiction].publicSearch ? 'spec-yes' : 'spec-no'}`}>
            Public Search: <strong>{registrySpecs[jurisdiction].publicSearch ? 'Yes' : 'No'}</strong>
          </span>
          <span className={`spec-item ${registrySpecs[jurisdiction].directorPublic ? 'spec-yes' : 'spec-no'}`}>
            Director Public: <strong>{registrySpecs[jurisdiction].directorPublic ? 'Yes' : 'No'}</strong>
          </span>
          <span className={`spec-item ${registrySpecs[jurisdiction].uboPublic ? 'spec-yes' : 'spec-no'}`}>
            UBO Public: <strong>{registrySpecs[jurisdiction].uboPublic ? 'Yes' : 'No'}</strong>
          </span>
        </div>
      </div>

      {/* Comparison Grid: Tier 1 vs Tier 2 */}
      <div className="comparison-grid">
        {/* Tier 1 Card */}
        <div
          onClick={() => setTierSelection('tier1')}
          className={`tier-box card-sand ${tierSelection === 'tier1' ? 'active-tier' : ''}`}
        >
          <div className="tier-top">
            <div className="tier-badge">TIER 1 ($2,000)</div>
            <Eye className="w-5 h-5 text-navy" />
          </div>
          <h3 className="tier-title display-font">Self as UBO & Director</h3>
          <p className="tier-desc">Your personal name is registered directly with the government registry.</p>
          
          <div className="registry-simulation">
            <div className="sim-title"><Search className="w-3 h-3 inline mr-1" /> Public Registry Search Output:</div>
            <div className="sim-row">
              <span>Director:</span> <strong>YOUR FULL NAME</strong>
            </div>
            <div className="sim-row">
              <span>Shareholder:</span> <strong>YOUR FULL NAME</strong>
            </div>
            <div className="sim-row">
              <span>Privacy Level:</span> <span className="badge badge-navy">Standard Legal</span>
            </div>
          </div>
        </div>

        {/* Tier 2 Card */}
        <div
          onClick={() => setTierSelection('tier2')}
          className={`tier-box card-orange-lt ${tierSelection === 'tier2' ? 'active-tier' : ''}`}
        >
          <div className="tier-top">
            <div className="tier-badge recommended-badge">TIER 2 ($3,000) • RECOMMENDED</div>
            <EyeOff className="w-5 h-5 text-orange" />
          </div>
          <h3 className="tier-title display-font">Nominee Director & UBO</h3>
          <p className="tier-desc">GCC Nominee holds official registry position while you maintain 100% beneficial ownership via Power of Attorney.</p>
          
          <div className="registry-simulation">
            <div className="sim-title"><Search className="w-3 h-3 inline mr-1" /> Public Registry Search Output:</div>
            <div className="sim-row">
              <span>Director:</span> <strong className="text-orange">GCC Nominee Nominees Ltd</strong>
            </div>
            <div className="sim-row">
              <span>Shareholder:</span> <strong className="text-orange">GCC Trustee Holdings Ltd</strong>
            </div>
            <div className="sim-row">
              <span>Privacy Level:</span> <span className="badge badge-orange font-bold">100% Shielded</span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="privacy-footer card-sand">
        <div className="footer-left">
          <ShieldCheck className="w-5 h-5 text-success inline mr-2" />
          <span>Includes Indemnity Agreement, Power of Attorney (PoA) & Declaration of Trust.</span>
        </div>
        <Link
          href={`/setup?tier=${tierSelection === 'tier2' ? 'tier2' : 'tier1'}&country=${jurisdiction}`}
          className="btn btn-primary"
        >
          <span>Select {tierSelection === 'tier2' ? 'Tier 2 Nominee ($3,000)' : 'Tier 1 Self ($2,000)'}</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      <style jsx>{`
        .privacy-card {
          padding: 36px 32px;
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .privacy-header {
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

        .jurisdiction-tabs {
          display: flex;
          justify-content: center;
          gap: 8px;
        }

        .tab-btn {
          padding: 8px 18px;
          border-radius: var(--radius-pill);
          font-size: 13px;
          font-weight: 700;
          background: var(--surface);
          border: 1px solid var(--border);
          color: var(--text-secondary);
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .tab-btn.active {
          background: var(--navy);
          border-color: var(--navy);
          color: #FFFFFF;
        }

        .comparison-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }

        @media (max-width: 768px) {
        .registry-info {
          padding: 16px 20px;
          border-radius: var(--radius);
        }

        .registry-title {
          font-size: 14px;
          font-weight: 700;
          color: var(--navy);
          margin-bottom: 8px;
        }

        .registry-specs {
          display: flex;
          gap: 16px;
          flex-wrap: wrap;
        }

        .spec-item {
          font-size: 13px;
          color: var(--text-secondary);
        }

        .spec-yes strong {
          color: var(--success, #16a34a);
        }

        .spec-no strong {
          color: var(--orange);
        }

        .comparison-grid {
            grid-template-columns: 1fr;
          }
        }

        .tier-box {
          padding: 24px;
          border-radius: var(--radius);
          cursor: pointer;
          transition: all 0.25s ease;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .tier-box.active-tier {
          border-color: var(--orange);
          box-shadow: 0 0 0 2px var(--orange);
        }

        .tier-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .tier-badge {
          font-size: 11px;
          font-weight: 700;
          color: var(--navy);
          letter-spacing: 0.05em;
        }

        .recommended-badge {
          color: var(--orange);
          background: var(--surface);
          padding: 2px 8px;
          border-radius: var(--radius-pill);
        }

        .tier-title {
          font-size: 1.25rem;
          color: var(--navy);
        }

        .tier-desc {
          font-size: 13px;
          color: var(--text-secondary);
          line-height: 1.4;
        }

        .registry-simulation {
          background: var(--surface);
          border: 1px dashed var(--border);
          border-radius: var(--radius-sm);
          padding: 14px;
          margin-top: auto;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .sim-title {
          font-size: 11px;
          font-weight: 700;
          color: var(--text-tertiary);
        }

        .sim-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 13px;
          color: var(--text-secondary);
        }

        .privacy-footer {
          padding: 18px 24px;
          border-radius: var(--radius);
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
        }

        @media (max-width: 768px) {
          .privacy-footer {
            flex-direction: column;
            text-align: center;
          }
        }

        .footer-left {
          font-size: 14px;
          color: var(--navy);
          font-weight: 500;
        }
      `}</style>
    </div>
  );
}
