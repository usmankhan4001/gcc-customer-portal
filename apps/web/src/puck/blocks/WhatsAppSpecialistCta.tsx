'use client'

import { useState, type FormEvent } from 'react'
import type { ComponentConfig } from '@puckeditor/core'
import { MessageCircle, X } from 'lucide-react'
import { Eyebrow, Input } from '@/components/ui'
import { getStoredAttribution } from '@/lib/attribution'
import { buildLeadPayload, LeadFormMeta } from '@/components/LeadFormMeta'

export type WhatsAppSpecialistCtaProps = {
  urgencyText: string
  tag: string
  headline: string
  description: string
  proofText: string
  buttonText: string
  whatsappDigits: string
  whatsappMessage: string
}

/** Ported from embeds/1-whatsapp-specialist-cta.html — urgency bar + big pulsing
 * WhatsApp CTA with avatar-stack social proof. The button opens its own inline
 * lead-capture form (name/phone required, email optional), matching the original
 * embed's modal — captures the lead via /api/lead before opening WhatsApp, rather
 * than linking straight out with nothing captured. */
function WhatsAppSpecialistCtaRender({
  urgencyText,
  tag,
  headline,
  description,
  proofText,
  buttonText,
  whatsappDigits,
  whatsappMessage,
}: WhatsAppSpecialistCtaProps) {
  const [open, setOpen] = useState(false)
  // No 'error' state: the handoff to WhatsApp now happens before the lead write and
  // never depends on it, so there is no failure the visitor could act on from here.
  const [status, setStatus] = useState<'idle' | 'submitting'>('idle')

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setStatus('submitting')
    const data = buildLeadPayload(e.currentTarget)
    const name = String(data.name ?? '')
    const body = JSON.stringify({
      ...data,
      source: 'WhatsApp CTA',
      page: window.location.pathname,
      ...getStoredAttribution(),
    })

    // Open WhatsApp synchronously, inside the click's user-gesture window. Both the
    // success and failure paths already handed off regardless of whether the lead
    // saved, but awaiting the write first put window.open() outside that window,
    // where popup blockers drop it — costing the handoff it was trying to protect.
    const finalMessage = `${whatsappMessage} My name is ${name}.`
    window.open(`https://wa.me/${whatsappDigits}?text=${encodeURIComponent(finalMessage)}`, '_blank', 'noopener,noreferrer')
    setOpen(false)
    setStatus('idle')

    // keepalive so the write survives the tab losing focus.
    fetch('/api/lead', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body, keepalive: true }).catch(
      () => {
        // Silent: the visitor is already in WhatsApp, where a specialist will pick
        // up the conversation. Surfacing an error behind them helps nobody.
      },
    )
  }

  return (
    <section className="section" style={{ padding: 0 }}>
      {urgencyText && <div className="cta-urgency-bar">{urgencyText}</div>}
      <div className="wrap" style={{ padding: 'var(--space-12) var(--space-4)', textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <Eyebrow>{tag}</Eyebrow>
        </div>
        <h2 style={{ maxWidth: 720, margin: '0 auto' }}>{headline}</h2>
        <p style={{ maxWidth: 560, margin: 'var(--space-4) auto 0', color: 'var(--text-secondary)' }}>{description}</p>

        <div className="cta-avatar-stack" style={{ justifyContent: 'center', marginTop: 'var(--space-6)' }}>
          <div className="avs">
            <span>🧑💼</span>
            <span>👩💼</span>
            <span>🧑💻</span>
          </div>
          <div className="cta-avatar-stack-text">
            <b>{proofText}</b>
          </div>
        </div>

        <div className="cta-ring-wrap" data-cta-accent="orange" style={{ marginTop: 'var(--space-8)' }}>
          <span className="cta-ring" aria-hidden />
          <button type="button" className="btn btn-primary" onClick={() => setOpen(true)}>
            <MessageCircle size={18} aria-hidden /> {buttonText}
          </button>
        </div>
      </div>

      {open && (
        <div className="cta-modal-overlay" onClick={(e) => e.target === e.currentTarget && setOpen(false)}>
          <div className="cta-modal">
            <button type="button" className="cta-modal-close" onClick={() => setOpen(false)} aria-label="Close">
              <X size={20} aria-hidden />
            </button>
            <span className="cta-blink-tag" style={{ width: 'fit-content' }}>
              Free · No Obligation
            </span>
            <h3 style={{ marginTop: 'var(--space-4)' }}>Claim Your Free Consultation</h3>
            <p style={{ marginTop: 'var(--space-2)', marginBottom: 'var(--space-6)', color: 'var(--text-secondary)' }}>
              Enter your details — we'll WhatsApp you in under 2 minutes.
            </p>
            <form onSubmit={onSubmit}>
              <Input label="Your name *" name="name" required placeholder="Your name" />
              <Input label="WhatsApp number *" name="phone" required placeholder="+971 50 123 4567" />
              <Input label="Email (optional)" name="email" type="email" placeholder="you@email.com" />
              <LeadFormMeta emailConsent />
              <button type="submit" className="btn btn-primary w-full flex-center" disabled={status === 'submitting'} style={{ marginTop: 'var(--space-2)' }}>
                <MessageCircle size={16} aria-hidden />
                {status === 'submitting' ? 'Connecting…' : 'Connect Me on WhatsApp'}
              </button>
              <p style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 'var(--space-3)', textAlign: 'center' }}>
                🔒 Your details are never shared or sold.
              </p>
            </form>
          </div>
        </div>
      )}
    </section>
  )
}

export const WhatsAppSpecialistCta: ComponentConfig<WhatsAppSpecialistCtaProps> = {
  fields: {
    urgencyText: { type: 'text' },
    tag: { type: 'text' },
    headline: { type: 'text' },
    description: { type: 'textarea' },
    proofText: { type: 'text' },
    buttonText: { type: 'text' },
    whatsappDigits: { type: 'text' },
    whatsappMessage: { type: 'textarea' },
  },
  defaultProps: {
    urgencyText: '⚡ Specialists online now — average reply time under 10 minutes',
    tag: 'Talk to a specialist',
    headline: 'Get a straight answer in the next 10 minutes.',
    description: 'No forms, no waiting for a callback — message a real specialist on WhatsApp right now and get a clear answer on jurisdiction, cost, and timeline.',
    proofText: '500+ founders helped · Replies within minutes',
    buttonText: 'Chat on WhatsApp',
    whatsappDigits: '447868762416',
    whatsappMessage: "Hi! I'd like a free GCC setup consultation.",
  },
  render: (props) => <WhatsAppSpecialistCtaRender {...props} />,
}
