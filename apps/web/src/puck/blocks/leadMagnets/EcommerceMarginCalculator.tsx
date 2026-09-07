'use client'

import { useState, type FormEvent } from 'react'
import type { ComponentConfig } from '@puckeditor/core'
import { QuizShell, ResultGate, ResultCard, Input, Select } from '@/components/ui'

export type EcommerceMarginCalculatorProps = {
  eyebrow: string
  title: string
  description: string
  /** Withhold the result until an email is given. Off by default — the tool
   * should prove its worth before asking. See components/ui/ResultGate.tsx. */
  gated: boolean
}

type Inputs = {
  revenue: number
  productCost: number
  adSpend: number
  platformFees: number
  vatRate: number
  taxRate: number
  entity: string
}
type Result = { trueMargin: number; taxDrag: number; marginScore: string; nextStep: string }

function computeResult(i: Inputs): Result {
  const costs = i.productCost + i.adSpend + i.platformFees
  const grossMargin = Math.max(i.revenue - costs, 0)
  const vatCost = grossMargin * (i.vatRate / 100)
  const taxDrag = Math.round((grossMargin - vatCost) * (i.taxRate / 100))
  const trueMargin = Math.round(grossMargin - vatCost - taxDrag)
  const marginPct = i.revenue > 0 ? (trueMargin / i.revenue) * 100 : 0
  const marginScore = marginPct >= 25 ? 'Protected' : marginPct >= 10 ? 'At risk' : 'Critical'
  const nextStep =
    marginScore === 'Critical'
      ? 'Book a free e-commerce structure review'
      : marginScore === 'At risk'
        ? 'Consider a Hong Kong or UAE structure'
        : 'Your margin looks healthy — a review can still tighten payment/VAT friction'
  return { trueMargin, taxDrag, marginScore, nextStep }
}

function Tool({ eyebrow, title, description, gated }: EcommerceMarginCalculatorProps) {
  const [inputs, setInputs] = useState<Inputs | null>(null)
  const [result, setResult] = useState<Result | null>(null)

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const data = Object.fromEntries(new FormData(e.currentTarget).entries())
    const i: Inputs = {
      revenue: Number(data.revenue) || 0,
      productCost: Number(data.productCost) || 0,
      adSpend: Number(data.adSpend) || 0,
      platformFees: Number(data.platformFees) || 0,
      vatRate: Number(data.vatRate) || 0,
      taxRate: Number(data.taxRate) || 0,
      entity: String(data.entity ?? ''),
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
          <Input label="Monthly revenue ($)" name="revenue" type="number" min={0} required placeholder="30000" />
          <Input label="Product cost ($)" name="productCost" type="number" min={0} required placeholder="10000" />
          <Input label="Ad spend ($)" name="adSpend" type="number" min={0} required placeholder="6000" />
          <Input label="Platform + payment gateway fees ($)" name="platformFees" type="number" min={0} required placeholder="2500" />
          <Input label="VAT exposure (%)" name="vatRate" type="number" min={0} max={100} placeholder="20" />
          <Input label="Current domestic tax estimate (%)" name="taxRate" type="number" min={0} max={100} required placeholder="30" />
          <Select label="Current entity type" name="entity" defaultValue="">
            <option value="">Select…</option>
            <option>Sole trader</option>
            <option>Local LLC</option>
            <option>Offshore company</option>
            <option>None yet</option>
          </Select>
          <button
            type="submit"
            className="btn btn-primary w-full flex-center" style={{ marginTop: 'var(--space-2)' }}
          >
            Calculate my true margin
          </button>
        </form>
      )}
      {result && (
        <ResultGate gated={gated} toolSlug="ecommerce-margin-calculator" answers={{ ...inputs, result }}>
          <ResultCard
            headline={`$${result.trueMargin.toLocaleString()} true net margin`}
            subheadline={`$${result.taxDrag.toLocaleString()} estimated tax drag`}
            tags={[`Margin score: ${result.marginScore}`, result.nextStep]}
            onRestart={restart}
          />
        </ResultGate>
      )}
    </QuizShell>
  )
}

export const EcommerceMarginCalculator: ComponentConfig<EcommerceMarginCalculatorProps> = {
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
    title: 'Your product margin is not your real profit',
    description: 'Calculate what taxes, fees, and payment friction are actually taking.',
    gated: false,
  },
  render: (props) => <Tool {...props} />,
}
