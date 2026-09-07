'use client'

import { useState, type FormEvent } from 'react'
import type { ComponentConfig } from '@puckeditor/core'
import { QuizShell, ResultGate, ResultCard, Input, Select } from '@/components/ui'

export type TaxLeakageCalculatorProps = {
  eyebrow: string
  title: string
  description: string
  /** Withhold the result until an email is given. Off by default — the tool
   * should prove its worth before asking. See components/ui/ResultGate.tsx. */
  gated: boolean
}

type Inputs = { country: string; revenue: number; expenses: number; taxRate: number }
type Result = { yearlyLeakage: number; monthlyRetained: number; pressureScore: string; nextStep: string }

function computeResult(i: Inputs): Result {
  const monthlyProfit = Math.max(i.revenue - i.expenses, 0)
  const yearlyLeakage = Math.round(monthlyProfit * (i.taxRate / 100) * 12)
  const monthlyRetained = Math.round(monthlyProfit - monthlyProfit * (i.taxRate / 100))
  const pressureScore = i.taxRate >= 40 ? 'Very high' : i.taxRate >= 25 ? 'High' : i.taxRate >= 15 ? 'Moderate' : 'Low'
  const nextStep =
    i.taxRate >= 30
      ? 'Consider UAE or Bahrain tax residency'
      : i.taxRate >= 15
        ? 'Consider a Hong Kong or Singapore structure'
        : 'Stay local for now — speak to an advisor if this changes'
  return { yearlyLeakage, monthlyRetained, pressureScore, nextStep }
}

function Tool({ eyebrow, title, description, gated }: TaxLeakageCalculatorProps) {
  const [inputs, setInputs] = useState<Inputs | null>(null)
  const [result, setResult] = useState<Result | null>(null)

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const data = Object.fromEntries(new FormData(e.currentTarget).entries())
    const i: Inputs = {
      country: String(data.country ?? ''),
      revenue: Number(data.revenue) || 0,
      expenses: Number(data.expenses) || 0,
      taxRate: Number(data.taxRate) || 0,
    }
    setInputs(i)
    setResult(computeResult(i))
  }

  function restart() {
    setInputs(null)
    setResult(null)
  }

  return (
    <QuizShell eyebrow={eyebrow} title={title} description={description}>
      {!result && (
        <form onSubmit={onSubmit}>
          <Select label="Country of residence" name="country" defaultValue="">
            <option value="">Select…</option>
            <option>Netherlands</option>
            <option>Germany</option>
            <option>France</option>
            <option>UK</option>
            <option>Canada</option>
            <option>Other</option>
          </Select>
          <Input label="Monthly revenue ($)" name="revenue" type="number" min={0} required placeholder="10000" />
          <Input label="Monthly expenses ($)" name="expenses" type="number" min={0} required placeholder="3000" />
          <Input label="Estimated tax rate (%)" name="taxRate" type="number" min={0} max={100} required placeholder="35" />
          <button
            type="submit"
            className="btn btn-primary w-full flex-center" style={{ marginTop: 'var(--space-2)' }}
          >
            Calculate my leakage
          </button>
          <p style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 'var(--space-3)' }}>
            Estimated figures, for planning only — not tax advice.
          </p>
        </form>
      )}
      {result && (
        <ResultGate gated={gated} toolSlug="tax-leakage-calculator" answers={{ ...inputs, result }}>
          <ResultCard
            headline={`$${result.yearlyLeakage.toLocaleString()} estimated yearly tax leakage`}
            subheadline={`~$${result.monthlyRetained.toLocaleString()}/mo retained profit`}
            tags={[`Pressure: ${result.pressureScore}`, result.nextStep]}
            onRestart={restart}
          />
        </ResultGate>
      )}
    </QuizShell>
  )
}

export const TaxLeakageCalculator: ComponentConfig<TaxLeakageCalculatorProps> = {
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
    eyebrow: 'Free calculator',
    title: 'See how much your current structure may be costing you every year',
    description: 'Estimated figures, for planning purposes only.',
    gated: false,
  },
  render: (props) => <Tool {...props} />,
}
