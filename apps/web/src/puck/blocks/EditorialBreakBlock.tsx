import type { ComponentConfig } from '@puckeditor/core'
import { EditorialBreak } from '@/components/ui'

export type EditorialBreakBlockProps = {
  eyebrow: string
  statement: string
  emphasis: string
}

/** Puck-editable version of the v7 editorial break — one confident statement, no
 * card. `emphasis` is a substring of `statement` to highlight in orange; if it
 * doesn't match exactly, the whole statement just renders unhighlighted. */
export const EditorialBreakBlock: ComponentConfig<EditorialBreakBlockProps> = {
  fields: {
    eyebrow: { type: 'text' },
    statement: { type: 'textarea' },
    emphasis: { type: 'textarea' },
  },
  defaultProps: {
    eyebrow: 'Our position',
    statement:
      "Most formation services optimize for paperwork. We optimize for the time you get back — the gap between deciding to incorporate and actually operating.",
    emphasis: 'We optimize for the time you get back',
  },
  render: ({ eyebrow, statement, emphasis }) => {
    const parts = emphasis && statement.includes(emphasis) ? statement.split(emphasis) : null
    return (
      <EditorialBreak eyebrow={eyebrow}>
        {parts ? (
          <>
            {parts[0]}
            <em>{emphasis}</em>
            {parts[1]}
          </>
        ) : (
          statement
        )}
      </EditorialBreak>
    )
  },
}
