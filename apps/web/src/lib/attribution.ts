'use client'

import { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'

const STORAGE_KEY = 'gcc_attribution'

type StoredAttribution = {
  utmSource?: string
  utmMedium?: string
  utmCampaign?: string
  utmContent?: string
  utmTerm?: string
  fbclid?: string
  /** When the fbclid was first seen. Meta's `fbc` parameter is built from the click
   * time, so capturing it at conversion time would misdate every ad click. */
  fbclidTs?: number
  referrer?: string
}

/** Captures UTM params + fbclid from the landing URL on first touch and persists them to
 * sessionStorage — a lead form on page 3 of a session still needs to know which ad the
 * visitor originally clicked, not just what's in the current URL (which is usually bare
 * by the time they convert). Mount once, site-wide (see (site)/layout.tsx). */
export function useUtmCapture() {
  const params = useSearchParams()

  useEffect(() => {
    if (typeof window === 'undefined') return

    const existingRaw = sessionStorage.getItem(STORAGE_KEY)
    const existing: StoredAttribution = existingRaw ? JSON.parse(existingRaw) : {}

    const next: StoredAttribution = { ...existing }
    const map: Record<string, keyof StoredAttribution> = {
      utm_source: 'utmSource',
      utm_medium: 'utmMedium',
      utm_campaign: 'utmCampaign',
      utm_content: 'utmContent',
      utm_term: 'utmTerm',
      fbclid: 'fbclid',
    }

    let changed = false
    for (const [param, key] of Object.entries(map)) {
      const value = params?.get(param)
      if (value) {
        next[key] = value as never
        changed = true
        // Stamp the click the moment we see it, not when the visitor converts.
        if (key === 'fbclid') next.fbclidTs = Date.now()
      }
    }

    if (!existing.referrer && document.referrer && !document.referrer.includes(window.location.hostname)) {
      next.referrer = document.referrer
      changed = true
    }

    if (changed) {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params])
}

/** Reads the currently-stored attribution as plain snake_case keys ready to spread into a
 * lead POST body — safe to call from any client component's event handler (not a hook). */
export function getStoredAttribution(): Record<string, string | number> {
  if (typeof window === 'undefined') return {}
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    const stored: StoredAttribution = JSON.parse(raw)
    const out: Record<string, string | number> = {}
    if (stored.utmSource) out.utmSource = stored.utmSource
    if (stored.utmMedium) out.utmMedium = stored.utmMedium
    if (stored.utmCampaign) out.utmCampaign = stored.utmCampaign
    if (stored.utmContent) out.utmContent = stored.utmContent
    if (stored.utmTerm) out.utmTerm = stored.utmTerm
    if (stored.fbclid) out.fbclid = stored.fbclid
    if (stored.fbclid && stored.fbclidTs) out.fbclidTs = stored.fbclidTs
    if (stored.referrer) out.referrer = stored.referrer
    return out
  } catch {
    return {}
  }
}