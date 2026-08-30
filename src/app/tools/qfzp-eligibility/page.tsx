"use client";

import React, { useState } from "react";
import BannerHeader from "@/components/portal/BannerHeader";
import { CheckCircle, Warning, ArrowRight, ShieldCheck } from "@phosphor-icons/react";
import Link from "next/link";

export default function QFZPEligibilityChecker() {
  const [activity, setActivity] = useState("Tech");
  const [visas, setVisas] = useState("1-2");
  const [hasSubstance, setHasSubstance] = useState(true);
  const [isForeignClients, setIsForeignClients] = useState(true);
  const [submitted, setSubmitted] = useState(false);

  const isLikelyEligible =
    activity !== "Excluded" &&
    hasSubstance &&
    (activity === "Tech" || activity === "Trading" || activity === "Consulting");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

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
                onChange={(e) => setActivity(e.target.value)}
                className="flex-1 border border-gray-300 bg-white rounded-lg p-2 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
              >
                <option value="Tech">Software Development & Cloud Services</option>
                <option value="Trading">Qualifying Commodity & Goods Trading</option>
                <option value="Consulting">Headquarter & Holding Company Services</option>
                <option value="Logistics">Logistics & Freight Forwarding</option>
                <option value="Excluded">Direct Mainland UAE B2C Retail (Excluded)</option>
              </select>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <label htmlFor="visas" className="w-40 text-xs font-semibold text-gray-700">
                Staff / Visas in Free Zone
              </label>
              <select
                id="visas"
                value={visas}
                onChange={(e) => setVisas(e.target.value)}
                className="flex-1 border border-gray-300 bg-white rounded-lg p-2 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
              >
                <option value="1-2">1 – 2 Visas (Founder / Director)</option>
                <option value="3-5">3 – 5 Visas (Core Team)</option>
                <option value="6+">6+ Visas (Full Office)</option>
              </select>
            </div>

            <div className="space-y-2 pt-2">
              <label className="flex items-center gap-2 cursor-pointer bg-gray-50 border border-gray-200 p-2.5 rounded-lg">
                <input
                  type="checkbox"
                  checked={hasSubstance}
                  onChange={(e) => setHasSubstance(e.target.checked)}
                  className="rounded border-gray-300 text-primary focus:ring-primary h-4 w-4"
                />
                <span className="text-xs text-gray-700 font-medium">
                  Will maintain physical/flexi office lease in a UAE Free Zone (Adequate Substance)
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer bg-gray-50 border border-gray-200 p-2.5 rounded-lg">
                <input
                  type="checkbox"
                  checked={isForeignClients}
                  onChange={(e) => setIsForeignClients(e.target.checked)}
                  className="rounded border-gray-300 text-primary focus:ring-primary h-4 w-4"
                />
                <span className="text-xs text-gray-700 font-medium">
                  Primary revenue is derived from foreign clients or Free Zone entities (not mainland UAE individuals)
                </span>
              </label>
            </div>

            <button
              type="submit"
              className="w-full bg-primary hover:bg-primary-700 text-white font-semibold py-2.5 px-4 rounded-lg text-xs transition-colors shadow-sm"
            >
              Evaluate 0% Tax Eligibility
            </button>
          </form>
        </div>

        {submitted && (
          <div className="space-y-4 animate-in fade-in duration-300">
            <div
              className={`bg-white rounded-xl shadow-sm border p-5 ${
                isLikelyEligible ? "border-emerald-300 ring-1 ring-emerald-100" : "border-amber-300"
              }`}
            >
              <div className="flex items-start gap-3">
                {isLikelyEligible ? (
                  <ShieldCheck className="w-7 h-7 text-emerald-600 shrink-0" />
                ) : (
                  <Warning className="w-7 h-7 text-amber-600 shrink-0" />
                )}
                <div>
                  <h3 className="text-sm font-bold text-gray-900">
                    {isLikelyEligible
                      ? "High Likelihood: Eligible for 0% UAE Corporate Tax"
                      : "Standard 9% Rate Applies / Non-Qualifying Activity"}
                  </h3>
                  <p className="text-xs text-gray-600 mt-1">
                    {isLikelyEligible
                      ? "Your business model meets the Qualifying Free Zone Person (QFZP) criteria: Qualifying activity with foreign/FZ counterparties and adequate UAE economic substance."
                      : "Activities involving direct mainland UAE consumer trade or lacking registered substance are taxed at the standard 9% UAE corporate tax rate (first AED 375k profit still 0%)."}
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
          </div>
        )}
      </main>
    </div>
  );
}
