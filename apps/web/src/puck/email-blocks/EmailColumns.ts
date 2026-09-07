import {
  EMAIL_FONT,
  EMAIL_HEADING_FONT,
  EMAIL_MAX_WIDTH,
  EMAIL_PALETTE,
  arr,
  defineEmailBlock,
  escapeHtml,
  hrefAttr,
  inlineHtml,
  inlineText,
  safeUrl,
  str,
  textLines,
} from './shared'

export type EmailColumn = {
  heading: string
  text: string
  imageUrl: string
  imageAlt: string
  linkText: string
  linkUrl: string
}

export type EmailColumnsProps = {
  columns: EmailColumn[]
}

const GUTTER = 16
const CONTENT_WIDTH = EMAIL_MAX_WIDTH - 64

/**
 * Two or three side-by-side cells built from real `<td>`s, because that is the
 * only multi-column construct every client agrees on. Mobile stacking is handled
 * by the `email-col` class in the document head: clients that honour a `<style>`
 * block get a single column under 480px, and the ones that strip it still see a
 * readable — if narrow — row rather than a broken layout.
 */
export const EmailColumns = defineEmailBlock<EmailColumnsProps>({
  label: 'Columns',
  fields: {
    columns: {
      type: 'array',
      label: 'Columns (2 or 3 works best)',
      arrayFields: {
        heading: { type: 'text', label: 'Heading' },
        text: { type: 'textarea', label: 'Text' },
        imageUrl: { type: 'text', label: 'Image URL (optional)' },
        imageAlt: { type: 'text', label: 'Image alt text' },
        linkText: { type: 'text', label: 'Link label (optional)' },
        linkUrl: { type: 'text', label: 'Link URL' },
      },
      getItemSummary: (item: Partial<EmailColumn>, index?: number) => str(item?.heading) || 'Column ' + ((index ?? 0) + 1),
    },
  },
  defaults: {
    columns: [
      { heading: 'Free zone', text: '100% foreign ownership and a fast licence.', imageUrl: '', imageAlt: '', linkText: '', linkUrl: '' },
      { heading: 'Mainland', text: 'Trade anywhere in the UAE with no agent needed.', imageUrl: '', imageAlt: '', linkText: '', linkUrl: '' },
    ],
  },
  toHtml: (props) => {
    const columns = arr(props.columns)
    if (columns.length === 0) return ''

    const count = Math.min(columns.length, 4)
    const cellWidth = Math.floor((CONTENT_WIDTH - GUTTER * (count - 1)) / count)

    const cells = columns
      .slice(0, count)
      .map((column, index) => {
        const parts: string[] = []
        const imageUrl = safeUrl(column.imageUrl, '')
        if (imageUrl) {
          parts.push(
            '<img src="' +
              escapeHtml(imageUrl) +
              '" alt="' +
              escapeHtml(str(column.imageAlt)) +
              '" width="' +
              cellWidth +
              '" style="display:block;width:100%;max-width:' +
              cellWidth +
              'px;height:auto;border:0;outline:none;text-decoration:none;border-radius:12px;margin:0 0 12px 0;" />',
          )
        }
        const heading = str(column.heading)
        if (heading) {
          parts.push(
            '<h3 class="email-heading" style="margin:0 0 8px 0;font-family:' +
              EMAIL_HEADING_FONT +
              ';font-size:17px;line-height:24px;font-weight:700;color:' +
              EMAIL_PALETTE.text +
              ';">' +
              inlineHtml(heading) +
              '</h3>',
          )
        }
        const text = str(column.text)
        if (text) {
          parts.push(
            '<p class="email-body" style="margin:0 0 10px 0;font-family:' +
              EMAIL_FONT +
              ';font-size:15px;line-height:23px;color:' +
              EMAIL_PALETTE.textSecondary +
              ';">' +
              inlineHtml(text) +
              '</p>',
          )
        }
        const linkText = str(column.linkText)
        if (linkText) {
          parts.push(
            '<a href="' +
              hrefAttr(column.linkUrl) +
              '" target="_blank" rel="noopener" style="font-family:' +
              EMAIL_FONT +
              ';font-size:15px;font-weight:700;color:' +
              EMAIL_PALETTE.orange +
              ';text-decoration:underline;">' +
              escapeHtml(linkText) +
              '</a>',
          )
        }
        if (parts.length === 0) return ''
        const paddingRight = index < count - 1 ? 'padding-right:' + GUTTER + 'px;' : ''
        return (
          '<td class="email-col" valign="top" width="' +
          cellWidth +
          '" style="width:' +
          cellWidth +
          'px;vertical-align:top;' +
          paddingRight +
          'font-family:' +
          EMAIL_FONT +
          ';">' +
          parts.join('') +
          '</td>'
        )
      })
      .filter((cell) => cell.length > 0)

    if (cells.length === 0) return ''

    return (
      '<table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="width:100%;border-collapse:collapse;">' +
      '<tr><td style="padding:0 32px 24px 32px;">' +
      '<table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="width:100%;border-collapse:collapse;">' +
      '<tr class="email-row">' +
      cells.join('') +
      '</tr></table></td></tr></table>'
    )
  },
  toText: (props) => {
    const columns = arr(props.columns)
    if (columns.length === 0) return ''
    return columns
      .map((column) => {
        const linkText = str(column.linkText)
        const linkUrl = safeUrl(column.linkUrl, '')
        return textLines(
          inlineText(column.heading),
          inlineText(column.text),
          linkText && linkUrl ? linkText + ': ' + linkUrl : linkText,
        )
      })
      .filter((block) => block.length > 0)
      .join('\n\n')
  },
})
