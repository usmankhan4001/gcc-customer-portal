import type { ComponentConfig } from '@puckeditor/core'
import { Star } from 'lucide-react'
import { Eyebrow } from '@/components/ui'

export type TestimonialsProps = {
  eyebrow: string
  title: string
  testimonials: Array<{ quote: string; initials: string; name: string; role: string; rating: number }>
}

export const Testimonials: ComponentConfig<TestimonialsProps> = {
  fields: {
    eyebrow: { type: 'text' },
    title: { type: 'text' },
    testimonials: {
      type: 'array',
      arrayFields: {
        quote: { type: 'textarea' },
        initials: { type: 'text' },
        name: { type: 'text' },
        role: { type: 'text' },
        rating: { type: 'number' },
      },
    },
  },
  defaultProps: { eyebrow: 'Client outcomes', title: '', testimonials: [] },
  render: ({ eyebrow, title, testimonials }) => (
    <section className="section section-alt">
      <div className="wrap" style={{ textAlign: 'center' }}>
        <div className="reveal max-w-lg" style={{ marginBottom: 'var(--space-12)' }}>
          <Eyebrow>{eyebrow}</Eyebrow>
          <h2>{title}</h2>
        </div>
        <div className="grid-3" style={{ textAlign: 'left' }}>
          {testimonials.map((t, i) => (
            <div
              className="card tile reveal"
              key={i}
              style={{ ['--tile-accent' as string]: 'var(--orange)', ['--tile-accent-lt' as string]: 'var(--orange-lt)' }}
            >
              <div style={{ display: 'flex', gap: 2, color: 'var(--accent)' }}>
                {Array.from({ length: t.rating || 5 }).map((_, si) => (
                  <Star key={si} size={16} fill="currentColor" strokeWidth={0} aria-hidden />
                ))}
              </div>
              <p style={{ marginTop: 'var(--space-3)', fontStyle: 'italic' }}>&ldquo;{t.quote}&rdquo;</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginTop: 'var(--space-4)' }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    background: 'var(--blue-lt)',
                    color: 'var(--blue-dk)',
                    display: 'grid',
                    placeItems: 'center',
                    fontWeight: 700,
                    fontSize: 13,
                  }}
                >
                  {t.initials}
                </div>
                <div>
                  <div style={{ fontWeight: 700 }}>{t.name}</div>
                  <div style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  ),
}
