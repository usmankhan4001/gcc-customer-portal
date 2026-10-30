"use client";

import React, { useState } from "react";
import Link from "next/link";
import BannerHeader from '@/components/portal/BannerHeader';
import { CheckCircle, WarningCircle, ArrowRight } from "@phosphor-icons/react";
import {
  VAT_BUSINESS_TYPE_OPTIONS,
  VAT_THRESHOLD_MANDATORY,
  VAT_THRESHOLD_VOLUNTARY,
  VatResultSuccess,
  evaluateVat,
  formatAED,
} from "@/lib/tools/vat-scorer";
import ContactCaptureGate from "@/components/portal/ContactCaptureGate";

export default function VATScorer() {
  const [revenue, setRevenue] = useState<string>("400000");
  const [businessType, setBusinessType] = useState<string>("B2B_Foreign");
  const [result, setResult] = useState<VatResultSuccess | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleScore = (e: React.FormEvent) => {
    e.preventDefault();
    const evaluation = evaluateVat(revenue, businessType);
    if (!evaluation.success) {
      setError(evaluation.error);
      setResult(null);
      return;
    }
    setError(null);
    setResult(evaluation);
  };

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
                min="0"
                value={revenue}
                onChange={(e) => {
                  setRevenue(e.target.value);
                  setResult(null);
                  setError(null);
                }}
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
                onChange={(e) => {
                  setBusinessType(e.target.value);
                  setResult(null);
                  setError(null);
                }}
                className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
              >
                {VAT_BUSINESS_TYPE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              className="w-full mt-2 bg-cta hover:bg-cta-600 text-cta-foreground text-xs font-semibold py-2.5 px-4 rounded-lg transition-colors shadow-sm"
            >
              Evaluate VAT Status
            </button>
          </form>
        </div>

        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs p-3 rounded-lg flex items-center gap-2">
            <WarningCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {result && (
          <div className="space-y-4 animate-in fade-in duration-300">
            <div
              className={`bg-white rounded-xl shadow-sm border p-5 ${
                result.isMandatory ? 'border-amber-300' : 'border-emerald-300'
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                {result.isMandatory ? (
                  <WarningCircle className="w-5 h-5 text-amber-600" />
                ) : (
                  <CheckCircle className="w-5 h-5 text-emerald-600" />
                )}
                <h3 className="text-sm font-bold text-gray-900">
                  {result.title}
                </h3>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs my-3">
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                  <span className="text-gray-400 block text-[10px]">Mandatory Threshold</span>
                  <span className="font-bold text-gray-900">{formatAED(VAT_THRESHOLD_MANDATORY)}</span>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                  <span className="text-gray-400 block text-[10px]">Voluntary Threshold</span>
                  <span className="font-bold text-gray-900">{formatAED(VAT_THRESHOLD_VOLUNTARY)}</span>
                </div>
              </div>

              <p className="text-xs text-gray-600 leading-relaxed bg-gray-50/60 p-3 rounded-lg border border-gray-100">
                {result.description}
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

            <ContactCaptureGate
              sourceTool="vat_scorer"
              toolInput={{ revenue: Number(revenue), businessType }}
              toolResult={result as unknown as Record<string, unknown>}
            />
          </div>
        )}
      </main>
    </div>
  );
}
