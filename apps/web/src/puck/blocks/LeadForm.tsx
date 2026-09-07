'use client'

import { useState, type FormEvent } from 'react'
import type { ComponentConfig } from '@puckeditor/core'
import { CheckCircle2 } from 'lucide-react'
import { Button, Eyebrow, Input, Select, Textarea } from '@/components/ui'
import { buildLeadPayload, LeadFormMeta } from '@/components/LeadFormMeta'
import {
  styleFields,
  defaultStyleProps,
  type StyleProps,
  getSectionStyle,
  getSectionClassName,
  getContainerClassName,
} from '@/puck/fields/styleFields'

export type LeadFormProps = {
  eyebrow: string
  title: string
  description: string
  formType: 'lead' | 'partner' | 'contact'
  submitButtonText: string
  successMessage: string
} & StyleProps

function LeadFormRender(props: LeadFormProps) {
  const { eyebrow, title, description, formType, submitButtonText, successMessage, maxWidth } = props
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')

  const sectionClass = getSectionClassName(props)
  const sectionStyle = getSectionStyle(props)
  const containerClass = getContainerClassName(maxWidth ?? 'narrow')

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setStatus('submitting')
    const data = buildLeadPayload(e.currentTarget)
    const endpoint = formType === 'partner' ? '/api/partner-application' : '/api/lead'
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, page: typeof window !== 'undefined' ? window.location.pathname : '' }),
      })
      setStatus(res.ok ? 'success' : 'error')
    } catch {
      setStatus('error')
    }
  }

  if (status === 'success') {
    return (
      <section className={sectionClass} style={sectionStyle} id="lead-form">
        <div className={`${containerClass} card`} style={{ textAlign: 'center' }}>
          <CheckCircle2 size={40} color="var(--success)" strokeWidth={1.75} aria-hidden style={{ margin: '0 auto' }} />
          <h3 style={{ marginTop: 'var(--space-4)' }}>Thank you!</h3>
          <p style={{ marginTop: 'var(--space-2)' }}>{successMessage}</p>
        </div>
      </section>
    )
  }

  return (
    <section className={sectionClass} style={sectionStyle} id="lead-form">
      <div className={`${containerClass} card`}>
        {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
        <h3>{title}</h3>
        {description && <p style={{ marginTop: 'var(--space-2)', marginBottom: 'var(--space-6)' }}>{description}</p>}
        <form onSubmit={onSubmit}>
          <Input label="Full name *" name="name" required placeholder="Your name" />
          <Input label="Email *" name="email" type="email" required placeholder="you@email.com" />
          <Input label="WhatsApp / phone" name="phone" placeholder="+ country code" />
          {formType === 'lead' && (
            <>
              <Select label="Country of interest" name="country" defaultValue="">
                <option value="">Not sure yet</option>
                <option>UAE</option>
                <option>Bahrain</option>
                <option>Hong Kong</option>
                <option>Singapore</option>
                <option>Ireland</option>
                <option>BVI &amp; Cayman</option>
              </Select>
              <Select label="What do you need?" name="interest" defaultValue="">
                <option value="">Select…</option>
                <option>Company registration</option>
                <option>Bank account setup</option>
                <option>Nominee UBO</option>
                <option>Shelf company</option>
                <option>Tax residency</option>
                <option>Annual renewals</option>
              </Select>
            </>
          )}
          <Textarea label="Message (optional)" name="message" placeholder="Tell us a bit about your situation…" rows={3} />
          {formType !== 'partner' && <LeadFormMeta emailConsent />}
          {status === 'error' && (
            <p style={{ color: 'var(--error)', marginBottom: 'var(--space-4)' }}>
              Something went wrong — please try again or WhatsApp us directly.
            </p>
          )}
          <Button type="submit" disabled={status === 'submitting'} className="w-full flex-center">
            {status === 'submitting' ? 'Sending…' : submitButtonText}
          </Button>
          <p style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 'var(--space-3)', textAlign: 'center' }}>
            🔒 Confidential. No spam. We reply within 24 hours.
          </p>
        </form>
      </div>
    </section>
  )
}

export const LeadForm: ComponentConfig<LeadFormProps> = {
  fields: {
    eyebrow: { type: 'text' },
    title: { type: 'text' },
    description: { type: 'textarea' },
    formType: {
      type: 'select',
      options: [
        { label: 'Lead', value: 'lead' },
        { label: 'Partner application', value: 'partner' },
        { label: 'Contact', value: 'contact' },
      ],
    },
    submitButtonText: { type: 'text' },
    successMessage: { type: 'textarea' },
    ...styleFields,
  },
  defaultProps: {
    ...defaultStyleProps,
    maxWidth: 'narrow',
    eyebrow: 'Get started',
    title: 'Request a free consultation',
    description: 'A specialist replies within 24 hours. No obligation.',
    formType: 'lead',
    submitButtonText: 'Send my enquiry',
    successMessage: "We've received your enquiry and will reply within 24 hours.",
  },
  render: (props) => <LeadFormRender {...props} />,
}
