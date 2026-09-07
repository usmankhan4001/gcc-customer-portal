'use client'

import { useState } from 'react'
import type { ComponentConfig } from '@puckeditor/core'
import { QuizShell, ProgressBar, ResultGate, ResultCard, QuizBackButton, QuizOptionButton } from '@/components/ui'

export type ShelfCompanySpeedTestProps = {
  eyebrow: string
  title: string
  description: string
  /** Withhold the result until an email is given. Off by default — the tool
   * should prove its worth before asking. See components/ui/ResultGate.tsx. */
  gated: boolean
}

const STEPS = [
  {
    key: 'urgency',
    question: 'How soon do you need to be operating?',
    options: [
      { value: 'now', label: 'Within 48 hours' },
      { value: 'soon', label: 'Within 1–2 weeks' },
      { value: 'flexible', label: 'No rush' },
    ],
  },
  {
    key: 'accountAge',
    question: 'Does account/company age matter for your use case (e.g. marketplace approvals)?',
    options: [
      { value: 'yes', label: 'Yes, older is better' },
      { value: 'no', label: 'Not important' },
    ],
  },
  {
    key: 'kyc',
    question: 'Do you have your KYC documents ready right now?',
    options: [
      { value: 'yes', label: 'Yes, ready' },
      { value: 'no', label: 'Not yet' },
    ],
  },
  {
    key: 'budget',
    question: "What's your budget range?",
    options: [
      { value: 'low', label: 'Under $3,000' },
      { value: 'mid', label: '$3,000 – $6,000' },
      { value: 'high', label: '$6,000+' },
    ],
  },
]

type Answers = Record<string, string>
type Result = { outcome: string; why: string }

function computeResult(a: Answers): Result {
  if (a.kyc === 'no') {
    return {
      outcome: 'Needs manual review',
      why: 'A shelf company can move fast, but only once KYC documents are ready — get those together first and this becomes a same-week option.',
    }
  }
  if (a.urgency === 'now' && (a.accountAge === 'yes' || a.budget !== 'low')) {
    return {
      outcome: 'Shelf company may fit',
      why: 'Immediate access with existing account/banking history in as little as 24–48 hours, depending on the specific company\'s age and transaction record.',
    }
  }
  if (a.urgency === 'flexible') {
    return {
      outcome: 'New company better',
      why: 'With no urgency, a freshly registered company is simpler, cheaper, and gives you a clean history from day one.',
    }
  }
  return {
    outcome: 'Shelf company may fit',
    why: 'Your timeline and requirements line up well with a ready-made company — final fit depends on which shelf entities are currently available.',
  }
}

function Tool({ eyebrow, title, description, gated }: ShelfCompanySpeedTestProps) {
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
          <ProgressBar step={step + 1} totalSteps={STEPS.length} label="Shelf Company Speed Test" />
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
        <ResultGate gated={gated} toolSlug="shelf-company-speed-test" answers={{ ...answers, result }}>
          <ResultCard headline={result.outcome} onRestart={restart}>
            <p>{result.why}</p>
          </ResultCard>
        </ResultGate>
      )}
    </QuizShell>
  )
}

export const ShelfCompanySpeedTest: ComponentConfig<ShelfCompanySpeedTestProps> = {
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
    eyebrow: 'Free eligibility check',
    title: 'Do you qualify for a ready-made company with existing banking?',
    description: 'Four quick questions, one instant answer.',
    gated: false,
  },
  render: (props) => <Tool {...props} />,
}
