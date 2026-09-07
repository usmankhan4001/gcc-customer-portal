import type { ComponentConfig } from '@puckeditor/core'

export type RelatedPostsProps = {
  title: string
  posts: Array<{ postTitle: string; postSlug: string; postExcerpt: string }>
}

/** Manually-curated "related posts" grid rather than an auto-queried one. Puck block
 * `render` functions run synchronously with only their own props — they don't have
 * async access to the Directus client the way a server page component does — so
 * pulling "latest N posts by category" here would mean threading data-fetching
 * logic into the Puck rendering layer itself (a bigger architectural change than
 * this block warrants; see BlogGrid in the roadmap for that path if it's ever
 * built). This keeps it a simple, editor-controlled block: the editor picks the
 * title/slug/excerpt of each related post by hand. */
export const RelatedPosts: ComponentConfig<RelatedPostsProps> = {
  fields: {
    title: { type: 'text' },
    posts: {
      type: 'array',
      arrayFields: {
        postTitle: { type: 'text' },
        postSlug: { type: 'text' },
        postExcerpt: { type: 'textarea' },
      },
      getItemSummary: (item) => item.postTitle || 'Post',
    },
  },
  defaultProps: {
    title: 'Related reading',
    posts: [],
  },
  render: ({ title, posts }) => {
    if (!posts?.length) return <></>
    return (
      <section className="section section-alt">
        <div className="wrap">
          {title && <h3 style={{ marginBottom: 'var(--space-6)' }}>{title}</h3>}
          <div className="grid-3">
            {posts.map((p, i) => (
              <a href={`/blog/${p.postSlug}`} className="card related-post-card" key={i}>
                <h4>{p.postTitle}</h4>
                {p.postExcerpt && <p style={{ marginTop: 'var(--space-2)', fontSize: 14 }}>{p.postExcerpt}</p>}
              </a>
            ))}
          </div>
        </div>
      </section>
    )
  },
}
