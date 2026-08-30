import React from 'react';
import { Bell, FileText, AlertCircle, Calendar, DollarSign, Clock } from 'lucide-react';

const mockRenewals = [
  { id: 1, company: 'Tech Innovators LLC', expiryDate: '2026-09-15', status: 'Upcoming', amount: 5000, plan: 'Enterprise' },
  { id: 2, company: 'Global Traders Inc.', expiryDate: '2026-08-25', status: 'Overdue', amount: 2500, plan: 'Pro' },
  { id: 3, company: 'NextGen Solutions', expiryDate: '2026-09-28', status: 'Upcoming', amount: 1500, plan: 'Basic' },
  { id: 4, company: 'Alpha Group', expiryDate: '2026-08-10', status: 'Overdue', amount: 8000, plan: 'Enterprise' },
];

export default function RenewalsDashboard() {
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Renewals & Billing</h1>
          <p className="text-gray-500 mt-1">Manage upcoming company license renewals and generate invoices.</p>
        </div>
        <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors">
          <Bell className="w-5 h-5" />
          <span>Send Bulk Reminders</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-center space-x-4">
          <div className="p-3 bg-blue-100 text-blue-600 rounded-lg">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Upcoming (30 days)</p>
            <h3 className="text-2xl font-bold text-gray-900">12</h3>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-center space-x-4">
          <div className="p-3 bg-red-100 text-red-600 rounded-lg">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Overdue</p>
            <h3 className="text-2xl font-bold text-gray-900">3</h3>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-center space-x-4">
          <div className="p-3 bg-green-100 text-green-600 rounded-lg">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Expected Revenue</p>
            <h3 className="text-2xl font-bold text-gray-900">$45,000</h3>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <h2 className="text-lg font-semibold text-gray-800 flex items-center space-x-2">
            <Clock className="w-5 h-5 text-gray-500" />
            <span>Expiring Licenses</span>
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white border-b border-gray-100 text-sm text-gray-500">
                <th className="px-6 py-4 font-medium">Company</th>
                <th className="px-6 py-4 font-medium">Plan</th>
                <th className="px-6 py-4 font-medium">Expiry Date</th>
                <th className="px-6 py-4 font-medium">Amount</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {mockRenewals.map((renewal) => (
                <tr key={renewal.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 text-gray-900 font-medium">{renewal.company}</td>
                  <td className="px-6 py-4 text-gray-600">{renewal.plan}</td>
                  <td className="px-6 py-4 text-gray-600">{renewal.expiryDate}</td>
                  <td className="px-6 py-4 text-gray-900">${renewal.amount.toLocaleString()}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      renewal.status === 'Upcoming' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {renewal.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="inline-flex items-center space-x-1 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 px-3 py-1.5 rounded-md text-sm font-medium transition-colors shadow-sm">
                      <FileText className="w-4 h-4" />
                      <span>Generate Invoice & Notify</span>
                    </button>
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
