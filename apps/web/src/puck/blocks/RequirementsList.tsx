import type { ComponentConfig } from '@puckeditor/core'
import { Check } from 'lucide-react'
import { Eyebrow } from '@/components/ui'

export type RequirementsListProps = {
  eyebrow: string
  title: string
  description: string
  requirements: Array<{ item: string }>
}

/** Puck-editable version of the checklist pattern used natively on country/pricing
 * pages ("documents you'll need" / "who this is for") — same `.req-grid`/`.req-item`
 * CSS, so any page composed in the editor can drop the identical pattern in. */
export const RequirementsList: ComponentConfig<RequirementsListProps> = {
  fields: {
    eyebrow: { type: 'text' },
    title: { type: 'text' },
    description: { type: 'textarea' },
    requirements: { type: 'array', arrayFields: { item: { type: 'text' } }, getItemSummary: (item) => item.item || 'Requirement' },
  },
  defaultProps: {
    eyebrow: 'What you\'ll need',
    title: 'Document requirements',
    description: '',
    requirements: [],
  },
  render: ({ eyebrow, title, description, requirements }) => (
    <section className="section">
      <div className="wrap-narrow">
        {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
        <h2>{title}</h2>
        {description && <p style={{ marginTop: 'var(--space-2)', color: 'var(--text-secondary)' }}>{description}</p>}
        {requirements?.length > 0 && (
          <ul className="req-grid reveal" style={{ marginTop: 'var(--space-6)', listStyle: 'none' }}>
            {requirements.map((r, i) => (
              <li key={i} className="req-item">
                <span className="req-ic">
                  <Check size={15} strokeWidth={3} color="var(--blue)" aria-hidden />
                </span>
                {r.item}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  ),
}
