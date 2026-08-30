"use client";

import React, { useState } from "react";
import Link from "next/link";
import BannerHeader from '@/components/portal/BannerHeader';
import { ShieldCheck, ShieldWarning, ArrowRight } from "@phosphor-icons/react";
import { COUNTRIES } from '@/lib/countries';

interface PrivacyResult {
  jurisdiction: string;
  exposureScore: number;
  publicRegistry: boolean;
  crsReporting: boolean;
  uboConfidential: boolean;
  recommendation: string;
}

function checkExposure(jurisdiction: string): PrivacyResult {
  const map: Record<string, PrivacyResult> = {
    uae: {
      jurisdiction: 'UAE Free Zone',
      exposureScore: 20,
      publicRegistry: false,
      crsReporting: true,
      uboConfidential: true,
      recommendation: 'UAE maintains high privacy: Shareholder and UBO registries are private and not accessible to the general public.',
    },
    bvi: {
      jurisdiction: 'British Virgin Islands (BVI)',
      exposureScore: 15,
      publicRegistry: false,
      crsReporting: true,
      uboConfidential: true,
      recommendation: 'Complete public anonymity. Director & UBO registers are held securely by registered agents and closed to public inspection.',
    },
    uk: {
      jurisdiction: 'United Kingdom (Companies House)',
      exposureScore: 95,
      publicRegistry: true,
      crsReporting: true,
      uboConfidential: false,
      recommendation: 'High Public Exposure: Persons of Significant Control (PSC) including full name, birth month, and home nationality are published publicly online.',
    },
    us: {
      jurisdiction: 'United States (Delaware / Wyoming)',
      exposureScore: 40,
      publicRegistry: false,
      crsReporting: false,
      uboConfidential: true,
      recommendation: 'No public shareholder listing in Wyoming/Delaware; Corporate Transparency Act (CTA) FinCEN filing required internally.',
    },
  };

  return map[jurisdiction] || map.uae;
}

export default function UBOPrivacyChecker() {
  const [citizenship, setCitizenship] = useState("US");
  const [jurisdiction, setJurisdiction] = useState("uae");
  const [result, setResult] = useState<PrivacyResult | null>(null);

  const checkPrivacy = (e: React.FormEvent) => {
    e.preventDefault();
    setResult(checkExposure(jurisdiction));
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900 flex flex-col">
      <BannerHeader title="UBO Privacy & Registry Checker" />

      <main className="flex-1 max-w-2xl w-full mx-auto p-4 space-y-4 pt-6">
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 space-y-4">
          <div>
            <h2 className="text-sm font-bold text-gray-900 mb-1">Evaluate Ultimate Beneficial Owner (UBO) Exposure</h2>
            <p className="text-xs text-gray-500">Check whether your identity, address, and shareholding will be visible on public government registries.</p>
          </div>

          <form onSubmit={checkPrivacy} className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <label htmlFor="citizenship" className="w-40 text-xs font-semibold text-gray-700">
                Your Citizenship
              </label>
              <select
                id="citizenship"
                value={citizenship}
                onChange={(e) => setCitizenship(e.target.value)}
                className="flex-1 border-gray-300 rounded-lg shadow-sm focus:border-primary focus:ring-1 focus:ring-primary p-2 text-sm border outline-none bg-white text-gray-900"
              >
                {COUNTRIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.flag} {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <label htmlFor="jurisdiction" className="w-40 text-xs font-semibold text-gray-700">
                Target Formation
              </label>
              <select
                id="jurisdiction"
                value={jurisdiction}
                onChange={(e) => setJurisdiction(e.target.value)}
                className="flex-1 border-gray-300 rounded-lg shadow-sm focus:border-primary focus:ring-1 focus:ring-primary p-2 text-sm border outline-none bg-white text-gray-900"
              >
                <option value="uae">UAE Free Zone (Dubai / RAK)</option>
                <option value="bvi">British Virgin Islands (BVI)</option>
                <option value="uk">United Kingdom (Companies House)</option>
                <option value="us">United States (Delaware / Wyoming)</option>
              </select>
            </div>

            <button
              type="submit"
              className="w-full mt-2 bg-primary hover:bg-primary-700 text-white text-xs font-semibold py-2.5 px-4 rounded-lg transition-colors shadow-sm"
            >
              Analyze Public Exposure Risk
            </button>
          </form>
        </div>

        {result && (
          <div className="space-y-4 animate-in fade-in duration-300">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {result.exposureScore < 40 ? (
                    <ShieldCheck className="w-6 h-6 text-emerald-600" />
                  ) : (
                    <ShieldWarning className="w-6 h-6 text-rose-600" />
                  )}
                  <h3 className="text-sm font-bold text-gray-900">{result.jurisdiction}</h3>
                </div>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                  result.exposureScore < 40 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                }`}>
                  {result.exposureScore < 40 ? 'Low Exposure (Private)' : 'High Public Exposure'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                  <span className="text-gray-400 block text-[10px]">Public Online Registry</span>
                  <span className="font-bold text-gray-900">{result.publicRegistry ? 'YES (Publicly Searchable)' : 'NO (Confidential)'}</span>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                  <span className="text-gray-400 block text-[10px]">UBO Protection</span>
                  <span className="font-bold text-gray-900">{result.uboConfidential ? 'Protected' : 'Disclosed Online'}</span>
                </div>
              </div>

              <p className="text-xs text-gray-600 leading-relaxed bg-gray-50/60 p-3 rounded-lg border border-gray-100">
                {result.recommendation}
              </p>

              <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                <span className="text-xs text-gray-500">Need nominee director or holding privacy?</span>
                <Link
                  href="/services"
                  className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:text-primary-700"
                >
                  Explore Nominee & Holding Tier <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
