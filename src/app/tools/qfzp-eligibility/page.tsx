"use client";

import React, { useState } from 'react';
import Link from 'next/link';

export default function QFZPEligibilityChecker() {
  const [activity, setActivity] = useState('Tech');
  const [visas, setVisas] = useState(1);

  // Basic eligibility logic based on inputs
  const isEligible = activity !== 'Crypto' && visas > 0;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      {/* Sticky top header */}
      <header className="sticky top-0 bg-white border-b border-gray-200 px-4 py-4 flex items-center shadow-sm z-10">
        <Link 
          href="/dashboard" 
          className="text-blue-600 hover:text-blue-800 flex items-center mr-4 transition-colors font-medium"
        >
          <span className="mr-2 text-xl leading-none">&larr;</span> Back
        </Link>
        <h1 className="text-xl font-semibold text-gray-800">QFZP Eligibility Checker</h1>
      </header>

      {/* Main content */}
      <main className="flex-grow p-4 md:p-8 max-w-3xl mx-auto w-full">
        <div className="bg-white p-6 md:p-8 rounded-xl shadow-sm border border-gray-100 mb-6">
          <h2 className="text-xl font-medium text-gray-800 mb-6">Eligibility Details</h2>
          
          <div className="space-y-6">
            <div>
              <label htmlFor="activity" className="block text-sm font-medium text-gray-700 mb-2">
                Business Activity
              </label>
              <select
                id="activity"
                value={activity}
                onChange={(e) => setActivity(e.target.value)}
                className="w-full border border-gray-300 bg-white rounded-lg p-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
              >
                <option value="Tech">Tech</option>
                <option value="Trading">Trading</option>
                <option value="Crypto">Crypto</option>
                <option value="Consulting">Consulting</option>
              </select>
            </div>

            <div>
              <label htmlFor="visas" className="block text-sm font-medium text-gray-700 mb-2">
                Required Visas
              </label>
              <input
                type="number"
                id="visas"
                min="0"
                value={visas}
                onChange={(e) => setVisas(parseInt(e.target.value) || 0)}
                className="w-full border border-gray-300 rounded-lg p-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
                placeholder="Enter number of visas"
              />
            </div>
          </div>
        </div>

        {/* Output */}
        <div className={`p-6 rounded-xl mb-8 border transition-colors duration-300 ${
          isEligible 
            ? 'bg-green-50 border-green-200 text-green-900' 
            : 'bg-red-50 border-red-200 text-red-900'
        }`}>
          <div className="flex items-start">
            {isEligible ? (
              <span className="text-3xl mr-4" role="img" aria-label="Eligible">✅</span>
            ) : (
              <span className="text-3xl mr-4" role="img" aria-label="Not Eligible">❌</span>
            )}
            <div>
              <h3 className="font-semibold text-lg md:text-xl">
                {isEligible ? 'Eligible for 100% Foreign Ownership' : 'Review Required'}
              </h3>
              <p className="text-sm md:text-base mt-2 opacity-90">
                {isEligible 
                  ? 'Great news! Based on your selected business activity and visa requirements, you appear eligible for 100% foreign ownership under the QFZP.' 
                  : 'Certain activities (like Crypto) or lacking visa requirements may restrict 100% foreign ownership. Please contact our support for detailed advice.'}
              </p>
            </div>
          </div>
        </div>

        {/* Upsell CTA */}
        <div className="text-center pb-8">
          <Link 
            href="/services" 
            className="inline-block w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-8 rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
          >
            Start Freezone Setup
          </Link>
        </div>
      </main>
    </div>
  );
}
