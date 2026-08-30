"use client";

import React, { useState } from "react";
import Link from "next/link";

export default function UBOPrivacyChecker() {
  const [citizenship, setCitizenship] = useState("");
  const [jurisdiction, setJurisdiction] = useState("");
  const [result, setResult] = useState<null | { level: string; desc: string; color: string }>(null);

  const checkPrivacy = (e: React.FormEvent) => {
    e.preventDefault();
    if (!citizenship || !jurisdiction) return;

    const lowerJurisdiction = jurisdiction.toLowerCase();
    
    if (lowerJurisdiction.includes("uk") || lowerJurisdiction.includes("united kingdom")) {
      setResult({
        level: "High Exposure: Publicly Searchable",
        desc: "Your details (name, nationality, month/year of birth, and service address) are freely available on public registries like Companies House.",
        color: "text-red-700 bg-red-50 border-red-200"
      });
    } else if (lowerJurisdiction.includes("us") || lowerJurisdiction.includes("united states")) {
      setResult({
        level: "Medium/High Exposure",
        desc: "While FinCEN data is generally not public, state-level registries may publicly expose your details depending on the state.",
        color: "text-orange-700 bg-orange-50 border-orange-200"
      });
    } else {
      setResult({
        level: "Moderate Exposure",
        desc: "Your UBO data may be accessible to authorities and potentially the public depending on specific local laws.",
        color: "text-yellow-700 bg-yellow-50 border-yellow-200"
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
      {/* Sticky Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200 px-4 py-3 flex items-center shadow-sm">
        <Link 
          href="/dashboard"
          className="flex items-center text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
        >
          <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          Back
        </Link>
        <h1 className="flex-1 text-center text-lg font-semibold pr-10">UBO Privacy Checker</h1>
      </header>

      {/* Main Content */}
      <main className="max-w-xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <p className="text-gray-600 text-sm mb-6">
            Find out how exposed your public registry data is based on your jurisdiction.
          </p>

          <form onSubmit={checkPrivacy} className="space-y-4">
            <div>
              <label htmlFor="citizenship" className="block text-sm font-medium text-gray-700 mb-1">
                Country of Citizenship
              </label>
              <input
                id="citizenship"
                type="text"
                placeholder="e.g., France"
                value={citizenship}
                onChange={(e) => setCitizenship(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label htmlFor="jurisdiction" className="block text-sm font-medium text-gray-700 mb-1">
                Current Jurisdiction
              </label>
              <input
                id="jurisdiction"
                type="text"
                placeholder="e.g., UK, US"
                value={jurisdiction}
                onChange={(e) => setJurisdiction(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full bg-gray-900 text-white font-medium py-2 px-4 rounded-md hover:bg-gray-800 transition-colors"
            >
              Check Exposure
            </button>
          </form>

          {/* Result Area */}
          {result && (
            <div className={`mt-6 p-4 rounded-md border ${result.color}`}>
              <h3 className="font-semibold text-lg flex items-center mb-2">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                {result.level}
              </h3>
              <p className="text-sm">
                {result.desc}
              </p>
            </div>
          )}
        </div>

        {/* Upsell CTA */}
        {result && (
          <div className="mt-8 bg-blue-50 border border-blue-100 rounded-xl p-6 text-center">
            <h4 className="text-blue-900 font-semibold mb-2">Protect Your Identity</h4>
            <p className="text-blue-700 text-sm mb-4">
              Keep your personal information private and off public databases.
            </p>
            <Link
              href="/checkout/uae"
              className="inline-block bg-blue-600 text-white font-medium py-2 px-6 rounded-md hover:bg-blue-700 transition-colors w-full sm:w-auto"
            >
              Secure Your Privacy with Nominee UBO
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
