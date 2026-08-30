"use client";

import React, { useState } from "react";
import Link from "next/link";
import BannerHeader from '@/components/portal/BannerHeader';
import { CheckCircle, WarningCircle, ArrowRight } from "@phosphor-icons/react";

export default function VATScorer() {
  const [revenue, setRevenue] = useState<string>("400000");
  const [businessType, setBusinessType] = useState("B2B");
  const [submitted, setSubmitted] = useState(false);

  const thresholdMandatory = 375000; // AED 375k mandatory
  const thresholdVoluntary = 187500; // AED 187.5k voluntary

  const revAmount = parseFloat(revenue) || 0;
  const isMandatory = revAmount >= thresholdMandatory;
  const isVoluntary = revAmount >= thresholdVoluntary && revAmount < thresholdMandatory;

  const handleScore = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  const fmtAED = (n: number) =>
    new Intl.NumberFormat('en-AE', { style: 'currency', currency: 'AED', maximumFractionDigits: 0 }).format(n);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <BannerHeader title="UAE VAT Threshold Scorer" />

      <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-6 space-y-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 space-y-4">
          <div>
            <h2 className="text-sm font-bold text-gray-900 mb-1">Determine UAE VAT Registration Obligation</h2>
            <p className="text-xs text-gray-500">Under UAE VAT Law (Federal Decree-Law No. 8/2017), taxable supplies in the UAE dictate registration deadlines.</p>
          </div>

          <form onSubmit={handleScore} className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <label htmlFor="revenue" className="w-44 text-xs font-semibold text-gray-700">
                Annual Taxable Revenue (AED)
              </label>
              <input
                type="number"
                id="revenue"
                value={revenue}
                onChange={(e) => setRevenue(e.target.value)}
                placeholder="375000"
                className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary font-mono"
                required
              />
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <label htmlFor="businessType" className="w-44 text-xs font-semibold text-gray-700">
                Primary Client Type
              </label>
              <select
                id="businessType"
                value={businessType}
                onChange={(e) => setBusinessType(e.target.value)}
                className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
              >
                <option value="B2B_Foreign">B2B Foreign Clients (Zero-Rated Export of Services)</option>
                <option value="B2B_Local">B2B Local UAE Clients (Standard 5% VAT)</option>
                <option value="B2C">B2C Retail / Direct Consumers</option>
              </select>
            </div>

            <button
              type="submit"
              className="w-full mt-2 bg-primary hover:bg-primary-700 text-white text-xs font-semibold py-2.5 px-4 rounded-lg transition-colors shadow-sm"
            >
              Evaluate VAT Status
            </button>
          </form>
        </div>

        {submitted && (
          <div className="space-y-4 animate-in fade-in duration-300">
            <div
              className={`bg-white rounded-xl shadow-sm border p-5 ${
                isMandatory ? 'border-amber-300' : 'border-emerald-300'
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                {isMandatory ? (
                  <WarningCircle className="w-5 h-5 text-amber-600" />
                ) : (
                  <CheckCircle className="w-5 h-5 text-emerald-600" />
                )}
                <h3 className="text-sm font-bold text-gray-900">
                  {isMandatory
                    ? 'Mandatory VAT Registration Required'
                    : isVoluntary
                    ? 'Eligible for Voluntary VAT Registration'
                    : 'Below VAT Registration Threshold'}
                </h3>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs my-3">
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                  <span className="text-gray-400 block text-[10px]">Mandatory Threshold</span>
                  <span className="font-bold text-gray-900">{fmtAED(thresholdMandatory)}</span>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                  <span className="text-gray-400 block text-[10px]">Voluntary Threshold</span>
                  <span className="font-bold text-gray-900">{fmtAED(thresholdVoluntary)}</span>
                </div>
              </div>

              <p className="text-xs text-gray-600 leading-relaxed bg-gray-50/60 p-3 rounded-lg border border-gray-100">
                {isMandatory
                  ? 'Your UAE annual turnover meets or exceeds AED 375,000. You must register with the Federal Tax Authority (FTA) within 30 days of reaching this threshold to avoid statutory late-registration penalties.'
                  : isVoluntary
                  ? 'Your turnover exceeds AED 187,500. Registration is optional but recommended if you want to recover input VAT on business expenses and local office equipment.'
                  : 'Your turnover is below the voluntary threshold (AED 187,500). No VAT registration is currently required.'}
              </p>

              <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                <span className="text-xs text-gray-500">Need VAT registration filing & TRN?</span>
                <Link
                  href="/services"
                  className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:text-primary-700"
                >
                  Book VAT Service <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
