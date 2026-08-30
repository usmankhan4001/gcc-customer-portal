'use client';

import { useEffect, useState } from 'react';
import { Contact2, Mail, MessageCircle } from 'lucide-react';

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

const SOURCE_LABELS: Record<string, string> = {
  tax_calculator: 'Tax Calculator',
  banking_odds: 'Banking Odds',
  nda_generator: 'NDA Generator',
  jurisdiction_quiz: 'Jurisdiction Fit Quiz',
  vat_scorer: 'VAT Scorer',
  ubo_privacy: 'UBO Privacy',
  compliance_calendar: 'Compliance Calendar',
  visa_estimator: 'Visa Estimator',
  name_checker: 'Name Checker',
  qfzp_eligibility: 'QFZP Eligibility',
};

export default function AdminLeadsPage() {
  const [rows, setRows] = useState<LeadRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/leads')
      .then((res) => res.json())
      .then((data) => setRows(data.leads ?? []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Leads</h1>
        <p className="text-gray-500 mt-1">
          Contacts captured by the lead-gen tools, newest first.
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2 bg-gray-50">
          <Contact2 className="w-5 h-5 text-gray-500" />
          <h2 className="text-lg font-semibold text-gray-800">{rows.length} lead{rows.length === 1 ? '' : 's'}</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white border-b border-gray-100 text-sm text-gray-500">
                <th className="px-6 py-4 font-medium">Contact</th>
                <th className="px-6 py-4 font-medium">Source Tool</th>
                <th className="px-6 py-4 font-medium">Persona</th>
                <th className="px-6 py-4 font-medium">Interest</th>
                <th className="px-6 py-4 font-medium">Track</th>
                <th className="px-6 py-4 font-medium">Captured</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-400">
                    Loading...
                  </td>
                </tr>
              )}
              {!loading && rows.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-400">
                    No leads captured yet.
                  </td>
                </tr>
              )}
              {rows.map((row) => (
                <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-0.5 text-sm">
                      {row.email && (
                        <span className="flex items-center gap-1.5 text-gray-900">
                          <Mail className="w-3.5 h-3.5 text-gray-400" /> {row.email}
                        </span>
                      )}
                      {row.whatsapp_number && (
                        <span className="flex items-center gap-1.5 text-gray-600">
                          <MessageCircle className="w-3.5 h-3.5 text-gray-400" /> {row.whatsapp_number}
                        </span>
                      )}
                      {row.converted_user_id && (
                        <span className="text-xs font-medium text-green-700 bg-green-50 w-fit px-1.5 py-0.5 rounded-sm mt-0.5">
                          Converted to client
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-600 text-sm">
                    {SOURCE_LABELS[row.source_tool] ?? row.source_tool}
                  </td>
                  <td className="px-6 py-4 text-gray-600 text-sm">{row.persona_tag ?? '—'}</td>
                  <td className="px-6 py-4 text-gray-600 text-sm capitalize">
                    {row.primary_interest_jurisdiction?.replace('-', ' ') ?? '—'}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {row.funnel_track ? (
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                          row.funnel_track === 'consultation_led'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}
                      >
                        {row.funnel_track === 'consultation_led' ? 'Consultation' : 'Self-serve'}
                      </span>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="px-6 py-4 text-gray-500 text-sm whitespace-nowrap">
                    {new Date(row.created_at).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
