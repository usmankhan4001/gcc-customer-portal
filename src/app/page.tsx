'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  Search,
  Calculator,
  Landmark,
  Shield,
  Clock,
  MessageSquare,
  Zap,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { usePortalStore } from '@/lib/store';

const jurisdictions = [
  {
    id: 'uae',
    name: 'UAE Freezone',
    sub: 'Dubai (IFZA / Meydan)',
    countryCode: 'uae',
    taxRate: '0% Tax',
    taxVariant: 'default' as const,
    turnaround: '48 Hours',
    price: '$2,499',
    bankingGuarantee: true,
    highlight: 'Emirates ID & Residency Included',
    href: '/setup?country=uae',
  },
  {
    id: 'hk',
    name: 'Hong Kong Offshore',
    sub: 'Companies Registry',
    countryCode: 'hk',
    taxRate: '0% Foreign',
    taxVariant: 'secondary' as const,
    turnaround: '3-5 Days',
    price: '$1,850',
    bankingGuarantee: true,
    highlight: '100% Remote Biometric Pass',
    href: '/setup?country=hk',
  },
  {
    id: 'singapore',
    name: 'Singapore Pte Ltd',
    sub: 'ACRA Registry',
    countryCode: 'singapore',
    taxRate: '5% Effective',
    taxVariant: 'outline' as const,
    turnaround: '2-3 Days',
    price: '$2,800',
    bankingGuarantee: true,
    highlight: 'Tier 1 Global Credibility',
    href: '/setup?country=singapore',
  },
  {
    id: 'bahrain',
    name: 'Bahrain W.L.L.',
    sub: 'MOIC Sijilat',
    countryCode: 'bahrain',
    taxRate: '0% Corp Tax',
    taxVariant: 'default' as const,
    turnaround: '4-6 Days',
    price: '$2,200',
    bankingGuarantee: true,
    highlight: '100% Foreign Ownership',
    href: '/setup?country=bahrain',
  },
];

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const { userProfile } = usePortalStore();

  const filteredJurisdictions = jurisdictions.filter((j) =>
    j.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    j.sub.toLowerCase().includes(searchQuery.toLowerCase()) ||
    j.taxRate.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-6 w-full max-w-4xl mx-auto py-8">
      {/* Executive Header Bar */}
      <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[11px] font-extrabold text-muted-foreground tracking-widest uppercase">
              GLOBAL FORMATION STUDIO
            </div>
            <h1 className="font-heading text-3xl font-bold text-foreground mt-1">
              Hello, {userProfile.name.split(' ')[0]}
            </h1>
          </div>

          <Link href="/portal/dashboard">
            <Avatar className="h-12 w-12 border-2 border-primary/20 cursor-pointer">
              <AvatarFallback className="bg-primary/10 text-primary font-bold">
                {userProfile.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
          </Link>
        </div>

        {/* Quick Search Bar */}
        <div className="relative w-full mt-2">
          <Search
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            type="text"
            placeholder="Search 15+ jurisdictions, tax structures, or banking..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-11 h-12 rounded-full border-muted-foreground/20 shadow-sm"
          />
        </div>
      </div>

      {/* 3-Minute AI Diagnostic Card */}
      <Card className="bg-slate-900 border-slate-800 text-white shadow-lg shadow-slate-900/20 overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent pointer-events-none" />
        <CardContent className="p-6 flex flex-col gap-4 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
              <Sparkles size={20} className="text-primary" />
            </div>
            <div>
              <Badge variant="default" className="bg-primary hover:bg-primary/90 text-[10px]">
                AI STRUCTURING
              </Badge>
              <div className="text-lg font-bold text-white mt-1">
                3-Minute Tax & Entity Diagnostic
              </div>
            </div>
          </div>
          <p className="text-sm text-slate-300 leading-relaxed">
            Answer 4 quick questions. Receive your tailored 0% tax entity blueprint, banking approval probability, and estimated annual savings.
          </p>
          <Button className="w-full mt-2">
            <Sparkles size={16} className="mr-2" />
            Launch Free Diagnostic Wizard
          </Button>
        </CardContent>
      </Card>

      {/* Quick Metrics Bar */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="bg-card">
          <CardContent className="p-4 flex flex-col items-center justify-center text-center">
            <div className="text-sm text-muted-foreground font-medium">Jurisdictions</div>
            <div className="text-xl font-bold text-foreground mt-1">15+</div>
          </CardContent>
        </Card>
        <Card className="bg-card">
          <CardContent className="p-4 flex flex-col items-center justify-center text-center">
            <div className="text-sm text-muted-foreground font-medium">Entities Formed</div>
            <div className="text-xl font-bold text-foreground mt-1">500+</div>
          </CardContent>
        </Card>
        <Card className="bg-card">
          <CardContent className="p-4 flex flex-col items-center justify-center text-center">
            <div className="text-sm text-muted-foreground font-medium">Setup SLA</div>
            <div className="text-xl font-bold text-foreground mt-1">48h</div>
          </CardContent>
        </Card>
      </div>

      {/* 2-Column Jurisdiction Catalog Grid */}
      <div className="mt-4">
        <div className="flex justify-between items-end mb-4">
          <div>
            <h2 className="font-heading text-xl font-bold text-foreground">Company Formation Catalog</h2>
            <div className="text-sm text-muted-foreground mt-1">
              100% remote incorporation with guaranteed corporate banking
            </div>
          </div>
          <Button variant="link" className="text-primary pr-0">
            View All &rarr;
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredJurisdictions.map((j) => (
            <Link key={j.id} href={j.href} className="block group">
              <Card className="h-full transition-all hover:shadow-md hover:border-primary/30">
                <CardContent className="p-5 flex flex-col h-full gap-4">
                  <div className="flex justify-between items-start">
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold overflow-hidden shadow-sm">
                      {j.countryCode.toUpperCase()}
                    </div>
                    <Badge variant={j.taxVariant}>{j.taxRate}</Badge>
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground">{j.name}</h3>
                    <p className="text-xs text-muted-foreground mt-1">{j.sub}</p>
                  </div>
                  <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-primary/10 text-[10px] font-bold text-primary w-fit mt-auto">
                    <Zap size={12} />
                    {j.highlight}
                  </div>
                  <div className="flex justify-between items-end pt-3 border-t mt-2">
                    <div>
                      <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-1">From</div>
                      <div className="font-bold text-lg text-foreground">{j.price}</div>
                    </div>
                    <Badge variant="outline" className="text-xs font-medium">
                      {j.turnaround}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Quick Interactive Tools Hub */}
      <div className="mt-4">
        <h2 className="font-heading text-xl font-bold text-foreground mb-4">Structuring & Calculators Hub</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-orange-100 dark:bg-orange-950 flex items-center justify-center shrink-0">
                <Calculator size={20} className="text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <div className="font-bold text-sm">Tax Arbitrage</div>
                <div className="text-xs text-muted-foreground">Compare EU/US savings</div>
              </div>
            </CardContent>
          </Card>
          <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-950 flex items-center justify-center shrink-0">
                <Landmark size={20} className="text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <div className="font-bold text-sm">Banking Odds</div>
                <div className="text-xs text-muted-foreground">Airwallex & Wio approval</div>
              </div>
            </CardContent>
          </Card>
          <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-950 flex items-center justify-center shrink-0">
                <Shield size={20} className="text-green-600 dark:text-green-400" />
              </div>
              <div>
                <div className="font-bold text-sm">Document Vault</div>
                <div className="text-xs text-muted-foreground">KYC & license locker</div>
              </div>
            </CardContent>
          </Card>
          <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-950 flex items-center justify-center shrink-0">
                <Clock size={20} className="text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <div className="font-bold text-sm">Renewals Hub</div>
                <div className="text-xs text-muted-foreground">License continuity</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Dedicated Concierge Specialist Advisor Card */}
      <Card className="mt-4 bg-muted border-muted-foreground/20">
        <CardContent className="p-5 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-primary text-primary-foreground font-bold">
                  AK
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm">Abdullah K.</span>
                  <Badge variant="outline" className="text-[9px] h-4 px-1.5 border-green-500 text-green-500">
                    ONLINE
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  Senior Structuring Lead • &lt;15m Response
                </div>
              </div>
            </div>
          </div>
          <p className="text-sm text-foreground/80 leading-relaxed">
            Have questions regarding nominee trust deeds, UAE Freezone trade licenses, or multi-currency IBAN pre-approvals?
          </p>
          <Button variant="default" className="w-full bg-[#25D366] hover:bg-[#20b958] text-white">
            <MessageSquare size={16} className="mr-2" />
            Chat Directly on WhatsApp (+971 50 123 4567)
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
