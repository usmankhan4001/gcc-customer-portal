"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import BannerHeader from '@/components/portal/BannerHeader';

export default function GenerateNDAPage() {
  const [yourCompany, setYourCompany] = useState('');
  const [otherParty, setOtherParty] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGenerated, setIsGenerated] = useState(false);

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!yourCompany || !otherParty) return;
    
    setIsGenerating(true);
    // Simulate generation delay
    setTimeout(() => {
      setIsGenerating(false);
      setIsGenerated(true);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <BannerHeader title="Generate NDA" />

      {/* Main Content */}
      <main className="flex-1 p-4 flex justify-center items-start pt-6">
        <div className="max-w-xl w-full">
          {!isGenerated ? (
            <div className="bg-white rounded-md shadow-sm border border-gray-200 p-4">
              <div className="mb-4">
                <h2 className="text-sm font-semibold text-gray-900 mb-1">Create a Mutual NDA</h2>
                <p className="text-xs text-gray-500">Enter the details below to instantly generate a standard non-disclosure agreement in PDF format.</p>
              </div>

              <form onSubmit={handleGenerate} className="space-y-3">
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
                    className="flex-1 px-2 py-1.5 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 transition-colors"
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
                    className="flex-1 px-2 py-1.5 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 transition-colors"
                    required
                  />
                </div>
                
                <button
                  type="submit"
                  disabled={isGenerating || !yourCompany || !otherParty}
                  className="w-full mt-4 bg-red-600 text-white text-sm font-medium py-2 px-4 rounded-md shadow hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center transition-colors"
                >
                  {isGenerating ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Generating...
                    </>
                  ) : (
                    <>
                      <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Generate PDF
                    </>
                  )}
                </button>
              </form>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Success State */}
              <div className="bg-white rounded-md shadow-sm border border-green-200 p-6 text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                  <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="text-lg font-bold text-gray-900 mb-1">NDA Generated Successfully!</h2>
                <p className="text-gray-500 text-sm mb-6 max-w-sm mx-auto">Your non-disclosure agreement between <strong>{yourCompany}</strong> and <strong>{otherParty}</strong> is ready.</p>
                
                <button className="mx-auto flex items-center justify-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors">
                  <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download PDF
                </button>
              </div>

              {/* Upsell */}
              <div className="bg-red-50 rounded-md border border-red-100 p-4 flex flex-col sm:flex-row items-center justify-between shadow-sm">
                <div className="flex items-start mb-3 sm:mb-0">
                  <div className="bg-red-100 p-1.5 rounded-full mr-3 flex-shrink-0">
                    <svg className="h-5 w-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-red-900 font-semibold text-sm">Store all your corporate documents securely.</h3>
                    <p className="text-red-700 text-xs mt-0.5">Keep your NDAs, contracts, and filings in one secure place.</p>
                  </div>
                </div>
                <Link 
                  href="/vault" 
                  className="whitespace-nowrap px-4 py-2 bg-white border border-red-200 text-red-700 text-xs font-medium rounded-md shadow-sm hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                >
                  Go to My Vault
                </Link>
              </div>
              
              <div className="text-center">
                 <button 
                   onClick={() => {
                     setIsGenerated(false);
                     setOtherParty('');
                   }}
                   className="text-xs text-gray-500 hover:text-gray-800 font-medium transition-colors"
                 >
                   Generate another NDA
                 </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
