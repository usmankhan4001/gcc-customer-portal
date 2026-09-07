import {
  EMAIL_FONT,
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

export type EmailTextProps = {
  text: string
  size: 'sm' | 'md' | 'lg'
  align: Align
  color: 'body' | 'ink' | 'muted'
}

const SIZES = { sm: { size: '14px', line: '22px' }, md: { size: '16px', line: '26px' }, lg: { size: '18px', line: '30px' } } as const
const COLORS = { body: EMAIL_PALETTE.textSecondary, ink: EMAIL_PALETTE.text, muted: EMAIL_PALETTE.textTertiary } as const

export const EmailText = defineEmailBlock<EmailTextProps>({
  label: 'Paragraph',
  fields: {
    text: {
      type: 'textarea',
      label: 'Text — **bold**, *italic*, [label](https://url) and {{merge_tags}} are supported',
    },
    size: {
      type: 'select',
      label: 'Size',
      options: [
        { label: 'Small', value: 'sm' },
        { label: 'Medium', value: 'md' },
        { label: 'Large', value: 'lg' },
      ],
    },
    align: alignField,
    color: {
      type: 'select',
      label: 'Colour',
      options: [
        { label: 'Body', value: 'body' },
        { label: 'Ink', value: 'ink' },
        { label: 'Muted', value: 'muted' },
      ],
    },
  },
  defaults: {
    text: 'Hi {{firstname}},\n\nThanks for getting in touch. Here is what happens next.',
    size: 'md',
    align: 'left',
    color: 'body',
  },
  toHtml: (props) => {
    const raw = str(props.text)
    if (!raw.trim()) return ''
    const { size, line } = SIZES[oneOf(props.size, ['sm', 'md', 'lg'] as const, 'md')]
    const align = oneOf(props.align, ['left', 'center', 'right'] as const, 'left')
    const color = COLORS[oneOf(props.color, ['body', 'ink', 'muted'] as const, 'body')]

    // A blank line starts a new <p>; single newlines stay <br /> inside one, which
    // is what inlineHtml already does. Separate paragraphs beat stacked <br />s
    // because margin collapsing is unreliable across clients.
    const paragraphs = raw
      .split(/\r?\n\s*\r?\n/)
      .map((chunk) => chunk.trim())
      .filter((chunk) => chunk.length > 0)

    const inner = paragraphs
      .map(
        (chunk) =>
          '<p class="email-body" style="margin:0 0 16px 0;font-family:' +
          EMAIL_FONT +
          ';font-size:' +
          size +
          ';line-height:' +
          line +
          ';color:' +
          color +
          ';text-align:' +
          align +
          ';">' +
          inlineHtml(chunk) +
          '</p>',
      )
      .join('')

    return blockTable(inner, { padding: '0 32px', align })
  },
  toText: (props) => {
    const raw = str(props.text)
    if (!raw.trim()) return ''
    return raw
      .split(/\r?\n\s*\r?\n/)
      .map((chunk) => inlineText(chunk))
      .filter((chunk) => chunk.length > 0)
      .join('\n\n')
  },
})
