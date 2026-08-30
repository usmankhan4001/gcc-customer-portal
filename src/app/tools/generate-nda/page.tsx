"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import BannerHeader from '@/components/portal/BannerHeader';
import ContactCaptureGate from '@/components/portal/ContactCaptureGate';

export default function GenerateNDAPage() {
  const [yourCompany, setYourCompany] = useState('');
  const [otherParty, setOtherParty] = useState('');
  const [ready, setReady] = useState(false);
  const [captured, setCaptured] = useState(false);

  const handleContinue = (e: React.FormEvent) => {
    e.preventDefault();
    if (!yourCompany || !otherParty) return;
    setReady(true);
    setCaptured(false);
  };

  const handleCapture = async (contact: { email: string; whatsapp_number: string }) => {
    await fetch('/api/leads/capture', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        source_tool: 'nda_generator',
        email: contact.email || undefined,
        whatsapp_number: contact.whatsapp_number || undefined,
        tool_input: { yourCompany, otherParty },
        tool_result: { status: 'pending_legal_template' },
      }),
    });
    setCaptured(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <BannerHeader title="Generate NDA" />

      <main className="flex-1 p-4 flex justify-center items-start pt-6">
        <div className="max-w-xl w-full space-y-4">
          {!ready ? (
            <div className="bg-white rounded-md shadow-sm border border-gray-200 p-4">
              <div className="mb-4">
                <h2 className="text-sm font-semibold text-gray-900 mb-1">Create a Mutual NDA</h2>
                <p className="text-xs text-gray-500">Enter the details below and we&apos;ll prepare a non-disclosure agreement for you.</p>
              </div>

              <form onSubmit={handleContinue} className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <label htmlFor="yourCompany" className="w-40 text-sm font-medium text-gray-700">
                    Your Company Name
                  </label>
                  <input
                    type="text"
                    id="yourCompany"
                    value={yourCompany}
                    onChange={(e) => setYourCompany(e.target.value)}
                    placeholder="e.g. Acme Corp"
                    className="flex-1 px-2 py-1.5 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                    required
                  />
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <label htmlFor="otherParty" className="w-40 text-sm font-medium text-gray-700">
                    Other Party Name
                  </label>
                  <input
                    type="text"
                    id="otherParty"
                    value={otherParty}
                    onChange={(e) => setOtherParty(e.target.value)}
                    placeholder="e.g. Globex Inc."
                    className="flex-1 px-2 py-1.5 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={!yourCompany || !otherParty}
                  className="w-full mt-4 bg-primary text-white text-sm font-medium py-2 px-4 rounded-md shadow hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Continue
                </button>
              </form>
            </div>
          ) : !captured ? (
            <ContactCaptureGate
              title="Where should we send your NDA?"
              subtitle="We'll email and WhatsApp it to you once it's ready."
              onCapture={handleCapture}
            />
          ) : (
            <div className="space-y-4">
              <div className="bg-white rounded-md shadow-sm border border-info/30 p-6 text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-info-light mb-4">
                  <svg className="h-6 w-6 text-info" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h2 className="text-lg font-bold text-gray-900 mb-1">Your NDA is being prepared</h2>
                <p className="text-gray-500 text-sm max-w-sm mx-auto">
                  We&apos;re finalizing the agreement between <strong>{yourCompany}</strong> and{' '}
                  <strong>{otherParty}</strong>. We&apos;ll send it to you shortly — no instant fake download here,
                  this one gets a real review before it goes out.
                </p>
              </div>

              <div className="bg-primary-50 rounded-md border border-primary-100 p-4 flex flex-col sm:flex-row items-center justify-between shadow-sm">
                <div>
                  <h3 className="text-primary-900 font-semibold text-sm">Store all your corporate documents securely.</h3>
                  <p className="text-primary-700 text-xs mt-0.5">Keep your NDAs, contracts, and filings in one secure place.</p>
                </div>
                <Link
                  href="/vault"
                  className="whitespace-nowrap px-4 py-2 bg-white border border-primary-200 text-primary-700 text-xs font-medium rounded-md shadow-sm hover:bg-primary-50 transition-colors mt-3 sm:mt-0"
                >
                  Go to My Vault
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
