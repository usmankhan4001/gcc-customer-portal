import { EMAIL_PALETTE, defineEmailBlock, escapeHtml, oneOf } from './shared'

export type EmailDividerProps = {
  style: 'solid' | 'dashed' | 'thick'
  color: 'border' | 'orange' | 'navy'
  inset: boolean
}

const COLORS = { border: EMAIL_PALETTE.border, orange: EMAIL_PALETTE.orange, navy: EMAIL_PALETTE.navy } as const

/**
 * A one-cell table with a top border rather than an `<hr>`: Outlook gives `<hr>`
 * its own uncontrollable margins and a 3D bevel, and several clients ignore
 * `border-style` on it entirely.
 */
export const EmailDivider = defineEmailBlock<EmailDividerProps>({
  label: 'Divider',
  fields: {
    style: {
      type: 'select',
      label: 'Style',
      options: [
        { label: 'Hairline', value: 'solid' },
        { label: 'Dashed', value: 'dashed' },
        { label: 'Thick', value: 'thick' },
      ],
    },
    color: {
      type: 'select',
      label: 'Colour',
      options: [
        { label: 'Light grey', value: 'border' },
        { label: 'Orange', value: 'orange' },
        { label: 'Navy', value: 'navy' },
      ],
    },
    inset: {
      type: 'radio',
      label: 'Inset from the edges',
      options: [
        { label: 'Yes', value: true },
        { label: 'No', value: false },
      ],
    },
  },
  defaults: { style: 'solid', color: 'border', inset: true },
  toHtml: (props) => {
    const style = oneOf(props.style, ['solid', 'dashed', 'thick'] as const, 'solid')
    const color = COLORS[oneOf(props.color, ['border', 'orange', 'navy'] as const, 'border')]
    const border = style === 'thick' ? '3px solid ' + color : style === 'dashed' ? '1px dashed ' + color : '1px solid ' + color
    const padding = props.inset === false ? '12px 0' : '12px 32px'
    return (
      '<table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="width:100%;border-collapse:collapse;">' +
      '<tr><td style="padding:' +
      escapeHtml(padding) +
      ';">' +
      '<table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="width:100%;border-collapse:collapse;">' +
      '<tr><td class="email-divider" style="font-size:0;line-height:0;height:1px;border-top:' +
      border +
      ';">&nbsp;</td></tr>' +
      '</table></td></tr></table>'
    )
  },
  // A rule is decoration, not content. Emitting one keeps the plain-text part
  // scannable where an HTML section break was intended.
  toText: () => '---',
})
