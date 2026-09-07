import type { ComponentConfig } from '@puckeditor/core'
import Image from 'next/image'
import { ButtonLink } from '@/components/ui'
import {
  styleFields,
  defaultStyleProps,
  type StyleProps,
  getSectionStyle,
  getSectionClassName,
  getContainerClassName,
} from '@/puck/fields/styleFields'
import { createMediaPickerField } from '@/components/admin/MediaPickerModal'

export type ColumnsProps = {
  columnCount: '2' | '3'
  columns: Array<{ image: string; title: string; description: string; linkText: string; linkUrl: string }>
} & StyleProps

export const Columns: ComponentConfig<ColumnsProps> = {
  fields: {
    columnCount: {
      type: 'select',
      options: [
        { label: '2 columns', value: '2' },
        { label: '3 columns', value: '3' },
      ],
    },
    columns: {
      type: 'array',
      arrayFields: {
        image: createMediaPickerField('Column Image'),
        title: { type: 'text' },
        description: { type: 'textarea' },
        linkText: { type: 'text' },
        linkUrl: { type: 'text' },
      },
      getItemSummary: (item) => item.title || 'Column',
    },
    ...styleFields,
  },
  defaultProps: {
    ...defaultStyleProps,
    columnCount: '2',
    columns: [
      { image: '', title: '', description: '', linkText: '', linkUrl: '' },
      { image: '', title: '', description: '', linkText: '', linkUrl: '' },
    ],
  },
  render: (props) => {
    const { columnCount, columns, maxWidth } = props
    const sectionClass = getSectionClassName(props)
    const sectionStyle = getSectionStyle(props)
    const containerClass = getContainerClassName(maxWidth)

    return (
      <section className={sectionClass} style={sectionStyle}>
        <div className={`${containerClass} columns-grid columns-grid-${columnCount}`}>
          {columns?.map((col, i) => (
            <div key={i} className="columns-item">
              {col.image && (
                <div className="columns-item-image">
                  <Image src={col.image} alt={col.title || ''} fill sizes="(min-width: 900px) 33vw, 100vw" quality={70} style={{ objectFit: 'cover' }} />
                </div>
              )}
              {col.title && <h3>{col.title}</h3>}
              {col.description && <p style={{ marginTop: 'var(--space-2)' }}>{col.description}</p>}
              {col.linkText && (
                <ButtonLink href={col.linkUrl || '#'} variant="outline" style={{ marginTop: 'var(--space-4)' }}>
                  {col.linkText}
                </ButtonLink>
              )}
            </div>
          ))}
        </div>
      </section>
    )
  },
}
