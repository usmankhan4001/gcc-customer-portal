import type { ComponentConfig } from '@puckeditor/core'
import { ButtonLink, Eyebrow } from '@/components/ui'

export type ProcessStepsProps = {
  eyebrow: string
  title: string
  description: string
  steps: Array<{ title: string; description: string }>
  ctaText: string
  ctaLink: string
}

export const ProcessSteps: ComponentConfig<ProcessStepsProps> = {
  fields: {
    eyebrow: { type: 'text' },
    title: { type: 'text' },
    description: { type: 'textarea' },
    steps: { type: 'array', arrayFields: { title: { type: 'text' }, description: { type: 'textarea' } } },
    ctaText: { type: 'text' },
    ctaLink: { type: 'text' },
  },
  defaultProps: { eyebrow: 'How it works', title: '', description: '', steps: [], ctaText: '', ctaLink: '' },
  render: ({ eyebrow, title, description, steps, ctaText, ctaLink }) => (
    <section className="section" id="process">
      <div className="wrap" style={{ textAlign: 'center' }}>
        <div className="reveal max-w-lg" style={{ marginBottom: 'var(--space-12)' }}>
          <Eyebrow>{eyebrow}</Eyebrow>
          <h2>{title}</h2>
          {description && <p style={{ marginTop: 'var(--space-3)' }}>{description}</p>}
        </div>
        <div className="process-track reveal">
          {steps.map((s, i) => (
            <div className="process-step" key={i}>
              <div className="process-circle">{i + 1}</div>
              <div className="process-content">
                <h4>{s.title}</h4>
                <p style={{ marginTop: 'var(--space-1)' }}>{s.description}</p>
              </div>
            </div>
          ))}
        </div>
        {ctaText && (
          <ButtonLink href={ctaLink || '#lead-form'} style={{ marginTop: 'var(--space-12)' }}>
            {ctaText}
          </ButtonLink>
        )}
      </div>
    </section>
  ),
}
