import type { ComponentConfig } from '@puckeditor/core'
import { QuotePhotoCard } from '@/components/ui'

export type QuotePhotoCardBlockProps = {
  quote: string
  cite: string
  statValue: string
  statLabel: string
}

/** Puck-editable version of the v7 featured-testimonial card. Defaults are
 * deliberately instructional placeholders, not a plausible-sounding fake quote —
 * this block should stay empty/obviously-a-placeholder until an editor enters a
 * real client quote. */
export const QuotePhotoCardBlock: ComponentConfig<QuotePhotoCardBlockProps> = {
  fields: {
    quote: { type: 'textarea' },
    cite: { type: 'text' },
    statValue: { type: 'text' },
    statLabel: { type: 'text' },
  },
  defaultProps: {
    quote: 'Enter a real, approved client quote here — do not leave placeholder text live.',
    cite: 'Client name, role — pending',
    statValue: '—',
    statLabel: 'Proof metric (e.g. setup time)',
  },
  render: ({ quote, cite, statValue, statLabel }) => (
    <section className="section">
      <div className="wrap">
        <QuotePhotoCard quote={quote} cite={cite} statValue={statValue} statLabel={statLabel} />
      </div>
    </section>
  ),
}
