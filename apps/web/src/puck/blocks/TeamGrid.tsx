import type { ComponentConfig } from '@puckeditor/core'
import Image from 'next/image'
import { Eyebrow } from '@/components/ui'

export type TeamGridProps = {
  eyebrow: string
  title: string
  description: string
  members: Array<{ photoUrl: string; name: string; role: string; bio: string }>
}

/** Team/consultant bio cards for an About/Trust page — reuses the shared `.card`
 * treatment (border, hover elevation) rather than inventing a new card style. */
export const TeamGrid: ComponentConfig<TeamGridProps> = {
  fields: {
    eyebrow: { type: 'text' },
    title: { type: 'text' },
    description: { type: 'textarea' },
    members: {
      type: 'array',
      arrayFields: {
        photoUrl: { type: 'text' },
        name: { type: 'text' },
        role: { type: 'text' },
        bio: { type: 'textarea' },
      },
      getItemSummary: (item) => item.name || 'Team member',
    },
  },
  defaultProps: {
    eyebrow: 'Our team',
    title: 'Meet the specialists',
    description: '',
    members: [],
  },
  render: ({ eyebrow, title, description, members }) => (
    <section className="section">
      <div className="wrap">
        <div className="reveal" style={{ maxWidth: 640, margin: '0 auto var(--space-12)', textAlign: 'center' }}>
          {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
          <h2>{title}</h2>
          {description && <p style={{ marginTop: 'var(--space-2)' }}>{description}</p>}
        </div>
        {members?.length > 0 && (
          <div className="grid-3">
            {members.map((m, i) => (
              <div className="card team-card reveal" key={i}>
                {m.photoUrl ? (
                  <span className="team-card-photo">
                    <Image src={m.photoUrl} alt={m.name || ''} fill sizes="96px" style={{ objectFit: 'cover' }} />
                  </span>
                ) : (
                  <span className="team-card-photo team-card-photo-placeholder" aria-hidden>
                    {(m.name || '?').charAt(0)}
                  </span>
                )}
                <h4>{m.name}</h4>
                <div className="team-card-role">{m.role}</div>
                {m.bio && <p style={{ marginTop: 'var(--space-3)', fontSize: 14 }}>{m.bio}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  ),
}
