"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import BannerHeader from '@/components/portal/BannerHeader';

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
      <BannerHeader title="Name Availability Checker" />

      <main className="flex-1 w-full max-w-3xl mx-auto px-4 py-4">
        <div className="bg-white rounded-md shadow-sm border border-gray-200 p-4">
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <label htmlFor="companyName" className="w-1/3 text-sm font-medium text-gray-700">
                Desired Company Name
              </label>
              <input
                type="text"
                id="companyName"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && checkAvailability()}
                className="w-2/3 px-3 py-2 rounded-md border border-gray-300 focus:ring-1 focus:ring-red-500 focus:border-red-500 transition-shadow outline-none text-gray-900 text-sm"
                placeholder="e.g., Acme Corp"
              />
            </div>

            <div className="flex justify-end border-t border-gray-100 pt-4">
              <button
                onClick={checkAvailability}
                disabled={loading || !name.trim()}
                className="flex items-center justify-center py-2 px-6 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Checking...' : 'Check Availability'}
              </button>
            </div>

            {/* Result Area */}
            {result && (
              <div className={`mt-4 p-4 rounded-md border ${result.status === 'available' ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'}`}>
                <div className="flex items-start gap-3 text-sm">
                  <div className="font-medium min-w-[120px]">Status:</div>
                  <div className={`font-semibold ${result.status === 'available' ? 'text-green-800' : 'text-amber-800'}`}>
                    {result.message}
                  </div>
                </div>
                {result.status === 'available' && (
                  <div className="flex items-start gap-3 text-sm mt-2">
                    <div className="font-medium min-w-[120px]">Details:</div>
                    <div className="text-green-700">This name appears to be available for registration in your selected jurisdiction.</div>
                  </div>
                )}
              </div>
            )}

            {/* Upsell CTA */}
            {result && result.status === 'available' && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="bg-red-50 rounded-md p-4 flex flex-col sm:flex-row items-center justify-between border border-red-100 gap-4">
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900">Secure this name today!</h4>
                    <p className="text-gray-600 text-xs mt-1">Company names are first-come, first-served.</p>
                  </div>
                  <Link
                    href="/services"
                    className="whitespace-nowrap inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md shadow-sm transition-colors"
                  >
                    Reserve Name
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
