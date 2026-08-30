'use client';

import { useEffect, useState } from 'react';
import { WarningCircle, CircleNotch } from '@phosphor-icons/react';

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
      <div className="bg-white rounded-md border border-gray-200 p-4 flex items-center justify-center text-gray-400 text-sm">
        <CircleNotch className="w-4 h-4 animate-spin mr-2" /> Loading compliance data...
      </div>
    );
  }

  const corporateRule = rules.find((r) => r.tax_type === 'corporate');

  return (
    <div className="bg-white rounded-md shadow-sm border border-gray-200 p-4">
      <h3 className="text-sm font-bold text-gray-900 mb-3">Compliance Snapshot</h3>

      {savedRevenue == null ? (
        <form onSubmit={handleSave} className="flex items-center gap-2">
          <input
            type="number"
            value={revenueInput}
            onChange={(e) => setRevenueInput(e.target.value)}
            placeholder="Estimated annual revenue ($)"
            className="flex-1 px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
          />
          <button
            type="submit"
            disabled={saving}
            className="bg-primary hover:bg-primary/90 disabled:opacity-60 text-white text-xs font-bold px-3 py-1.5 rounded-md transition-colors whitespace-nowrap"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </form>
      ) : corporateRule ? (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Est. corporate tax</span>
            <span className="font-bold text-gray-900">
              ${Math.round((savedRevenue * corporateRule.rate_percent) / 10000).toLocaleString()}/yr
            </span>
          </div>
          {(() => {
            const deadline = nextDeadlineFromRule(corporateRule.filing_deadline_rule, fiscalYearEnd);
            return (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Next filing deadline</span>
                <span className="font-semibold text-gray-800">
                  {deadline ? deadline.toLocaleDateString() : corporateRule.filing_deadline_rule}
                </span>
              </div>
            );
          })()}
        </div>
      ) : (
        <p className="text-sm text-gray-400">No tax rules configured for this jurisdiction yet.</p>
      )}

      <div className="mt-3 pt-3 border-t border-gray-100 flex items-start gap-2">
        <WarningCircle className="w-3.5 h-3.5 text-gray-400 shrink-0 mt-0.5" />
        <p className="text-xs text-gray-400">
          Estimate only, not filed tax advice — consult your advisor before relying on this.
        </p>
      </div>
    </div>
  );
}
