'use client'

import { useState } from 'react'
import type { ComponentConfig } from '@puckeditor/core'
import { QuizShell, ProgressBar, ResultGate, ResultCard, QuizBackButton, QuizOptionButton } from '@/components/ui'

export type PaymentGatewayCheckerProps = {
  eyebrow: string
  title: string
  description: string
  /** Withhold the result until an email is given. Off by default — the tool
   * should prove its worth before asking. See components/ui/ResultGate.tsx. */
  gated: boolean
}

const STEPS = [
  {
    key: 'platform',
    question: 'Which platform do you mainly sell/invoice through?',
    options: [
      { value: 'shopify', label: 'Shopify / Amazon' },
      { value: 'stripe', label: 'Stripe / PayPal (SaaS or services)' },
      { value: 'upwork', label: 'Upwork / freelance platforms' },
      { value: 'invoices', label: 'Direct agency invoices' },
    ],
  },
  {
    key: 'customers',
    question: 'Where are most of your customers/clients located?',
    options: [
      { value: 'us', label: 'United States' },
      { value: 'eu', label: 'Europe' },
      { value: 'asia', label: 'Asia' },
      { value: 'global', label: 'Global / mixed' },
    ],
  },
  {
    key: 'currentBank',
    question: 'Where is your current business bank account, if any?',
    options: [
      { value: 'home', label: 'My home country' },
      { value: 'offshore', label: 'Already offshore' },
      { value: 'none', label: "Don't have one yet" },
    ],
  },
  {
    key: 'preference',
    question: 'Do you need fintech banking (Stripe, Airwallex, Wise) or credible local banking?',
    options: [
      { value: 'fintech', label: 'Fintech banking' },
      { value: 'local', label: 'Local bank credibility' },
      { value: 'both', label: 'Both' },
    ],
  },
]

type Answers = Record<string, string>
type Result = { structure: string; route: string; jurisdiction: string; riskFlags: string[] }

function computeResult(a: Answers): Result {
  const riskFlags: string[] = []
  if (a.currentBank === 'home' && a.customers !== 'home') riskFlags.push('Home-country bank may flag foreign-client payments')
  if (a.platform === 'upwork') riskFlags.push('Marketplace payouts often need a company entity, not personal account')
  if (a.preference === 'both') riskFlags.push('Dual banking adds setup time — plan for both accounts upfront')

  if (a.preference === 'local') {
    return {
      structure: 'UAE or Bahrain company + local bank account',
      route: 'Local Gulf banking',
      jurisdiction: a.customers === 'eu' ? 'Bahrain' : 'UAE Free Zone',
      riskFlags,
    }
  }
  return {
    structure: 'Hong Kong or Singapore company + fintech stack',
    route: 'Airwallex / Wise / Stripe',
    jurisdiction: a.platform === 'shopify' || a.customers === 'us' ? 'Hong Kong' : 'Singapore',
    riskFlags,
  }
}

function Tool({ eyebrow, title, description, gated }: PaymentGatewayCheckerProps) {
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState<Answers>({})
  const [result, setResult] = useState<Result | null>(null)

  function pick(value: string) {
    const next = { ...answers, [STEPS[step].key]: value }
    setAnswers(next)
    if (step < STEPS.length - 1) {
      setStep(step + 1)
    } else {
      setResult(computeResult(next))
    }
  }

  function restart() {
    setAnswers({})
    setResult(null)
    setStep(0)
  }

  return (
    <QuizShell eyebrow={eyebrow} title={title} description={description}>
      {!result && (
        <>
          <ProgressBar step={step + 1} totalSteps={STEPS.length} label="Payment Gateway Compatibility Checker" />
          <div style={{ fontWeight: 700, marginBottom: 'var(--space-4)' }}>{STEPS[step].question}</div>
          <div style={{ display: 'grid', gap: 'var(--space-2)' }}>
            {STEPS[step].options.map((opt) => (
              <QuizOptionButton key={opt.value} onClick={() => pick(opt.value)}>
                {opt.label}
              </QuizOptionButton>
            ))}
          </div>
          {step > 0 && <QuizBackButton onClick={() => setStep(step - 1)} />}
        </>
      )}
      {result && (
        <ResultGate gated={gated} toolSlug="payment-gateway-checker" answers={{ ...answers, result }}>
          <ResultCard headline={result.structure} subheadline={result.route} tags={[`Best fit: ${result.jurisdiction}`, ...result.riskFlags]} onRestart={restart} />
        </ResultGate>
      )}
    </QuizShell>
  )
}

export const PaymentGatewayChecker: ComponentConfig<PaymentGatewayCheckerProps> = {
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
    eyebrow: 'Free checker',
    title: 'Will your current structure work with Stripe, PayPal, Wise, Airwallex, and global clients?',
    description: 'Four quick questions, one clear payment route.',
    gated: false,
  },
  render: (props) => <Tool {...props} />,
}
