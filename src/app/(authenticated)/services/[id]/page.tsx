"use client";

import { use } from 'react';
import Link from 'next/link';
import { CheckCircle, Clock, Wallet } from '@phosphor-icons/react';
import { notFound } from 'next/navigation';
import BannerHeader from '@/components/portal/BannerHeader';
import CountryFlag from '@/components/ui/CountryFlag';
import { getJurisdiction } from '@/lib/jurisdictions';

export default function JurisdictionDetails({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const data = getJurisdiction(resolvedParams.id);
  if (!data) notFound();

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 pb-20">
      <BannerHeader title="JURISDICTION DETAILS" />

      {/* Hero Section */}
      <div className="bg-white px-4 py-4 border-b border-gray-200">
        <div className="flex items-center gap-4">
          <div className="rounded-sm border border-gray-200 shadow-sm overflow-hidden">
            <CountryFlag country={data.flagCode} size="xl" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-gray-900 tracking-tight">{data.name}</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="bg-primary-50 text-primary-600 font-bold px-2 py-0.5 rounded-sm text-xs border border-primary-100 uppercase tracking-wide">
                {data.tax}
              </span>
            </div>
          </div>
        </div>
        <p className="mt-4 text-sm text-gray-700 font-medium leading-snug">
          {data.description}
        </p>
      </div>

      {/* Fast Facts Grid */}
      <div className="px-4 py-4 border-b border-gray-200 bg-gray-50">
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Fast Facts</h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white p-3 rounded-sm shadow-sm border border-gray-200 flex flex-col gap-1">
            <Wallet size={20} weight="duotone" className="text-gray-500" />
            <span className="text-[10px] text-gray-400 font-bold uppercase">Starting Price</span>
            <span className="font-bold text-gray-900 text-base">{data.price}</span>
          </div>
          <div className="bg-white p-3 rounded-sm shadow-sm border border-gray-200 flex flex-col gap-1">
            <Clock size={20} weight="duotone" className="text-gray-500" />
            <span className="text-[10px] text-gray-400 font-bold uppercase">Timeline</span>
            <span className="font-bold text-gray-900 text-base">{data.timeline}</span>
          </div>
        </div>
      </div>

      {/* Benefits List */}
      <div className="px-4 py-4">
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">What's Included</h3>
        <div className="bg-white rounded-sm shadow-sm border border-gray-200 overflow-hidden">
          {data.features.map((feature: string, idx: number) => (
            <div key={idx} className={`p-3 flex items-start gap-2 ${idx !== data.features.length - 1 ? 'border-b border-gray-100' : ''}`}>
              <CheckCircle size={16} weight="duotone" className="text-success shrink-0 mt-0.5" />
              <span className="text-sm font-medium text-gray-800">{feature}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Sticky Bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 p-3 bg-white border-t border-gray-200 shadow-sm z-10">
        <Link 
          href={`/checkout/${resolvedParams.id}`}
          className="block w-full text-center bg-primary hover:bg-primary/90 text-white font-bold py-3 px-4 rounded-sm shadow-sm transition duration-200 text-sm uppercase tracking-wide"
        >
          Start Incorporation
        </Link>
      </div>
    </div>
  );
}
