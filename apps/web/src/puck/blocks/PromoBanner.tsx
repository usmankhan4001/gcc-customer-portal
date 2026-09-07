'use client'

import { useState, type FormEvent } from 'react'
import type { ComponentConfig } from '@puckeditor/core'
import { Input, Select } from '@/components/ui'
import { getStoredAttribution } from '@/lib/attribution'
import { buildLeadPayload, LeadFormMeta } from '@/components/LeadFormMeta'

export type PromoBannerProps = {
  tag: string
  headline: string
  highlight: string
  description: string
  buttonText: string
  buttonLink: string
  formTitle: string
  formDescription: string
}

/** Ported from embeds/3-promo-banner.html — split orange/white promo band. The right
 * panel now carries its own inline lead-capture form (name/phone required, business/stage
 * optional), matching the original embed, instead of just linking to a separate lead form
 * elsewhere on the page. */
function PromoBannerRender({ tag, headline, highlight, description, buttonText, buttonLink, formTitle, formDescription }: PromoBannerProps) {
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setStatus('submitting')
    const data = buildLeadPayload(e.currentTarget)
    const { business, stage, ...rest } = data
    try {
      const res = await fetch('/api/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...rest,
          interest: 'Free Jurisdiction Analysis',
          message: [business ? `Business: ${business}` : '', stage ? `Stage: ${stage}` : ''].filter(Boolean).join('\n'),
          source: 'Promo CTA Band',
          page: window.location.pathname,
          ...getStoredAttribution(),
        }),
      })
      setStatus(res.ok ? 'success' : 'error')
    } catch {
      setStatus('error')
    }
  }

  return (
    <section className="section">
      <div className="wrap">
        <div className="cta-split" style={{ minHeight: 320 }}>
          <div className="cta-split-panel" style={{ justifyContent: 'center' }}>
            <span className="cta-blink-tag" style={{ borderColor: 'rgba(255,255,255,.4)', color: '#fff', background: 'rgba(255,255,255,.15)', width: 'fit-content' }}>
              {tag}
            </span>
            <h2 style={{ color: '#fff' }}>
              {headline} <span style={{ background: '#fff', color: 'var(--orange)', padding: '2px 8px', borderRadius: 4 }}>{highlight}</span>
            </h2>
            <p style={{ color: 'rgba(255,255,255,.85)', maxWidth: 400 }}>{description}</p>
            <a href={buttonLink} className="btn" style={{ background: '#fff', color: 'var(--orange)', width: 'fit-content' }}>
              {buttonText}
            </a>
          </div>

          <div className="cta-split-form">
            {status === 'success' ? (
              <div style={{ textAlign: 'center' }}>
                <h3>Analysis on its way!</h3>
                <p style={{ marginTop: 'var(--space-2)', color: 'var(--text-secondary)' }}>
                  Our specialist will send your personalised jurisdiction breakdown to your WhatsApp within 24 hours.
                </p>
              </div>
            ) : (
              <form onSubmit={onSubmit}>
                <h3>{formTitle}</h3>
                <p style={{ marginTop: 'var(--space-2)', marginBottom: 'var(--space-6)', color: 'var(--text-secondary)' }}>{formDescription}</p>
                <Input label="Your name *" name="name" required placeholder="Your name" />
                <Input label="WhatsApp number *" name="phone" required placeholder="+971 50 123 4567" />
                <Input label="What does your business do?" name="business" placeholder="e.g. Shopify store, SaaS, consulting" />
                <Select label="Business stage" name="stage" defaultValue="">
                  <option value="" disabled>
                    Select…
                  </option>
                  <option>Pre-launch / idea stage</option>
                  <option>Already trading, expanding</option>
                  <option>Relocating existing company</option>
                  <option>Investor / holding structure</option>
                </Select>
                <LeadFormMeta />
                {status === 'error' && <p style={{ color: 'var(--error)', marginBottom: 'var(--space-4)' }}>Something went wrong — please try again.</p>}
                <button type="submit" className="btn btn-primary w-full flex-center" disabled={status === 'submitting'} style={{ marginTop: 'var(--space-2)' }}>
                  {status === 'submitting' ? 'Sending…' : 'Send Me the Free Analysis →'}
                </button>
                <p style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 'var(--space-3)', textAlign: 'center' }}>
                  Free · No card needed · WhatsApp delivery
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

export const PromoBanner: ComponentConfig<PromoBannerProps> = {
  fields: {
    tag: { type: 'text' },
    headline: { type: 'text' },
    highlight: { type: 'text' },
    description: { type: 'textarea' },
    buttonText: { type: 'text' },
    buttonLink: { type: 'text' },
    formTitle: { type: 'text' },
    formDescription: { type: 'textarea' },
  },
  defaultProps: {
    tag: 'Limited time',
    headline: 'Set up before year-end and',
    highlight: 'save 15%',
    description: 'Lock in 2026 pricing on company registration, banking, and nominee UBO — offer ends soon.',
    buttonText: 'Claim my discount',
    buttonLink: '#lead-form',
    formTitle: 'Claim Your Free Analysis',
    formDescription: "We'll WhatsApp your personalised breakdown within 24 hours.",
  },
  render: (props) => <PromoBannerRender {...props} />,
}
