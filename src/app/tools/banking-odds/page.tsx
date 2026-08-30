"use client";

import React, { useState } from "react";
import Link from "next/link";

export default function BankingOddsMatcher() {
  const [nationality, setNationality] = useState("");
  const [industry, setIndustry] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<{ bank: string; odds: number }[] | null>(null);

  const handleCalculate = () => {
    if (!nationality || !industry) return;
    setLoading(true);
    setResults(null);

    // Mock 1-second loading
    setTimeout(() => {
      // Mock logic based on industry/nationality
      let wioOdds = 95;
      let enbdOdds = 85;

      if (industry === "Crypto") {
        wioOdds = 40;
        enbdOdds = 20;
      } else if (industry === "E-commerce") {
        wioOdds = 90;
        enbdOdds = 75;
      }

      setResults([
        { bank: "Wio Bank", odds: wioOdds },
        { bank: "Emirates NBD", odds: enbdOdds },
      ]);
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      {/* Sticky Header */}
      <header className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="p-2 hover:bg-gray-100 rounded-full transition-colors flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-700">
              <path d="m12 19-7-7 7-7"/>
              <path d="M19 12H5"/>
            </svg>
          </Link>
          <h1 className="text-xl font-semibold text-gray-900">Banking Odds Matcher</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-2xl w-full mx-auto p-6 space-y-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 space-y-6">
          <div className="space-y-4">
            <div>
              <label htmlFor="nationality" className="block text-sm font-medium text-gray-700 mb-1">
                Nationality
              </label>
              <select
                id="nationality"
                value={nationality}
                onChange={(e) => setNationality(e.target.value)}
                className="w-full border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2.5 border outline-none transition-colors bg-white text-gray-900"
              >
                <option value="">Select Nationality</option>
                <option value="US">United States</option>
                <option value="UK">United Kingdom</option>
                <option value="IN">India</option>
                <option value="AE">UAE</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label htmlFor="industry" className="block text-sm font-medium text-gray-700 mb-1">
                Industry
              </label>
              <select
                id="industry"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                className="w-full border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2.5 border outline-none transition-colors bg-white text-gray-900"
              >
                <option value="">Select Industry</option>
                <option value="Consulting">Consulting</option>
                <option value="E-commerce">E-commerce</option>
                <option value="Crypto">Crypto</option>
                <option value="Real Estate">Real Estate</option>
                <option value="Technology">Technology</option>
              </select>
            </div>
          </div>

          <button
            onClick={handleCalculate}
            disabled={!nationality || !industry || loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Calculating...
              </>
            ) : (
              "Calculate Odds"
            )}
          </button>
        </div>

        {/* Results Section */}
        {results && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <h2 className="text-xl font-semibold text-gray-900">Your Match Results</h2>
            
            <div className="space-y-4">
              {results.map((result, idx) => (
                <div key={idx} className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect>
                        <path d="M9 22v-4h6v4"></path>
                        <path d="M8 6h.01"></path>
                        <path d="M16 6h.01"></path>
                        <path d="M12 6h.01"></path>
                        <path d="M12 10h.01"></path>
                        <path d="M12 14h.01"></path>
                        <path d="M16 10h.01"></path>
                        <path d="M16 14h.01"></path>
                        <path d="M8 10h.01"></path>
                        <path d="M8 14h.01"></path>
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg text-gray-900">{result.bank}</h3>
                      <p className="text-sm text-gray-500">Estimated Approval</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center justify-end gap-1 text-2xl font-bold text-gray-900">
                      {result.odds}<span className="text-lg text-gray-400">%</span>
                    </div>
                    <p className={`text-sm font-medium ${result.odds > 80 ? 'text-green-600' : result.odds > 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                      {result.odds > 80 ? 'High Likelihood' : result.odds > 50 ? 'Medium Likelihood' : 'Low Likelihood'}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Upsell CTA */}
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-6 text-center space-y-4 mt-8 shadow-sm">
              <h3 className="text-lg font-bold text-blue-900">Need guaranteed approval?</h3>
              <p className="text-blue-800 text-sm max-w-md mx-auto">
                Skip the guesswork. Our experts have relationships with all major UAE banks.
              </p>
              <Link
                href="/services"
                className="inline-block w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors shadow-sm"
              >
                Get Guaranteed Banking
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
