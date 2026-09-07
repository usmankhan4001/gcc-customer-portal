import type { ComponentConfig } from '@puckeditor/core'
import { ButtonLink } from '@/components/ui'

export type ButtonBlockProps = {
  text: string
  link: string
  variant: 'primary' | 'outline'
  shimmer: boolean
  align: 'left' | 'center' | 'right'
}

/** Single standalone CTA button — for when GlobalCta's full band is too heavy for
 * the moment (e.g. a quick "Learn more" mid-page). Reuses the same ButtonLink
 * primitive/CSS classes (btn/btn-primary/btn-outline/btn-shimmer) every other CTA
 * on the site already uses, so it never drifts from the validated button design. */
export const ButtonBlock: ComponentConfig<ButtonBlockProps> = {
  fields: {
    text: { type: 'text' },
    link: { type: 'text' },
    variant: {
      type: 'select',
      options: [
        { label: 'Primary', value: 'primary' },
        { label: 'Outline', value: 'outline' },
      ],
    },
    shimmer: { type: 'radio', options: [{ label: 'Yes', value: true }, { label: 'No', value: false }] },
    align: {
      type: 'select',
      options: [
        { label: 'Left', value: 'left' },
        { label: 'Center', value: 'center' },
        { label: 'Right', value: 'right' },
      ],
    },
  },
  defaultProps: {
    text: 'Get started',
    link: '#lead-form',
    variant: 'primary',
    shimmer: false,
    align: 'left',
  },
  render: ({ text, link, variant, shimmer, align }) => {
    if (!text) return <></>
    return (
      <section className="section">
        <div className="wrap" style={{ display: 'flex', justifyContent: align === 'center' ? 'center' : align === 'right' ? 'flex-end' : 'flex-start' }}>
          <ButtonLink href={link} variant={variant} shimmer={shimmer}>
            {text}
          </ButtonLink>
        </div>
      </section>
    )
  },
}
