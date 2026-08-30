"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import BannerHeader from '@/components/portal/BannerHeader';

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
      <BannerHeader title="TAX CALCULATOR" />

      <main className="flex-1 w-full max-w-lg mx-auto p-4 mt-4">
        <div className="bg-white rounded-md shadow-sm border border-gray-200">
          
          <div className="p-4 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <label htmlFor="country" className="w-40 text-sm font-semibold text-gray-700">
                Current Country
              </label>
              <select
                id="country"
                className="flex-1 px-2 py-1.5 text-sm rounded-md border border-gray-300 focus:ring-1 focus:ring-red-500 focus:border-red-500 bg-gray-50 transition-colors"
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

            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <label htmlFor="profit" className="w-40 text-sm font-semibold text-gray-700">
                Annual Profit ($)
              </label>
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                  <span className="text-gray-500 font-medium text-sm">$</span>
                </div>
                <input
                  type="number"
                  id="profit"
                  className="w-full pl-6 pr-2 py-1.5 text-sm rounded-md border border-gray-300 focus:ring-1 focus:ring-red-500 focus:border-red-500 bg-gray-50 transition-colors"
                  placeholder="100000"
                  value={profit}
                  onChange={(e) => setProfit(e.target.value === '' ? '' : Number(e.target.value))}
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <label htmlFor="gcc" className="w-40 text-sm font-semibold text-gray-700">
                Compare with
              </label>
              <select
                id="gcc"
                className="flex-1 px-2 py-1.5 text-sm rounded-md border border-gray-300 focus:ring-1 focus:ring-red-500 focus:border-red-500 bg-gray-50 transition-colors"
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

          <div className="p-4 bg-red-50 border-t border-red-100">
            <h3 className="text-xs font-semibold text-red-800 uppercase tracking-wider mb-1">Your Potential Savings</h3>
            <div className="flex items-baseline space-x-1">
              <span className="text-2xl font-bold text-red-900">
                ${taxSaved.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </span>
              <span className="text-red-700 text-sm font-medium">/ year</span>
            </div>
            
            <div className="mt-3 pt-3 border-t border-red-200/60 space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-gray-600">Current Tax ({selectedCountry.name}):</span>
                <span className="font-semibold text-gray-800">${currentTax.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-600">GCC Tax ({selectedGcc.name}):</span>
                <span className="font-semibold text-gray-800">${gccTax.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
              </div>
            </div>
          </div>

          <div className="p-4 border-t border-gray-200">
            <Link
              href="/services"
              className="block w-full bg-red-600 hover:bg-red-700 text-white text-center text-sm font-bold py-2 rounded-md shadow hover:shadow-md transition-all"
            >
              Start 0% Tax Setup Now
            </Link>
          </div>

        </div>
      </main>
    </div>
  );
}
