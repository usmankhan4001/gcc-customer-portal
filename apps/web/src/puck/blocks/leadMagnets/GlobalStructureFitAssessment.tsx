'use client'

import { useState } from 'react'
import type { ComponentConfig } from '@puckeditor/core'
import { QuizShell, ProgressBar, ResultGate, ResultCard, QuizBackButton, QuizOptionButton } from '@/components/ui'

export type GlobalStructureFitAssessmentProps = {
  eyebrow: string
  title: string
  description: string
  /** Withhold the result until an email is given. Off by default — the tool
   * should prove its worth before asking. See components/ui/ResultGate.tsx. */
  gated: boolean
}

const STEPS = [
  {
    key: 'residence',
    question: 'Where do you currently live?',
    options: [
      { value: 'nl', label: 'Netherlands' },
      { value: 'de', label: 'Germany' },
      { value: 'uk', label: 'UK' },
      { value: 'ca', label: 'Canada' },
      { value: 'other', label: 'Elsewhere' },
    ],
  },
  {
    key: 'business',
    question: 'What type of business do you run?',
    options: [
      { value: 'freelance', label: 'Freelancer / consultant' },
      { value: 'ecom', label: 'E-commerce' },
      { value: 'saas', label: 'SaaS / tech' },
      { value: 'agency', label: 'Agency / B2B services' },
      { value: 'sme', label: 'Established SME' },
    ],
  },
  {
    key: 'revenue',
    question: 'Monthly revenue range?',
    options: [
      { value: 'low', label: 'Under $5,000' },
      { value: 'mid', label: '$5,000 – $20,000' },
      { value: 'high', label: '$20,000 – $50,000' },
      { value: 'vhigh', label: '$50,000+' },
    ],
  },
  {
    key: 'clients',
    question: 'Where are your clients/customers located?',
    options: [
      { value: 'us', label: 'United States' },
      { value: 'eu', label: 'Europe' },
      { value: 'asia', label: 'Asia' },
      { value: 'global', label: 'Global / mixed' },
    ],
  },
  {
    key: 'banking',
    question: 'Do you need fintech banking (Stripe, PayPal, Airwallex, Wise) or local banking?',
    options: [
      { value: 'fintech', label: 'Fintech banking' },
      { value: 'local', label: 'Local bank credibility' },
      { value: 'both', label: 'Both' },
    ],
  },
  {
    key: 'priority',
    question: 'What matters most right now?',
    options: [
      { value: 'privacy', label: 'Privacy / nominee support' },
      { value: 'relocate', label: 'Relocating & tax residency' },
      { value: 'speed', label: 'Fastest possible setup' },
      { value: 'efficiency', label: 'Lowest tax, no relocation' },
    ],
  },
]

type Answers = Record<string, string>
type Result = { jurisdiction: string; route: string; timeline: string; banking: string; complianceScore: string }

function computeResult(a: Answers): Result {
  if (a.priority === 'relocate') {
    return {
      jurisdiction: 'UAE Free Zone',
      route: 'Tax Residency',
      timeline: '~30 days incl. Emirates ID',
      banking: 'Local UAE banking',
      complianceScore: 'Ready — standard KYC applies',
    }
  }
  if (a.priority === 'privacy') {
    return {
      jurisdiction: 'Hong Kong',
      route: 'Nominee UBO',
      timeline: '17–18 days',
      banking: a.banking === 'local' ? 'Local HK bank' : 'Airwallex / Wise',
      complianceScore: 'Ready — nominee documentation required',
    }
  }
  if (a.priority === 'speed') {
    return {
      jurisdiction: 'Hong Kong',
      route: 'Shelf Company',
      timeline: '24–48 hours',
      banking: 'Airwallex / Wise',
      complianceScore: 'Fast-track — existing banking history',
    }
  }
  if (a.business === 'sme' || a.revenue === 'vhigh') {
    return {
      jurisdiction: 'Singapore',
      route: 'Self UBO',
      timeline: '2–3 weeks',
      banking: 'Local + fintech banking',
      complianceScore: 'Ready — standard KYC applies',
    }
  }
  if (a.clients === 'eu' || ['nl', 'de', 'uk'].includes(a.residence)) {
    return {
      jurisdiction: 'Bahrain',
      route: 'Self UBO',
      timeline: '2–3 weeks',
      banking: 'Local Gulf banking',
      complianceScore: 'Ready — standard KYC applies',
    }
  }
  return {
    jurisdiction: 'Hong Kong',
    route: 'Self UBO',
    timeline: '17–18 days',
    banking: 'Airwallex / Wise',
    complianceScore: 'Ready — standard KYC applies',
  }
}

function Tool({ eyebrow, title, description, gated }: GlobalStructureFitAssessmentProps) {
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
          <ProgressBar step={step + 1} totalSteps={STEPS.length} label="Global Structure Fit Assessment" />
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
        <ResultGate gated={gated} toolSlug="global-structure-fit-assessment" answers={{ ...answers, result }}>
          <ResultCard
            headline={result.jurisdiction}
            subheadline={result.route}
            tags={[result.timeline, result.banking, result.complianceScore]}
            onRestart={restart}
          />
        </ResultGate>
      )}
    </QuizShell>
  )
}

export const GlobalStructureFitAssessment: ComponentConfig<GlobalStructureFitAssessmentProps> = {
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
    eyebrow: 'Free tool',
    title: 'Find the best jurisdiction for your online business in 3 minutes',
    description: 'Answer a few quick questions and get an instant, personalized recommendation.',
    gated: false,
  },
  render: (props) => <Tool {...props} />,
}
