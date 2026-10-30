"use client";

import React, { useState } from "react";
import Link from "next/link";
import BannerHeader from "@/components/portal/BannerHeader";
import {
  calculateBankingOddsForIndustry,
  BANKING_INDUSTRY_OPTIONS,
  type BankOddsResult,
} from "@/lib/tools/banking-odds";
import ContactCaptureGate from "@/components/portal/ContactCaptureGate";

export default function BankingOddsMatcher() {
  const [industry, setIndustry] = useState("");
  const [turnover, setTurnover] = useState<number | "">("");
  const [results, setResults] = useState<BankOddsResult[] | null>(null);

  const handleCalculate = () => {
    if (!industry || turnover === "") return;
    setResults(calculateBankingOddsForIndustry(industry, Number(turnover)));
  };

  const handleIndustryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setIndustry(e.target.value);
    setResults(null);
  };

  const handleTurnoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTurnover(e.target.value === "" ? "" : Number(e.target.value));
    setResults(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <BannerHeader title="Banking Odds" />

      <main className="flex-1 max-w-2xl w-full mx-auto p-4 space-y-4 mt-4">
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 space-y-4">
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <label htmlFor="industry" className="w-40 text-xs font-semibold text-gray-700">
                Industry
              </label>
              <select
                id="industry"
                value={industry}
                onChange={handleIndustryChange}
                className="flex-1 border-gray-300 rounded-lg shadow-sm focus:border-primary focus:ring-1 focus:ring-primary p-2 text-sm border outline-none transition-colors bg-white text-gray-900"
              >
                <option value="">Select Industry</option>
                {BANKING_INDUSTRY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <label htmlFor="turnover" className="w-40 text-xs font-semibold text-gray-700">
                Annual Turnover ($)
              </label>
              <input
                id="turnover"
                type="number"
                value={turnover}
                onChange={handleTurnoverChange}
                placeholder="150000"
                className="flex-1 border-gray-300 rounded-lg shadow-sm focus:border-primary focus:ring-1 focus:ring-primary p-2 text-sm border outline-none transition-colors bg-white text-gray-900"
              />
            </div>
          </div>

          <button
            onClick={handleCalculate}
            disabled={!industry || turnover === ""}
            className="w-full bg-cta hover:bg-cta-600 text-cta-foreground text-sm font-semibold py-2.5 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm cursor-pointer"
          >
            Calculate Approval Odds
          </button>
        </div>

        {results && (
          <div className="space-y-4 animate-in fade-in duration-300">
            <h2 className="text-base font-bold text-gray-900">Your Bank Approval Estimates</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {results.map((result, idx) => (
                <div key={idx} className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-sm text-gray-900">{result.bank}</h3>
                    <p className="text-xs text-gray-500">Corporate Account</p>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-black text-gray-900">
                      {result.odds}<span className="text-xs font-semibold text-gray-400">%</span>
                    </div>
                    <p className={`text-[11px] font-bold ${result.odds > 80 ? 'text-emerald-600' : result.odds > 50 ? 'text-amber-600' : 'text-rose-600'}`}>
                      {result.label}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-primary/5 border border-primary/20 rounded-xl p-5 text-center space-y-3 mt-4">
              <h3 className="text-sm font-bold text-primary">Need Guaranteed Banking Support?</h3>
              <p className="text-gray-600 text-xs max-w-md mx-auto">
                Our banking compliance officers manage relationship officer submissions, compliance files, and fast-track opening.
              </p>
              <Link
                href="/services"
                className="inline-block bg-cta hover:bg-cta-600 text-cta-foreground text-xs font-semibold py-2.5 px-6 rounded-lg transition-colors shadow-sm"
              >
                Explore Banking Concierge
              </Link>
            </div>

            <ContactCaptureGate
              sourceTool="banking_odds"
              toolInput={{ industry, turnover: Number(turnover) }}
              toolResult={{ results }}
            />
          </div>
        )}
      </main>
    </div>
  );
}
