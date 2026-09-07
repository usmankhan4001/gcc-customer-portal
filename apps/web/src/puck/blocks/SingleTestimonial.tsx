import type { ComponentConfig } from '@puckeditor/core'
import Image from 'next/image'
import { Star } from 'lucide-react'

export type SingleTestimonialProps = {
  quote: string
  name: string
  role: string
  photoUrl: string
  rating: number
}

/** One large, "featured testimonial" moment — deliberately distinct from the 3-card
 * `Testimonials` grid: a big pull-quote with a side photo, not a smaller version of
 * the grid card. Use this to spotlight a single standout client story. */
export const SingleTestimonial: ComponentConfig<SingleTestimonialProps> = {
  fields: {
    quote: { type: 'textarea' },
    name: { type: 'text' },
    role: { type: 'text' },
    photoUrl: { type: 'text' },
    rating: { type: 'number', min: 1, max: 5 },
  },
  defaultProps: {
    quote: '',
    name: '',
    role: '',
    photoUrl: '',
    rating: 5,
  },
  render: ({ quote, name, role, photoUrl, rating }) => (
    <section className="section section-alt">
      <div className="wrap">
        <div className={`single-testimonial reveal ${photoUrl ? 'has-photo' : ''}`}>
          {photoUrl && (
            <span className="single-testimonial-photo">
              <Image src={photoUrl} alt={name || ''} fill sizes="(max-width: 640px) 90px, 140px" style={{ objectFit: 'cover' }} />
            </span>
          )}
          <div className="single-testimonial-body">
            <div style={{ display: 'flex', gap: 3, color: 'var(--accent)', marginBottom: 'var(--space-4)' }}>
              {Array.from({ length: rating || 5 }).map((_, i) => (
                <Star key={i} size={20} fill="currentColor" strokeWidth={0} aria-hidden />
              ))}
            </div>
            <p className="single-testimonial-quote">&ldquo;{quote}&rdquo;</p>
            <div style={{ marginTop: 'var(--space-6)' }}>
              <div style={{ fontWeight: 700, fontSize: 17 }}>{name}</div>
              <div style={{ fontSize: 14, color: 'var(--text-tertiary)' }}>{role}</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  ),
}
