import type { SiteSettings } from '@/lib/directus'
import { ConsentGatedAnalytics } from '@/components/seo/ConsentGatedAnalytics'

const GA4_ID = /^G-[A-Z0-9]{6,14}$/
const GTM_ID = /^GTM-[A-Z0-9]{4,12}$/
const META_PIXEL_ID = /^\d{5,20}$/

function validId(value: string | null | undefined, pattern: RegExp, uppercase = false) {
  const normalized = value?.trim()
  if (!normalized) return null
  const candidate = uppercase ? normalized.toUpperCase() : normalized
  return pattern.test(candidate) ? candidate : null
}

/** Site-wide GA4/GTM/Meta Pixel base tags, sourced from the site_settings singleton
 * (admin-configurable, no redeploy needed) — mounted once in (site)/layout.tsx so it
 * never loads on /admin. Each tag is independently optional; blank fields render nothing.
 * The Meta Pixel here is the client-side base code (PageView/ViewContent) — separate
 * from src/lib/integrations/metaCapi.ts's server-side Conversions API Lead event. */
export function AnalyticsScripts({ settings }: { settings: SiteSettings }) {
  const ga4Id = validId(settings.ga4_measurement_id, GA4_ID, true)
  const gtmId = validId(settings.gtm_container_id, GTM_ID, true)
  const metaPixelId = validId(settings.meta_pixel_id, META_PIXEL_ID)

  return <ConsentGatedAnalytics ga4Id={ga4Id} gtmId={gtmId} metaPixelId={metaPixelId} />
}