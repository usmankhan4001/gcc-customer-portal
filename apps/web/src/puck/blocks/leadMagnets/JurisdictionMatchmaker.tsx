'use client'

import { useState } from 'react'
import type { ComponentConfig } from '@puckeditor/core'
import { QuizShell, ProgressBar, ResultGate, ResultCard, QuizBackButton, QuizOptionButton } from '@/components/ui'

export type JurisdictionMatchmakerProps = {
  eyebrow: string
  title: string
  description: string
  /** Withhold the result until an email is given. Off by default — the tool
   * should prove its worth before asking. See components/ui/ResultGate.tsx. */
  gated: boolean
}

const STEPS = [
  {
    key: 'business',
    question: 'What type of business is this for?',
    options: [
      { value: 'freelance', label: 'Freelancer / consultant' },
      { value: 'ecom', label: 'E-commerce' },
      { value: 'saas', label: 'SaaS' },
      { value: 'sme', label: 'Established SME' },
    ],
  },
  {
    key: 'banking',
    question: 'What banking do you need?',
    options: [
      { value: 'fintech', label: 'Fintech (Stripe/Airwallex/Wise)' },
      { value: 'local', label: 'Credible local bank' },
    ],
  },
  {
    key: 'privacy',
    question: 'How important is corporate privacy?',
    options: [
      { value: 'high', label: 'Very important — nominee preferred' },
      { value: 'low', label: 'Not a priority' },
    ],
  },
  {
    key: 'speed',
    question: 'How fast do you need to be operating?',
    options: [
      { value: 'fast', label: 'Days, not weeks' },
      { value: 'normal', label: 'A few weeks is fine' },
    ],
  },
]

type Answers = Record<string, string>
type Result = { structure: string; banking: string; privacy: string; speed: string; relocation: string; nextStep: string }

function computeResult(a: Answers): Result {
  if (a.privacy === 'high') {
    return {
      structure: 'Hong Kong company + Nominee UBO',
      banking: a.banking === 'local' ? 'Local HK bank' : 'Airwallex / Wise',
      privacy: 'Nominee UBO included',
      speed: a.speed === 'fast' ? '24–48 hours (shelf company)' : '17–18 days',
      relocation: 'No',
      nextStep: 'Free consultation',
    }
  }
  if (a.business === 'sme') {
    return {
      structure: 'Singapore company',
      banking: 'Local + fintech banking',
      privacy: 'Self UBO, nominee director available',
      speed: '2–3 weeks',
      relocation: 'No',
      nextStep: 'Free consultation',
    }
  }
  if (a.banking === 'local' && a.speed !== 'fast') {
    return {
      structure: 'UAE Free Zone company',
      banking: 'Local UAE banking',
      privacy: 'Self UBO',
      speed: '~30 days incl. Emirates ID',
      relocation: 'Optional — tax residency route available',
      nextStep: 'Free consultation',
    }
  }
  if (a.business === 'ecom' || a.banking === 'fintech') {
    return {
      structure: 'Bahrain company',
      banking: 'Local Gulf banking',
      privacy: 'Self UBO',
      speed: '2–3 weeks',
      relocation: 'Optional',
      nextStep: 'Free consultation',
    }
  }
  return {
    structure: 'Hong Kong company + fintech banking',
    banking: 'Airwallex / Wise',
    privacy: 'Nominee optional',
    speed: '17–18 days',
    relocation: 'No',
    nextStep: 'Free consultation',
  }
}

function ResultTable({ result }: { result: Result }) {
  const rows: [string, string][] = [
    ['Best structure', result.structure],
    ['Banking route', result.banking],
    ['Privacy route', result.privacy],
    ['Setup speed', result.speed],
    ['Relocation needed', result.relocation],
  ]
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
      <tbody>
        {rows.map(([label, value]) => (
          <tr key={label} style={{ borderBottom: '1px solid var(--border)' }}>
            <td style={{ padding: 'var(--space-2) 0', color: 'var(--text-tertiary)', fontSize: 14 }}>{label}</td>
            <td style={{ padding: 'var(--space-2) 0', fontWeight: 600, textAlign: 'right' }}>{value}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function Tool({ eyebrow, title, description, gated }: JurisdictionMatchmakerProps) {
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
          <ProgressBar step={step + 1} totalSteps={STEPS.length} label="Jurisdiction Matchmaker" />
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
        <ResultGate gated={gated} toolSlug="jurisdiction-matchmaker" answers={{ ...answers, result }}>
          <ResultCard headline={result.structure} onRestart={restart}>
            <ResultTable result={result} />
          </ResultCard>
        </ResultGate>
      )}
    </QuizShell>
  )
}

export const JurisdictionMatchmaker: ComponentConfig<JurisdictionMatchmakerProps> = {
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
    title: 'Hong Kong, Singapore, UAE, or Bahrain — which route fits your business?',
    description: 'Four quick questions, one clear recommendation.',
    gated: false,
  },
  render: (props) => <Tool {...props} />,
}
