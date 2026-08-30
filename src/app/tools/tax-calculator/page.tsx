"use client";

import React, { useState } from 'react';
import Link from 'next/link';

const COUNTRIES = [
  { name: 'United Kingdom', rate: 0.25 },
  { name: 'Germany', rate: 0.30 },
  { name: 'France', rate: 0.25 },
  { name: 'United States', rate: 0.21 },
  { name: 'Canada', rate: 0.26 },
  { name: 'Australia', rate: 0.30 },
];

const GCC_OPTIONS = [
  { name: 'Bahrain (0%)', rate: 0 },
  { name: 'UAE (9%)', rate: 0.09 },
];

export default function TaxCalculatorPage() {
  const [profit, setProfit] = useState<number | ''>('');
  const [selectedCountry, setSelectedCountry] = useState(COUNTRIES[0]);
  const [selectedGcc, setSelectedGcc] = useState(GCC_OPTIONS[0]);

  const currentTax = typeof profit === 'number' ? profit * selectedCountry.rate : 0;
  const gccTax = typeof profit === 'number' ? profit * selectedGcc.rate : 0;
  const taxSaved = currentTax - gccTax;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center">
      <header className="sticky top-0 w-full bg-white shadow-sm z-10">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/dashboard" className="text-blue-600 hover:text-blue-800 font-medium flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            Back
          </Link>
          <h1 className="text-xl font-bold text-gray-800">Tax Savings Calculator</h1>
          <div className="w-20"></div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-lg mx-auto p-6 mt-8">
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          
          <div className="space-y-6">
            <div>
              <label htmlFor="country" className="block text-sm font-semibold text-gray-700 mb-2">
                Your Current Country
              </label>
              <select
                id="country"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 transition-colors"
                value={selectedCountry.name}
                onChange={(e) => {
                  const country = COUNTRIES.find(c => c.name === e.target.value);
                  if (country) setSelectedCountry(country);
                }}
              >
                {COUNTRIES.map((c) => (
                  <option key={c.name} value={c.name}>
                    {c.name} ({(c.rate * 100).toFixed(0)}%)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="profit" className="block text-sm font-semibold text-gray-700 mb-2">
                Annual Profit ($)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <span className="text-gray-500 font-medium">$</span>
                </div>
                <input
                  type="number"
                  id="profit"
                  className="w-full pl-8 pr-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 transition-colors"
                  placeholder="100000"
                  value={profit}
                  onChange={(e) => setProfit(e.target.value === '' ? '' : Number(e.target.value))}
                />
              </div>
            </div>

            <div>
              <label htmlFor="gcc" className="block text-sm font-semibold text-gray-700 mb-2">
                Compare with GCC Setup
              </label>
              <select
                id="gcc"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 transition-colors"
                value={selectedGcc.name}
                onChange={(e) => {
                  const gcc = GCC_OPTIONS.find(g => g.name === e.target.value);
                  if (gcc) setSelectedGcc(gcc);
                }}
              >
                {GCC_OPTIONS.map((g) => (
                  <option key={g.name} value={g.name}>
                    {g.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-10 p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
            <h3 className="text-sm font-semibold text-blue-800 uppercase tracking-wider mb-2">Your Potential Savings</h3>
            <div className="flex items-baseline space-x-2">
              <span className="text-4xl font-extrabold text-blue-900">
                ${taxSaved.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </span>
              <span className="text-blue-700 font-medium">/ year</span>
            </div>
            
            <div className="mt-4 pt-4 border-t border-blue-200/60 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Current Tax ({selectedCountry.name}):</span>
                <span className="font-semibold text-gray-800">${currentTax.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">GCC Tax ({selectedGcc.name}):</span>
                <span className="font-semibold text-gray-800">${gccTax.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
              </div>
            </div>
          </div>

          <div className="mt-8">
            <Link
              href="/services"
              className="block w-full bg-blue-600 hover:bg-blue-700 text-white text-center font-bold py-4 rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5"
            >
              Start 0% Tax Setup Now
            </Link>
          </div>

        </div>
      </main>
    </div>
  );
}
