'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ChatCircle,
  CheckCircle,
  CircleNotch,
  Envelope,
  FloppyDisk,
  Sparkle,
  UserCheck,
} from '@phosphor-icons/react';
import {
  attachConsent,
  buildToolPersonaSignals,
  CONSENT_TEXT,
  type SourceTool,
} from '@/lib/tools/lead-capture';
import type { PersonaSignals } from '@/lib/persona';

export interface ContactCaptureGateProps {
  sourceTool?: SourceTool;
  toolInput?: Record<string, unknown>;
  toolResult?: Record<string, unknown>;
  signals?: PersonaSignals;
  title?: string;
  subtitle?: string;
  onSuccess?: (leadId: string) => void;
  onCapture?: (contact: { email: string; whatsapp_number: string }) => Promise<void> | void;
  className?: string;
}

interface SessionUser {
  id: string;
  email: string;
}

export default function ContactCaptureGate({
  sourceTool,
  toolInput = {},
  toolResult = {},
  signals,
  title,
  subtitle,
  onSuccess,
  onCapture,
  className = '',
}: ContactCaptureGateProps) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [sessionLoading, setSessionLoading] = useState(true);

  const [email, setEmail] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [consent, setConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [savedLeadId, setSavedLeadId] = useState<string | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;
    fetch('/api/auth/session')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (isMounted && data?.user?.id) {
          setUser({ id: data.user.id, email: data.user.email ?? '' });
        }
      })
      .catch(() => {
        // Unauthenticated visitor
      })
      .finally(() => {
        if (isMounted) setSessionLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleLeadSubmit = async (contactEmail?: string, contactPhone?: string) => {
    setError('');
    setSubmitting(true);

    try {
      const finalEmail = contactEmail ?? email.trim();
      const finalPhone = contactPhone ?? whatsapp.trim();

      // Compatibility fallback if no sourceTool is configured
      if (!sourceTool && onCapture) {
        await onCapture({ email: finalEmail, whatsapp_number: finalPhone });
        setSubmitted(true);
        return;
      }

      if (!sourceTool) {
        throw new Error('sourceTool is required');
      }

      const inputWithConsent = attachConsent(toolInput, true);
      const computedSignals = signals ?? buildToolPersonaSignals(sourceTool, toolInput, toolResult);

      const res = await fetch('/api/leads/capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source_tool: sourceTool,
          email: finalEmail || undefined,
          whatsapp_number: finalPhone || undefined,
          tool_input: inputWithConsent,
          tool_result: toolResult,
          signals: computedSignals,
        }),
      });

      if (!res.ok) {
        const errorJson = await res.json().catch(() => null);
        throw new Error(errorJson?.error || 'Failed to save lead report');
      }

      const data = (await res.json()) as { lead: { id: string } };
      const leadId = data.lead.id;

      if (typeof window !== 'undefined' && leadId) {
        try {
          localStorage.setItem('gcc_latest_lead_id', leadId);
        } catch {
          // ignore storage error
        }
      }

      setSavedLeadId(leadId);
      setSubmitted(true);

      if (onSuccess) {
        onSuccess(leadId);
      }
      if (onCapture) {
        await onCapture({ email: finalEmail, whatsapp_number: finalPhone });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Something went wrong. Please try again.';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleGuestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() && !whatsapp.trim()) {
      setError('Please provide at least your email address or WhatsApp number.');
      return;
    }
    if (!consent) {
      setError('Please check the consent box to receive your report.');
      return;
    }
    await handleLeadSubmit();
  };

  const handleAuthenticatedSubmit = async () => {
    await handleLeadSubmit(user?.email || undefined, undefined);
  };

  if (submitted) {
    return (
      <div
        className={`bg-white rounded-xl shadow-sm border border-emerald-200 p-5 animate-in fade-in duration-300 ${className}`}
      >
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 mb-1">
              <h3 className="text-sm font-bold text-gray-900">Report Saved Successfully</h3>
              {savedLeadId && (
                <span className="text-[11px] font-mono text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 w-fit">
                  Reference ID: #{savedLeadId.slice(0, 8)}
                </span>
              )}
            </div>
            <p className="text-xs text-gray-600 mb-3 leading-relaxed">
              {user
                ? 'Your calculation has been saved and linked to your GCCStartup account. Next steps and updates will be delivered to your registered email.'
                : 'A confirmation and your detailed assessment summary has been recorded. Our formation advisors will follow up with tailored guidance.'}
            </p>
            {user ? (
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary-700"
              >
                Go to Dashboard &rarr;
              </Link>
            ) : (
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 pt-2 border-t border-gray-100">
                <span className="text-xs text-gray-500">Ready to initiate your company incorporation?</span>
                <Link
                  href="/onboarding"
                  className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:text-primary-700"
                >
                  Start Onboarding &rarr;
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Already Signed In State (AC3: 1-click action, no manual contact inputs)
  if (!sessionLoading && user) {
    return (
      <div
        className={`bg-white rounded-xl shadow-sm border border-primary/20 p-5 space-y-4 ${className}`}
      >
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <UserCheck className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-bold text-gray-900 mb-0.5">
              Save Report to Your Account
            </h3>
            <p className="text-xs text-gray-500">
              Logged in as <span className="font-semibold text-gray-700">{user.email}</span>. Click below to save this calculation to your account and receive email updates.
            </p>
          </div>
        </div>

        {error && (
          <div role="alert" className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-lg">
            {error}
          </div>
        )}

        <button
          type="button"
          onClick={handleAuthenticatedSubmit}
          disabled={submitting}
          className="w-full bg-cta hover:bg-cta-600 disabled:opacity-60 text-cta-foreground text-xs font-semibold py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm cursor-pointer"
        >
          {submitting ? (
            <CircleNotch className="w-4 h-4 animate-spin" />
          ) : (
            <FloppyDisk className="w-4 h-4" />
          )}
          {submitting ? 'Saving Report...' : 'Save report to my account & Email me updates'}
        </button>
      </div>
    );
  }

  // Guest State (AC3, AC4: Capture card with contact inputs + mandatory consent checkbox)
  return (
    <div
      className={`bg-white rounded-xl shadow-sm border border-gray-200 p-5 space-y-4 ${className}`}
    >
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-lg bg-cta/15 text-cta-700 flex items-center justify-center shrink-0">
          <Sparkle className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-gray-900 mb-0.5">
            {title ?? 'Save & Email Your Report'}
          </h3>
          <p className="text-xs text-gray-500">
            {subtitle ?? 'Get a comprehensive copy of this assessment with jurisdiction breakdowns and consultation options.'}
          </p>
        </div>
      </div>

      {error && (
        <div role="alert" className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-lg">
          {error}
        </div>
      )}

      <form onSubmit={handleGuestSubmit} className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="relative">
            <Envelope className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="email"
              id="lead-capture-email"
              placeholder="work.email@company.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError('');
              }}
              className="w-full pl-9 pr-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors bg-white text-gray-900"
            />
          </div>

          <div className="relative">
            <ChatCircle className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="tel"
              id="lead-capture-phone"
              placeholder="+971 50 123 4567 (WhatsApp)"
              value={whatsapp}
              onChange={(e) => {
                setWhatsapp(e.target.value);
                setError('');
              }}
              className="w-full pl-9 pr-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors bg-white text-gray-900"
            />
          </div>
        </div>

        <div className="pt-1">
          <label className="flex items-start gap-2.5 cursor-pointer bg-gray-50/80 p-2.5 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors">
            <input
              type="checkbox"
              id="lead-consent-checkbox"
              checked={consent}
              onChange={(e) => {
                setConsent(e.target.checked);
                setError('');
              }}
              className="mt-0.5 rounded border-gray-300 text-primary focus:ring-primary h-4 w-4 shrink-0"
              required
            />
            <span className="text-[11px] text-gray-600 leading-tight select-none">
              {CONSENT_TEXT}
            </span>
          </label>
        </div>

        <button
          type="submit"
          disabled={submitting || !consent || (!email.trim() && !whatsapp.trim())}
          className="w-full bg-cta hover:bg-cta-600 disabled:opacity-50 disabled:cursor-not-allowed text-cta-foreground text-xs font-semibold py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm cursor-pointer"
        >
          {submitting ? (
            <CircleNotch className="w-4 h-4 animate-spin" />
          ) : (
            <FloppyDisk className="w-4 h-4" />
          )}
          {submitting ? 'Saving Report...' : 'Save My Report & Send Updates'}
        </button>
      </form>
    </div>
  );
}
