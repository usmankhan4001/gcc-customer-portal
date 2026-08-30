'use client';

import { useState, type ReactNode } from 'react';
import { notFound } from 'next/navigation';
import {
  Buildings,
  FolderOpen,
  Bell,
  Warning,
  CircleNotch,
  ShieldWarning,
} from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import BannerHeader from '@/components/portal/BannerHeader';
import SummaryCard from '@/components/portal/SummaryCard';
import ServiceTile from '@/components/portal/ServiceTile';
import PipelineStepTracker from '@/components/portal/PipelineStepTracker';
import EmptyState from '@/components/portal/EmptyState';
import LoadingSkeleton from '@/components/portal/LoadingSkeleton';
import ErrorState from '@/components/portal/ErrorState';
import PromoBanner from '@/components/portal/PromoBanner';
import ContactCaptureGate from '@/components/portal/ContactCaptureGate';
import ConnectSheet from '@/components/portal/ConnectSheet';

// Class names must appear as literal strings for Tailwind's scanner to
// generate them — a template-literal-built class like `bg-primary-${s}`
// is invisible to it, so every swatch/token variant is spelled out here.
const PRIMARY_SCALE: { step: number; bg: string }[] = [
  { step: 50, bg: 'bg-primary-50' },
  { step: 100, bg: 'bg-primary-100' },
  { step: 200, bg: 'bg-primary-200' },
  { step: 300, bg: 'bg-primary-300' },
  { step: 400, bg: 'bg-primary-400' },
  { step: 500, bg: 'bg-primary-500' },
  { step: 600, bg: 'bg-primary-600' },
  { step: 700, bg: 'bg-primary-700' },
  { step: 800, bg: 'bg-primary-800' },
  { step: 900, bg: 'bg-primary-900' },
];
const SECONDARY_SCALE: { step: number; bg: string }[] = [
  { step: 50, bg: 'bg-secondary-50' },
  { step: 100, bg: 'bg-secondary-100' },
  { step: 200, bg: 'bg-secondary-200' },
  { step: 300, bg: 'bg-secondary-300' },
  { step: 400, bg: 'bg-secondary-400' },
  { step: 500, bg: 'bg-secondary-500' },
  { step: 600, bg: 'bg-secondary-600' },
  { step: 700, bg: 'bg-secondary-700' },
  { step: 800, bg: 'bg-secondary-800' },
  { step: 900, bg: 'bg-secondary-900' },
];
const SEMANTIC_TOKENS: { name: string; label: string; card: string; iconWrap: string; iconText: string; label2: string }[] = [
  { name: 'success', label: 'Success', card: 'bg-success-light border-success/30', iconWrap: 'bg-success/10 text-success', iconText: 'text-success', label2: '--success / --success-light' },
  { name: 'warning', label: 'Warning', card: 'bg-warning-light border-warning/30', iconWrap: 'bg-warning/10 text-warning', iconText: 'text-warning', label2: '--warning / --warning-light' },
  { name: 'info', label: 'Info', card: 'bg-info-light border-info/30', iconWrap: 'bg-info/10 text-info', iconText: 'text-info', label2: '--info / --info-light' },
  { name: 'destructive', label: 'Destructive', card: 'bg-destructive/10 border-destructive/30', iconWrap: 'bg-destructive/10 text-destructive', iconText: 'text-destructive', label2: '--destructive' },
];

const PIPELINE_STEPS = [
  'Order Paid',
  'Official Portal KYC',
  'Government Filing',
  'Trade License Issued',
  'Bank Setup',
  'Active',
];

function Section({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <section className="mb-12">
      <h2 className="text-xl font-bold text-gray-900 mb-1">{title}</h2>
      {description && <p className="text-sm text-gray-500 mb-4 max-w-2xl">{description}</p>}
      {!description && <div className="mb-4" />}
      {children}
    </section>
  );
}

