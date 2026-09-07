import type { ComponentConfig } from '@puckeditor/core'
import Image from 'next/image'

export type AuthorBioProps = {
  name: string
  role: string
  bio: string
  photoUrl: string
}

/** Compact author byline for the bottom of a blog post. `PostItem` (src/lib/directus.ts)
 * has no author fields today (just category/reading_time), so author identity is a
 * plain per-block Puck field the editor fills in per-post rather than a new Directus
 * relationship — keeps this block self-contained with no schema change required. */
export const AuthorBio: ComponentConfig<AuthorBioProps> = {
  fields: {
    name: { type: 'text' },
    role: { type: 'text' },
    bio: { type: 'textarea' },
    photoUrl: { type: 'text' },
  },
  defaultProps: {
    name: '',
    role: '',
    bio: '',
    photoUrl: '',
  },
  render: ({ name, role, bio, photoUrl }) => {
    if (!name && !bio) return <></>
    return (
      <section className="section">
        <div className="wrap-narrow">
          <div className="author-bio card">
            {photoUrl ? (
              <span className="author-bio-photo">
                <Image src={photoUrl} alt={name || ''} fill sizes="64px" style={{ objectFit: 'cover' }} />
              </span>
            ) : (
              <span className="author-bio-photo author-bio-photo-placeholder" aria-hidden>
                {(name || '?').charAt(0)}
              </span>
            )}
            <div>
              <div style={{ fontWeight: 700 }}>
                {name} {role && <span style={{ fontWeight: 400, color: 'var(--text-tertiary)' }}>&middot; {role}</span>}
              </div>
              {bio && <p style={{ marginTop: 'var(--space-1)', fontSize: 14 }}>{bio}</p>}
            </div>
          </div>
        </div>
      </section>
    )
  },
}
