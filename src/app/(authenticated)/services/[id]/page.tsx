"use client";

import { use } from 'react';
import Link from 'next/link';
import { ArrowLeft, CheckCircle2, Clock, ShieldCheck, Wallet } from 'lucide-react';
import { notFound } from 'next/navigation';

const jurisdictionData: Record<string, any> = {
  'uae': {
    name: 'United Arab Emirates',
    flagUrl: 'https://flagcdn.com/ae.svg',
    price: '$1,500',
    tax: '9% / 0% Foreign',
    timeline: '~30 days',
    description: 'Emirates ID, full tax residency, top-tier local banking, and a cosmopolitan lifestyle base.',
    features: [
      '0% tax on foreign-sourced income',
      'Local credible banking (Emirates NBD, FAB)',
      'Emirates ID & Tax Residency included',
      '100% foreign ownership'
    ]
  },
  'hong-kong': {
    name: 'Hong Kong',
    flagUrl: 'https://flagcdn.com/hk.svg',
    price: '$2,000',
    tax: '0% on Foreign',
    timeline: '17–18 days',
    description: '100% remote. Fintech banking via Airwallex & Wise. The preferred structure for digital income earners.',
    features: [
      '100% fully remote setup',
      '0% tax on all foreign-sourced income',
      'Instant fintech banking (Airwallex)',
      'Highly reputable global jurisdiction'
    ]
  },
  // Add fallback for others for demo purposes
};

export default function JurisdictionDetails({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const data = jurisdictionData[resolvedParams.id] || {
    name: resolvedParams.id.charAt(0).toUpperCase() + resolvedParams.id.slice(1),
    flagUrl: 'https://flagcdn.com/bh.svg', // generic fallback
    price: 'Custom quote',
    tax: '0% Corporate',
    timeline: 'Varies',
    description: 'Premium corporate structuring tailored to your specific global needs.',
    features: ['100% foreign ownership', 'Zero minimum capital requirement']
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 pb-8">
      {/* Top Header / Nav */}
      <header className="bg-white border-b border-gray-200 px-4 py-4 flex items-center sticky top-0 z-10">
        <Link href="/services" className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors">
          <ArrowLeft className="w-6 h-6 text-gray-700" />
        </Link>
        <h1 className="ml-2 text-lg font-bold text-gray-900">Jurisdiction Details</h1>
      </header>

      {/* Hero Section */}
      <div className="bg-white px-6 py-8 border-b border-gray-100">
        <div className="flex items-center gap-5">
          <img 
            src={data.flagUrl} 
            alt={`${data.name} Flag`} 
            className="w-20 h-20 rounded-full object-cover border-4 border-gray-50 shadow-sm"
          />
          <div>
            <h2 className="text-3xl font-black text-gray-900 tracking-tight">{data.name}</h2>
            <div className="flex items-center gap-2 mt-2">
              <span className="bg-blue-50 text-blue-700 font-bold px-3 py-1 rounded-full text-sm border border-blue-100">
                {data.tax}
              </span>
            </div>
          </div>
        </div>
        <p className="mt-6 text-gray-600 font-medium leading-relaxed">
          {data.description}
        </p>
      </div>

      {/* Fast Facts Grid */}
      <div className="px-6 py-8">
        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Fast Facts</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-2">
            <Wallet className="w-6 h-6 text-orange-500" />
            <span className="text-xs text-gray-500 font-medium uppercase">Starting Price</span>
            <span className="font-bold text-gray-900 text-lg">{data.price}</span>
          </div>
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-2">
            <Clock className="w-6 h-6 text-blue-500" />
            <span className="text-xs text-gray-500 font-medium uppercase">Timeline</span>
            <span className="font-bold text-gray-900 text-lg">{data.timeline}</span>
          </div>
        </div>
      </div>

      {/* Benefits List */}
      <div className="px-6 pb-24">
        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">What's Included</h3>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {data.features.map((feature: string, idx: number) => (
            <div key={idx} className={`p-4 flex items-start gap-3 ${idx !== data.features.length - 1 ? 'border-b border-gray-100' : ''}`}>
              <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
              <span className="font-medium text-gray-800">{feature}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Sticky Bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 shadow-[0_-10px_15px_-3px_rgba(0,0,0,0.05)]">
        <Link 
          href={`/checkout/${resolvedParams.id}`}
          className="block w-full text-center bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-8 rounded-xl shadow-md transition duration-200 text-lg"
        >
          Start Incorporation
        </Link>
      </div>
    </div>
  );
}
