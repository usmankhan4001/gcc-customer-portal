'use client'

import { useState, type FormEvent } from 'react'
import type { ComponentConfig } from '@puckeditor/core'
import { QuizShell, ResultGate, ResultCard } from '@/components/ui'

export type KycReadinessCheckerProps = {
  eyebrow: string
  title: string
  description: string
  /** Withhold the result until an email is given. Off by default — the tool
   * should prove its worth before asking. See components/ui/ResultGate.tsx. */
  gated: boolean
}

const CHECKS = [
  { key: 'passport', label: 'Passport is valid (6+ months remaining)' },
  { key: 'proofOfAddress', label: 'Proof of address ready (utility bill or bank statement)' },
  { key: 'businessDescription', label: 'Business description prepared' },
  { key: 'uboDeclaration', label: 'Beneficial ownership declaration ready' },
  { key: 'bankingReadiness', label: 'Banking verification documents ready' },
  { key: 'timelineReady', label: "Ready to register this month" },
]
const RESTRICTED_KEY = 'restrictedIndustry'

type Result = { outcome: string; missingCount: number }

function computeResult(checked: Record<string, boolean>): Result {
  if (checked[RESTRICTED_KEY]) {
    return { outcome: 'Not eligible', missingCount: 0 }
  }
  const missingCount = CHECKS.filter((c) => !checked[c.key]).length
  if (missingCount === 0) return { outcome: 'Ready now', missingCount }
  if (missingCount <= 2) return { outcome: 'Missing 1–2 documents', missingCount }
  return { outcome: 'Needs manual review', missingCount }
}

function Tool({ eyebrow, title, description, gated }: KycReadinessCheckerProps) {
  const [result, setResult] = useState<Result | null>(null)
  const [answers, setAnswers] = useState<Record<string, boolean> | null>(null)

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const data = new FormData(e.currentTarget)
    const checked: Record<string, boolean> = {}
    for (const c of CHECKS) checked[c.key] = data.get(c.key) === 'on'
    checked[RESTRICTED_KEY] = data.get(RESTRICTED_KEY) === 'on'
    setAnswers(checked)
    setResult(computeResult(checked))
  }

  function restart() {
    setAnswers(null)
    setResult(null)
  }

  return (
    <QuizShell eyebrow={eyebrow} title={title} description={description}>
      {!result && (
        <form onSubmit={onSubmit}>
          <div style={{ display: 'grid', gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
            {CHECKS.map((c) => (
              <label key={c.key} className="custom-checkbox-label">
                <input type="checkbox" name={c.key} className="custom-checkbox-input" />
                <span>{c.label}</span>
              </label>
            ))}
            <label className="custom-checkbox-label">
              <input type="checkbox" name={RESTRICTED_KEY} className="custom-checkbox-input" />
              <span>My business is in a restricted industry (gambling, crypto exchange, adult content, etc.)</span>
            </label>
          </div>
          <button type="submit" className="btn btn-primary w-full flex-center">
            Check my readiness
          </button>
        </form>
      )}
      {result && (
        <ResultGate gated={gated} toolSlug="kyc-readiness-checker" answers={{ ...answers, result }}>
          <ResultCard
            headline={result.outcome}
            subheadline={result.missingCount > 0 ? `${result.missingCount} item(s) still needed` : undefined}
            onRestart={restart}
          />
        </ResultGate>
      )}
    </QuizShell>
  )
}

export const KycReadinessChecker: ComponentConfig<KycReadinessCheckerProps> = {
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
    eyebrow: 'Free checklist',
    title: 'Check whether you are ready to register your company this month',
    description: 'Tick what you already have — get an instant readiness result.',
    gated: false,
  },
  render: (props) => <Tool {...props} />,
}
