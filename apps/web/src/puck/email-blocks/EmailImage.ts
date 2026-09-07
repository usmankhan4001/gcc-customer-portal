import {
  EMAIL_FONT,
  EMAIL_MAX_WIDTH,
  EMAIL_PALETTE,
  alignField,
  blockTable,
  defineEmailBlock,
  escapeHtml,
  hrefAttr,
  inlineText,
  num,
  oneOf,
  safeUrl,
  str,
  textLines,
  type Align,
} from './shared'

export type EmailImageProps = {
  src: string
  alt: string
  width: 'full' | 'bleed' | 'half' | 'custom'
  customWidth: number
  href: string
  caption: string
  align: Align
  rounded: boolean
}

/** Content column minus the 32px gutters the other blocks use. */
const CONTENT_WIDTH = EMAIL_MAX_WIDTH - 64

export const EmailImage = defineEmailBlock<EmailImageProps>({
  label: 'Image',
  fields: {
    src: { type: 'text', label: 'Image URL' },
    alt: { type: 'text', label: 'Alt text (required — many clients block images by default)' },
    width: {
      type: 'select',
      label: 'Width',
      options: [
        { label: 'Full content width', value: 'full' },
        { label: 'Edge to edge', value: 'bleed' },
        { label: 'Half width', value: 'half' },
        { label: 'Custom', value: 'custom' },
      ],
    },
    customWidth: { type: 'number', label: 'Custom width (px)' },
    href: { type: 'text', label: 'Link URL (optional)' },
    caption: { type: 'text', label: 'Caption (optional)' },
    align: alignField,
    rounded: {
      type: 'radio',
      label: 'Rounded corners',
      options: [
        { label: 'Yes', value: true },
        { label: 'No', value: false },
      ],
    },
  },
  defaults: { src: '', alt: '', width: 'full', customWidth: 320, href: '', caption: '', align: 'center', rounded: true },
  toHtml: (props) => {
    const src = safeUrl(props.src, '')
    if (!src) return ''
    const mode = oneOf(props.width, ['full', 'bleed', 'half', 'custom'] as const, 'full')
    const align = oneOf(props.align, ['left', 'center', 'right'] as const, 'center')
    const rounded = props.rounded === false ? '' : 'border-radius:14px;'
    const width =
      mode === 'bleed'
        ? EMAIL_MAX_WIDTH
        : mode === 'half'
          ? Math.round(CONTENT_WIDTH / 2)
          : mode === 'custom'
            ? Math.max(40, Math.min(EMAIL_MAX_WIDTH, Math.round(num(props.customWidth, CONTENT_WIDTH))))
            : CONTENT_WIDTH

    // `display:block` kills the descender gap Outlook and Gmail leave under an
    // inline image; `height:auto` is what lets the width attribute scale on mobile.
    let img =
      '<img src="' +
      escapeHtml(src) +
      '" alt="' +
      escapeHtml(str(props.alt)) +
      '" width="' +
      width +
      '" style="display:block;width:100%;max-width:' +
      width +
      'px;height:auto;border:0;outline:none;text-decoration:none;' +
      rounded +
      '" />'

    const href = safeUrl(props.href, '')
    if (href) img = '<a href="' + hrefAttr(href) + '" target="_blank" rel="noopener" style="text-decoration:none;">' + img + '</a>'

    const caption = str(props.caption)
    if (caption) {
      img +=
        '<p style="margin:10px 0 0 0;font-family:' +
        EMAIL_FONT +
        ';font-size:13px;line-height:20px;color:' +
        EMAIL_PALETTE.textTertiary +
        ';text-align:' +
        align +
        ';">' +
        escapeHtml(caption) +
        '</p>'
    }

    const wrapped =
      '<table role="presentation" border="0" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">' +
      '<tr><td align="' +
      align +
      '">' +
      img +
      '</td></tr></table>'

    return blockTable(wrapped, { padding: mode === 'bleed' ? '0' : '0 32px 24px 32px', align })
  },
  toText: (props) => {
    const src = safeUrl(props.src, '')
    if (!src) return ''
    const alt = inlineText(props.alt)
    const href = safeUrl(props.href, '')
    return textLines('[Image' + (alt ? ': ' + alt : '') + ']', href ? href : '', inlineText(props.caption))
  },
})
