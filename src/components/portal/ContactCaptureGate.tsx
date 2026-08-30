'use client';

import { useState } from 'react';
import { Envelope, ChatCircle, CircleNotch } from '@phosphor-icons/react';

interface ContactCaptureGateProps {
  title?: string;
  subtitle?: string;
  onCapture: (contact: { email: string; whatsapp_number: string }) => Promise<void> | void;
}

/**
 * Gates a tool's result behind a quick contact-info step. Every lead-gen
 * tool renders this instead of its results until the visitor supplies
 * contact info — that's what turns "a calculator" into an actual lead.
 */
export default function ContactCaptureGate({ title, subtitle, onCapture }: ContactCaptureGateProps) {
  const [email, setEmail] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email && !whatsapp) {
      setError('Enter at least your email or WhatsApp number.');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      await onCapture({ email, whatsapp_number: whatsapp });
    } catch {
      setError('Something went wrong — please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-md shadow-sm border border-gray-200 p-6 text-center">
      <h3 className="text-base font-bold text-gray-900 mb-1">
        {title ?? 'Almost there — where should we send your result?'}
      </h3>
      <p className="text-sm text-gray-500 mb-5">
        {subtitle ?? "Takes 5 seconds. We'll use this to follow up with next steps."}
      </p>

      {error && (
        <div className="mb-4 p-2 bg-destructive/10 text-destructive border border-destructive/20 rounded-md text-sm">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3 max-w-sm mx-auto text-left">
        <div className="relative">
          <Envelope className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="email"
            placeholder="you@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
          />
        </div>
        <div className="relative">
          <ChatCircle className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="tel"
            placeholder="WhatsApp number"
            value={whatsapp}
            onChange={(e) => setWhatsapp(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
          />
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary-700 disabled:opacity-60 text-white text-sm font-semibold py-2.5 px-4 rounded-md transition-colors"
        >
          {submitting ? <CircleNotch className="w-4 h-4 animate-spin" /> : null}
          {submitting ? 'Sending...' : 'Show my result'}
        </button>
      </form>
    </div>
  );
}
