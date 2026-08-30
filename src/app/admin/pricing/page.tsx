'use client';

import { useEffect, useState } from 'react';
import { DollarSign, Save, Megaphone, Plus } from 'lucide-react';

interface PricingRow {
  id: string;
  jurisdiction: string;
  tier: string;
  price_usd: number;
  updated_at: string;
}

interface BannerRow {
  id: string;
  title: string;
  body: string;
  link_url: string | null;
  active: boolean;
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

  const [banners, setBanners] = useState<BannerRow[]>([]);
  const [newBanner, setNewBanner] = useState({ title: '', body: '', link_url: '' });
  const [creatingBanner, setCreatingBanner] = useState(false);

  useEffect(() => {
    fetch('/api/admin/pricing')
      .then((res) => res.json())
      .then((data) => setRows(data.pricing ?? []))
      .finally(() => setLoading(false));

    fetch('/api/admin/promo-banners')
      .then((res) => res.json())
      .then((data) => setBanners(data.banners ?? []));
  }, []);

  const handleCreateBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBanner.title || !newBanner.body) return;
    setCreatingBanner(true);
    try {
      const res = await fetch('/api/admin/promo-banners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newBanner),
      });
      const data = await res.json();
      if (data.banner) {
        setBanners((prev) => [data.banner, ...prev]);
        setNewBanner({ title: '', body: '', link_url: '' });
      }
    } finally {
      setCreatingBanner(false);
    }
  };

  const handleToggleBanner = async (id: string, active: boolean) => {
    const res = await fetch(`/api/admin/promo-banners/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active }),
    });
    const data = await res.json();
    if (data.banner) {
      setBanners((prev) => prev.map((b) => (b.id === id ? data.banner : b)));
    }
  };

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

      <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2 bg-gray-50">
          <Megaphone className="w-5 h-5 text-gray-500" />
          <h2 className="text-lg font-semibold text-gray-800">Dashboard Announcements</h2>
        </div>

        <form onSubmit={handleCreateBanner} className="p-6 border-b border-gray-100 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              type="text"
              placeholder="Title (e.g. Finish your KYC)"
              value={newBanner.title}
              onChange={(e) => setNewBanner((prev) => ({ ...prev, title: e.target.value }))}
              className="px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900"
            />
            <input
              type="text"
              placeholder="Link URL (optional)"
              value={newBanner.link_url}
              onChange={(e) => setNewBanner((prev) => ({ ...prev, link_url: e.target.value }))}
              className="px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900"
            />
          </div>
          <textarea
            placeholder="Body text"
            value={newBanner.body}
            onChange={(e) => setNewBanner((prev) => ({ ...prev, body: e.target.value }))}
            rows={2}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900"
          />
          <button
            type="submit"
            disabled={creatingBanner || !newBanner.title || !newBanner.body}
            className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed text-white px-3 py-1.5 rounded-md text-sm font-medium transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            {creatingBanner ? 'Creating...' : 'Create banner'}
          </button>
        </form>

        <div className="divide-y divide-gray-100">
          {banners.length === 0 && (
            <p className="p-6 text-center text-sm text-gray-400">No announcements yet.</p>
          )}
          {banners.map((banner) => (
            <div key={banner.id} className="p-4 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-gray-900">{banner.title}</p>
                <p className="text-xs text-gray-500">{banner.body}</p>
              </div>
              <button
                onClick={() => handleToggleBanner(banner.id, !banner.active)}
                className={`text-xs font-semibold px-3 py-1.5 rounded-full transition-colors shrink-0 ${
                  banner.active ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}
              >
                {banner.active ? 'Active' : 'Inactive'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
