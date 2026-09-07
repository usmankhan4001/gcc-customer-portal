import {
  EMAIL_FONT,
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
  type EmailRenderContext,
} from './shared'

export type EmailFooterLink = { label: string; url: string }

export type EmailFooterProps = {
  companyName: string
  address: string
  note: string
  links: EmailFooterLink[]
  showUnsubscribe: boolean
  unsubscribeText: string
  theme: 'light' | 'navy'
}

/**
 * The compliance block. The unsubscribe href is never authored in the CMS — it is
 * always the `unsubscribeUrl` renderEmail was given, because that value is a
 * per-recipient HMAC token for the bulk lane and a literal `{{unsubscribe_url}}`
 * merge tag for the campaign lane. Letting an editor type it would produce a link
 * that unsubscribes whoever generated the template.
 */
export const EmailFooter = defineEmailBlock<EmailFooterProps>({
  label: 'Footer',
  fields: {
    companyName: { type: 'text', label: 'Company name (blank uses the brand default)' },
    address: { type: 'text', label: 'Postal address (blank uses the brand default)' },
    note: { type: 'textarea', label: 'Why-you-got-this note' },
    links: {
      type: 'array',
      label: 'Footer links',
      arrayFields: {
        label: { type: 'text', label: 'Label' },
        url: { type: 'text', label: 'URL' },
      },
      getItemSummary: (item: Partial<EmailFooterLink>) => str(item?.label) || 'Link',
    },
    showUnsubscribe: {
      type: 'radio',
      label: 'Unsubscribe link',
      options: [
        { label: 'Show', value: true },
        { label: 'Hide (transactional only)', value: false },
      ],
    },
    unsubscribeText: { type: 'text', label: 'Unsubscribe link text' },
    theme: {
      type: 'select',
      label: 'Theme',
      options: [
        { label: 'Light', value: 'light' },
        { label: 'Navy', value: 'navy' },
      ],
    },
  },
  defaults: {
    companyName: '',
    address: '',
    note: 'You are receiving this because you asked us about setting up a company in the GCC.',
    links: [
      { label: 'Website', url: 'https://gccstartup.com' },
      { label: 'Contact', url: 'https://gccstartup.com/contact' },
    ],
    showUnsubscribe: true,
    unsubscribeText: 'Unsubscribe',
    theme: 'light',
  },
  toHtml: (props, ctx) => {
    const navy = str(props.theme) === 'navy'
    const bg = navy ? EMAIL_PALETTE.navy : EMAIL_PALETTE.surfaceAlt
    const color = navy ? '#8FA3C4' : EMAIL_PALETTE.textTertiary
    const linkColor = navy ? '#C7D2E4' : EMAIL_PALETTE.textSecondary

    const parts: string[] = []
    const brand = str(props.companyName) || ctx.brandName
    if (brand) {
      parts.push(
        '<p style="margin:0 0 8px 0;font-family:' +
          EMAIL_FONT +
          ';font-size:14px;font-weight:700;color:' +
          (navy ? EMAIL_PALETTE.white : EMAIL_PALETTE.text) +
          ';">' +
          escapeHtml(brand) +
          '</p>',
      )
    }

    const links = arr(props.links)
      .map((link) => {
        const label = str(link.label)
        if (!label) return ''
        return (
          '<a href="' +
          hrefAttr(link.url) +
          '" target="_blank" rel="noopener" style="color:' +
          linkColor +
          ';text-decoration:underline;">' +
          escapeHtml(label) +
          '</a>'
        )
      })
      .filter((link) => link.length > 0)

    if (links.length > 0) {
      parts.push(
        '<p style="margin:0 0 10px 0;font-family:' +
          EMAIL_FONT +
          ';font-size:13px;line-height:20px;color:' +
          color +
          ';">' +
          links.join(' &nbsp;&middot;&nbsp; ') +
          '</p>',
      )
    }

    const address = str(props.address) || ctx.brandAddress
    if (address) {
      parts.push(
        '<p style="margin:0 0 8px 0;font-family:' + EMAIL_FONT + ';font-size:12px;line-height:19px;color:' + color + ';">' + escapeHtml(address) + '</p>',
      )
    }

    const note = str(props.note)
    if (note) {
      parts.push(
        '<p style="margin:0 0 10px 0;font-family:' + EMAIL_FONT + ';font-size:12px;line-height:19px;color:' + color + ';">' + inlineHtml(note) + '</p>',
      )
    }

    const tail: string[] = []
    if (ctx.webVersionUrl) {
      tail.push(
        '<a href="' +
          hrefAttr(ctx.webVersionUrl) +
          '" target="_blank" rel="noopener" style="color:' +
          color +
          ';text-decoration:underline;">View in browser</a>',
      )
    }
    if (props.showUnsubscribe !== false && ctx.unsubscribeUrl) {
      tail.push(
        '<a href="' +
          hrefAttr(ctx.unsubscribeUrl) +
          '" target="_blank" rel="noopener" style="color:' +
          color +
          ';text-decoration:underline;">' +
          escapeHtml(str(props.unsubscribeText) || 'Unsubscribe') +
          '</a>',
      )
    }
    if (tail.length > 0) {
      parts.push(
        '<p style="margin:0;font-family:' +
          EMAIL_FONT +
          ';font-size:12px;line-height:19px;color:' +
          color +
          ';">' +
          tail.join(' &nbsp;&middot;&nbsp; ') +
          '</p>',
      )
    }

    if (parts.length === 0) return ''

    return (
      '<table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" bgcolor="' +
      bg +
      '" style="width:100%;border-collapse:collapse;background-color:' +
      bg +
      ';">' +
      '<tr><td align="center" style="padding:28px 32px;text-align:center;border-top:1px solid ' +
      (navy ? '#1C2A4D' : EMAIL_PALETTE.border) +
      ';background-color:' +
      bg +
      ';">' +
      parts.join('') +
      '</td></tr></table>'
    )
  },
  toText: (props, ctx) => {
    const links = arr(props.links)
      .map((link) => {
        const label = str(link.label)
        const url = safeUrl(link.url, '')
        return label && url ? label + ': ' + url : ''
      })
      .filter((line) => line.length > 0)

    return textLines(
      '---',
      str(props.companyName) || ctx.brandName,
      ...links,
      str(props.address) || ctx.brandAddress,
      inlineText(props.note),
      ctx.webVersionUrl ? 'View in browser: ' + ctx.webVersionUrl : '',
      props.showUnsubscribe !== false && ctx.unsubscribeUrl
        ? (str(props.unsubscribeText) || 'Unsubscribe') + ': ' + ctx.unsubscribeUrl
        : '',
    )
  },
})

/** Used by renderEmail when a document carries no EmailFooter of its own: no
 * marketing send may leave without an unsubscribe path, so one is appended. */
export function fallbackFooter(ctx: EmailRenderContext): { html: string; text: string } {
  const props = {
    companyName: '',
    address: '',
    note: '',
    links: [],
    showUnsubscribe: true,
    unsubscribeText: 'Unsubscribe',
    theme: 'light',
  } as unknown as Record<string, unknown>
  return { html: EmailFooter.toHtml(props, ctx), text: EmailFooter.toText(props, ctx) }
}
