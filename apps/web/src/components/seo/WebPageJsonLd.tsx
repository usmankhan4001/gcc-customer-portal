import { serializeJsonLd } from '@/lib/json-ld'

/** Generic WebPage structured data for Puck-composed pages (landing/campaign/generic) —
 * these previously got zero structured data of any kind, unlike countries/services/
 * pricing which all have FaqJsonLd. Uses aeo_llm_summary (admin's AEO tab) as the
 * description when present, since that's written specifically to be a clear, self-
 * contained summary for AI answer engines — falling back to the SEO meta description. */
export function WebPageJsonLd({
  title,
  description,
  url,
}: {
  title: string
  description?: string | null
  url: string
}) {
  if (!description) return null

  const json = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: title,
    description,
    url,
  }

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(json) }} />
}