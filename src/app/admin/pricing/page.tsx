'use client';

import { useEffect, useState } from 'react';
import { DollarSign, Save } from 'lucide-react';

interface PricingRow {
  id: string;
  jurisdiction: string;
  tier: string;
  price_usd: number;
  updated_at: string;
}

const TIER_LABELS: Record<string, string> = {
  tier_1_self: 'Self UBO (Basic)',
  tier_2_nominee: 'Nominee UBO',
  tier_3_shelf: 'Shelf Company',
};

export default function AdminPricingPage() {
  const [rows, setRows] = useState<PricingRow[]>([]);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/pricing')
      .then((res) => res.json())
      .then((data) => setRows(data.pricing ?? []))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (id: string) => {
    const draft = drafts[id];
    if (draft === undefined) return;
    const priceUsd = Math.round(parseFloat(draft) * 100);
    if (Number.isNaN(priceUsd) || priceUsd < 0) return;

    setSavingId(id);
    try {
      const res = await fetch('/api/admin/pricing', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, price_usd: priceUsd }),
      });
      const data = await res.json();
      if (data.pricing) {
        setRows((prev) => prev.map((r) => (r.id === id ? data.pricing : r)));
        setDrafts((prev) => {
          const next = { ...prev };
          delete next[id];
          return next;
        });
      }
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Jurisdiction Pricing</h1>
        <p className="text-gray-500 mt-1">
          Prices charged at checkout, per jurisdiction and tier. Changes take effect immediately.
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2 bg-gray-50">
          <DollarSign className="w-5 h-5 text-gray-500" />
          <h2 className="text-lg font-semibold text-gray-800">Prices</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white border-b border-gray-100 text-sm text-gray-500">
                <th className="px-6 py-4 font-medium">Jurisdiction</th>
                <th className="px-6 py-4 font-medium">Tier</th>
                <th className="px-6 py-4 font-medium">Price (USD)</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading && (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-400">
                    Loading...
                  </td>
                </tr>
              )}
              {!loading && rows.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-400">
                    No pricing configured yet. Run <code>npm run db:seed</code> for placeholder values.
                  </td>
                </tr>
              )}
              {rows.map((row) => {
                const draft = drafts[row.id];
                const displayValue = draft ?? (row.price_usd / 100).toFixed(2);
                return (
                  <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-gray-900 font-medium capitalize">
                      {row.jurisdiction.replace('-', ' ')}
                    </td>
                    <td className="px-6 py-4 text-gray-600">{TIER_LABELS[row.tier] ?? row.tier}</td>
                    <td className="px-6 py-4">
                      <div className="relative w-32">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                        <input
                          type="number"
                          step="0.01"
                          value={displayValue}
                          onChange={(e) =>
                            setDrafts((prev) => ({ ...prev, [row.id]: e.target.value }))
                          }
                          className="w-full pl-6 pr-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900"
                        />
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleSave(row.id)}
                        disabled={draft === undefined || savingId === row.id}
                        className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed text-white px-3 py-1.5 rounded-md text-sm font-medium transition-colors"
                      >
                        <Save className="w-3.5 h-3.5" />
                        {savingId === row.id ? 'Saving...' : 'Save'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
