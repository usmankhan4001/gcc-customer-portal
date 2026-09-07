import type { ComponentConfig } from '@puckeditor/core'
import Image from 'next/image'
import { ButtonLink, Eyebrow } from '@/components/ui'
import {
  styleFields,
  defaultStyleProps,
  type StyleProps,
  getSectionStyle,
  getSectionClassName,
  getContainerClassName,
} from '@/puck/fields/styleFields'
import { createMediaPickerField } from '@/components/admin/MediaPickerModal'

export type SubheroProps = {
  eyebrow: string
  title: string
  description: string
  image: string
  ctaText: string
  ctaLink: string
} & StyleProps

/** Secondary hero-style banner — lighter than the full-bleed PhotoHero, for a section
 * partway down a page rather than the top of it (e.g. introducing a new topic mid-page). */
export const Subhero: ComponentConfig<SubheroProps> = {
  fields: {
    eyebrow: { type: 'text' },
    title: { type: 'text' },
    description: { type: 'textarea' },
    image: createMediaPickerField('Subhero Image'),
    ctaText: { type: 'text' },
    ctaLink: { type: 'text' },
    ...styleFields,
  },
  defaultProps: {
    ...defaultStyleProps,
    eyebrow: '',
    title: '',
    description: '',
    image: '',
    ctaText: '',
    ctaLink: '#lead-form',
  },
  render: (props) => {
    const { eyebrow, title, description, image, ctaText, ctaLink, maxWidth } = props
    const sectionClass = getSectionClassName(props)
    const sectionStyle = getSectionStyle(props)
    const containerClass = getContainerClassName(maxWidth)

    return (
      <section className={sectionClass} style={sectionStyle}>
        <div className={`${containerClass} subhero-grid${image ? '' : ' no-image'}`}>
          <div>
            {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
            <h2>{title}</h2>
            {description && <p style={{ marginTop: 'var(--space-4)', color: 'var(--text-secondary)' }}>{description}</p>}
            {ctaText && (
              <ButtonLink href={ctaLink} style={{ marginTop: 'var(--space-6)' }}>
                {ctaText}
              </ButtonLink>
            )}
          </div>
          {image && (
            <div style={{ position: 'relative', minHeight: 280, borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
              <Image src={image} alt="" fill sizes="(min-width: 900px) 40vw, 100vw" quality={70} style={{ objectFit: 'cover' }} />
            </div>
          )}
        </div>
      </section>
    )
  },
}
