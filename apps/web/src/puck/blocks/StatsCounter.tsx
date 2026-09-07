'use client'

import { useEffect, useRef, useState } from 'react'
import type { ComponentConfig } from '@puckeditor/core'

export type StatsCounterProps = {
  stats: Array<{ value: number; suffix: string; label: string }>
}

function Counter({ value, suffix, label }: { value: number; suffix: string; label: string }) {
  const ref = useRef<HTMLDivElement | null>(null)
  const [display, setDisplay] = useState(0)
  const started = useRef(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true
          const duration = 1200
          const start = performance.now()
          function tick(now: number) {
            const progress = Math.min((now - start) / duration, 1)
            setDisplay(Math.round(value * (1 - Math.pow(1 - progress, 3))))
            if (progress < 1) requestAnimationFrame(tick)
          }
          requestAnimationFrame(tick)
        }
      },
      { threshold: 0.4 },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [value])

  return (
    <div ref={ref}>
      <div className="stats-counter-num">
        {display}
        {suffix}
      </div>
      <div className="stats-counter-label">{label}</div>
    </div>
  )
}

/** Replaces the static StatsRow stub — each number counts up from 0 when it scrolls
 * into view, using the same IntersectionObserver pattern as FeatureShowcase. */
export const StatsCounter: ComponentConfig<StatsCounterProps> = {
  fields: {
    stats: {
      type: 'array',
      arrayFields: { value: { type: 'number' }, suffix: { type: 'text' }, label: { type: 'text' } },
      getItemSummary: (item) => item.label || 'Stat',
    },
  },
  defaultProps: {
    stats: [
      { value: 500, suffix: '+', label: 'Companies registered' },
      { value: 15, suffix: '+', label: 'Jurisdictions' },
      { value: 0, suffix: '%', label: 'Tax in Bahrain & HK' },
    ],
  },
  render: ({ stats }) => (
    <section className="section">
      <div className="wrap stats-counter-row">
        {stats?.map((s, i) => <Counter key={i} value={s.value} suffix={s.suffix} label={s.label} />)}
      </div>
    </section>
  ),
}
