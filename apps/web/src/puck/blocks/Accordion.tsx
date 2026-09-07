'use client'

import { useState } from 'react'
import type { ComponentConfig } from '@puckeditor/core'
import { Eyebrow } from '@/components/ui'

export type AccordionProps = {
  eyebrow: string
  title: string
  items: Array<{ title: string; content: string }>
}

/** Generic expand/collapse list — same 'use client' + useState interaction pattern
 * as Faq.tsx's FaqItem, but deliberately un-styled toward "question/answer" so it
 * reads equally well for "what's included", "requirements", or any other
 * title+detail list. Faq stays as the dedicated FAQ+contact-card layout; this is
 * the reusable primitive underneath it. */
function AccordionItem({ title, content }: { title: string; content: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="card accordion-item">
      <button onClick={() => setOpen((o) => !o)} aria-expanded={open} className="accordion-trigger">
        <span>{title}</span>
        <span aria-hidden className="accordion-icon" style={{ flexShrink: 0 }}>{open ? '−' : '+'}</span>
      </button>
      {open && <p className="accordion-body">{content}</p>}
    </div>
  )
}

function AccordionRender({ eyebrow, title, items }: AccordionProps) {
  return (
    <section className="section">
      <div className="wrap-narrow">
        {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
        {title && <h2>{title}</h2>}
        <div style={{ marginTop: title || eyebrow ? 'var(--space-8)' : 0 }}>
          {items?.map((item, i) => (
            <AccordionItem key={i} title={item.title} content={item.content} />
          ))}
        </div>
      </div>
    </section>
  )
}

export const Accordion: ComponentConfig<AccordionProps> = {
  fields: {
    eyebrow: { type: 'text' },
    title: { type: 'text' },
    items: {
      type: 'array',
      arrayFields: { title: { type: 'text' }, content: { type: 'textarea' } },
      getItemSummary: (item) => item.title || 'Item',
    },
  },
  defaultProps: {
    eyebrow: '',
    title: '',
    items: [],
  },
  render: (props) => <AccordionRender {...props} />,
}
