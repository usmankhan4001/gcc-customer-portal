'use client';

import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/admin/PageHeader';
import {
  formatCaptured,
  formatInterest,
  leadCountLabel,
  personaBadge,
  sourceBadge,
  trackBadge,
} from '@/lib/admin-ui/leads';

interface LeadRow {
  id: string;
  email: string | null;
  whatsapp_number: string | null;
  source_tool: string;
  persona_tag: string | null;
  estimated_revenue_band: string | null;
  industry_risk_tier: string | null;
  primary_interest_jurisdiction: string | null;
  funnel_track: string | null;
  converted_user_id: string | null;
  created_at: string;
}

export default function AdminLeadsPage() {
  const [rows, setRows] = useState<LeadRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch('/api/admin/leads')
      .then((res) => {
        if (!res.ok) throw new Error(String(res.status));
        return res.json();
      })
      .then((data) => setRows(data.leads ?? []))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="wrap admin-page">
      <PageHeader
        eyebrow="Operations"
        title="Leads"
        subtitle={`Contacts captured by the lead-gen tools, newest first. ${loading || error ? '' : leadCountLabel(rows.length)}`.trim()}
      />

      {loading && (
        <div className="admin-state" role="status">
          Loading leads…
        </div>
      )}
      {!loading && error && (
        <div className="cl-empty is-error" role="alert">
          <p>Could not load leads. Check your connection and try again.</p>
        </div>
      )}
      {!loading && !error && rows.length === 0 && (
        <div className="cl-empty">
          <p>No leads have been captured yet.</p>
        </div>
      )}
      {!loading && !error && rows.length > 0 && (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Contact</th>
                <th>Source Tool</th>
                <th>Persona</th>
                <th className="hide-phone">Interest</th>
                <th className="hide-phone">Track</th>
                <th>Captured</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const source = sourceBadge(row.source_tool);
                const persona = personaBadge(row.persona_tag);
                const track = trackBadge(row.funnel_track);
                return (
                  <tr key={row.id}>
                    <td>
                      <div>{row.email ?? row.whatsapp_number ?? '—'}</div>
                      {row.email && row.whatsapp_number && <div>{row.whatsapp_number}</div>}
                      {row.converted_user_id && <span className="badge badge-success">Converted to client</span>}
                    </td>
                    <td>
                      <span className={source.className}>{source.label}</span>
                    </td>
                    <td>{persona ? <span className={persona.className}>{persona.label}</span> : '—'}</td>
                    <td className="hide-phone">{formatInterest(row.primary_interest_jurisdiction)}</td>
                    <td className="hide-phone">
                      {track ? <span className={track.className}>{track.label}</span> : '—'}
                    </td>
                    <td>{formatCaptured(row.created_at)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
