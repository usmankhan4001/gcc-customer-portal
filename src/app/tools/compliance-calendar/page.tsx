"use client";

import React, { useState } from 'react';
import BannerHeader from '@/components/portal/BannerHeader';
import ContactCaptureGate from '@/components/portal/ContactCaptureGate';

interface DeadlineRow {
  requirement: string;
  deadline: Date | null;
  deadlineLabel: string;
  status: 'On Track' | 'Action Needed' | 'Overdue' | 'Ongoing';
}

function addMonths(date: Date, months: number): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

function computeDeadlines(formationDate: Date): DeadlineRow[] {
  const now = new Date();
  const licenseRenewal = addMonths(formationDate, 12);
  const esrNotification = addMonths(formationDate, 6);
  const corporateTaxRegistration = addMonths(formationDate, 3);

  const statusFor = (deadline: Date): DeadlineRow['status'] => {
    const daysLeft = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    if (daysLeft < 0) return 'Overdue';
    if (daysLeft < 30) return 'Action Needed';
    return 'On Track';
  };

  return [
    {
      requirement: 'License Renewal',
      deadline: licenseRenewal,
      deadlineLabel: licenseRenewal.toLocaleDateString(),
      status: statusFor(licenseRenewal),
    },
    {
      requirement: 'VAT Registration',
      deadline: null,
      deadlineLabel: 'Within 30 days of crossing the mandatory revenue threshold',
      status: 'Ongoing',
    },
    {
      requirement: 'ESR Notification',
      deadline: esrNotification,
      deadlineLabel: esrNotification.toLocaleDateString(),
      status: statusFor(esrNotification),
    },
    {
      requirement: 'Corporate Tax Registration',
      deadline: corporateTaxRegistration,
      deadlineLabel: corporateTaxRegistration.toLocaleDateString(),
      status: statusFor(corporateTaxRegistration),
    },
  ];
}

const STATUS_STYLES: Record<DeadlineRow['status'], string> = {
  'On Track': 'bg-green-100 text-green-800',
  'Action Needed': 'bg-yellow-100 text-yellow-800',
  Overdue: 'bg-red-100 text-red-800',
  Ongoing: 'bg-gray-100 text-gray-800',
};

export default function ComplianceCalendarPage() {
  const [formationDate, setFormationDate] = useState('');
  const [rows, setRows] = useState<DeadlineRow[] | null>(null);
  const [captured, setCaptured] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formationDate) return;
    setRows(computeDeadlines(new Date(formationDate)));
    setCaptured(false);
  };

  const handleCapture = async (contact: { email: string; whatsapp_number: string }) => {
    if (!rows) return;
    await fetch('/api/leads/capture', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        source_tool: 'compliance_calendar',
        email: contact.email || undefined,
        whatsapp_number: contact.whatsapp_number || undefined,
        tool_input: { formationDate },
        tool_result: rows,
      }),
    });
    setCaptured(true);
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <BannerHeader title="Compliance Calendar" />

      <div className="flex-1 px-4 py-8 max-w-4xl mx-auto w-full space-y-8">
        <div className="bg-white p-6 rounded-md shadow-sm border border-gray-200">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Calculate Deadlines</h2>
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex-1 w-full">
              <label htmlFor="formationDate" className="block text-sm font-medium text-gray-700 mb-1">
                Company Formation Date
              </label>
              <input
                type="date"
                id="formationDate"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent"
                value={formationDate}
                onChange={(e) => setFormationDate(e.target.value)}
                required
              />
            </div>
            <button
              type="submit"
              className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-6 rounded-md transition-colors"
            >
              Generate
            </button>
          </form>
        </div>

        {rows && !captured && (
          <ContactCaptureGate
            title="See your real deadlines"
            subtitle="Enter your contact info to reveal the dates below."
            onCapture={handleCapture}
          />
        )}

        {rows && captured && (
          <div className="bg-white rounded-md shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <h3 className="text-lg font-bold text-gray-900">Upcoming Deadlines</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-100 text-sm font-semibold text-gray-700">
                    <th className="px-6 py-3 border-b border-gray-200">Compliance Requirement</th>
                    <th className="px-6 py-3 border-b border-gray-200">Deadline</th>
                    <th className="px-6 py-3 border-b border-gray-200">Status</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {rows.map((row) => (
                    <tr key={row.requirement} className="border-b border-gray-200 hover:bg-gray-50 last:border-b-0">
                      <td className="px-6 py-4 font-medium text-gray-900">{row.requirement}</td>
                      <td className="px-6 py-4 text-gray-600">{row.deadlineLabel}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[row.status]}`}>
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="px-6 py-3 text-xs text-gray-400 border-t border-gray-100">
              Estimate only, based on general UAE deadlines — not filed tax advice. Confirm with your advisor.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
