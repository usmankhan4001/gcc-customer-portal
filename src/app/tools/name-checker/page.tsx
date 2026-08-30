"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import BannerHeader from '@/components/portal/BannerHeader';
import ContactCaptureGate from '@/components/portal/ContactCaptureGate';

interface NameResult {
  status: 'available' | 'forbidden';
  message: string;
}

function checkAvailability(name: string): NameResult {
  const lowerName = name.toLowerCase();
  if (lowerName.includes('bank') || lowerName.includes('crypto')) {
    return {
      status: 'forbidden',
      message: 'Contains a restricted word (e.g., "bank", "crypto") that typically requires special licensing.',
    };
  }
  return {
    status: 'available',
    message: 'No obvious restricted words found',
  };
}

export default function NameCheckerPage() {
  const [name, setName] = useState('');
  const [result, setResult] = useState<NameResult | null>(null);
  const [captured, setCaptured] = useState(false);

  const handleCheck = () => {
    if (!name.trim()) return;
    setResult(checkAvailability(name));
    setCaptured(false);
  };

  const handleCapture = async (contact: { email: string; whatsapp_number: string }) => {
    if (!result) return;
    await fetch('/api/leads/capture', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        source_tool: 'name_checker',
        email: contact.email || undefined,
        whatsapp_number: contact.whatsapp_number || undefined,
        tool_input: { name },
        tool_result: result,
      }),
    });
    setCaptured(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <BannerHeader title="Name Availability Checker" />

      <main className="flex-1 w-full max-w-3xl mx-auto px-4 py-4 space-y-4">
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
                onKeyDown={(e) => e.key === 'Enter' && handleCheck()}
                className="w-2/3 px-3 py-2 rounded-md border border-gray-300 focus:ring-1 focus:ring-red-500 focus:border-red-500 transition-shadow outline-none text-gray-900 text-sm"
                placeholder="e.g., Acme Corp"
              />
            </div>

            <div className="flex justify-end border-t border-gray-100 pt-4">
              <button
                onClick={handleCheck}
                disabled={!name.trim()}
                className="flex items-center justify-center py-2 px-6 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Check
              </button>
            </div>
          </div>
        </div>

        {result && !captured && (
          <ContactCaptureGate
            title="See the full check"
            subtitle="Enter your contact info to reveal the result."
            onCapture={handleCapture}
          />
        )}

        {result && captured && (
          <>
            <div className={`p-4 rounded-md border ${result.status === 'available' ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'}`}>
              <div className="flex items-start gap-3 text-sm">
                <div className="font-medium min-w-[120px]">Preliminary check:</div>
                <div className={`font-semibold ${result.status === 'available' ? 'text-green-800' : 'text-amber-800'}`}>
                  {result.message}
                </div>
              </div>
              <p className="mt-3 pt-3 border-t border-black/5 text-xs text-gray-500">
                This is a preliminary check only, not a registry search — final availability is confirmed
                during official filing with the relevant registrar.
              </p>
            </div>

            {result.status === 'available' && (
              <div className="bg-red-50 rounded-md p-4 flex flex-col sm:flex-row items-center justify-between border border-red-100 gap-4">
                <div>
                  <h4 className="text-sm font-semibold text-gray-900">Ready to register?</h4>
                  <p className="text-gray-600 text-xs mt-1">We'll run the official check as part of formation.</p>
                </div>
                <Link
                  href="/services"
                  className="whitespace-nowrap inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md shadow-sm transition-colors"
                >
                  Start Formation
                </Link>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
