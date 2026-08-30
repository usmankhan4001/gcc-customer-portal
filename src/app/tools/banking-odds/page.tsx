"use client";

import React, { useState } from "react";
import Link from "next/link";
import BannerHeader from '@/components/portal/BannerHeader';

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
      <BannerHeader title="Banking Odds" />

      {/* Main Content */}
      <main className="flex-1 max-w-2xl w-full mx-auto p-4 space-y-4 mt-4">
        <div className="bg-white p-4 rounded-md shadow-sm border border-gray-200 space-y-4">
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <label htmlFor="nationality" className="w-40 text-sm font-medium text-gray-700">
                Nationality
              </label>
              <select
                id="nationality"
                value={nationality}
                onChange={(e) => setNationality(e.target.value)}
                className="flex-1 border-gray-300 rounded-md shadow-sm focus:border-red-500 focus:ring-1 focus:ring-red-500 p-1.5 text-sm border outline-none transition-colors bg-white text-gray-900"
              >
                <option value="">Select Nationality</option>
                <option value="US">United States</option>
                <option value="UK">United Kingdom</option>
                <option value="IN">India</option>
                <option value="AE">UAE</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <label htmlFor="industry" className="w-40 text-sm font-medium text-gray-700">
                Industry
              </label>
              <select
                id="industry"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                className="flex-1 border-gray-300 rounded-md shadow-sm focus:border-red-500 focus:ring-1 focus:ring-red-500 p-1.5 text-sm border outline-none transition-colors bg-white text-gray-900"
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
            className="w-full bg-red-600 hover:bg-red-700 text-white text-sm font-medium py-2 px-4 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
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
          <div className="space-y-4 animate-in fade-in duration-500">
            <h2 className="text-lg font-semibold text-gray-900">Your Match Results</h2>
            
            <div className="space-y-3">
              {results.map((result, idx) => (
                <div key={idx} className="bg-white p-3 rounded-md shadow-sm border border-gray-200 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-red-50 rounded-md flex items-center justify-center text-red-600">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
                      <h3 className="font-semibold text-sm text-gray-900">{result.bank}</h3>
                      <p className="text-xs text-gray-500">Estimated Approval</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center justify-end gap-1 text-lg font-bold text-gray-900">
                      {result.odds}<span className="text-sm text-gray-400">%</span>
                    </div>
                    <p className={`text-xs font-medium ${result.odds > 80 ? 'text-green-600' : result.odds > 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                      {result.odds > 80 ? 'High Likelihood' : result.odds > 50 ? 'Medium Likelihood' : 'Low Likelihood'}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Upsell CTA */}
            <div className="bg-red-50 border border-red-100 rounded-md p-4 text-center space-y-3 mt-4 shadow-sm">
              <h3 className="text-sm font-bold text-red-900">Need guaranteed approval?</h3>
              <p className="text-red-800 text-xs max-w-md mx-auto">
                Skip the guesswork. Our experts have relationships with all major UAE banks.
              </p>
              <Link
                href="/services"
                className="inline-block w-full bg-red-600 hover:bg-red-700 text-white text-sm font-medium py-2 px-4 rounded-md transition-colors shadow-sm"
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
