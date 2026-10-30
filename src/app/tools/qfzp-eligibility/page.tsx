"use client";

import React, { useState } from "react";
import BannerHeader from "@/components/portal/BannerHeader";
import { ArrowRight, ShieldCheck, Warning } from "@phosphor-icons/react";
import Link from "next/link";
import {
  evaluateQFZPEligibility,
  QFZP_ACTIVITIES,
  type QFZPActivity,
} from "@/lib/tools/qfzp-eligibility";
import ContactCaptureGate from "@/components/portal/ContactCaptureGate";

export default function QFZPEligibilityChecker() {
  const [activity, setActivity] = useState<QFZPActivity>("Tech");
  const [hasSubstance, setHasSubstance] = useState(true);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  const handleActivityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setActivity(e.target.value as QFZPActivity);
    setSubmitted(false);
  };

  const handleSubstanceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setHasSubstance(e.target.checked);
    setSubmitted(false);
  };

  const result = evaluateQFZPEligibility({ activity, hasSubstance });

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <BannerHeader title="0% Corporate Tax (QFZP) Checker" />

      <main className="flex-grow p-4 max-w-2xl mx-auto w-full space-y-4 pt-6">
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
          <div className="border-b border-gray-100 pb-3 mb-4">
            <h2 className="text-sm font-bold text-gray-900">Qualifying Free Zone Person (QFZP) Assessment</h2>
            <p className="text-xs text-gray-500">Under UAE Cabinet Decision No. 55/2023, qualifying free zone income is subject to 0% Corporate Tax.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <label htmlFor="activity" className="w-40 text-xs font-semibold text-gray-700">
                Business Activity
              </label>
              <select
                id="activity"
                value={activity}
                onChange={handleActivityChange}
                className="flex-1 border border-gray-300 bg-white rounded-lg p-2 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
              >
                {QFZP_ACTIVITIES.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2 pt-2">
              <label className="flex items-center gap-2 cursor-pointer bg-gray-50 border border-gray-200 p-2.5 rounded-lg">
                <input
                  type="checkbox"
                  checked={hasSubstance}
                  onChange={handleSubstanceChange}
                  className="rounded border-gray-300 text-primary focus:ring-primary h-4 w-4"
                />
                <span className="text-xs text-gray-700 font-medium">
                  Will maintain physical/flexi office lease in a UAE Free Zone (Adequate Substance)
                </span>
              </label>
            </div>

            <button
              type="submit"
              className="w-full bg-cta hover:bg-cta-600 text-cta-foreground font-semibold py-2.5 px-4 rounded-lg text-xs transition-colors shadow-sm cursor-pointer"
            >
              Evaluate 0% Tax Eligibility
            </button>
          </form>
        </div>

        {submitted && (
          <div className="space-y-4 animate-in fade-in duration-300">
            <div
              className={`bg-white rounded-xl shadow-sm border p-5 ${
                result.isLikelyEligible ? "border-emerald-300 ring-1 ring-emerald-100" : "border-amber-300"
              }`}
            >
              <div className="flex items-start gap-3">
                {result.isLikelyEligible ? (
                  <ShieldCheck className="w-7 h-7 text-emerald-600 shrink-0" />
                ) : (
                  <Warning className="w-7 h-7 text-amber-600 shrink-0" />
                )}
                <div>
                  <h3 className="text-sm font-bold text-gray-900">
                    {result.headline}
                  </h3>
                  <p className="text-xs text-gray-600 mt-1">
                    {result.description}
                  </p>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                <span className="text-xs text-gray-500">Need help structuring your 0% corporate tax return?</span>
                <Link
                  href="/services"
                  className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:text-primary-700"
                >
                  Consult Tax Specialist <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>

            <ContactCaptureGate
              sourceTool="qfzp_eligibility"
              toolInput={{ activity, hasSubstance }}
              toolResult={result as unknown as Record<string, unknown>}
            />
          </div>
        )}
      </main>
    </div>
  );
}
