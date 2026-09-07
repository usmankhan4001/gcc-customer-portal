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
  type Align,
} from './shared'

export type EmailHeroProps = {
  eyebrow: string
  heading: string
  subheading: string
  buttonText: string
  buttonUrl: string
  imageUrl: string
  imageAlt: string
  theme: 'navy' | 'orange' | 'light' | 'white'
  align: Align
}

/** The four themes are colour pairs rather than free-form fields: a designer
 * picking their own hex is how an email ends up with black text on a black
 * background the first time a client forces dark mode. */
const THEMES = {
  navy: { bg: EMAIL_PALETTE.navy, heading: EMAIL_PALETTE.white, body: '#C7D2E4', eyebrow: EMAIL_PALETTE.orange },
  orange: { bg: EMAIL_PALETTE.orange, heading: EMAIL_PALETTE.white, body: '#FFE6D8', eyebrow: EMAIL_PALETTE.white },
  light: { bg: EMAIL_PALETTE.surfaceAlt, heading: EMAIL_PALETTE.text, body: EMAIL_PALETTE.textSecondary, eyebrow: EMAIL_PALETTE.orange },
  white: { bg: EMAIL_PALETTE.white, heading: EMAIL_PALETTE.text, body: EMAIL_PALETTE.textSecondary, eyebrow: EMAIL_PALETTE.orange },
} as const

export const EmailHero = defineEmailBlock<EmailHeroProps>({
  label: 'Hero',
  fields: {
    eyebrow: { type: 'text', label: 'Eyebrow' },
    heading: { type: 'text', label: 'Heading' },
    subheading: { type: 'textarea', label: 'Subheading' },
    buttonText: { type: 'text', label: 'Button text' },
    buttonUrl: { type: 'text', label: 'Button URL' },
    imageUrl: { type: 'text', label: 'Image URL (optional)' },
    imageAlt: { type: 'text', label: 'Image alt text' },
    theme: {
      type: 'select',
      label: 'Theme',
      options: [
        { label: 'Navy', value: 'navy' },
        { label: 'Orange', value: 'orange' },
        { label: 'Light grey', value: 'light' },
        { label: 'White', value: 'white' },
      ],
    },
    align: {
      type: 'select',
      label: 'Alignment',
      options: [
        { label: 'Left', value: 'left' },
        { label: 'Center', value: 'center' },
        { label: 'Right', value: 'right' },
      ],
    },
  },
  defaults: {
    eyebrow: 'GCC Startup',
    heading: 'Set up your company in the GCC',
    subheading: 'Company formation, banking and residency handled end to end by specialists on the ground.',
    buttonText: 'Book a free consultation',
    buttonUrl: 'https://gccstartup.com/contact',
    imageUrl: '',
    imageAlt: '',
    theme: 'navy',
    align: 'left',
  },
  toHtml: (props) => {
    const theme = THEMES[oneOf(props.theme, ['navy', 'orange', 'light', 'white'] as const, 'navy')]
    const align = oneOf(props.align, ['left', 'center', 'right'] as const, 'left')
    const eyebrow = str(props.eyebrow)
    const heading = str(props.heading)
    const subheading = str(props.subheading)
    const buttonText = str(props.buttonText)
    const imageUrl = safeUrl(props.imageUrl, '')

    const parts: string[] = []

    if (imageUrl) {
      parts.push(
        '<img src="' +
          escapeHtml(imageUrl) +
          '" alt="' +
          escapeHtml(str(props.imageAlt)) +
          '" width="536" style="display:block;width:100%;max-width:536px;height:auto;border:0;outline:none;text-decoration:none;border-radius:16px;margin:0 0 24px 0;" />',
      )
    }
    if (eyebrow) {
      parts.push(
        '<p style="margin:0 0 12px 0;font-family:' +
          EMAIL_FONT +
          ';font-size:13px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;color:' +
          theme.eyebrow +
          ';">' +
          inlineHtml(eyebrow) +
          '</p>',
      )
    }
    if (heading) {
      parts.push(
        '<h1 style="margin:0 0 14px 0;font-family:' +
          EMAIL_HEADING_FONT +
          ';font-size:30px;line-height:38px;font-weight:800;color:' +
          theme.heading +
          ';">' +
          inlineHtml(heading) +
          '</h1>',
      )
    }
    if (subheading) {
      parts.push(
        '<p style="margin:0 0 24px 0;font-family:' +
          EMAIL_FONT +
          ';font-size:16px;line-height:26px;color:' +
          theme.body +
          ';">' +
          inlineHtml(subheading) +
          '</p>',
      )
    }
    if (buttonText) {
      const onDark = theme.bg === EMAIL_PALETTE.navy || theme.bg === EMAIL_PALETTE.orange
      parts.push(
        buttonHtml({
          text: buttonText,
          url: str(props.buttonUrl),
          background: theme.bg === EMAIL_PALETTE.orange ? EMAIL_PALETTE.white : EMAIL_PALETTE.orange,
          color: theme.bg === EMAIL_PALETTE.orange ? EMAIL_PALETTE.orange : EMAIL_PALETTE.white,
          border: onDark && theme.bg === EMAIL_PALETTE.orange ? EMAIL_PALETTE.white : undefined,
        }),
      )
    }

    if (parts.length === 0) return ''

    // The button is a nested table, so it needs its own aligned wrapper cell
    // rather than inheriting `text-align` from the parent.
    const inner =
      '<table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="width:100%;border-collapse:collapse;">' +
      '<tr><td align="' +
      align +
      '" style="text-align:' +
      align +
      ';font-family:' +
      EMAIL_FONT +
      ';">' +
      parts.join('') +
      '</td></tr></table>'

    return (
      '<table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" bgcolor="' +
      theme.bg +
      '" style="width:100%;border-collapse:collapse;background-color:' +
      theme.bg +
      ';">' +
      '<tr><td style="padding:40px 32px;background-color:' +
      theme.bg +
      ';">' +
      inner +
      '</td></tr></table>'
    )
  },
  toText: (props) => {
    const buttonText = str(props.buttonText)
    const buttonUrl = safeUrl(props.buttonUrl, '')
    return textLines(
      str(props.eyebrow) ? inlineText(props.eyebrow).toUpperCase() : '',
      inlineText(props.heading),
      inlineText(props.subheading),
      buttonText && buttonUrl ? buttonText + ': ' + buttonUrl : buttonText,
    )
  },
})

