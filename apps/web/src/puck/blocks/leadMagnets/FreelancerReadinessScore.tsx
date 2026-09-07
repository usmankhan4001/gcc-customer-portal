'use client'

import { useState } from 'react'
import type { ComponentConfig } from '@puckeditor/core'
import { QuizShell, ProgressBar, ResultGate, ResultCard, QuizBackButton, QuizOptionButton } from '@/components/ui'

export type FreelancerReadinessScoreProps = {
  eyebrow: string
  title: string
  description: string
  /** Withhold the result until an email is given. Off by default — the tool
   * should prove its worth before asking. See components/ui/ResultGate.tsx. */
  gated: boolean
}

const STEPS = [
  {
    key: 'income',
    question: 'What is your current monthly income?',
    options: [
      { value: 'low', label: 'Under $3,000' },
      { value: 'mid', label: '$3,000 – $8,000' },
      { value: 'high', label: '$8,000 – $20,000' },
      { value: 'vhigh', label: '$20,000+' },
    ],
  },
  {
    key: 'international',
    question: 'Do you invoice clients internationally?',
    options: [
      { value: 'yes', label: 'Yes' },
      { value: 'no', label: 'No, mostly local' },
    ],
  },
  {
    key: 'privacy',
    question: 'Do you want more privacy around your business ownership?',
    options: [
      { value: 'yes', label: 'Yes' },
      { value: 'no', label: 'Not important to me' },
    ],
  },
  {
    key: 'relocation',
    question: 'Are you considering relocating for tax residency?',
    options: [
      { value: 'yes', label: 'Yes' },
      { value: 'no', label: 'No, staying put' },
    ],
  },
]

type Answers = Record<string, string>
type Result = { score: number; outcome: string }

function computeResult(a: Answers): Result {
  const incomePoints: Record<string, number> = { low: 0, mid: 1, high: 2, vhigh: 3 }
  const score = (incomePoints[a.income] ?? 0) + (a.international === 'yes' ? 1 : 0) + (a.privacy === 'yes' ? 1 : 0) + (a.relocation === 'yes' ? 1 : 0)

  let outcome: string
  if (a.relocation === 'yes') outcome = 'Consider UAE/Bahrain residency'
  else if (a.privacy === 'yes' && score >= 2) outcome = 'Consider a nominee route'
  else if (score >= 5) outcome = 'Speak to an advisor'
  else if (score >= 2) outcome = 'Consider a company structure'
  else outcome = 'Stay freelancer for now'

  return { score, outcome }
}

function Tool({ eyebrow, title, description, gated }: FreelancerReadinessScoreProps) {
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
          <ProgressBar step={step + 1} totalSteps={STEPS.length} label="Freelancer Incorporation Readiness Score" />
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
        <ResultGate gated={gated} toolSlug="freelancer-readiness-score" answers={{ ...answers, result }}>
          <ResultCard headline={result.outcome} subheadline={`Readiness score: ${result.score}/6`} onRestart={restart} />
        </ResultGate>
      )}
    </QuizShell>
  )
}

export const FreelancerReadinessScore: ComponentConfig<FreelancerReadinessScoreProps> = {
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
    title: 'Have you outgrown freelancer tax treatment?',
    description: 'Four quick questions, one instant readiness score.',
    gated: false,
  },
  render: (props) => <Tool {...props} />,
}
