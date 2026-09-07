'use client'

import { useState, type FormEvent } from 'react'
import type { ComponentConfig } from '@puckeditor/core'
import { Download, BookOpen } from 'lucide-react'
import { Eyebrow, Input, Select } from '@/components/ui'
import { getStoredAttribution } from '@/lib/attribution'
import { buildLeadPayload, LeadFormMeta } from '@/components/LeadFormMeta'

export type TaxGuideCtaProps = {
  badge: string
  bookTitle: string
  headline: string
  description: string
  perks: Array<{ text: string }>
  formTitle: string
  formDescription: string
  submitText: string
  /** Optional — a real hosted PDF (e.g. an R2 URL). Download button only shows once set. */
  pdfUrl: string
}

/** Ported from embeds/0-tax-guide-cta.html — the split orange/white lead-magnet card.
 * Same lead capture pattern as LeadForm, source-tagged so it's distinguishable in the
 * leads collection, then either a real PDF download or a "we'll be in touch" fallback
 * if no pdfUrl has been configured yet. */
/**
 * Starts the guide download via a synthesised anchor rather than window.open().
 *
 * By the time the lead write resolves, the submit's user-gesture window has closed
 * and popup blockers eat window.open() — leaving the visitor on a success message
 * with no file. A `download` anchor is not a popup, so it survives; for a same-origin
 * file it also saves directly instead of opening a viewer tab.
 */
function startDownload(url: string) {
  const a = document.createElement('a')
  a.href = url
  a.download = ''
  a.target = '_blank'
  a.rel = 'noopener noreferrer'
  document.body.appendChild(a)
  a.click()
  a.remove()
}

function TaxGuideCtaRender({ badge, bookTitle, headline, description, perks, formTitle, formDescription, submitText, pdfUrl }: TaxGuideCtaProps) {
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setStatus('submitting')
    const data = buildLeadPayload(e.currentTarget)
    try {
      const res = await fetch('/api/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, source: 'Tax Guide Download', page: window.location.pathname, ...getStoredAttribution() }),
      })
      setStatus(res.ok ? 'success' : 'error')
      if (res.ok && pdfUrl) startDownload(pdfUrl)
    } catch {
      setStatus('error')
    }
  }

  return (
    <section className="section">
      <div className="wrap">
        <div className="cta-split">
          <div className="cta-split-panel">
            <span className="cta-blink-tag" style={{ borderColor: '#fff', color: '#fff', width: 'fit-content' }}>
              {badge}
            </span>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <BookOpen size={64} strokeWidth={1.25} aria-hidden />
            </div>
            <div>
              <h3 style={{ color: '#fff' }}>{bookTitle}</h3>
              <p style={{ color: 'rgba(255,255,255,.85)', marginTop: 'var(--space-2)' }}>{headline}</p>
              <p style={{ color: 'rgba(255,255,255,.7)', marginTop: 'var(--space-2)', fontSize: 14 }}>{description}</p>
            </div>
            <ul className="cta-perk-list">
              {perks?.map((p, i) => <li key={i}>{p.text}</li>)}
            </ul>
          </div>

          <div className="cta-split-form">
            {status === 'success' ? (
              <div style={{ textAlign: 'center' }}>
                <h3>Your guide is on its way!</h3>
                <p style={{ marginTop: 'var(--space-2)', color: 'var(--text-secondary)' }}>
                  {pdfUrl ? 'Check your downloads — a specialist will follow up if you have questions.' : "We'll send it to you shortly — a specialist will follow up too."}
                </p>
                {pdfUrl && (
                  <a href={pdfUrl} download className="btn btn-primary" style={{ marginTop: 'var(--space-4)', display: 'inline-flex' }}>
                    <Download size={16} aria-hidden /> Download again
                  </a>
                )}
              </div>
            ) : (
              <form onSubmit={onSubmit}>
                <Eyebrow>Free instant download</Eyebrow>
                <h3>{formTitle}</h3>
                <p style={{ marginTop: 'var(--space-2)', marginBottom: 'var(--space-6)', color: 'var(--text-secondary)' }}>{formDescription}</p>
                <Input label="Full name *" name="name" required placeholder="Your name" />
                <Input label="Email *" name="email" type="email" required placeholder="you@email.com" />
                <Input label="WhatsApp" name="phone" placeholder="+971 50 123 4567" />
                <Select label="Country of interest" name="country" defaultValue="">
                  <option value="">Not sure yet</option>
                  <option>UAE</option>
                  <option>Bahrain</option>
                  <option>Hong Kong</option>
                  <option>Singapore</option>
                  <option>Ireland</option>
                  <option>BVI &amp; Cayman</option>
                </Select>
                <LeadFormMeta emailConsent />
                {status === 'error' && <p style={{ color: 'var(--error)', marginBottom: 'var(--space-4)' }}>Something went wrong — please try again.</p>}
                <button type="submit" className="btn btn-primary w-full flex-center" disabled={status === 'submitting'} style={{ marginTop: 'var(--space-2)' }}>
                  <Download size={16} aria-hidden />
                  {status === 'submitting' ? 'Sending…' : submitText}
                </button>
                <p style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 'var(--space-3)', textAlign: 'center' }}>
                  🔒 Confidential. No spam. We reply within 24 hours.
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

export const TaxGuideCta: ComponentConfig<TaxGuideCtaProps> = {
  fields: {
    badge: { type: 'text' },
    bookTitle: { type: 'text' },
    headline: { type: 'text' },
    description: { type: 'textarea' },
    perks: { type: 'array', arrayFields: { text: { type: 'text' } }, getItemSummary: (item) => item.text || 'Perk' },
    formTitle: { type: 'text' },
    formDescription: { type: 'textarea' },
    submitText: { type: 'text' },
    pdfUrl: { type: 'text' },
  },
  defaultProps: {
    badge: 'Free Download · 2026 Edition',
    bookTitle: 'Tax Optimization Guide 2026',
    headline: "Legally pay 0% tax — here's the full playbook.",
    description: 'The complete guide to choosing the right jurisdiction and structure for your business.',
    perks: [
      { text: 'UAE, Bahrain, Hong Kong, Singapore & Ireland compared' },
      { text: 'Step-by-step costs & timelines per country' },
      { text: '0% tax structures explained in plain English' },
      { text: 'Nominee UBO & full privacy strategies' },
    ],
    formTitle: 'Get the GCC Tax Optimization Guide',
    formDescription: "Fill in your details — we'll send the guide straight to you.",
    submitText: 'Get My Free Guide',
    pdfUrl: '',
  },
  render: (props) => <TaxGuideCtaRender {...props} />,
}
