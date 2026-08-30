"use client";

import React, { useState } from 'react';
import Link from 'next/link';

export default function NameCheckerPage() {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ status: 'available' | 'forbidden', message: string } | null>(null);

  const checkAvailability = () => {
    if (!name.trim()) return;
    
    setLoading(true);
    setResult(null);

    setTimeout(() => {
      setLoading(false);
      const lowerName = name.toLowerCase();
      // Mock check for forbidden words
      if (lowerName.includes('bank') || lowerName.includes('crypto')) {
        setResult({
          status: 'forbidden',
          message: 'The name contains restricted words (e.g., "bank", "crypto").'
        });
      } else {
        setResult({
          status: 'available',
          message: 'Highly Likely Available'
        });
      }
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Sticky Header */}
      <div className="sticky top-0 bg-white border-b border-gray-200 z-10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center">
          <Link href="/dashboard" className="text-gray-500 hover:text-gray-900 flex items-center gap-2 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>
            <span>Back</span>
          </Link>
          <h1 className="ml-6 text-xl font-semibold text-gray-900">Name Availability Checker</h1>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 sm:p-8">
          <div className="space-y-6">
            <div>
              <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 mb-2">
                Desired Company Name
              </label>
              <input
                type="text"
                id="companyName"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && checkAvailability()}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow outline-none text-gray-900"
                placeholder="e.g., Acme Corp"
              />
            </div>

            <button
              onClick={checkAvailability}
              disabled={loading || !name.trim()}
              className="w-full flex items-center justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Checking...
                </>
              ) : (
                'Check Availability'
              )}
            </button>

            {/* Result Area */}
            {result && (
              <div className={`mt-6 p-6 rounded-lg border ${result.status === 'available' ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'}`}>
                <div className="flex items-start gap-4">
                  {result.status === 'available' ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-600 flex-shrink-0 mt-0.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/></svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-600 flex-shrink-0 mt-0.5"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
                  )}
                  <div>
                    <h3 className={`text-lg font-medium ${result.status === 'available' ? 'text-green-800' : 'text-amber-800'}`}>
                      {result.message}
                    </h3>
                    {result.status === 'available' && (
                      <p className="mt-2 text-green-700 text-sm">
                        This name appears to be available for registration in your selected jurisdiction.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Upsell CTA */}
            {result && result.status === 'available' && (
              <div className="mt-8 pt-6 border-t border-gray-100">
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 text-center border border-blue-100">
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">Secure this name today!</h4>
                  <p className="text-gray-600 text-sm mb-6 max-w-md mx-auto">
                    Company names are registered on a first-come, first-served basis. Don't let someone else take it.
                  </p>
                  <Link
                    href="/services"
                    className="inline-flex items-center justify-center px-8 py-3 text-base font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors"
                  >
                    Reserve Name Now
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
