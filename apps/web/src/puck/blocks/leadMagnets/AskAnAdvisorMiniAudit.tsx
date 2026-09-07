'use client'

import { useState, type FormEvent } from 'react'
import type { ComponentConfig } from '@puckeditor/core'
import { CheckCircle2 } from 'lucide-react'
import { QuizShell, Input, Select, Button } from '@/components/ui'
import { getStoredAttribution } from '@/lib/attribution'
import { buildLeadPayload, LeadFormMeta } from '@/components/LeadFormMeta'

export type AskAnAdvisorMiniAuditProps = {
  eyebrow: string
  title: string
  description: string
}

function Tool({ eyebrow, title, description }: AskAnAdvisorMiniAuditProps) {
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setStatus('submitting')
    const data = buildLeadPayload(e.currentTarget)
    const { name, email, phone, emailConsent, consentPolicyVersion, website, startedAt, turnstileToken, ...answers } = data
    try {
      const res = await fetch('/api/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          phone,
          emailConsent,
          consentPolicyVersion,
          website,
          startedAt,
          turnstileToken,
          source: 'lead-magnet:ask-an-advisor-mini-audit',
          page: typeof window !== 'undefined' ? window.location.pathname : '',
          toolSlug: 'ask-an-advisor-mini-audit',
          answers,
          ...getStoredAttribution(),
        }),
      })
      setStatus(res.ok ? 'success' : 'error')
    } catch {
      setStatus('error')
    }
  }

  if (status === 'success') {
    return (
      <QuizShell eyebrow={eyebrow} title={title} description={description}>
        <div style={{ textAlign: 'center' }}>
          <CheckCircle2 size={40} color="var(--success)" strokeWidth={1.75} aria-hidden style={{ margin: '0 auto' }} />
          <h3 style={{ marginTop: 'var(--space-4)' }}>Got it — thank you!</h3>
          <p style={{ marginTop: 'var(--space-2)' }}>
            A specialist will send you a personal 3–5 line reply by WhatsApp or email, usually within 24 hours.
          </p>
        </div>
      </QuizShell>
    )
  }

  return (
    <QuizShell eyebrow={eyebrow} title={title} description={description}>
      <form onSubmit={onSubmit}>
        <Input label="Full name *" name="name" required placeholder="Your name" />
        <Input label="Email *" name="email" type="email" required placeholder="you@email.com" />
        <Input label="WhatsApp / phone" name="phone" placeholder="+ country code" />
        <Input label="Country of residence" name="residence" placeholder="e.g. Netherlands" />
        <Input label="Business type" name="businessType" placeholder="e.g. SaaS, e-commerce, consulting" />
        <Input label="Monthly revenue" name="revenue" placeholder="e.g. $10,000" />
        <Input label="Client/customer countries" name="clientCountries" placeholder="e.g. US, EU" />
        <Input label="Current company setup" name="currentSetup" placeholder="e.g. none yet, sole trader, LLC" />
        <Select label="Main issue" name="mainIssue" defaultValue="">
          <option value="">Select…</option>
          <option>Tax</option>
          <option>Banking</option>
          <option>Privacy</option>
          <option>Payment gateways</option>
          <option>Residency</option>
        </Select>
        <Input label="Timeline" name="timeline" placeholder="e.g. this month, exploring options" />
        <LeadFormMeta emailConsent />
        {status === 'error' && (
          <p style={{ color: 'var(--error)', marginBottom: 'var(--space-4)' }}>
            Something went wrong — please try again or WhatsApp us directly.
          </p>
        )}
        <Button type="submit" disabled={status === 'submitting'} className="w-full flex-center">
          {status === 'submitting' ? 'Sending…' : 'Send my business model'}
        </Button>
      </form>
    </QuizShell>
  )
}

export const AskAnAdvisorMiniAudit: ComponentConfig<AskAnAdvisorMiniAuditProps> = {
  fields: {
    eyebrow: { type: 'text' },
    title: { type: 'text' },
    description: { type: 'textarea' },
  },
  defaultProps: {
    eyebrow: 'Ask a specialist',
    title: "Send us your business model. We'll tell you the most suitable structure to consider.",
    description: 'A founder-led, manual 3–5 line reply — not an automated result.',
  },
  render: (props) => <Tool {...props} />,
}
