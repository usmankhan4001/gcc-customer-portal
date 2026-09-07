'use client'

import { useState } from 'react'
import type { ComponentConfig } from '@puckeditor/core'
import { QuizShell, ProgressBar, ResultGate, ResultCard, QuizBackButton, QuizOptionButton } from '@/components/ui'

export type CountryTaxPressureScorecardProps = {
  eyebrow: string
  title: string
  description: string
  /** Which country campaign this scorecard is for — swaps the headline copy only, same underlying quiz. */
  country: 'Netherlands' | 'Germany' | 'France' | 'UK' | 'Canada'
  /** Withhold the result until an email is given. Off by default — the tool
   * should prove its worth before asking. See components/ui/ResultGate.tsx. */
  gated: boolean
}

const STEPS = [
  {
    key: 'businessType',
    question: 'What type of business do you run?',
    options: [
      { value: 'freelance', label: 'Freelancer / consultant' },
      { value: 'ecom', label: 'E-commerce' },
      { value: 'sme', label: 'Established SME' },
    ],
  },
  {
    key: 'revenue',
    question: 'Monthly revenue range?',
    options: [
      { value: 'low', label: 'Under $5,000' },
      { value: 'mid', label: '$5,000 – $20,000' },
      { value: 'high', label: '$20,000+' },
    ],
  },
  {
    key: 'bankingFriction',
    question: 'Have you run into banking friction with international clients?',
    options: [
      { value: 'yes', label: 'Yes, regularly' },
      { value: 'no', label: 'Not really' },
    ],
  },
  {
    key: 'privacy',
    question: 'Is business privacy important to you?',
    options: [
      { value: 'yes', label: 'Yes' },
      { value: 'no', label: 'Not a priority' },
    ],
  },
]

type Answers = Record<string, string>
type Result = { taxPressure: string; structurePressure: string; bankingFriction: string; privacyNeed: string; bestFit: string }

function computeResult(a: Answers): Result {
  const revenuePoints: Record<string, number> = { low: 0, mid: 1, high: 2 }
  const points = (revenuePoints[a.revenue] ?? 0) + (a.businessType === 'sme' ? 1 : 0)
  const taxPressure = points >= 2 ? 'High' : points === 1 ? 'Moderate' : 'Low'
  const structurePressure = a.businessType === 'ecom' ? 'High — margin-sensitive' : a.businessType === 'sme' ? 'Moderate' : 'Low'
  const bankingFriction = a.bankingFriction === 'yes' ? 'High' : 'Low'
  const privacyNeed = a.privacy === 'yes' ? 'High' : 'Low'
  const bestFit = a.privacy === 'yes' ? 'Hong Kong + Nominee UBO' : taxPressure === 'High' ? 'UAE or Bahrain' : 'Hong Kong'
  return { taxPressure, structurePressure, bankingFriction, privacyNeed, bestFit }
}

function Tool({ eyebrow, title, description, country, gated }: CountryTaxPressureScorecardProps) {
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
    <QuizShell eyebrow={eyebrow} title={title.replace('{country}', country)} description={description}>
      {!result && (
        <>
          <ProgressBar step={step + 1} totalSteps={STEPS.length} label={`${country} Tax Pressure Score`} />
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
        <ResultGate gated={gated} toolSlug="country-tax-pressure-scorecard" answers={{ country, ...answers, result }}>
          <ResultCard
            headline={`${country} tax pressure: ${result.taxPressure}`}
            subheadline={`Best fit: ${result.bestFit}`}
            tags={[`Structure pressure: ${result.structurePressure}`, `Banking friction: ${result.bankingFriction}`, `Privacy need: ${result.privacyNeed}`]}
            onRestart={restart}
          />
        </ResultGate>
      )}
    </QuizShell>
  )
}

export const CountryTaxPressureScorecard: ComponentConfig<CountryTaxPressureScorecardProps> = {
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
    country: {
      type: 'select',
      options: [
        { label: 'Netherlands', value: 'Netherlands' },
        { label: 'Germany', value: 'Germany' },
        { label: 'France', value: 'France' },
        { label: 'UK', value: 'UK' },
        { label: 'Canada', value: 'Canada' },
      ],
    },
  },
  defaultProps: {
    eyebrow: 'Free scorecard',
    title: '{country} Entrepreneur Tax Pressure Score',
    description: 'Four quick questions, one instant tax pressure score.',
    country: 'Netherlands',
    gated: false,
  },
  render: (props) => <Tool {...props} />,
}
