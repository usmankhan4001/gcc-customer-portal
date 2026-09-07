'use client'

import { useState } from 'react'
import type { ComponentConfig } from '@puckeditor/core'
import { QuizShell, ProgressBar, ResultGate, ResultCard, QuizBackButton, QuizOptionButton } from '@/components/ui'

export type NomineeUboDecisionToolProps = {
  eyebrow: string
  title: string
  description: string
  /** Withhold the result until an email is given. Off by default — the tool
   * should prove its worth before asking. See components/ui/ResultGate.tsx. */
  gated: boolean
}

const STEPS = [
  {
    key: 'visibility',
    question: 'Do you want your name visible on public-facing company documents?',
    options: [
      { value: 'yes', label: "Yes, that's fine" },
      { value: 'no', label: 'No, I want it private' },
    ],
  },
  {
    key: 'privacy',
    question: 'How important is stronger privacy to you?',
    options: [
      { value: 'high', label: 'Very important' },
      { value: 'low', label: 'Not a priority' },
    ],
  },
  {
    key: 'profile',
    question: 'Is your business or brand high-profile?',
    options: [
      { value: 'yes', label: 'Yes' },
      { value: 'no', label: 'No, fairly low-key' },
    ],
  },
  {
    key: 'understanding',
    question: 'Do you understand beneficial ownership (UBO) documentation requirements?',
    options: [
      { value: 'yes', label: 'Yes, I understand it' },
      { value: 'no', label: 'Not really' },
    ],
  },
]

type Answers = Record<string, string>
type Result = { outcome: string; why: string }

function computeResult(a: Answers): Result {
  if (a.visibility === 'no' || a.privacy === 'high') {
    if (a.profile === 'yes' && a.understanding === 'no') {
      return {
        outcome: 'Manual review required',
        why: 'High-profile businesses needing privacy usually need a tailored nominee structure — one of our advisors will review your case directly.',
      }
    }
    return {
      outcome: 'Nominee UBO recommended',
      why: 'You want privacy on public-facing documents while retaining full operational control. A Nominee UBO structure keeps you entirely off the public record.',
    }
  }
  return {
    outcome: 'Self UBO recommended',
    why: "You're comfortable being named as the beneficial owner, so a standard Self UBO structure is the simpler, faster, lower-cost route.",
  }
}

function Tool({ eyebrow, title, description, gated }: NomineeUboDecisionToolProps) {
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
          <ProgressBar step={step + 1} totalSteps={STEPS.length} label="Nominee vs Self UBO" />
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
        <ResultGate gated={gated} toolSlug="nominee-ubo-decision-tool" answers={{ ...answers, result }}>
          <ResultCard headline={result.outcome} onRestart={restart}>
            <p>{result.why}</p>
          </ResultCard>
        </ResultGate>
      )}
    </QuizShell>
  )
}

export const NomineeUboDecisionTool: ComponentConfig<NomineeUboDecisionToolProps> = {
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
    title: 'Should your name be on the company paperwork?',
    description: 'Four quick questions to see if Self UBO or Nominee UBO fits you better.',
    gated: false,
  },
  render: (props) => <Tool {...props} />,
}
