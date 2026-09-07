import type { ComponentConfig } from '@puckeditor/core'
import {
  styleFields,
  defaultStyleProps,
  type StyleProps,
  getSectionStyle,
  getSectionClassName,
  getContainerClassName,
} from '@/puck/fields/styleFields'
import { createRichTextField } from '@/components/admin/RichTextEditor'
import { sanitizeRichTextHtml } from '@/lib/sanitize-html'

export type RichTextProps = {
  headingLevel: 'none' | 'h2' | 'h3' | 'h4'
  heading: string
  body: string
  narrow?: boolean
} & StyleProps

/** Freeform text block — the single most-used primitive on any real page builder.
 * `body` is edited with a Ghost-style WYSIWYG (RichTextEditor) and stored as real HTML.
 *
 * Backward compatibility: pages built before this editor existed have `body` stored as
 * plain text with manual line breaks (the old textarea's format), not HTML — switching
 * straight to dangerouslySetInnerHTML would render that old content as one unbroken
 * paragraph. TipTap's output always starts with a block tag ("<p>", "<h2>", etc.), so
 * that's used as the format signal: HTML-looking body renders as HTML, anything else
 * falls back to the original manual paragraph/line-break splitting untouched. */
export const RichText: ComponentConfig<RichTextProps> = {
  fields: {
    headingLevel: {
      type: 'select',
      options: [
        { label: 'No heading', value: 'none' },
        { label: 'Heading 2', value: 'h2' },
        { label: 'Heading 3', value: 'h3' },
        { label: 'Heading 4', value: 'h4' },
      ],
    },
    heading: { type: 'text' },
    body: createRichTextField('Write your content…'),
    narrow: { type: 'radio', options: [{ label: 'Narrow column', value: true }, { label: 'Full width', value: false }] },
    ...styleFields,
  },
  defaultProps: {
    ...defaultStyleProps,
    maxWidth: 'narrow',
    headingLevel: 'h2',
    heading: '',
    body: '',
    narrow: true,
  },
  render: (props) => {
    const { headingLevel, heading, body, narrow, maxWidth } = props
    const HeadingTag = headingLevel === 'none' ? null : headingLevel
    const sectionClass = getSectionClassName(props)
    const sectionStyle = getSectionStyle(props)
    const containerClass = maxWidth ? getContainerClassName(maxWidth) : narrow ? 'wrap-narrow' : 'wrap'
    const isHtml = body?.trim().startsWith('<')

    return (
      <section className={sectionClass} style={sectionStyle}>
        <div className={containerClass}>
          {HeadingTag && heading && <HeadingTag>{heading}</HeadingTag>}
          {isHtml ? (
            <div className="prose" dangerouslySetInnerHTML={{ __html: sanitizeRichTextHtml(body) }} />
          ) : (
            body &&
            body.split(/\n{2,}/).map((para, i) => (
              <p key={i} style={{ marginTop: i === 0 && !(HeadingTag && heading) ? 0 : 'var(--space-4)' }}>
                {para.split('\n').map((line, j, arr) => (
                  <span key={j}>
                    {line}
                    {j < arr.length - 1 && <br />}
                  </span>
                ))}
              </p>
            ))
          )}
        </div>
      </section>
    )
  },
}
