'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export default function VatScorerPage() {
  const [revenue, setRevenue] = useState('');
  const [businessType, setBusinessType] = useState('B2B');

  const revAmount = parseFloat(revenue) || 0;
  const isMandatory = revAmount > 100000;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Sticky Header */}
      <header className="sticky top-0 bg-white border-b border-gray-200 z-10 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center w-1/3">
            <Link href="/dashboard" className="text-sm font-medium text-blue-600 hover:text-blue-800 flex items-center transition-colors">
              &larr; Back
            </Link>
          </div>
          <h1 className="text-lg sm:text-xl font-semibold text-gray-900 text-center w-1/3 truncate">
            VAT Threshold Scorer
          </h1>
          <div className="w-1/3"></div> {/* Spacer for centering */}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 sm:p-8">
          <div className="space-y-6">
            <div>
              <label htmlFor="revenue" className="block text-sm font-medium text-gray-700 mb-1">
                Estimated UAE Revenue ($)
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">$</span>
                </div>
                <input
                  type="number"
                  name="revenue"
                  id="revenue"
                  className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-7 pr-4 sm:text-sm border-gray-300 rounded-md py-2.5 border"
                  placeholder="0.00"
                  value={revenue}
                  onChange={(e) => setRevenue(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label htmlFor="businessType" className="block text-sm font-medium text-gray-700 mb-1">
                Business Type
              </label>
              <select
                id="businessType"
                name="businessType"
                className="block w-full pl-3 pr-10 py-2.5 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md border"
                value={businessType}
                onChange={(e) => setBusinessType(e.target.value)}
              >
                <option value="B2B">B2B (Business to Business)</option>
                <option value="B2C">B2C (Business to Consumer)</option>
              </select>
            </div>

            <div className={`p-4 rounded-lg transition-colors duration-300 ${isMandatory ? 'bg-red-50 border border-red-200' : 'bg-green-50 border border-green-200'}`}>
              <h3 className={`text-lg font-medium flex items-center ${isMandatory ? 'text-red-800' : 'text-green-800'}`}>
                {isMandatory ? (
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd"></path></svg>
                ) : (
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd"></path></svg>
                )}
                {isMandatory ? 'VAT Registration Mandatory' : 'Voluntary'}
              </h3>
              <p className={`mt-2 text-sm ${isMandatory ? 'text-red-700' : 'text-green-700'}`}>
                {isMandatory 
                  ? 'Based on your estimated revenue, you are required to register for VAT in the UAE.' 
                  : 'Based on your estimated revenue, VAT registration is currently voluntary.'}
              </p>
            </div>

            <div className="mt-8 pt-8 border-t border-gray-100">
              <div className="rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 p-6 text-center border border-blue-100">
                <h3 className="text-lg font-semibold text-blue-900 mb-2">Need help with VAT?</h3>
                <p className="text-sm text-blue-700 mb-5">Let our experts handle your tax compliance automatically.</p>
                <Link
                  href="/services"
                  className="inline-flex items-center justify-center px-6 py-2.5 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
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
