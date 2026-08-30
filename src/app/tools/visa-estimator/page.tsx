'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import BannerHeader from '@/components/portal/BannerHeader';
import { Users, ArrowRight } from '@phosphor-icons/react';

export default function VisaEstimator() {
  const [employees, setEmployees] = useState('2');
  const [jurisdiction, setJurisdiction] = useState('FreeZone');
  const [showResults, setShowResults] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowResults(true);
  };

  const count = parseInt(employees) || 1;
  const isFreeZone = jurisdiction === 'FreeZone';
  // Standard UAE residency visa fees (AED)
  const entryPermit = isFreeZone ? 1100 : 1500;
  const medicalFitness = 350;
  const emiratesId = 380;
  const visaStamping = isFreeZone ? 1650 : 2100;
  const perVisaTotal = entryPermit + medicalFitness + emiratesId + visaStamping;
  const grandTotal = perVisaTotal * count;

  const fmtAED = (n: number) =>
    new Intl.NumberFormat('en-AE', { style: 'currency', currency: 'AED', maximumFractionDigits: 0 }).format(n);

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <BannerHeader title="UAE Residence Visa Estimator" />

      <div className="flex-1 px-4 py-6 max-w-2xl mx-auto w-full space-y-5">
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
          <h2 className="text-sm font-bold text-gray-900 mb-1">Calculate Investor & Employee Visa Costs</h2>
          <p className="text-xs text-gray-500 mb-4">Includes entry permit, VIP medical fitness test, Emirates ID (2-year validity), and e-visa residency issuance.</p>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <label htmlFor="jurisdiction" className="w-40 text-xs font-semibold text-gray-700">
                Entity Type
              </label>
              <select
                id="jurisdiction"
                value={jurisdiction}
                onChange={(e) => setJurisdiction(e.target.value)}
                className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
              >
                <option value="FreeZone">UAE Free Zone (Dubai / RAK / IFZA / Meydan)</option>
                <option value="Mainland">Dubai Mainland (DED)</option>
              </select>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <label htmlFor="employees" className="w-40 text-xs font-semibold text-gray-700">
                Number of Visas Needed
              </label>
              <input
                type="number"
                id="employees"
                min="1"
                max="50"
                className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary font-mono"
                value={employees}
                onChange={(e) => setEmployees(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              className="w-full mt-2 bg-primary hover:bg-primary-700 text-white text-xs font-semibold py-2.5 px-6 rounded-lg transition-colors shadow-sm"
            >
              Calculate Total Visa Package
            </button>
          </form>
        </div>

        {showResults && (
          <div className="space-y-4 animate-in fade-in duration-300">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-primary" />
                  <h3 className="text-xs font-bold text-gray-900">Official Government & Medical Fee Schedule</h3>
                </div>
                <span className="text-xs font-mono font-bold text-primary">{count} Visa(s)</span>
              </div>

              <div className="p-5 space-y-3 text-xs">
                <div className="flex justify-between py-1 border-b border-gray-100">
                  <span className="text-gray-600">Entry Permit / Change of Status</span>
                  <span className="font-mono font-medium text-gray-900">{fmtAED(entryPermit * count)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-100">
                  <span className="text-gray-600">Medical Fitness Test (VIP fast track)</span>
                  <span className="font-mono font-medium text-gray-900">{fmtAED(medicalFitness * count)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-100">
                  <span className="text-gray-600">Emirates ID Biometrics (2 Years)</span>
                  <span className="font-mono font-medium text-gray-900">{fmtAED(emiratesId * count)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-100">
                  <span className="text-gray-600">Residency Stamping & Establishment Issuance</span>
                  <span className="font-mono font-medium text-gray-900">{fmtAED(visaStamping * count)}</span>
                </div>
                <div className="flex justify-between pt-2 text-sm font-bold text-gray-900">
                  <span>Total Estimated Visa Government Cost</span>
                  <span className="font-mono text-primary">{fmtAED(grandTotal)}</span>
                </div>
              </div>

              <div className="px-5 py-3.5 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                <span className="text-xs text-gray-500">Need VIP PRO concierge processing?</span>
                <Link
                  href="/services"
                  className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:text-primary-700"
                >
                  Book Visa Package <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
