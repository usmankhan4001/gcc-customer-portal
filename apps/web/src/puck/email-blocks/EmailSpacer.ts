import { defineEmailBlock, num } from './shared'

export type EmailSpacerProps = {
  height: number
}

/**
 * Vertical whitespace as a real cell with a height, not a margin. Outlook drops
 * margins on block elements and Gmail collapses empty cells, so the cell carries
 * `font-size:0;line-height:0` and a `&nbsp;` to keep it from being collapsed away.
 */
export const EmailSpacer = defineEmailBlock<EmailSpacerProps>({
  label: 'Spacer',
  fields: {
    height: {
      type: 'select',
      label: 'Height',
      options: [
        { label: 'Extra small — 8px', value: 8 },
        { label: 'Small — 16px', value: 16 },
        { label: 'Medium — 24px', value: 24 },
        { label: 'Large — 40px', value: 40 },
        { label: 'Extra large — 64px', value: 64 },
      ],
    },
  },
  defaults: { height: 24 },
  toHtml: (props) => {
    const height = Math.max(1, Math.min(200, Math.round(num(props.height, 24))))
    return (
      '<table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="width:100%;border-collapse:collapse;">' +
      '<tr><td height="' +
      height +
      '" style="height:' +
      height +
      'px;line-height:' +
      height +
      'px;font-size:0;">&nbsp;</td></tr></table>'
    )
  },
  // Blank lines are already how renderEmail joins blocks, so a spacer adds nothing
  // a text client can use.
  toText: () => '',
})
