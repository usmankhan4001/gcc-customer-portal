"use client";

import React, { useState } from "react";
import Link from "next/link";
import BannerHeader from '@/components/portal/BannerHeader';
import ContactCaptureGate from '@/components/portal/ContactCaptureGate';

interface PrivacyResult {
  level: string;
  desc: string;
  color: string;
}

function checkExposure(jurisdiction: string): PrivacyResult {
  const lowerJurisdiction = jurisdiction.toLowerCase();

  if (lowerJurisdiction.includes("uk") || lowerJurisdiction.includes("united kingdom")) {
    return {
      level: "High Exposure: Publicly Searchable",
      desc: "Your details (name, nationality, month/year of birth, and service address) are freely available on public registries like Companies House.",
      color: "text-destructive bg-destructive/10 border-destructive/20",
    };
  }
  if (lowerJurisdiction.includes("us") || lowerJurisdiction.includes("united states")) {
    return {
      level: "Medium/High Exposure",
      desc: "While FinCEN data is generally not public, state-level registries may publicly expose your details depending on the state.",
      color: "text-warning bg-warning-light border-warning/30",
    };
  }
  return {
    level: "Moderate Exposure",
    desc: "Your UBO data may be accessible to authorities and potentially the public depending on specific local laws.",
    color: "text-info bg-info-light border-info/30",
  };
}

// Maps a loosely-typed jurisdiction input to a real, sellable jurisdiction
// so the upsell CTA routes correctly instead of always assuming UAE.
function mapToSellableJurisdiction(input: string): 'uae' | 'hong-kong' | 'singapore' | 'bahrain' | 'ireland' | 'bvi' {
  const s = input.toLowerCase();
  if (s.includes('hong kong') || s.includes('hk')) return 'hong-kong';
  if (s.includes('singapore') || s.includes('sg')) return 'singapore';
  if (s.includes('bahrain')) return 'bahrain';
  if (s.includes('ireland')) return 'ireland';
  if (s.includes('bvi') || s.includes('cayman')) return 'bvi';
  return 'uae';
}

export default function UBOPrivacyChecker() {
  const [citizenship, setCitizenship] = useState("");
  const [jurisdiction, setJurisdiction] = useState("");
  const [result, setResult] = useState<PrivacyResult | null>(null);
  const [captured, setCaptured] = useState(false);

  const checkPrivacy = (e: React.FormEvent) => {
    e.preventDefault();
    if (!citizenship || !jurisdiction) return;
    setResult(checkExposure(jurisdiction));
    setCaptured(false);
  };

  const handleCapture = async (contact: { email: string; whatsapp_number: string }) => {
    if (!result) return;
    await fetch('/api/leads/capture', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        source_tool: 'ubo_privacy',
        email: contact.email || undefined,
        whatsapp_number: contact.whatsapp_number || undefined,
        tool_input: { citizenship, jurisdiction },
        tool_result: result,
        signals: { primaryInterestJurisdiction: mapToSellableJurisdiction(jurisdiction) },
      }),
    });
    setCaptured(true);
  };

  const sellableJurisdiction = mapToSellableJurisdiction(jurisdiction || 'uae');

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900 flex flex-col">
      <BannerHeader title="UBO Privacy Checker" />

      <main className="max-w-3xl w-full mx-auto px-4 py-4 space-y-4">
        <div className="bg-white rounded-md shadow-sm border border-gray-200 p-4">
          <p className="text-gray-600 text-sm mb-4 border-b border-gray-100 pb-3">
            Find out how exposed your public registry data is based on your jurisdiction.
          </p>

          <form onSubmit={checkPrivacy} className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <label htmlFor="citizenship" className="w-1/3 text-sm font-medium text-gray-700">
                Country of Citizenship
              </label>
              <input
                id="citizenship"
                type="text"
                placeholder="e.g., France"
                value={citizenship}
                onChange={(e) => setCitizenship(e.target.value)}
                className="w-2/3 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 text-sm"
                required
              />
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <label htmlFor="jurisdiction" className="w-1/3 text-sm font-medium text-gray-700">
                Current Jurisdiction
              </label>
              <input
                id="jurisdiction"
                type="text"
                placeholder="e.g., UK, US"
                value={jurisdiction}
                onChange={(e) => setJurisdiction(e.target.value)}
                className="w-2/3 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 text-sm"
                required
              />
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="bg-gray-900 text-white text-sm font-medium py-2 px-6 rounded-md hover:bg-gray-800 transition-colors"
              >
                Check Exposure
              </button>
            </div>
          </form>
        </div>

        {result && !captured && (
          <ContactCaptureGate
            title="See your full exposure report"
            subtitle="Enter your contact info to reveal the details."
            onCapture={handleCapture}
          />
        )}

        {result && captured && (
          <>
            <div className="bg-white rounded-md shadow-sm border border-gray-200 p-4">
              <div className={`p-4 rounded-md border ${result.color} text-sm`}>
                <div className="flex items-start gap-4">
                  <div className="font-medium min-w-[120px]">Exposure Level:</div>
                  <div className="font-semibold">{result.level}</div>
                </div>
                <div className="flex items-start gap-4 mt-2">
                  <div className="font-medium min-w-[120px]">Description:</div>
                  <div>{result.desc}</div>
                </div>
              </div>
            </div>

            <div className="bg-primary-50 border border-primary-100 rounded-md p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h4 className="text-primary-900 font-semibold text-sm">Protect Your Identity</h4>
                <p className="text-primary-700 text-xs mt-1">Keep your personal information private and off public databases.</p>
              </div>
              <Link
                href={`/checkout/${sellableJurisdiction}`}
                className="whitespace-nowrap inline-block bg-primary text-white text-sm font-medium py-2 px-4 rounded-md hover:bg-primary-700 transition-colors"
              >
                Secure Privacy
              </Link>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
