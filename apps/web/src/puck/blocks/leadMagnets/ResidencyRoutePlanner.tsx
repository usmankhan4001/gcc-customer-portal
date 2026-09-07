'use client'

import { useState } from 'react'
import type { ComponentConfig } from '@puckeditor/core'
import { QuizShell, ProgressBar, ResultGate, ResultCard, QuizBackButton, QuizOptionButton } from '@/components/ui'

export type ResidencyRoutePlannerProps = {
  eyebrow: string
  title: string
  description: string
  /** Withhold the result until an email is given. Off by default — the tool
   * should prove its worth before asking. See components/ui/ResultGate.tsx. */
  gated: boolean
}

const STEPS = [
  {
    key: 'scope',
    question: 'Are you looking to structure your company only, or relocate personally too?',
    options: [
      { value: 'company', label: 'Company only' },
      { value: 'relocate', label: 'Relocate personally too' },
    ],
  },
  {
    key: 'family',
    question: 'Would family members need to relocate with you?',
    options: [
      { value: 'yes', label: 'Yes' },
      { value: 'no', label: 'No, just me' },
    ],
  },
  {
    key: 'presence',
    question: 'How many days a year could you realistically spend in the Gulf?',
    options: [
      { value: 'low', label: 'Under 90 days' },
      { value: 'mid', label: '90–183 days' },
      { value: 'high', label: '183+ days' },
    ],
  },
  {
    key: 'emiratesId',
    question: 'Do you need an Emirates ID / residence permit specifically?',
    options: [
      { value: 'yes', label: 'Yes' },
      { value: 'no', label: 'Not essential' },
    ],
  },
]

type Answers = Record<string, string>
type Result = { route: string; why: string }

function computeResult(a: Answers): Result {
  if (a.scope === 'company') {
    return {
      route: 'Company-only route',
      why: 'A company structure alone (Hong Kong, Singapore, UAE Free Zone, or Bahrain) covers your needs without a personal residency application.',
    }
  }
  if (a.emiratesId === 'yes' || a.family === 'yes' || a.presence === 'high') {
    return {
      route: 'UAE residency route',
      why: 'Family visas, Emirates ID, and strong local banking credibility make the UAE the most comprehensive option for full relocation.',
    }
  }
  if (a.presence === 'low') {
    return {
      route: 'Bahrain residency route',
      why: 'Bahrain residency has lighter physical-presence requirements while still giving you 0% corporate tax and credible local banking.',
    }
  }
  return {
    route: 'Manual advisory required',
    why: "Your situation has enough moving parts (presence, family, banking needs) that a tailored review will get you a more precise answer than a quiz can.",
  }
}

function Tool({ eyebrow, title, description, gated }: ResidencyRoutePlannerProps) {
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
          <ProgressBar step={step + 1} totalSteps={STEPS.length} label="UAE/Bahrain Residency Route Planner" />
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
        <ResultGate gated={gated} toolSlug="residency-route-planner" answers={{ ...answers, result }}>
          <ResultCard headline={result.route} onRestart={restart}>
            <p>{result.why}</p>
          </ResultCard>
        </ResultGate>
      )}
    </QuizShell>
  )
}

export const ResidencyRoutePlanner: ComponentConfig<ResidencyRoutePlannerProps> = {
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
    eyebrow: 'Free planner',
    title: 'Should you structure only your company — or your residency too?',
    description: 'Four quick questions to map your best route.',
    gated: false,
  },
  render: (props) => <Tool {...props} />,
}
