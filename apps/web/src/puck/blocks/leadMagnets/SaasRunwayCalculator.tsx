'use client'

import { useState, type FormEvent } from 'react'
import type { ComponentConfig } from '@puckeditor/core'
import { QuizShell, ResultGate, ResultCard, Input } from '@/components/ui'

export type SaasRunwayCalculatorProps = {
  eyebrow: string
  title: string
  description: string
  /** Withhold the result until an email is given. Off by default — the tool
   * should prove its worth before asking. See components/ui/ResultGate.tsx. */
  gated: boolean
}

type Inputs = { mrr: number; burn: number; taxRate: number; targetRunway: number }
type Result = { taxDrag: number; runwayImpactMonths: number; jurisdiction: string; banking: string }

function computeResult(i: Inputs): Result {
  const yearlyRevenue = i.mrr * 12
  const taxDrag = Math.round(yearlyRevenue * (i.taxRate / 100))
  const runwayImpactMonths = i.burn > 0 ? Math.round((taxDrag / i.burn) * 10) / 10 : 0
  const jurisdiction = i.taxRate >= 20 ? 'Hong Kong or UAE Free Zone' : 'Bahrain or Singapore'
  const banking = 'Airwallex / Wise + Stripe'
  return { taxDrag, runwayImpactMonths, jurisdiction, banking }
}

function Tool({ eyebrow, title, description, gated }: SaasRunwayCalculatorProps) {
  const [inputs, setInputs] = useState<Inputs | null>(null)
  const [result, setResult] = useState<Result | null>(null)

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const data = Object.fromEntries(new FormData(e.currentTarget).entries())
    const i: Inputs = {
      mrr: Number(data.mrr) || 0,
      burn: Number(data.burn) || 0,
      taxRate: Number(data.taxRate) || 0,
      targetRunway: Number(data.targetRunway) || 0,
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
          <Input label="Monthly recurring revenue ($)" name="mrr" type="number" min={0} required placeholder="25000" />
          <Input label="Monthly burn ($)" name="burn" type="number" min={0} required placeholder="18000" />
          <Input label="Current tax exposure (%)" name="taxRate" type="number" min={0} max={100} required placeholder="25" />
          <Input label="Target runway (months)" name="targetRunway" type="number" min={0} placeholder="18" />
          <button
            type="submit"
            className="btn btn-primary w-full flex-center" style={{ marginTop: 'var(--space-2)' }}
          >
            Calculate my runway impact
          </button>
        </form>
      )}
      {result && (
        <ResultGate gated={gated} toolSlug="saas-runway-calculator" answers={{ ...inputs, result }}>
          <ResultCard
            headline={`${result.runwayImpactMonths} months of runway at risk`}
            subheadline={`$${result.taxDrag.toLocaleString()} estimated yearly tax drag`}
            tags={[`Suggested: ${result.jurisdiction}`, result.banking]}
            onRestart={restart}
          />
        </ResultGate>
      )}
    </QuizShell>
  )
}

export const SaasRunwayCalculator: ComponentConfig<SaasRunwayCalculatorProps> = {
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
    title: 'How many months of runway is your tax structure costing you?',
    description: 'Estimated figures, for planning purposes only.',
    gated: false,
  },
  render: (props) => <Tool {...props} />,
}
