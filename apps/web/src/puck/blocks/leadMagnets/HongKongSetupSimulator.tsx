'use client'

import { useState } from 'react'
import type { ComponentConfig } from '@puckeditor/core'
import { QuizShell, ProgressBar, ResultGate, ResultCard, QuizBackButton, QuizOptionButton } from '@/components/ui'

export type HongKongSetupSimulatorProps = {
  eyebrow: string
  title: string
  description: string
  /** Withhold the result until an email is given. Off by default — the tool
   * should prove its worth before asking. See components/ui/ResultGate.tsx. */
  gated: boolean
}

const STEPS = [
  {
    key: 'ubo',
    question: 'Self UBO or Nominee UBO?',
    options: [
      { value: 'self', label: 'Self UBO' },
      { value: 'nominee', label: 'Nominee UBO' },
    ],
  },
  {
    key: 'banking',
    question: 'Airwallex or Wise for banking?',
    options: [
      { value: 'airwallex', label: 'Airwallex' },
      { value: 'wise', label: 'Wise' },
    ],
  },
  {
    key: 'docs',
    question: 'Are your documents ready (passport, proof of address)?',
    options: [
      { value: 'yes', label: 'Yes, ready now' },
      { value: 'no', label: 'Not yet' },
    ],
  },
  {
    key: 'gateways',
    question: 'Do you need PayPal/Stripe/Shopify compatibility?',
    options: [
      { value: 'yes', label: 'Yes' },
      { value: 'no', label: 'Not essential' },
    ],
  },
]

type Answers = Record<string, string>
type Result = { timeline: string[]; checklist: string[]; bottleneck: string | null }

function computeResult(a: Answers): Result {
  const timeline = [
    `Day 1–2: Company registration${a.ubo === 'nominee' ? ' + nominee UBO paperwork' : ''}`,
    'Day 3–5: Certificate of Incorporation issued',
    `Day 6–17: ${a.banking === 'airwallex' ? 'Airwallex' : 'Wise'} banking application + KYC review`,
    a.gateways === 'yes' ? 'Day 15–18: Stripe/PayPal/Shopify connected once banking is live' : 'Day 17–18: Fully operational',
  ]
  const checklist = ['Passport copy', 'Proof of address (utility bill or bank statement)', 'Business activity description']
  if (a.ubo === 'nominee') checklist.push('Nominee UBO declaration')
  const bottleneck = a.docs === 'no' ? 'Missing documents will delay Day 1 — gather your passport and proof of address first.' : null
  return { timeline, checklist, bottleneck }
}

function Tool({ eyebrow, title, description, gated }: HongKongSetupSimulatorProps) {
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
          <ProgressBar step={step + 1} totalSteps={STEPS.length} label="17-Day Hong Kong Setup Simulator" />
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
        <ResultGate gated={gated} toolSlug="hong-kong-setup-simulator" answers={{ ...answers, result }}>
          <ResultCard headline="Your personalized Hong Kong setup timeline" onRestart={restart}>
            <ul style={{ paddingLeft: 18, margin: 0, display: 'grid', gap: 'var(--space-2)' }}>
              {result.timeline.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ul>
            <div style={{ fontWeight: 700, marginTop: 'var(--space-4)', marginBottom: 'var(--space-2)' }}>Document checklist</div>
            <ul style={{ paddingLeft: 18, margin: 0, display: 'grid', gap: 'var(--space-1)' }}>
              {result.checklist.map((doc) => (
                <li key={doc}>{doc}</li>
              ))}
            </ul>
            {result.bottleneck && (
              <p style={{ color: 'var(--error)', marginTop: 'var(--space-4)' }}>{result.bottleneck}</p>
            )}
          </ResultCard>
        </ResultGate>
      )}
    </QuizShell>
  )
}

export const HongKongSetupSimulator: ComponentConfig<HongKongSetupSimulatorProps> = {
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
    eyebrow: 'Free simulator',
    title: 'See what happens from Day 1 to Day 18 setting up a Hong Kong company',
    description: 'Four quick questions, one personalized setup timeline.',
    gated: false,
  },
  render: (props) => <Tool {...props} />,
}
