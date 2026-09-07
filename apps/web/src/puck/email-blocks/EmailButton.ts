import {
  EMAIL_PALETTE,
  alignField,
  blockTable,
  bool,
  buttonHtml,
  defineEmailBlock,
  oneOf,
  safeUrl,
  str,
  type Align,
} from './shared'

export type EmailButtonProps = {
  text: string
  url: string
  variant: 'primary' | 'dark' | 'outline'
  align: Align
  fullWidth: boolean
}

const VARIANTS = {
  primary: { background: EMAIL_PALETTE.orange, color: EMAIL_PALETTE.white, border: undefined as string | undefined },
  dark: { background: EMAIL_PALETTE.navy, color: EMAIL_PALETTE.white, border: undefined as string | undefined },
  outline: { background: EMAIL_PALETTE.white, color: EMAIL_PALETTE.navy, border: EMAIL_PALETTE.borderStrong as string | undefined },
} as const

export const EmailButton = defineEmailBlock<EmailButtonProps>({
  label: 'Button',
  fields: {
    text: { type: 'text', label: 'Label' },
    url: { type: 'text', label: 'URL' },
    variant: {
      type: 'select',
      label: 'Style',
      options: [
        { label: 'Primary (orange)', value: 'primary' },
        { label: 'Dark (navy)', value: 'dark' },
        { label: 'Outline', value: 'outline' },
      ],
    },
    align: alignField,
    fullWidth: {
      type: 'radio',
      label: 'Full width',
      options: [
        { label: 'No', value: false },
        { label: 'Yes', value: true },
      ],
    },
  },
  defaults: { text: 'Book a free consultation', url: 'https://gccstartup.com/contact', variant: 'primary', align: 'left', fullWidth: false },
  toHtml: (props) => {
    const text = str(props.text)
    if (!text) return ''
    const variant = VARIANTS[oneOf(props.variant, ['primary', 'dark', 'outline'] as const, 'primary')]
    const align = oneOf(props.align, ['left', 'center', 'right'] as const, 'left')
    const button = buttonHtml({
      text,
      url: str(props.url),
      background: variant.background,
      color: variant.color,
      border: variant.border,
      fullWidth: bool(props.fullWidth),
    })
    // A nested table ignores the parent cell's text-align, so the alignment has to
    // ride on an `align` attribute of the cell that directly contains it.
    return blockTable(button, { padding: '8px 32px 24px 32px', align })
  },
  toText: (props) => {
    const text = str(props.text)
    if (!text) return ''
    const url = safeUrl(props.url, '')
    return url ? '-> ' + text + ': ' + url : '-> ' + text
  },
})
