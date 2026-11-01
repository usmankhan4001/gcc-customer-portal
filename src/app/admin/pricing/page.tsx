'use client';

import { useEffect, useState } from 'react';
import { Save, Plus } from 'lucide-react';
import { PageHeader } from '@/components/admin/PageHeader';
import {
  bannerBadgeTone,
  bannerStatusLabel,
  formatCents,
  jurisdictionLabel,
  parsePriceToCents,
  tierLabel,
} from '@/lib/admin-ui/pricing';

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

export default function AdminPricingPage() {
  const [rows, setRows] = useState<PricingRow[]>([]);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  const [banners, setBanners] = useState<BannerRow[]>([]);
  const [newBanner, setNewBanner] = useState({ title: '', body: '', link_url: '' });
  const [creatingBanner, setCreatingBanner] = useState(false);

  useEffect(() => {
    fetch('/api/admin/pricing')
      .then((res) => res.json())
      .then((data) => setRows(data.pricing ?? []))
      .catch(() => setLoadError(true))
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
    const priceUsd = parsePriceToCents(draft);
    if (priceUsd === null) return;

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
    <div className="wrap admin-page">
      <PageHeader
        eyebrow="Operations"
        title="Jurisdiction Pricing"
        subtitle="Prices charged at checkout, per jurisdiction and tier. Changes take effect immediately."
      />

      <div className="admin-section-head">
        <h2>Prices</h2>
      </div>
      {loading ? (
        <div className="admin-state" role="status">Loading pricing…</div>
      ) : loadError ? (
        <div className="cl-empty is-error" role="alert">
          <p>Could not load pricing. Check your connection and try again.</p>
        </div>
      ) : rows.length === 0 ? (
        <div className="cl-empty">
          <p>No pricing configured yet. Run <code>npm run db:seed</code> for placeholder values.</p>
        </div>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Jurisdiction</th>
                <th>Tier</th>
                <th>Price (USD)</th>
                <th className="is-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const draft = drafts[row.id];
                const displayValue = draft ?? formatCents(row.price_usd);
                const name = `${jurisdictionLabel(row.jurisdiction)} ${tierLabel(row.tier)}`;
                return (
                  <tr key={row.id}>
                    <td style={{ textTransform: 'capitalize' }}>{jurisdictionLabel(row.jurisdiction)}</td>
                    <td>{tierLabel(row.tier)}</td>
                    <td>
                      <input
                        type="number"
                        step="0.01"
                        inputMode="decimal"
                        aria-label={`Price in USD for ${name}`}
                        value={displayValue}
                        onChange={(e) => setDrafts((prev) => ({ ...prev, [row.id]: e.target.value }))}
                      />
                    </td>
                    <td className="is-right">
                      <button
                        type="button"
                        className="btn btn-primary"
                        aria-label={`Save price for ${name}`}
                        onClick={() => handleSave(row.id)}
                        disabled={draft === undefined || savingId === row.id}
                      >
                        <Save size={14} />
                        {savingId === row.id ? 'Saving...' : 'Save'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="admin-section-head">
        <h2>Dashboard Announcements</h2>
      </div>

      <form onSubmit={handleCreateBanner} className="card admin-form-card">
        <div className="admin-form-stack">
          <div className="admin-form-grid-2">
            <div className="field">
              <label htmlFor="banner-title">Title</label>
              <input
                id="banner-title"
                type="text"
                placeholder="Title (e.g. Finish your KYC)"
                value={newBanner.title}
                onChange={(e) => setNewBanner((prev) => ({ ...prev, title: e.target.value }))}
              />
            </div>
            <div className="field">
              <label htmlFor="banner-link">Link URL</label>
              <input
                id="banner-link"
                type="text"
                placeholder="Link URL (optional)"
                value={newBanner.link_url}
                onChange={(e) => setNewBanner((prev) => ({ ...prev, link_url: e.target.value }))}
              />
            </div>
          </div>
          <div className="field">
            <label htmlFor="banner-body">Body text</label>
            <textarea
              id="banner-body"
              placeholder="Body text"
              value={newBanner.body}
              onChange={(e) => setNewBanner((prev) => ({ ...prev, body: e.target.value }))}
              rows={2}
            />
          </div>
        </div>
        <div className="admin-form-actions">
          <button
            type="submit"
            className="btn btn-primary"
            disabled={creatingBanner || !newBanner.title || !newBanner.body}
          >
            <Plus size={14} />
            {creatingBanner ? 'Creating...' : 'Create banner'}
          </button>
        </div>
      </form>

      {banners.length === 0 ? (
        <div className="cl-empty">
          <p>No announcements yet.</p>
        </div>
      ) : (
        <div className="admin-form-stack">
          {banners.map((banner) => (
            <div key={banner.id} className="card admin-form-card">
              <div className="admin-section-head">
                <div>
                  <strong>{banner.title}</strong>
                  <p className="admin-form-note">{banner.body}</p>
                </div>
                <button
                  type="button"
                  className={`badge ${bannerBadgeTone(banner.active)}`}
                  aria-label={`${banner.title}: ${bannerStatusLabel(banner.active)}. Toggle`}
                  onClick={() => handleToggleBanner(banner.id, !banner.active)}
                >
                  {bannerStatusLabel(banner.active)}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
