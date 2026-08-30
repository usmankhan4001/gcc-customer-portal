"use client";

import React, { useState } from 'react';
import Link from 'next/link';

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
      {/* Sticky Header */}
      <header className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3 flex items-center shadow-sm">
        <Link href="/dashboard" className="text-gray-600 hover:text-gray-900 flex items-center mr-4 transition-colors">
          <svg className="h-5 w-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span className="font-medium">Back</span>
        </Link>
        <h1 className="text-xl font-semibold text-gray-800">Generate Quick NDA</h1>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 flex justify-center items-start pt-12">
        <div className="max-w-xl w-full">
          {!isGenerated ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 md:p-8">
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-1">Create a Mutual NDA</h2>
                <p className="text-sm text-gray-500">Enter the details below to instantly generate a standard non-disclosure agreement in PDF format.</p>
              </div>

              <form onSubmit={handleGenerate} className="space-y-5">
                <div>
                  <label htmlFor="yourCompany" className="block text-sm font-medium text-gray-700 mb-1">
                    Your Company Name
                  </label>
                  <input
                    type="text"
                    id="yourCompany"
                    value={yourCompany}
                    onChange={(e) => setYourCompany(e.target.value)}
                    placeholder="e.g. Acme Corp"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="otherParty" className="block text-sm font-medium text-gray-700 mb-1">
                    Other Party Name
                  </label>
                  <input
                    type="text"
                    id="otherParty"
                    value={otherParty}
                    onChange={(e) => setOtherParty(e.target.value)}
                    placeholder="e.g. Globex Inc."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    required
                  />
                </div>
                
                <button
                  type="submit"
                  disabled={isGenerating || !yourCompany || !otherParty}
                  className="w-full mt-6 bg-blue-600 text-white font-medium py-2.5 px-4 rounded-md shadow hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center transition-colors"
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
            <div className="space-y-6">
              {/* Success State */}
              <div className="bg-white rounded-xl shadow-sm border border-green-200 p-8 text-center">
                <div className="mx-auto flex items-center justify-center h-14 w-14 rounded-full bg-green-100 mb-5">
                  <svg className="h-7 w-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">NDA Generated Successfully!</h2>
                <p className="text-gray-500 mb-8 max-w-sm mx-auto">Your non-disclosure agreement between <strong>{yourCompany}</strong> and <strong>{otherParty}</strong> is ready.</p>
                
                <button className="mx-auto flex items-center justify-center px-6 py-2.5 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors">
                  <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download PDF
                </button>
              </div>

              {/* Upsell */}
              <div className="bg-indigo-50 rounded-xl border border-indigo-100 p-6 flex flex-col sm:flex-row items-center justify-between shadow-sm">
                <div className="flex items-start mb-4 sm:mb-0">
                  <div className="bg-indigo-100 p-2 rounded-full mr-4 flex-shrink-0">
                    <svg className="h-6 w-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-indigo-900 font-semibold text-lg">Store all your corporate documents securely.</h3>
                    <p className="text-indigo-700 text-sm mt-1">Keep your NDAs, contracts, and filings in one secure place.</p>
                  </div>
                </div>
                <Link 
                  href="/vault" 
                  className="whitespace-nowrap px-5 py-2.5 bg-white border border-indigo-200 text-indigo-700 text-sm font-medium rounded-md shadow-sm hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
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
                   className="text-sm text-gray-500 hover:text-gray-800 font-medium transition-colors"
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
