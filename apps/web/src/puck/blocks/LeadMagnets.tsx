import type { ComponentConfig } from '@puckeditor/core'
import { ButtonLink, Eyebrow } from '@/components/ui'

export type LeadMagnetsProps = {
  eyebrow: string
  title: string
  description: string
  magnets: Array<{ label: string; title: string; description: string; url: string }>
}

export const LeadMagnets: ComponentConfig<LeadMagnetsProps> = {
  fields: {
    eyebrow: { type: 'text' },
    title: { type: 'text' },
    description: { type: 'textarea' },
    magnets: {
      type: 'array',
      arrayFields: {
        label: { type: 'text' },
        title: { type: 'text' },
        description: { type: 'textarea' },
        url: { type: 'text' },
      },
    },
  },
  defaultProps: { eyebrow: 'Free resources', title: '', description: '', magnets: [] },
  render: ({ eyebrow, title, description, magnets }) => (
    <section className="section">
      <div className="wrap">
        <div className="reveal max-w-lg" style={{ marginBottom: 'var(--space-12)' }}>
          <Eyebrow>{eyebrow}</Eyebrow>
          <h2>{title}</h2>
          {description && <p style={{ marginTop: 'var(--space-3)' }}>{description}</p>}
        </div>
        <div className="grid-2">
          {magnets.map((m, i) => (
            <div className="card reveal" key={i}>
              {m.label && (
                <span className="badge badge-accent" style={{ marginBottom: 'var(--space-3)' }}>
                  {m.label}
                </span>
              )}
              <h3>{m.title}</h3>
              <p style={{ marginTop: 'var(--space-2)' }}>{m.description}</p>
              <ButtonLink href={m.url} style={{ marginTop: 'var(--space-4)' }}>
                Get this →
              </ButtonLink>
            </div>
          ))}
        </div>
      </div>
    </section>
  ),
}
