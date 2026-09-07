import type { ComponentConfig } from '@puckeditor/core'
import Image from 'next/image'
import { Eyebrow } from '@/components/ui'

export type LogoCloudProps = {
  eyebrow: string
  title: string
  logos: Array<{ imageUrl: string; altText: string; linkUrl: string }>
}

/** "As seen on" / partner-logos strip — trust signal for a company-formation site.
 * Grayscale-by-default with hover-to-color is a common, cheap-to-implement pattern
 * (single CSS filter transition, no JS) so it's included rather than skipped. */
export const LogoCloud: ComponentConfig<LogoCloudProps> = {
  fields: {
    eyebrow: { type: 'text' },
    title: { type: 'text' },
    logos: {
      type: 'array',
      arrayFields: {
        imageUrl: { type: 'text' },
        altText: { type: 'text' },
        linkUrl: { type: 'text' },
      },
      getItemSummary: (item) => item.altText || 'Logo',
    },
  },
  defaultProps: {
    eyebrow: '',
    title: 'As seen on',
    logos: [],
  },
  render: ({ eyebrow, title, logos }) => (
    <section className="section">
      <div className="wrap" style={{ textAlign: 'center' }}>
        {(eyebrow || title) && (
          <div className="reveal" style={{ marginBottom: 'var(--space-8)' }}>
            {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
            {title && <h3>{title}</h3>}
          </div>
        )}
        {logos?.length > 0 && (
          <div className="logo-cloud-row reveal">
            {logos.map((logo, i) => {
              if (!logo.imageUrl) return null
              const img = (
                <span className="logo-cloud-frame">
                  <Image src={logo.imageUrl} alt={logo.altText || ''} fill sizes="160px" style={{ objectFit: 'contain' }} />
                </span>
              )
              return (
                <span className="logo-cloud-item" key={i}>
                  {logo.linkUrl ? (
                    <a href={logo.linkUrl} target="_blank" rel="noopener noreferrer" aria-label={logo.altText}>
                      {img}
                    </a>
                  ) : (
                    img
                  )}
                </span>
              )
            })}
          </div>
        )}
      </div>
    </section>
  ),
}
