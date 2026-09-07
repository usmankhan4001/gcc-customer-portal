import type { Config } from '@puckeditor/core'
import { DEFAULT_RENDER_CONTEXT, EMAIL_BLOCKS, type EmailBlockName } from './email-blocks'

export type EmailProps = {
  [K in EmailBlockName]: Record<string, unknown>
}

const RAW_COMPONENTS = Object.fromEntries(
  (Object.entries(EMAIL_BLOCKS) as Array<[EmailBlockName, (typeof EMAIL_BLOCKS)[EmailBlockName]]>).map(([name, block]) => [
    name,
    {
      label: block.label,
      fields: block.fields,
      defaultProps: block.defaults,
      render: (props: Record<string, unknown>) => (
        <div
          style={{ width: '100%', background: '#F8FAFC', padding: '8px 0' }}
          dangerouslySetInnerHTML={{ __html: block.toHtml({ ...block.defaults, ...props }, DEFAULT_RENDER_CONTEXT) }}
        />
      ),
    },
  ]),
) as unknown as Config<EmailProps>['components']

export const emailConfig: Config<EmailProps> = {
  root: {
    render: ({ children }) => <div style={{ maxWidth: 640, margin: '0 auto' }}>{children}</div>,
  },
  components: RAW_COMPONENTS,
  categories: {
    content: {
      title: 'Content',
      components: ['EmailHero', 'EmailHeading', 'EmailText', 'EmailQuote', 'EmailCtaCard'],
    },
    buttons: { title: 'Buttons', components: ['EmailButton'] },
    media: { title: 'Images', components: ['EmailImage'] },
    layout: { title: 'Layout', components: ['EmailColumns', 'EmailDivider', 'EmailSpacer'] },
    footer: { title: 'Footer', components: ['EmailFooter'] },
  },
}

export default emailConfig
