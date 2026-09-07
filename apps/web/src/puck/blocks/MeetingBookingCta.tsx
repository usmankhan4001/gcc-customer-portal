'use client'

import { useState, type FormEvent } from 'react'
import type { ComponentConfig } from '@puckeditor/core'
import { Eyebrow, Input } from '@/components/ui'
import { getStoredAttribution } from '@/lib/attribution'
import { buildLeadPayload, LeadFormMeta } from '@/components/LeadFormMeta'

export type MeetingBookingCtaProps = {
  urgencyText: string
  tag: string
  headline: string
  description: string
  perks: Array<{ text: string }>
  socialProof: Array<{ text: string }>
}

const TIMES = ['9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM']
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]
const DOW = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

function startOfToday() {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d
}

function formatLong(d: Date) {
  return d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })
}
function formatShort(d: Date) {
  return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
}
function formatFull(d: Date) {
  return d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

/** Ported from embeds/2-meeting-booking-cta.html — the original had a full calendar +
 * time-slot picker, then a short confirm form once a slot is chosen. Rebuilt as
 * controlled React state (calendar month, selected date, selected time, submit status)
 * instead of the original's vanilla-JS DOM manipulation, same UX and same /api/lead
 * payload shape (message includes the picked date/time so it lands on the lead record). */
function MeetingBookingCtaRender({ urgencyText, tag, headline, description, perks, socialProof }: MeetingBookingCtaProps) {
  const today = startOfToday()
  const [cursor, setCursor] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1))
  const [selDate, setSelDate] = useState<Date | null>(null)
  const [selTime, setSelTime] = useState<string | null>(null)
  const [status, setStatus] = useState<'idle' | 'submitting' | 'error' | 'done'>('idle')

  const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1).getDay()
  const daysInMonth = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate()

  function pickDate(date: Date) {
    setSelDate(date)
    setSelTime(null)
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!selDate || !selTime) return
    setStatus('submitting')
    const data = buildLeadPayload(e.currentTarget)
    const ds = formatFull(selDate)
    try {
      const response = await fetch('/api/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          interest: 'Strategy Call',
          message: `Call: ${ds} at ${selTime} GST`,
          source: 'Meeting Booking CTA',
          page: window.location.pathname,
          ...getStoredAttribution(),
        }),
      })
      if (!response.ok) throw new Error('Lead submission failed')
      setStatus('done')
    } catch {
      setStatus('error')
    }
  }

  return (
    <section className="section" style={{ padding: 0 }}>
      {urgencyText && <div className="cta-urgency-bar">{urgencyText}</div>}
      <div className="wrap-narrow" style={{ padding: 'var(--space-12) var(--space-4) var(--space-8)', textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <Eyebrow>{tag}</Eyebrow>
        </div>
        <h2>{headline}</h2>
        <p style={{ marginTop: 'var(--space-4)', color: 'var(--text-secondary)' }}>{description}</p>
      </div>

      {perks?.length > 0 && (
        <div className="cta-perk-strip">
          {perks.map((p, i) => (
            <span className="cta-perk-strip-item" key={i}>
              {p.text}
            </span>
          ))}
        </div>
      )}

      <div className="wrap" style={{ padding: 'var(--space-8) var(--space-4)' }}>
        <div className="card grid-2-split" style={{ gap: 'var(--space-6)' }}>
          <div>
            <div className="cta-cal-header">
              <button type="button" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))} aria-label="Previous month">
                ‹
              </button>
              <span style={{ fontWeight: 700 }}>
                {MONTHS[cursor.getMonth()]} {cursor.getFullYear()}
              </span>
              <button type="button" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))} aria-label="Next month">
                ›
              </button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', textAlign: 'center', fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 4 }}>
              {DOW.map((d) => (
                <span key={d}>{d}</span>
              ))}
            </div>
            <div className="cta-cal-grid">
              {Array.from({ length: first }).map((_, i) => (
                <span key={`empty-${i}`} className="cta-cal-day empty" />
              ))}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1
                const date = new Date(cursor.getFullYear(), cursor.getMonth(), day)
                const isPast = date < today || date.getDay() === 0 || date.getDay() === 6
                const isToday = date.getTime() === today.getTime()
                const isSelected = selDate && date.toDateString() === selDate.toDateString()
                const classes = ['cta-cal-day', isPast && 'past', isToday && 'today', isSelected && 'selected'].filter(Boolean).join(' ')
                return (
                  <button key={day} type="button" className={classes} disabled={isPast} onClick={() => pickDate(date)}>
                    {day}
                  </button>
                )
              })}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {status === 'done' && selDate && selTime ? (
              <div style={{ margin: 'auto', textAlign: 'center' }}>
                <h3>You're booked in!</h3>
                <p style={{ marginTop: 'var(--space-2)', color: 'var(--text-secondary)' }}>
                  We'll confirm your call for <strong style={{ color: 'var(--orange)' }}>{formatFull(selDate)} at {selTime} GST</strong> via WhatsApp within the hour.
                </p>
              </div>
            ) : !selDate ? (
              <div style={{ margin: 'auto', textAlign: 'center', color: 'var(--text-tertiary)' }}>🗓 Pick a date to see available times</div>
            ) : (
              <>
                <p style={{ fontWeight: 700 }}>Available times</p>
                <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-4)' }}>{formatLong(selDate)}</p>
                <div className="cta-slot-grid">
                  {TIMES.map((t) => (
                    <button
                      key={t}
                      type="button"
                      className={`cta-slot${selTime === t ? ' selected' : ''}`}
                      onClick={() => setSelTime(t)}
                    >
                      {t}
                    </button>
                  ))}
                </div>
                {selTime && (
                  <form onSubmit={onSubmit} style={{ marginTop: 'var(--space-6)' }}>
                    <button
                      type="button"
                      onClick={() => setSelTime(null)}
                      style={{ all: 'unset', cursor: 'pointer', color: 'var(--text-tertiary)', fontSize: 13, marginBottom: 'var(--space-3)' }}
                    >
                      ← Change time
                    </button>
                    <p style={{ fontWeight: 700, marginBottom: 'var(--space-3)' }}>
                      {formatShort(selDate)} · {selTime} GST
                    </p>
                    <Input label="Full name *" name="name" required placeholder="Your full name" />
                    <Input label="Email address" name="email" type="email" placeholder="you@email.com" />
                    <Input label="WhatsApp number *" name="phone" required placeholder="+971 50 123 4567" />
                    <LeadFormMeta emailConsent />
                    {status === 'error' && <p style={{ color: 'var(--error)', marginBottom: 'var(--space-4)' }}>Something went wrong — please try again.</p>}
                    <button type="submit" className="btn btn-primary w-full flex-center" disabled={status === 'submitting'} style={{ marginTop: 'var(--space-2)' }}>
                      {status === 'submitting' ? 'Confirming…' : 'Confirm My Free Call →'}
                    </button>
                  </form>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {socialProof?.length > 0 && (
        <div className="wrap" style={{ display: 'flex', justifyContent: 'center', gap: 'var(--space-6)', flexWrap: 'wrap', paddingBottom: 'var(--space-8)', fontSize: 13, color: 'var(--text-secondary)' }}>
          {socialProof.map((s, i) => (
            <span key={i}>{s.text}</span>
          ))}
        </div>
      )}
    </section>
  )
}

export const MeetingBookingCta: ComponentConfig<MeetingBookingCtaProps> = {
  fields: {
    urgencyText: { type: 'text' },
    tag: { type: 'text' },
    headline: { type: 'text' },
    description: { type: 'textarea' },
    perks: { type: 'array', arrayFields: { text: { type: 'text' } }, getItemSummary: (item) => item.text || 'Perk' },
    socialProof: { type: 'array', arrayFields: { text: { type: 'text' } }, getItemSummary: (item) => item.text || 'Proof point' },
  },
  defaultProps: {
    urgencyText: '📅 Limited free strategy calls available this week',
    tag: 'Free strategy call',
    headline: 'Book your free 30-minute strategy call.',
    description: "We'll map out the right jurisdiction, structure, and timeline for your specific situation — no pitch, no pressure.",
    perks: [
      { text: 'Jurisdiction recommendation' },
      { text: 'Cost breakdown' },
      { text: 'Tax strategy' },
      { text: 'No sales pressure' },
    ],
    socialProof: [
      { text: '⭐ 4.9/5 from 200+ founders' },
      { text: '🏆 500+ companies set up' },
      { text: '⚡ WhatsApp confirmation in 1 hour' },
    ],
  },
  render: (props) => <MeetingBookingCtaRender {...props} />,
}
