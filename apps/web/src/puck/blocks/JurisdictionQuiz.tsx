'use client'

import { useState } from 'react'
import type { ComponentConfig } from '@puckeditor/core'
import { ButtonLink, Eyebrow, Flag, QuizBackButton, QuizOptionButton } from '@/components/ui'

export type JurisdictionQuizProps = {
  eyebrow: string
  title: string
  description: string
}

const goalOptions = [
  { value: 'tax', label: 'Legally reduce my tax bill' },
  { value: 'privacy', label: 'Full corporate privacy' },
  { value: 'banking', label: 'Credible international banking' },
  { value: 'relocate', label: 'Relocate and establish tax residency' },
]
const incomeOptions = [
  { value: 'digital', label: 'Digital services / consulting / freelance' },
  { value: 'ecom', label: 'E-commerce / Amazon FBA' },
  { value: 'biz', label: 'Established business / SME' },
  { value: 'invest', label: 'Investment or holding company' },
]
const travelOptions = [
  { value: 'remote', label: 'Prefer a fully remote setup' },
  { value: 'visit', label: 'Happy to travel for the right deal' },
]
const budgetOptions = [
  { value: 'basic', label: '$1,500 – $2,500' },
  { value: 'mid', label: '$2,500 – $5,000' },
  { value: 'prem', label: '$5,000 or more' },
]

type Result = { flagCode: string; name: string; rate: string; why: string; tags: string[] }

function computeResult(g: string, i: string, t: string): Result {
  if (g === 'relocate' || t === 'visit') {
    return {
      flagCode: 'ae',
      name: 'UAE Free Zone',
      rate: '9% tax / 0% on foreign income',
      why: 'Full personal tax residency, Emirates ID, family visas, and top-tier local banking. The complete package for entrepreneurs relocating to the Gulf.',
      tags: ['Tax residency', 'Emirates ID', 'Local banking', '~30 days'],
    }
  }
  if (g === 'privacy') {
    return {
      flagCode: 'hk',
      name: 'Hong Kong + Nominee UBO',
      rate: '0% + full privacy',
      why: 'Maximum privacy via our Nominee UBO service combined with a Hong Kong entity. You retain complete operational control while remaining entirely off the public record.',
      tags: ['Full privacy', 'Nominee UBO', 'Remote setup', '0% tax'],
    }
  }
  if (i === 'biz') {
    return {
      flagCode: 'sg',
      name: 'Singapore',
      rate: '5% corporate tax',
      why: 'Strong ASEAN credibility with nominee director included. The preferred structure for established businesses targeting Asian markets.',
      tags: ['ASEAN hub', 'Nominee director', 'Remote setup'],
    }
  }
  if (g === 'tax' && (i === 'ecom' || i === 'invest')) {
    return {
      flagCode: 'bh',
      name: 'Bahrain',
      rate: '0% corporate income tax',
      why: 'The most tax-efficient jurisdiction in the Gulf. 0% corporate income tax with credible local banking and personal tax residency options.',
      tags: ['0% tax', 'Gulf banking', 'Tax residency'],
    }
  }
  return {
    flagCode: 'hk',
    name: 'Hong Kong',
    rate: '0% tax on foreign income',
    why: 'The ideal structure for digital income earners who want fast, fully remote setup with fintech banking and full corporate privacy through a Nominee UBO.',
    tags: ['Remote setup', '17–18 days', 'Fintech banking', 'Nominee UBO available'],
  }
}

function Quiz({ eyebrow, title, description }: JurisdictionQuizProps) {
  const [step, setStep] = useState(1)
  const [answers, setAnswers] = useState<Record<number, string>>({})
  const [result, setResult] = useState<Result | null>(null)

  const options = [goalOptions, incomeOptions, travelOptions, budgetOptions][step - 1]

  function pick(value: string) {
    const next = { ...answers, [step]: value }
    setAnswers(next)
    if (step < 4) {
      setStep(step + 1)
    } else {
      setResult(computeResult(next[1], next[2], next[3]))
    }
  }

  function restart() {
    setAnswers({})
    setResult(null)
    setStep(1)
  }

  return (
    <section className="section" id="finder">
      <div className="wrap grid-2-split">
        <div className="reveal">
          <Eyebrow>{eyebrow}</Eyebrow>
          <h2>{title}</h2>
          {description && <p style={{ marginTop: 'var(--space-3)' }}>{description}</p>}
        </div>
        <div className="card reveal">
          {!result ? (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-3)', fontSize: 13, color: 'var(--text-tertiary)' }}>
                <span>Jurisdiction Matcher</span>
                <span>Step {step} of 4</span>
              </div>
              <div style={{ height: 4, background: 'var(--border)', borderRadius: 2, marginBottom: 'var(--space-6)' }}>
                <div style={{ height: '100%', width: `${(step / 4) * 100}%`, background: 'var(--accent)', borderRadius: 2, transition: 'width .2s ease' }} />
              </div>
              <div style={{ fontWeight: 700, marginBottom: 'var(--space-4)' }}>
                {step === 1 && 'What is your primary goal?'}
                {step === 2 && 'What type of income do you earn?'}
                {step === 3 && 'Can you travel to set up in person?'}
                {step === 4 && 'What is your budget?'}
              </div>
              <div style={{ display: 'grid', gap: 'var(--space-2)' }}>
                {options.map((opt) => (
                  <QuizOptionButton key={opt.value} onClick={() => pick(opt.value)}>
                    {opt.label}
                  </QuizOptionButton>
                ))}
              </div>
              {step > 1 && <QuizBackButton onClick={() => setStep(step - 1)} />}
            </>
          ) : (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                <Flag code={result.flagCode} size="lg" />
                <div>
                  <div style={{ fontWeight: 700, fontSize: 18 }}>{result.name}</div>
                  <div style={{ color: 'var(--accent)', fontSize: 14 }}>{result.rate}</div>
                </div>
              </div>
              <p style={{ marginTop: 'var(--space-4)' }}>{result.why}</p>
              <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap', marginTop: 'var(--space-4)' }}>
                {result.tags.map((tag) => (
                  <span key={tag} className="badge badge-info">
                    {tag}
                  </span>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 'var(--space-6)' }}>
                <ButtonLink href="#lead-form">Get started</ButtonLink>
                <button onClick={restart} style={{ all: 'unset', cursor: 'pointer', color: 'var(--text-tertiary)', fontSize: 14, padding: '14px 20px' }}>
                  Try again
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

export const JurisdictionQuiz: ComponentConfig<JurisdictionQuizProps> = {
  fields: {
    eyebrow: { type: 'text' },
    title: { type: 'text' },
    description: { type: 'textarea' },
  },
  defaultProps: {
    eyebrow: 'Free tool',
    title: 'Which jurisdiction is right for you?',
    description: 'Answer four questions and get an instant, personalized recommendation.',
  },
  render: (props) => <Quiz {...props} />,
}
