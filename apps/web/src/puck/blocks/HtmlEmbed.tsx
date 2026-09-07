import type { ComponentConfig } from '@puckeditor/core'
import { sanitizeEmbedHtml } from '@/lib/sanitize-html'

export type HtmlEmbedProps = { html: string }

export const HtmlEmbed: ComponentConfig<HtmlEmbedProps> = {
  fields: {
    html: { type: 'textarea' },
  },
  defaultProps: {
    html: '<!-- Paste any third-party HTML/embed snippet here -->',
  },
  render: ({ html }) => (
    <div className="wrap" style={{ padding: 'var(--space-8) 0' }} dangerouslySetInnerHTML={{ __html: sanitizeEmbedHtml(html) }} />
  ),
}
