import {
  EMAIL_FONT,
  EMAIL_PALETTE,
  defineEmailBlock,
  escapeHtml,
  inlineHtml,
  inlineText,
  oneOf,
  safeUrl,
  str,
  textLines,
} from './shared'

export type EmailQuoteProps = {
  quote: string
  attribution: string
  role: string
  avatarUrl: string
  theme: 'light' | 'navy'
}

export const EmailQuote = defineEmailBlock<EmailQuoteProps>({
  label: 'Quote',
  fields: {
    quote: { type: 'textarea', label: 'Quote' },
    attribution: { type: 'text', label: 'Attributed to' },
    role: { type: 'text', label: 'Role / company' },
    avatarUrl: { type: 'text', label: 'Avatar URL (optional)' },
    theme: {
      type: 'select',
      label: 'Theme',
      options: [
        { label: 'Light card', value: 'light' },
        { label: 'Navy card', value: 'navy' },
      ],
    },
  },
  defaults: {
    quote: 'They had our licence issued and a corporate account open inside five weeks.',
    attribution: 'Sarah Al Mansouri',
    role: 'Founder, Meridian Trading',
    avatarUrl: '',
    theme: 'light',
  },
  toHtml: (props) => {
    const quote = str(props.quote)
    if (!quote.trim()) return ''
    const theme = oneOf(props.theme, ['light', 'navy'] as const, 'light')
    const bg = theme === 'navy' ? EMAIL_PALETTE.navy : EMAIL_PALETTE.surfaceAlt
    const quoteColor = theme === 'navy' ? EMAIL_PALETTE.white : EMAIL_PALETTE.text
    const metaColor = theme === 'navy' ? '#C7D2E4' : EMAIL_PALETTE.textTertiary

    const attribution = str(props.attribution)
    const role = str(props.role)
    const avatar = safeUrl(props.avatarUrl, '')

    let meta = ''
    if (attribution || role) {
      const label =
        (attribution
          ? '<strong style="color:' + (theme === 'navy' ? EMAIL_PALETTE.white : EMAIL_PALETTE.text) + ';">' + escapeHtml(attribution) + '</strong>'
          : '') + (role ? (attribution ? '<br />' : '') + escapeHtml(role) : '')

      meta = avatar
        ? '<table role="presentation" border="0" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">' +
          '<tr><td valign="middle" width="48" style="width:48px;padding-right:12px;">' +
          '<img src="' +
          escapeHtml(avatar) +
          '" alt="' +
          escapeHtml(attribution || 'Photo') +
          '" width="48" height="48" style="display:block;width:48px;height:48px;border:0;border-radius:9999px;" />' +
          '</td><td valign="middle" style="font-family:' +
          EMAIL_FONT +
          ';font-size:14px;line-height:21px;color:' +
          metaColor +
          ';">' +
          label +
          '</td></tr></table>'
        : '<p style="margin:0;font-family:' +
          EMAIL_FONT +
          ';font-size:14px;line-height:21px;color:' +
          metaColor +
          ';">' +
          label +
          '</p>'
    }

    const inner =
      '<table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" bgcolor="' +
      bg +
      '" style="width:100%;border-collapse:collapse;background-color:' +
      bg +
      ';border-radius:16px;">' +
      '<tr><td style="padding:28px;border-left:4px solid ' +
      EMAIL_PALETTE.orange +
      ';border-radius:16px;background-color:' +
      bg +
      ';">' +
      '<p style="margin:0 0 16px 0;font-family:' +
      EMAIL_FONT +
      ';font-size:18px;line-height:29px;font-style:italic;color:' +
      quoteColor +
      ';">&ldquo;' +
      inlineHtml(quote) +
      '&rdquo;</p>' +
      meta +
      '</td></tr></table>'

    return (
      '<table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="width:100%;border-collapse:collapse;">' +
      '<tr><td style="padding:0 32px 24px 32px;">' +
      inner +
      '</td></tr></table>'
    )
  },
  toText: (props) => {
    const quote = inlineText(props.quote)
    if (!quote) return ''
    const attribution = inlineText(props.attribution)
    const role = inlineText(props.role)
    const credit = [attribution, role].filter((part) => part.length > 0).join(', ')
    return textLines('"' + quote + '"', credit ? '— ' + credit : '')
  },
})
