'use client';

import React, { useState } from 'react';
import BannerHeader from '@/components/portal/BannerHeader';
import { DownloadSimple, Printer } from '@phosphor-icons/react';

interface DeadlineRow {
  requirement: string;
  deadlineLabel: string;
  status: 'Pending' | 'Upcoming' | 'Action Required';
}

function computeDeadlines(formation: Date): DeadlineRow[] {
  const addMonths = (d: Date, m: number) => {
    const next = new Date(d);
    next.setMonth(next.getMonth() + m);
    return next;
  };
  const fmt = (d: Date) => d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

  const vatRegDeadline = addMonths(formation, 1);
  const ctRegDeadline = addMonths(formation, 3);
  const finYearEnd = addMonths(formation, 12);
  const ctFilingDeadline = addMonths(finYearEnd, 9);
  const esrDeadline = addMonths(finYearEnd, 12);

  return [
    { requirement: 'Mandatory/Voluntary VAT Registration', deadlineLabel: fmt(vatRegDeadline), status: 'Upcoming' },
    { requirement: 'Corporate Tax (EmaraTax) Registration', deadlineLabel: fmt(ctRegDeadline), status: 'Action Required' },
    { requirement: 'First Financial Year End', deadlineLabel: fmt(finYearEnd), status: 'Pending' },
    { requirement: 'First Corporate Tax Return & Payment (9 Months Post-FYE)', deadlineLabel: fmt(ctFilingDeadline), status: 'Pending' },
    { requirement: 'Economic Substance Regulations (ESR) Annual Notification', deadlineLabel: fmt(esrDeadline), status: 'Pending' },
    { requirement: 'Trade License & Establishment Card Annual Renewal', deadlineLabel: fmt(finYearEnd), status: 'Upcoming' },
  ];
}

const STATUS_STYLES = {
  Pending: 'bg-gray-100 text-gray-700',
  Upcoming: 'bg-amber-100 text-amber-800',
  'Action Required': 'bg-rose-100 text-rose-800',
};

export default function ComplianceCalendar() {
  const [formationDate, setFormationDate] = useState('');
  const [rows, setRows] = useState<DeadlineRow[] | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formationDate) return;
    setRows(computeDeadlines(new Date(formationDate)));
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <BannerHeader title="Compliance Calendar" />

      <div className="flex-1 px-4 py-6 max-w-4xl mx-auto w-full space-y-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h2 className="text-base font-bold text-gray-900 mb-2">Generate Your Statutory Deadlines</h2>
          <p className="text-xs text-gray-500 mb-4">Select your company incorporation or target license date to calculate all UAE statutory deadlines.</p>
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex-1 w-full">
              <label htmlFor="formationDate" className="block text-xs font-semibold text-gray-700 mb-1">
                Company Formation Date
              </label>
              <input
                type="date"
                id="formationDate"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                value={formationDate}
                onChange={(e) => setFormationDate(e.target.value)}
                required
              />
            </div>
            <button
              type="submit"
              className="w-full sm:w-auto bg-primary hover:bg-primary-700 text-white text-xs font-semibold py-2.5 px-6 rounded-lg transition-colors shadow-sm"
            >
              Generate Deadlines
            </button>
          </form>
        </div>

        {rows && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden animate-in fade-in duration-300">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-gray-900">Upcoming UAE Statutory Deadlines</h3>
                <p className="text-xs text-gray-500">Based on license date: {formationDate}</p>
              </div>
              <button
                onClick={handlePrint}
                className="flex items-center gap-1.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors shadow-xs"
              >
                <Printer className="w-3.5 h-3.5" />
                Print / Save PDF
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-100/70 text-xs font-semibold text-gray-700">
                    <th className="px-6 py-3 border-b border-gray-200">Compliance Requirement</th>
                    <th className="px-6 py-3 border-b border-gray-200">Statutory Deadline</th>
                    <th className="px-6 py-3 border-b border-gray-200">Status</th>
                  </tr>
                </thead>
                <tbody className="text-xs">
                  {rows.map((row) => (
                    <tr key={row.requirement} className="border-b border-gray-100 hover:bg-gray-50 last:border-b-0">
                      <td className="px-6 py-3.5 font-medium text-gray-900">{row.requirement}</td>
                      <td className="px-6 py-3.5 text-gray-600 font-mono">{row.deadlineLabel}</td>
                      <td className="px-6 py-3.5">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${STATUS_STYLES[row.status]}`}>
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="px-6 py-3 text-[11px] text-gray-400 border-t border-gray-100">
              Note: Estimates based on UAE Federal Tax Authority (FTA) and Ministry of Economy timelines.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
