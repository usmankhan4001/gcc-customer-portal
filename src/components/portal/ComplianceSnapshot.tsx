'use client';

import { useEffect, useState } from 'react';
import { CircleNotch } from '@phosphor-icons/react';
import s from './dash.module.css';

interface TaxRule {
  tax_type: 'corporate' | 'vat' | 'other';
  rate_percent: number; // stored as percent * 100 (e.g. 900 = 9.00%)
  filing_deadline_rule: string;
}

interface ComplianceSnapshotProps {
  jurisdiction: string;
  annualRevenueEstimate: number | null;
  fiscalYearEnd: string | null; // "MM-DD"
}

function nextDeadlineFromRule(rule: string, fiscalYearEnd: string | null): Date | null {
  if (!fiscalYearEnd) return null;
  const monthsMatch = rule.match(/(\d+)\s*months?/i);
  if (!monthsMatch) return null;
  const months = parseInt(monthsMatch[1], 10);

  const [month, day] = fiscalYearEnd.split('-').map(Number);
  if (!month || !day) return null;

  const now = new Date();
  let fyEnd = new Date(now.getFullYear(), month - 1, day);
  const deadline = new Date(fyEnd);
  deadline.setMonth(deadline.getMonth() + months);

  if (deadline < now) {
    fyEnd = new Date(now.getFullYear() + 1, month - 1, day);
    const nextDeadline = new Date(fyEnd);
    nextDeadline.setMonth(nextDeadline.getMonth() + months);
    return nextDeadline;
  }
  return deadline;
}

export default function ComplianceSnapshot({ jurisdiction, annualRevenueEstimate, fiscalYearEnd }: ComplianceSnapshotProps) {
  const [rules, setRules] = useState<TaxRule[] | null>(null);
  const [revenueInput, setRevenueInput] = useState(annualRevenueEstimate?.toString() ?? '');
  const [saving, setSaving] = useState(false);
  const [savedRevenue, setSavedRevenue] = useState(annualRevenueEstimate);

  useEffect(() => {
    fetch(`/api/tax-rules?jurisdiction=${jurisdiction}`)
      .then((res) => res.json())
      .then((data) => setRules(data.rules ?? []))
      .catch(() => setRules([]));
  }, [jurisdiction]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = parseFloat(revenueInput);
    if (Number.isNaN(value) || value < 0) return;
    setSaving(true);
    try {
      const res = await fetch('/api/companies/revenue-estimate', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ annual_revenue_estimate: value }),
      });
      if (res.ok) setSavedRevenue(value);
    } finally {
      setSaving(false);
    }
  };

  if (rules === null) {
    return (
      <div className="admin-state" role="status">
        <CircleNotch size={20} className="animate-spin" /> Loading compliance data...
      </div>
    );
  }

  const corporateRule = rules.find((r) => r.tax_type === 'corporate');

  return (
    <div className="card">
      <div className={s.head}>
        <h2>Compliance snapshot</h2>
      </div>

      {savedRevenue == null ? (
        <form onSubmit={handleSave} className={s.inline}>
          <input
            type="number"
            value={revenueInput}
            onChange={(e) => setRevenueInput(e.target.value)}
            placeholder="Estimated annual revenue ($)"
            aria-label="Estimated annual revenue in dollars"
          />
          <button type="submit" disabled={saving} className="btn btn-primary">
            {saving ? 'Saving...' : 'Save'}
          </button>
        </form>
      ) : corporateRule ? (
        <div>
          <div className={s.kv}>
            <span>Est. corporate tax</span>
            <span>${Math.round((savedRevenue * corporateRule.rate_percent) / 10000).toLocaleString()}/yr</span>
          </div>
          {(() => {
            const deadline = nextDeadlineFromRule(corporateRule.filing_deadline_rule, fiscalYearEnd);
            return (
              <div className={s.kv}>
                <span>Next filing deadline</span>
                <span>{deadline ? deadline.toLocaleDateString() : corporateRule.filing_deadline_rule}</span>
              </div>
            );
          })()}
        </div>
      ) : (
        <p className="admin-form-note">No tax rules configured for this jurisdiction yet.</p>
      )}

      <p className={s.note}>Estimate only, not filed tax advice. Consult your advisor before relying on this.</p>
    </div>
  );
}
