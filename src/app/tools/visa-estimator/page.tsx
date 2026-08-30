"use client";

import React, { useState } from 'react';
import BannerHeader from '@/components/portal/BannerHeader';
import ContactCaptureGate from '@/components/portal/ContactCaptureGate';
import PDFDownloadPanel from '@/components/portal/PDFDownloadPanel';

export default function VisaEstimatorPage() {
  const [employees, setEmployees] = useState('1');
  const [jurisdiction, setJurisdiction] = useState('Mainland');
  const [showResults, setShowResults] = useState(false);
  const [captured, setCaptured] = useState(false);
  const [leadId, setLeadId] = useState<string | null>(null);
  const [leadEmail, setLeadEmail] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowResults(true);
    setCaptured(false);
  };

  const perEmployeeTotal = jurisdiction === 'Mainland' ? 4190 : 1190;
  const grandTotal = perEmployeeTotal * (parseInt(employees) || 1);

  const handleCapture = async (contact: { email: string; whatsapp_number: string }) => {
    const res = await fetch('/api/leads/capture', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        source_tool: 'visa_estimator',
        email: contact.email || undefined,
        whatsapp_number: contact.whatsapp_number || undefined,
        tool_input: { employees, jurisdiction },
        tool_result: { perEmployeeTotal, grandTotal },
        signals: { primaryInterestJurisdiction: 'uae' },
      }),
    });
    const data = await res.json();
    setLeadId(data.lead?.id ?? null);
    setLeadEmail(contact.email || null);
    setCaptured(true);
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <BannerHeader title="Visa Estimator" />

      <div className="flex-1 px-4 py-8 max-w-4xl mx-auto w-full space-y-8">
        <div className="bg-white p-6 rounded-md shadow-sm border border-gray-200">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Calculate Visa Costs</h2>
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex-1 w-full">
              <label htmlFor="employees" className="block text-sm font-medium text-gray-700 mb-1">
                Number of Employees
              </label>
              <input
                type="number"
                id="employees"
                min="1"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                value={employees}
                onChange={(e) => setEmployees(e.target.value)}
                required
              />
            </div>
            <div className="flex-1 w-full">
              <label htmlFor="jurisdiction" className="block text-sm font-medium text-gray-700 mb-1">
                Jurisdiction
              </label>
              <select
                id="jurisdiction"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                value={jurisdiction}
                onChange={(e) => setJurisdiction(e.target.value)}
              >
                <option value="Mainland">Mainland</option>
                <option value="Free Zone">Free Zone</option>
              </select>
            </div>
            <button
              type="submit"
              className="w-full sm:w-auto bg-primary hover:bg-primary-700 text-white font-medium py-2 px-6 rounded-md transition-colors"
            >
              Estimate
            </button>
          </form>
        </div>

        {showResults && !captured && (
          <ContactCaptureGate
            title="See your full cost breakdown"
            subtitle="Enter your contact info to reveal the numbers below."
            onCapture={handleCapture}
          />
        )}

        {showResults && captured && (
          <div className="bg-white rounded-md shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <h3 className="text-lg font-bold text-gray-900">Estimated Visa Costs (Per Employee)</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-100 text-sm font-semibold text-gray-700">
                    <th className="px-6 py-3 border-b border-gray-200">Fee Type</th>
                    <th className="px-6 py-3 border-b border-gray-200">Description</th>
                    <th className="px-6 py-3 border-b border-gray-200 text-right">Amount (AED)</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  <tr className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900">Medical Test</td>
                    <td className="px-6 py-4 text-gray-600">Standard medical fitness test</td>
                    <td className="px-6 py-4 text-right">320</td>
                  </tr>
                  <tr className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900">Emirates ID</td>
                    <td className="px-6 py-4 text-gray-600">2-year validity</td>
                    <td className="px-6 py-4 text-right">370</td>
                  </tr>
                  <tr className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900">Visa Stamping</td>
                    <td className="px-6 py-4 text-gray-600">Residency visa issuance</td>
                    <td className="px-6 py-4 text-right">500</td>
                  </tr>
                  <tr className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900">Security Deposit</td>
                    <td className="px-6 py-4 text-gray-600">Refundable deposit (if applicable)</td>
                    <td className="px-6 py-4 text-right">{jurisdiction === 'Mainland' ? '3,000' : '0'}</td>
                  </tr>
                  <tr className="bg-gray-50 font-bold text-gray-900">
                    <td className="px-6 py-4" colSpan={2}>Total Estimated Cost (Per Employee)</td>
                    <td className="px-6 py-4 text-right">{perEmployeeTotal.toLocaleString()}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
              <div className="flex justify-between items-center font-bold text-lg">
                <span>Grand Total for {employees} Employee(s)</span>
                <span className="text-primary">AED {grandTotal.toLocaleString()}</span>
              </div>
            </div>
            {leadId && (
              <div className="px-6 py-4 border-t border-gray-200">
                <PDFDownloadPanel
                  leadId={leadId}
                  title="Visa Cost Estimate"
                  subtitle={`${jurisdiction} — ${employees} employee(s)`}
                  hasEmail={!!leadEmail}
                  rows={[
                    { label: 'Medical Test', value: 'AED 320' },
                    { label: 'Emirates ID', value: 'AED 370' },
                    { label: 'Visa Stamping', value: 'AED 500' },
                    { label: 'Security Deposit', value: jurisdiction === 'Mainland' ? 'AED 3,000' : 'AED 0' },
                    { label: 'Total per employee', value: `AED ${perEmployeeTotal.toLocaleString()}` },
                    { label: 'Grand total', value: `AED ${grandTotal.toLocaleString()}` },
                  ]}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
