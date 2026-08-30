"use client";

import React, { useState } from 'react';
import BannerHeader from '@/components/portal/BannerHeader';

export default function ComplianceCalendarPage() {
  const [formationDate, setFormationDate] = useState('');
  const [showResults, setShowResults] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formationDate) {
      setShowResults(true);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <BannerHeader title="COMPLIANCE CALENDAR" />

      <div className="flex-1 px-4 py-8 max-w-4xl mx-auto w-full">
        <div className="bg-white p-6 rounded-md shadow-sm border border-gray-200 mb-8">
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

        {showResults && (
          <div className="bg-white rounded-md shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <h3 className="text-lg font-bold text-gray-900">Upcoming Deadlines</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-100 text-sm font-semibold text-gray-700">
                    <th className="px-6 py-3 border-b border-gray-200">Compliance Requirement</th>
                    <th className="px-6 py-3 border-b border-gray-200">Estimated Deadline</th>
                    <th className="px-6 py-3 border-b border-gray-200">Status</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  <tr className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900">License Renewal</td>
                    <td className="px-6 py-4 text-gray-600">1 year from formation</td>
                    <td className="px-6 py-4"><span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">On Track</span></td>
                  </tr>
                  <tr className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900">VAT Registration</td>
                    <td className="px-6 py-4 text-gray-600">Within 30 days of crossing threshold</td>
                    <td className="px-6 py-4"><span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">Action Needed</span></td>
                  </tr>
                  <tr className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900">ESR Notification</td>
                    <td className="px-6 py-4 text-gray-600">6 months after financial year end</td>
                    <td className="px-6 py-4"><span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">Upcoming</span></td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900">Corporate Tax Registration</td>
                    <td className="px-6 py-4 text-gray-600">Before first tax period</td>
                    <td className="px-6 py-4"><span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">Upcoming</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
