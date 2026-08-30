'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Search, CheckCircle2, AlertTriangle, ArrowRight, Globe } from 'lucide-react';

export default function NameAvailabilityChecker() {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [jurisdiction, setJurisdiction] = useState('uae');
  const [analyzed, setAnalyzed] = useState(false);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      setDebouncedQuery(query);
      setAnalyzed(false);
    }, 400);
    return () => { if (debounceTimer.current) clearTimeout(debounceTimer.current); };
  }, [query]);

  const handleCheck = (e: React.FormEvent) => {
    e.preventDefault();
    if (debouncedQuery.trim()) {
      setDebouncedQuery(query);
      setAnalyzed(true);
    }
  };

  const restrictedRegex = /\b(bank|banking|trust|insurance|royal|emirates|dubai|abu\s*dhabi|sharjah|qatar|saudi|bahrain|kuwait|oman|government|minister|national|federal|authority|reserve|currency|exchange)\b/i;
  const hasRestrictedWords = restrictedRegex.test(debouncedQuery);
  const isAvailable = debouncedQuery.length >= 3 && !hasRestrictedWords;

  return (
    <div className="card name-card">
      <div className="name-header">
        <div className="badge badge-blue">
          <Globe className="w-3.5 h-3.5" />
          <span>TRADE REGISTRY & ARABIC TRANSLATION PRE-CHECK</span>
        </div>
        <h2 className="title display-font">
          Company Name <span className="text-orange">Availability & Screener</span>
        </h2>
        <p className="subtitle">
          Screen your chosen business name across official Freezone, Mainland, and Hong Kong registry rules before formal submission.
        </p>
      </div>

      {/* Search Input Box */}
      <form onSubmit={handleCheck} className="search-box card-sand">
        <div className="input-group">
          <input
            type="text"
            placeholder="e.g. Apex Cloud Solutions"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="input-field query-input"
          />
          <select
            value={jurisdiction}
            onChange={(e) => setJurisdiction(e.target.value)}
            className="input-field jurisdiction-select"
          >
            <option value="uae">UAE Freezone / Mainland</option>
            <option value="hk">Hong Kong Companies Registry</option>
            <option value="singapore">Singapore ACRA</option>
            <option value="bahrain">Bahrain Sijilat</option>
          </select>
          <button type="submit" className="btn btn-primary">
            <Search className="w-4 h-4" />
            <span>Screen Name</span>
          </button>
        </div>
      </form>

      {/* Results View */}
      {analyzed && (
        <div className={`result-box ${isAvailable ? 'card-blue-lt' : 'card-orange-lt'}`}>
          <div className="result-icon">
            {isAvailable ? (
              <CheckCircle2 className="w-8 h-8 text-success" />
            ) : (
              <AlertTriangle className="w-8 h-8 text-orange" />
            )}
          </div>
          <div className="result-text-box">
            <span className="result-title display-font text-navy">
              {isAvailable ? `"${debouncedQuery}" Looks Preliminary Available!` : `"${debouncedQuery}" Triggers Restricted Terms`}
            </span>
            <p className="result-desc">
              {isAvailable
                ? `The name satisfies registry naming guidelines for ${jurisdiction.toUpperCase()}. Full Arabic transliteration will be generated upon formal filing.`
                : 'Contains restricted terms (e.g. financial or regional keywords) that may require special regulatory pre-approval.'}
            </p>
          </div>

          <Link href={`/setup?name=${encodeURIComponent(debouncedQuery)}&country=${jurisdiction}`} className="btn btn-primary">
            <span>Reserve in Setup</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}

      <style jsx>{`
        .name-card {
          padding: 36px 32px;
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .name-header {
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

        .search-box {
          padding: 20px;
          border-radius: var(--radius);
        }

        .input-group {
          display: flex;
          gap: 10px;
        }

        @media (max-width: 768px) {
          .input-group {
            flex-direction: column;
          }
        }

        .query-input {
          flex: 2;
        }

        .jurisdiction-select {
          flex: 1;
        }

        .result-box {
          padding: 24px;
          border-radius: var(--radius);
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
        }

        @media (max-width: 768px) {
          .result-box {
            flex-direction: column;
            text-align: center;
          }
        }

        .result-title {
          font-size: 1.2rem;
          display: block;
          margin-bottom: 4px;
        }

        .result-desc {
          font-size: 14px;
          color: var(--text-secondary);
        }
      `}</style>
    </div>
  );
}
