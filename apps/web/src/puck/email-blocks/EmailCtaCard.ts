import {
  EMAIL_FONT,
  EMAIL_HEADING_FONT,
  EMAIL_PALETTE,
  buttonHtml,
  defineEmailBlock,
  escapeHtml,
  inlineHtml,
  inlineText,
  oneOf,
  safeUrl,
  str,
  textLines,
} from './shared'

export type EmailCtaCardProps = {
  eyebrow: string
  heading: string
  text: string
  buttonText: string
  buttonUrl: string
  footnote: string
  theme: 'orange' | 'navy' | 'light'
}

const THEMES = {
  orange: { bg: EMAIL_PALETTE.orangeLight, border: '#F9C9AC', heading: EMAIL_PALETTE.text, body: EMAIL_PALETTE.textSecondary },
  navy: { bg: EMAIL_PALETTE.navy, border: '#1C2A4D', heading: EMAIL_PALETTE.white, body: '#C7D2E4' },
  light: { bg: EMAIL_PALETTE.surfaceAlt, border: EMAIL_PALETTE.border, heading: EMAIL_PALETTE.text, body: EMAIL_PALETTE.textSecondary },
} as const

/** The mid-email conversion unit: a bordered card with one button and nothing
 * competing with it. Deliberately offers a single call to action. */
export const EmailCtaCard = defineEmailBlock<EmailCtaCardProps>({
  label: 'CTA card',
  fields: {
    eyebrow: { type: 'text', label: 'Eyebrow' },
    heading: { type: 'text', label: 'Heading' },
    text: { type: 'textarea', label: 'Supporting text' },
    buttonText: { type: 'text', label: 'Button label' },
    buttonUrl: { type: 'text', label: 'Button URL' },
    footnote: { type: 'text', label: 'Footnote under the button' },
    theme: {
      type: 'select',
      label: 'Theme',
      options: [
        { label: 'Orange tint', value: 'orange' },
        { label: 'Navy', value: 'navy' },
        { label: 'Light grey', value: 'light' },
      ],
    },
  },
  defaults: {
    eyebrow: 'Next step',
    heading: 'Talk to a formation specialist',
    text: 'A 20-minute call is usually enough to narrow it down to one jurisdiction.',
    buttonText: 'Book a free consultation',
    buttonUrl: 'https://gccstartup.com/contact',
    footnote: 'No obligation. No sales script.',
    theme: 'orange',
  },
  toHtml: (props) => {
    const heading = str(props.heading)
    const text = str(props.text)
    const buttonText = str(props.buttonText)
    if (!heading && !text && !buttonText) return ''

    const theme = THEMES[oneOf(props.theme, ['orange', 'navy', 'light'] as const, 'orange')]
    const parts: string[] = []

    const eyebrow = str(props.eyebrow)
    if (eyebrow) {
      parts.push(
        '<p style="margin:0 0 10px 0;font-family:' +
          EMAIL_FONT +
          ';font-size:12px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;color:' +
          EMAIL_PALETTE.orange +
          ';">' +
          inlineHtml(eyebrow) +
          '</p>',
      )
    }
    if (heading) {
      parts.push(
        '<h2 class="email-heading" style="margin:0 0 10px 0;font-family:' +
          EMAIL_HEADING_FONT +
          ';font-size:22px;line-height:30px;font-weight:800;color:' +
          theme.heading +
          ';">' +
          inlineHtml(heading) +
          '</h2>',
      )
    }
    if (text) {
      parts.push(
        '<p class="email-body" style="margin:0 0 20px 0;font-family:' +
          EMAIL_FONT +
          ';font-size:16px;line-height:26px;color:' +
          theme.body +
          ';">' +
          inlineHtml(text) +
          '</p>',
      )
    }
    if (buttonText) {
      parts.push(
        '<table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="width:100%;border-collapse:collapse;">' +
          '<tr><td align="center">' +
          buttonHtml({ text: buttonText, url: str(props.buttonUrl), background: EMAIL_PALETTE.orange, color: EMAIL_PALETTE.white }) +
          '</td></tr></table>',
      )
    }
    const footnote = str(props.footnote)
    if (footnote) {
      parts.push(
        '<p style="margin:14px 0 0 0;font-family:' +
          EMAIL_FONT +
          ';font-size:13px;line-height:20px;color:' +
          (theme.bg === EMAIL_PALETTE.navy ? '#8FA3C4' : EMAIL_PALETTE.textTertiary) +
          ';">' +
          escapeHtml(footnote) +
          '</p>',
      )
    }

    const card =
      '<table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" bgcolor="' +
      theme.bg +
      '" style="width:100%;border-collapse:collapse;background-color:' +
      theme.bg +
      ';border-radius:18px;">' +
      '<tr><td align="center" style="padding:32px 28px;text-align:center;border:1px solid ' +
      theme.border +
      ';border-radius:18px;background-color:' +
      theme.bg +
      ';">' +
      parts.join('') +
      '</td></tr></table>'

    return (
      '<table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="width:100%;border-collapse:collapse;">' +
      '<tr><td style="padding:8px 32px 24px 32px;">' +
      card +
      '</td></tr></table>'
    )
  },
  toText: (props) => {
    const buttonText = str(props.buttonText)
    const buttonUrl = safeUrl(props.buttonUrl, '')
    return textLines(
      str(props.eyebrow) ? inlineText(props.eyebrow).toUpperCase() : '',
      inlineText(props.heading),
      inlineText(props.text),
      buttonText && buttonUrl ? '-> ' + buttonText + ': ' + buttonUrl : buttonText ? '-> ' + buttonText : '',
      inlineText(props.footnote),
    )
  },
})
