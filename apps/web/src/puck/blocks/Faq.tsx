import type { ComponentConfig } from '@puckeditor/core'
import { ButtonLink, Eyebrow } from '@/components/ui'
import {
  styleFields,
  defaultStyleProps,
  type StyleProps,
  getSectionStyle,
  getSectionClassName,
  getContainerClassName,
} from '@/puck/fields/styleFields'

export type FaqProps = {
  title: string
  contactTitle: string
  contactDescription: string
  contactButtonText: string
  contactButtonLink: string
  faqs: Array<{ q: string; a: string }>
} & StyleProps

function FaqItem({ q, a }: { q: string; a: string }) {
  return (
    <div className="card" style={{ marginBottom: 'var(--space-3)', padding: 'var(--space-4) var(--space-6)' }}>
      <style>{`summary::-webkit-details-marker{display:none}.faq-toggle{transition:transform .15s ease}details[open] .faq-toggle{transform:rotate(45deg)}`}</style>
      <details>
        <summary
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 'var(--space-4)',
            cursor: 'pointer',
            fontWeight: 700,
            color: 'var(--text)',
            listStyle: 'none',
          }}
        >
          <span>{q}</span>
          <span className="faq-toggle" aria-hidden style={{ color: 'var(--accent)', fontSize: 20, flexShrink: 0 }}>+</span>
        </summary>
        <p style={{ marginTop: 'var(--space-3)' }}>{a}</p>
      </details>
    </div>
  )
}

export const Faq: ComponentConfig<FaqProps> = {
  fields: {
    title: { type: 'text' },
    contactTitle: { type: 'text' },
    contactDescription: { type: 'textarea' },
    contactButtonText: { type: 'text' },
    contactButtonLink: { type: 'text' },
    faqs: { type: 'array', arrayFields: { q: { type: 'text' }, a: { type: 'textarea' } } },
    ...styleFields,
  },
  defaultProps: {
    ...defaultStyleProps,
    title: 'Common questions answered.',
    contactTitle: 'Still have questions?',
    contactDescription: 'WhatsApp us for a direct, honest answer. Most questions are resolved within a few hours.',
    contactButtonText: 'WhatsApp us now',
    contactButtonLink: 'https://wa.me/447868762416',
    faqs: [],
  },
  render: (props) => {
    const { title, contactTitle, contactDescription, contactButtonText, contactButtonLink, faqs, maxWidth } = props
    const sectionClass = getSectionClassName(props)
    const sectionStyle = getSectionStyle(props)
    const containerClass = getContainerClassName(maxWidth)

    return (
      <section className={sectionClass} style={sectionStyle} id="faq">
        <div className={`${containerClass} grid-2-split-rev`}>
          <div className="reveal">
            <Eyebrow>Questions</Eyebrow>
            <h2>{title}</h2>
            <div className="card" style={{ marginTop: 'var(--space-8)' }}>
              <h4>{contactTitle}</h4>
              <p style={{ marginTop: 'var(--space-2)' }}>{contactDescription}</p>
              {contactButtonText && (
                <ButtonLink href={contactButtonLink} style={{ marginTop: 'var(--space-4)' }}>
                  {contactButtonText}
                </ButtonLink>
              )}
            </div>
          </div>
          <div className="reveal">
            {faqs?.map((f, i) => (
              <FaqItem key={i} q={f.q} a={f.a} />
            ))}
          </div>
        </div>
      </section>
    )
  },
}
