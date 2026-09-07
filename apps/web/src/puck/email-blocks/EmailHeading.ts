import {
  EMAIL_HEADING_FONT,
  EMAIL_PALETTE,
  alignField,
  blockTable,
  defineEmailBlock,
  inlineHtml,
  inlineText,
  oneOf,
  str,
  type Align,
} from './shared'

export type EmailHeadingProps = {
  text: string
  level: 'h1' | 'h2' | 'h3'
  align: Align
  color: 'ink' | 'orange' | 'navy' | 'muted'
}

const SIZES = {
  h1: { size: '28px', line: '36px', weight: '800', top: '8px', bottom: '14px' },
  h2: { size: '22px', line: '30px', weight: '700', top: '8px', bottom: '12px' },
  h3: { size: '18px', line: '26px', weight: '700', top: '8px', bottom: '10px' },
} as const

const COLORS = {
  ink: EMAIL_PALETTE.text,
  orange: EMAIL_PALETTE.orange,
  navy: EMAIL_PALETTE.navy,
  muted: EMAIL_PALETTE.textTertiary,
} as const

export const EmailHeading = defineEmailBlock<EmailHeadingProps>({
  label: 'Heading',
  fields: {
    text: { type: 'text', label: 'Text' },
    level: {
      type: 'select',
      label: 'Level',
      options: [
        { label: 'H1 — page title', value: 'h1' },
        { label: 'H2 — section', value: 'h2' },
        { label: 'H3 — subsection', value: 'h3' },
      ],
    },
    align: alignField,
    color: {
      type: 'select',
      label: 'Colour',
      options: [
        { label: 'Ink', value: 'ink' },
        { label: 'Orange', value: 'orange' },
        { label: 'Navy', value: 'navy' },
        { label: 'Muted', value: 'muted' },
      ],
    },
  },
  defaults: { text: 'A section heading', level: 'h2', align: 'left', color: 'ink' },
  toHtml: (props) => {
    const text = str(props.text)
    if (!text) return ''
    const level = oneOf(props.level, ['h1', 'h2', 'h3'] as const, 'h2')
    const align = oneOf(props.align, ['left', 'center', 'right'] as const, 'left')
    const color = COLORS[oneOf(props.color, ['ink', 'orange', 'navy', 'muted'] as const, 'ink')]
    const size = SIZES[level]
    const inner =
      '<' +
      level +
      ' class="email-heading" style="margin:' +
      size.top +
      ' 0 ' +
      size.bottom +
      ' 0;font-family:' +
      EMAIL_HEADING_FONT +
      ';font-size:' +
      size.size +
      ';line-height:' +
      size.line +
      ';font-weight:' +
      size.weight +
      ';color:' +
      color +
      ';text-align:' +
      align +
      ';">' +
      inlineHtml(text) +
      '</' +
      level +
      '>'
    return blockTable(inner, { padding: '0 32px', align })
  },
  toText: (props) => {
    const text = inlineText(props.text)
    if (!text) return ''
    // An underline is the only heading cue a text-only client has, and it is what
    // most plain-text readers already expect from a converted newsletter.
    const level = oneOf(props.level, ['h1', 'h2', 'h3'] as const, 'h2')
    if (level === 'h3') return text
    const rule = (level === 'h1' ? '=' : '-').repeat(Math.min(text.length, 60))
    return text + '\n' + rule
  },
})