function Swatch({ className, label, value }: { className: string; label: string; value: string }) {
  return (
    <div className="flex flex-col">
      <div className={`h-14 rounded-md border border-gray-200 ${className}`} />
      <span className="text-xs font-semibold text-gray-700 mt-1">{label}</span>
      <span className="text-[11px] text-gray-400">{value}</span>
    </div>
  );
}

export default function StyleGuidePage() {
  const [connectOpen, setConnectOpen] = useState(false);
  const [pipelineStep, setPipelineStep] = useState(2);

  // Dev-only visual QA route — never shipped as a reachable production page.
  if (process.env.NODE_ENV === 'production') {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-secondary text-white px-6 py-6">
        <h1 className="text-2xl font-bold">GCCStartup Style Guide</h1>
        <p className="text-sm opacity-80 mt-1">
          Every token and composed component in one place, for fast visual QA against the reference
          screenshots. Dev-only — 404s outside development.
        </p>
      </div>

      <div className="max-w-5xl mx-auto px-4 md:px-6 pt-8">
        <Section title="Brand color scales" description="Full 50-900 tint/shade scales, not a single flat hex per role.">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Primary (orange)</p>
          <div className="grid grid-cols-5 sm:grid-cols-10 gap-2 mb-6">
            {PRIMARY_SCALE.map((s) => (
              <Swatch key={s.step} className={s.bg} label={`${s.step}`} value={`primary-${s.step}`} />
            ))}
          </div>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Secondary (navy)</p>
          <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
            {SECONDARY_SCALE.map((s) => (
              <Swatch key={s.step} className={s.bg} label={`${s.step}`} value={`secondary-${s.step}`} />
            ))}
          </div>
        </Section>

        <Section
          title="Semantic status tokens"
          description="Reserved for KYC states, notification severity, and tool-result severity — never used for ordinary brand CTAs."
        >
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {SEMANTIC_TOKENS.map((t) => (
              <div key={t.name} className={`rounded-md border p-3 ${t.card}`}>
                <div className={`w-8 h-8 rounded-full ${t.iconWrap} flex items-center justify-center mb-2`}>
                  <Warning size={16} weight="duotone" />
                </div>
                <p className={`text-sm font-bold ${t.iconText}`}>{t.label}</p>
                <p className="text-[11px] text-gray-500">{t.label2}</p>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Radius" description="A tighter tile radius for the dense icon-tile grid vs. the default card radius.">
          <div className="flex gap-4">
            <div className="flex flex-col items-center gap-1">
              <div className="w-16 h-16 bg-primary-100 border border-primary-200 rounded-[var(--radius-tile)]" />
              <span className="text-xs text-gray-500">--radius-tile</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="w-16 h-16 bg-gray-100 border border-gray-200 rounded-md" />
              <span className="text-xs text-gray-500">rounded-md (cards)</span>
            </div>
          </div>
        </Section>

        <Section
          title="Icon language"
          description="Phosphor Icons, duotone weight for feature/service icons — matches the reference screenshots' flat two-tone style."
        >
          <div className="flex flex-wrap gap-6">
            {[Buildings, FolderOpen, Bell, ShieldWarning].map((Icon, i) => (
              <div key={i} className="flex flex-col items-center gap-1">
                <div className="w-12 h-12 rounded-[var(--radius-tile)] bg-primary-50 text-primary flex items-center justify-center">
                  <Icon size={24} weight="duotone" />
                </div>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Primitives" description="Radix/@base-ui behavior layer — token-driven, available for interactive overlays (Sheet is proven via ConnectSheet below).">
          <div className="space-y-6">
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Button</p>
              <div className="flex flex-wrap gap-2">
                <Button variant="default">Default</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="destructive">Destructive</Button>
                <Button variant="link">Link</Button>
              </div>
            </div>
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Badge</p>
              <div className="flex flex-wrap gap-2">
                <Badge variant="default">Default</Badge>
                <Badge variant="secondary">Secondary</Badge>
                <Badge variant="outline">Outline</Badge>
                <Badge variant="destructive">Destructive</Badge>
              </div>
            </div>
            <div className="flex flex-wrap items-end gap-6">
              <div className="w-56">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Input</p>
                <Input placeholder="you@email.com" />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Avatar</p>
                <Avatar>
                  <AvatarFallback>GC</AvatarFallback>
                </Avatar>
              </div>
              <div className="w-56">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Progress</p>
                <Progress value={60} />
              </div>
            </div>
          </div>
        </Section>

        <Section title="BannerHeader" description="Tall diagonal hero below lg, compact strip at lg+.">
          <div className="rounded-md overflow-hidden border border-gray-200">
            <BannerHeader title="Tax Savings Calculator" subtitle="See your potential savings in seconds." />
          </div>
        </Section>

        <Section title="SummaryCard">
          <SummaryCard title="Active Structures" balance="2" totalIncome="$48,000" totalExpense="$3,200" />
        </Section>

        <Section title="ServiceTile grid">
          <div className="grid grid-cols-4 gap-4 max-w-md">
            <ServiceTile title="Tax Calculator" href="#" icon={<Buildings className="w-6 h-6" weight="duotone" />} />
            <ServiceTile title="Vault" href="#" icon={<FolderOpen className="w-6 h-6" weight="duotone" />} />
            <ServiceTile title="Notifications" href="#" icon={<Bell className="w-6 h-6" weight="duotone" />} />
            <ServiceTile title="More Tools" href="#" icon={<CircleNotch className="w-6 h-6" weight="duotone" />} />
          </div>
        </Section>

        <Section title="PipelineStepTracker" description="Driven by companies.status/milestones — the visible case-status view.">
          <div className="flex gap-2 mb-2">
            {PIPELINE_STEPS.map((_, i) => (
              <button
                key={i}
                onClick={() => setPipelineStep(i)}
                className={`text-xs px-2 py-1 rounded-md border ${pipelineStep === i ? 'bg-primary text-white border-primary' : 'border-gray-300 text-gray-600'}`}
              >
                Step {i + 1}
              </button>
            ))}
          </div>
          <div className="bg-white rounded-md border border-gray-200">
            <PipelineStepTracker steps={PIPELINE_STEPS} currentStep={pipelineStep} />
          </div>
        </Section>

        <Section title="EmptyState / LoadingSkeleton / ErrorState" description="Previously every screen either improvised its own or rendered nothing considered.">
          <div className="grid sm:grid-cols-3 gap-4">
            <EmptyState
              icon={<FolderOpen size={24} weight="duotone" />}
              title="No documents yet"
              description="Upload your first document to get started."
            />
            <LoadingSkeleton rows={2} />
            <ErrorState title="Something went wrong" description="Could not load your data." onRetry={() => {}} />
          </div>
        </Section>

        <Section title="PromoBanner" description="Admin-authored, dismissible; dismissal persisted per-viewer in localStorage.">
          <PromoBanner banner={{ id: 'style-guide-demo', title: 'Finish your KYC', body: 'Complete your official portal KYC to keep your filing on track.', link_url: null }} />
        </Section>

        <Section title="ContactCaptureGate" description="Every lead-gen tool gates its result behind this before showing anything.">
          <ContactCaptureGate onCapture={async () => {}} />
        </Section>

        <Section title="ConnectSheet" description="Bottom sheet below lg, centered dialog at lg+ — same component, responsive variant.">
          <Button onClick={() => setConnectOpen(true)}>Open Connect Sheet</Button>
          <ConnectSheet open={connectOpen} onOpenChange={setConnectOpen} />
        </Section>

        <Section
          title="Requires live session/DB data"
          description="QA'd in-context on their real pages instead of mocked here: TopBar + NotificationBell (dashboard), ComplianceSnapshot (dashboard), NotificationList (/notifications), VaultUploader/DownloadButton/ShareButton (/vault), PDFDownloadPanel (tool result pages), PushNotificationToggle (/profile)."
        >
          <div />
        </Section>
      </div>
    </div>
  );
}
