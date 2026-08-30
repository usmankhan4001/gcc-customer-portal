"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import BannerHeader from '@/components/portal/BannerHeader';
import ContactCaptureGate from '@/components/portal/ContactCaptureGate';

export default function QFZPEligibilityChecker() {
  const [activity, setActivity] = useState('Tech');
  const [visas, setVisas] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [captured, setCaptured] = useState(false);

  const isLikelyEligible = activity !== 'Crypto' && visas > 0;

  const handleSubmit = () => {
    setSubmitted(true);
    setCaptured(false);
  };

  const handleCapture = async (contact: { email: string; whatsapp_number: string }) => {
    await fetch('/api/leads/capture', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        source_tool: 'qfzp_eligibility',
        email: contact.email || undefined,
        whatsapp_number: contact.whatsapp_number || undefined,
        tool_input: { activity, visas },
        tool_result: { isLikelyEligible },
        signals: { primaryInterestJurisdiction: 'uae' },
      }),
    });
    setCaptured(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <BannerHeader title="QFZP Eligibility Checker" />

      <main className="flex-grow p-4 max-w-3xl mx-auto w-full space-y-4">
        <div className="bg-white p-4 rounded-md shadow-sm border border-gray-200">
          <div className="border-b border-gray-100 pb-3 mb-4">
            <h2 className="text-sm font-semibold text-gray-800">Eligibility Details</h2>
          </div>

          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <label htmlFor="activity" className="w-1/3 text-sm font-medium text-gray-700">
                Business Activity
              </label>
              <select
                id="activity"
                value={activity}
                onChange={(e) => setActivity(e.target.value)}
                className="w-2/3 border border-gray-300 bg-white rounded-md p-2 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 transition-shadow"
              >
                <option value="Tech">Tech</option>
                <option value="Trading">Trading</option>
                <option value="Crypto">Crypto</option>
                <option value="Consulting">Consulting</option>
              </select>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <label htmlFor="visas" className="w-1/3 text-sm font-medium text-gray-700">
                Required Visas
              </label>
              <input
                type="number"
                id="visas"
                min="0"
                value={visas}
                onChange={(e) => setVisas(parseInt(e.target.value) || 0)}
                className="w-2/3 border border-gray-300 rounded-md p-2 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 transition-shadow"
                placeholder="Enter number of visas"
              />
            </div>

            <div className="flex justify-end border-t border-gray-100 pt-4">
              <button
                onClick={handleSubmit}
                className="py-2 px-6 rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 transition-colors"
              >
                Check Eligibility
              </button>
            </div>
          </div>
        </div>

        {submitted && !captured && (
          <ContactCaptureGate
            title="See your eligibility assessment"
            subtitle="Enter your contact info to reveal the result."
            onCapture={handleCapture}
          />
        )}

        {submitted && captured && (
          <>
            <div
              className={`p-4 rounded-md border transition-colors duration-300 ${
                isLikelyEligible ? 'bg-green-50 border-green-200 text-green-900' : 'bg-red-50 border-red-200 text-red-900'
              }`}
            >
              <div className="flex items-start gap-4 text-sm">
                <div className="font-medium min-w-[120px]">Preliminary status:</div>
                <div className="font-semibold">
                  {isLikelyEligible ? 'Likely eligible for QFZP status' : 'Review required'}
                </div>
              </div>
              <div className="flex items-start gap-4 text-sm mt-2">
                <div className="font-medium min-w-[120px]">Notes:</div>
                <div className="opacity-90">
                  {isLikelyEligible
                    ? 'Based on activity and visa inputs alone, this is a positive early signal — real QFZP status also depends on de minimis income, audited financials, and adequate substance requirements not captured here.'
                    : 'Certain activities (like Crypto) or a lack of visa requirements often restrict QFZP eligibility. Talk to our team for a full assessment.'}
                </div>
              </div>
              <p className="mt-3 pt-3 border-t border-black/10 text-xs opacity-70">
                Indicative only, not a compliance determination — confirm with your advisor before relying on this.
              </p>
            </div>

            <div className="text-right">
              <Link
                href="/services"
                className="inline-block bg-red-600 hover:bg-red-700 text-white text-sm font-medium py-2 px-6 rounded-md shadow-sm transition-all duration-200"
              >
                Start Freezone Setup
              </Link>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
