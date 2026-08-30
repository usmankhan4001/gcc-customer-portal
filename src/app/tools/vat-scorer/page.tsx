'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import BannerHeader from '@/components/portal/BannerHeader';

export default function VatScorerPage() {
  const [revenue, setRevenue] = useState('');
  const [businessType, setBusinessType] = useState('B2B');

  const revAmount = parseFloat(revenue) || 0;
  const isMandatory = revAmount > 100000;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <BannerHeader title="VAT Threshold Scorer" />

      <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-4">
        <div className="bg-white rounded-md shadow-sm border border-gray-200 p-4">
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <label htmlFor="revenue" className="w-1/3 text-sm font-medium text-gray-700">
                Estimated UAE Revenue ($)
              </label>
              <div className="w-2/3 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">$</span>
                </div>
                <input
                  type="number"
                  name="revenue"
                  id="revenue"
                  className="focus:ring-1 focus:ring-red-500 focus:border-red-500 block w-full pl-7 pr-4 py-2 sm:text-sm border-gray-300 rounded-md border text-gray-900 outline-none"
                  placeholder="0.00"
                  value={revenue}
                  onChange={(e) => setRevenue(e.target.value)}
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <label htmlFor="businessType" className="w-1/3 text-sm font-medium text-gray-700">
                Business Type
              </label>
              <select
                id="businessType"
                name="businessType"
                className="w-2/3 block pl-3 pr-10 py-2 text-sm border-gray-300 focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 rounded-md border text-gray-900"
                value={businessType}
                onChange={(e) => setBusinessType(e.target.value)}
              >
                <option value="B2B">B2B (Business to Business)</option>
                <option value="B2C">B2C (Business to Consumer)</option>
              </select>
            </div>

            <div className={`p-4 rounded-md mt-6 border transition-colors duration-300 text-sm ${isMandatory ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
              <div className="flex items-start gap-4">
                <div className="font-medium min-w-[120px]">Requirement:</div>
                <div className={`font-semibold ${isMandatory ? 'text-red-800' : 'text-green-800'}`}>
                  {isMandatory ? 'VAT Registration Mandatory' : 'Voluntary'}
                </div>
              </div>
              <div className="flex items-start gap-4 mt-2">
                <div className="font-medium min-w-[120px]">Details:</div>
                <div className={`${isMandatory ? 'text-red-700' : 'text-green-700'}`}>
                  {isMandatory 
                    ? 'Based on your estimated revenue, you are required to register for VAT in the UAE.' 
                    : 'Based on your estimated revenue, VAT registration is currently voluntary.'}
                </div>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="rounded-md bg-red-50 p-4 flex flex-col sm:flex-row items-center justify-between border border-red-100 gap-4">
                <div>
                  <h3 className="text-sm font-semibold text-red-900">Need help with VAT?</h3>
                  <p className="text-xs text-red-700 mt-1">Let our experts handle your tax compliance automatically.</p>
                </div>
                <Link
                  href="/services"
                  className="whitespace-nowrap inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                >
                  Get Automated Tax Compliance
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
