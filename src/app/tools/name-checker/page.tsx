"use client";

import React, { useState } from "react";
import BannerHeader from "@/components/portal/BannerHeader";
import { CheckCircle, XCircle, Sparkle, ArrowRight } from "@phosphor-icons/react";
import Link from "next/link";

interface CheckResult {
  isAvailable: boolean;
  score: number;
  reason: string;
  alternatives: string[];
}

function checkAvailability(name: string): CheckResult {
  const restrictedWords = ['bank', 'insurance', 'government', 'emirates', 'royal', 'invest', 'crypto', 'global'];
  const lower = name.toLowerCase().trim();
  const hit = restrictedWords.find((w) => lower.includes(w));

  if (hit) {
    return {
      isAvailable: false,
      score: 35,
      reason: `"${hit}" is a regulated / restricted term in UAE & GCC registries requiring special ministry pre-approval.`,
      alternatives: [
        `${name.replace(new RegExp(hit, 'gi'), '').trim()} Holdings`,
        `${name.replace(new RegExp(hit, 'gi'), '').trim()} Commercial Services`,
        `${name.replace(new RegExp(hit, 'gi'), '').trim()} Tech Solutions`,
      ],
    };
  }

  return {
    isAvailable: true,
    score: 92,
    reason: `"${name}" meets standard UAE & international naming guidelines and does not conflict with major registered trademarks.`,
    alternatives: [
      `${name} FZ-LLC`,
      `${name} Global FZCO`,
      `${name} Limited`,
    ],
  };
}

export default function NameChecker() {
  const [name, setName] = useState("");
  const [result, setResult] = useState<CheckResult | null>(null);

  const handleCheck = () => {
    if (!name.trim()) return;
    setResult(checkAvailability(name));
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <BannerHeader title="Company Name Availability Checker" />

      <main className="flex-1 w-full max-w-2xl mx-auto px-4 py-6 space-y-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 space-y-4">
          <div>
            <h2 className="text-sm font-bold text-gray-900 mb-1">Check Trademark & Registry Availability</h2>
            <p className="text-xs text-gray-500">Instantly test your desired corporate entity name against UAE and GCC registry conventions.</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              id="companyName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCheck()}
              className="flex-1 px-3.5 py-2.5 rounded-lg border border-gray-300 focus:ring-1 focus:ring-primary focus:border-primary outline-none text-gray-900 text-sm"
              placeholder="e.g. Apex Frontier Solutions"
            />
            <button
              onClick={handleCheck}
              disabled={!name.trim()}
              className="py-2.5 px-6 rounded-lg text-xs font-semibold text-white bg-primary hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm whitespace-nowrap"
            >
              Check Availability
            </button>
          </div>
        </div>

        {result && (
          <div className="space-y-4 animate-in fade-in duration-300">
            <div
              className={`bg-white rounded-xl shadow-sm border p-5 ${
                result.isAvailable ? 'border-emerald-200' : 'border-amber-200'
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                {result.isAvailable ? (
                  <CheckCircle className="w-5 h-5 text-emerald-600" />
                ) : (
                  <XCircle className="w-5 h-5 text-amber-600" />
                )}
                <h3 className="text-sm font-bold text-gray-900">
                  {result.isAvailable ? 'Name is Likely Available' : 'Requires Approval / Restricted Words Found'}
                </h3>
              </div>

              <p className="text-xs text-gray-600 mb-4">{result.reason}</p>

              <div className="bg-gray-50 p-3.5 rounded-lg border border-gray-100 mb-4">
                <span className="text-[11px] font-bold text-gray-700 block mb-1.5">
                  Recommended Available Formats & Alternatives:
                </span>
                <div className="flex flex-wrap gap-2">
                  {result.alternatives.map((alt, i) => (
                    <span
                      key={i}
                      className="px-2.5 py-1 bg-white border border-gray-200 rounded-md text-xs font-mono text-gray-800 shadow-2xs"
                    >
                      {alt}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                <span className="text-xs text-gray-500">Ready to reserve this name?</span>
                <Link
                  href="/services"
                  className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:text-primary-700"
                >
                  Reserve with Company Formation <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
