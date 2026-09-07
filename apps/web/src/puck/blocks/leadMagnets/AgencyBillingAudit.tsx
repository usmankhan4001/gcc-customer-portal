'use client'

import { useState, type FormEvent } from 'react'
import type { ComponentConfig } from '@puckeditor/core'
import { QuizShell, ResultGate, ResultCard, Input, Select } from '@/components/ui'

export type AgencyBillingAuditProps = {
  eyebrow: string
  title: string
  description: string
  /** Withhold the result until an email is given. Off by default — the tool
   * should prove its worth before asking. See components/ui/ResultGate.tsx. */
  gated: boolean
}

type Inputs = {
  clientCountries: string
  avgInvoice: number
  currentCompany: string
  failedPayments: string
  bankingConcerns: string
}
type Result = { billingFrictionScore: string; bankingCredibilityScore: string; entityRoute: string; gatewayRoute: string }

function computeResult(i: Inputs): Result {
  let frictionPoints = 0
  if (i.failedPayments === 'yes') frictionPoints += 2
  if (i.currentCompany === 'home' && i.clientCountries !== 'home') frictionPoints += 1
  const billingFrictionScore = frictionPoints >= 2 ? 'High' : frictionPoints === 1 ? 'Moderate' : 'Low'

  let bankingPoints = 0
  if (i.bankingConcerns === 'yes') bankingPoints += 2
  if (i.currentCompany === 'home') bankingPoints += 1
  const bankingCredibilityScore = bankingPoints >= 2 ? 'Weak' : bankingPoints === 1 ? 'Fair' : 'Strong'

  const entityRoute = i.clientCountries === 'eu' ? 'Bahrain or UAE company' : 'Hong Kong or Singapore company'
  const gatewayRoute = i.avgInvoice >= 5000 ? 'Local bank + Airwallex for high-value invoices' : 'Stripe / Wise / Airwallex'

  return { billingFrictionScore, bankingCredibilityScore, entityRoute, gatewayRoute }
}

function Tool({ eyebrow, title, description, gated }: AgencyBillingAuditProps) {
  const [inputs, setInputs] = useState<Inputs | null>(null)
  const [result, setResult] = useState<Result | null>(null)

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const data = Object.fromEntries(new FormData(e.currentTarget).entries())
    const i: Inputs = {
      clientCountries: String(data.clientCountries ?? ''),
      avgInvoice: Number(data.avgInvoice) || 0,
      currentCompany: String(data.currentCompany ?? ''),
      failedPayments: String(data.failedPayments ?? ''),
      bankingConcerns: String(data.bankingConcerns ?? ''),
    }
    setInputs(i)
    setResult(computeResult(i))
  }

  function restart() {
    setInputs(null)
    setResult(null)
  }

  return (
    <QuizShell eyebrow={eyebrow} title={title} description={description}>
      {!result && (
        <form onSubmit={onSubmit}>
          <Select label="Most clients are located in" name="clientCountries" defaultValue="">
            <option value="">Select…</option>
            <option value="home">My home country</option>
            <option value="us">United States</option>
            <option value="eu">Europe</option>
            <option value="global">Global / mixed</option>
          </Select>
          <Input label="Average invoice value ($)" name="avgInvoice" type="number" min={0} required placeholder="4000" />
          <Select label="Current company country" name="currentCompany" defaultValue="">
            <option value="">Select…</option>
            <option value="home">My home country</option>
            <option value="offshore">Already offshore</option>
            <option value="none">None yet</option>
          </Select>
          <Select label="Have you had failed/delayed payments from clients?" name="failedPayments" defaultValue="">
            <option value="">Select…</option>
            <option value="yes">Yes</option>
            <option value="no">No</option>
          </Select>
          <Select label="Do clients ever question your banking credibility?" name="bankingConcerns" defaultValue="">
            <option value="">Select…</option>
            <option value="yes">Yes</option>
            <option value="no">No</option>
          </Select>
          <button
            type="submit"
            className="btn btn-primary w-full flex-center" style={{ marginTop: 'var(--space-2)' }}
          >
            Run my billing audit
          </button>
        </form>
      )}
      {result && (
        <ResultGate gated={gated} toolSlug="agency-billing-audit" answers={{ ...inputs, result }}>
          <ResultCard
            headline={`Billing friction: ${result.billingFrictionScore}`}
            subheadline={`Banking credibility: ${result.bankingCredibilityScore}`}
            tags={[result.entityRoute, result.gatewayRoute]}
            onRestart={restart}
          />
        </ResultGate>
      )}
    </QuizShell>
  )
}

export const AgencyBillingAudit: ComponentConfig<AgencyBillingAuditProps> = {
  fields: {
    eyebrow: { type: 'text' },
    title: { type: 'text' },
    description: { type: 'textarea' },
    gated: {
      type: 'radio',
      label: 'Require an email to show the result',
      options: [
        { label: 'No — show it freely', value: false },
        { label: 'Yes — gate it', value: true },
      ],
    },
  },
  defaultProps: {
    eyebrow: 'Free audit',
    title: 'Is your agency billing structure limiting international clients?',
    description: 'A quick audit of your billing friction and banking credibility.',
    gated: false,
  },
  render: (props) => <Tool {...props} />,
}
