import type { ComponentConfig } from '@puckeditor/core'

export type TableOfContentsProps = {
  title: string
  items: Array<{ label: string; anchorId: string }>
}

/** For long blog posts. LIMITATION: Puck blocks render standalone and have no access
 * to the actual rendered heading structure of the surrounding post content at edit
 * time (that content is separate markdown/rich-text on `PostItem.content`, not
 * something a Puck block can introspect) — so this can't auto-generate from
 * headings the way a client-side rehype/remark plugin could. Instead the editor
 * manually lists {label, anchorId} pairs, and is responsible for matching each
 * anchorId to a real `id` attribute on a heading elsewhere in the post (e.g. via an
 * HtmlEmbed block or a heading anchor convention in the post content). A future
 * upgrade could scan post content server-side when the page is assembled and inject
 * this automatically — out of scope for a Puck-block-level implementation. */
export const TableOfContents: ComponentConfig<TableOfContentsProps> = {
  fields: {
    title: { type: 'text' },
    items: {
      type: 'array',
      arrayFields: {
        label: { type: 'text' },
        anchorId: { type: 'text' },
      },
      getItemSummary: (item) => item.label || 'Section',
    },
  },
  defaultProps: {
    title: 'In this article',
    items: [],
  },
  render: ({ title, items }) => {
    if (!items?.length) return <></>
    return (
      <section className="section">
        <div className="wrap-narrow">
          <nav className="toc card" aria-label="Table of contents">
            {title && <h4>{title}</h4>}
            <ol className="toc-list">
              {items.map((item, i) => (
                <li key={i}>
                  <a href={`#${item.anchorId}`}>{item.label}</a>
                </li>
              ))}
            </ol>
          </nav>
        </div>
      </section>
    )
  },
}
