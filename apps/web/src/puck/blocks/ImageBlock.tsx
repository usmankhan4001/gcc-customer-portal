import type { ComponentConfig } from '@puckeditor/core'
import Image from 'next/image'
import {
  styleFields,
  defaultStyleProps,
  type StyleProps,
  getSectionStyle,
  getSectionClassName,
  getContainerClassName,
} from '@/puck/fields/styleFields'
import { createMediaPickerField } from '@/components/admin/MediaPickerModal'

export type ImageBlockProps = {
  image: string
  alt: string
  caption: string
  link: string
  maxWidth?: 'narrow' | 'medium' | 'full'
} & StyleProps

/** Standalone image + optional caption/link — the plain "drop an image in" primitive. */
export const ImageBlock: ComponentConfig<ImageBlockProps> = {
  fields: {
    image: createMediaPickerField('Image Asset'),
    alt: { type: 'text' },
    caption: { type: 'text' },
    link: { type: 'text' },
    ...styleFields,
  },
  defaultProps: {
    ...defaultStyleProps,
    image: '',
    alt: '',
    caption: '',
    link: '',
    maxWidth: 'medium',
  },
  render: (props) => {
    const { image, alt, caption, link, maxWidth } = props
    if (!image) return <></>

    const sectionClass = getSectionClassName(props)
    const sectionStyle = getSectionStyle(props)
    const containerClass = getContainerClassName(maxWidth)

    const figure = (
      <figure className={`img-block img-block-${maxWidth || 'medium'}`}>
        <div className="img-block-frame">
          <Image src={image} alt={alt || ''} fill sizes="(min-width: 900px) 60vw, 100vw" quality={75} style={{ objectFit: 'cover' }} />
        </div>
        {caption && <figcaption className="img-block-caption">{caption}</figcaption>}
      </figure>
    )

    return (
      <section className={sectionClass} style={sectionStyle}>
        <div className={containerClass}>
          {link ? (
            <a href={link} className="img-block-link">
              {figure}
            </a>
          ) : (
            figure
          )}
        </div>
      </section>
    )
  },
}
