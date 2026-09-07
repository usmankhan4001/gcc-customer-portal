import type { SiteSettings } from '@/lib/directus'
import { serializeJsonLd } from '@/lib/json-ld'

/** Article structured data for blog posts — helps answer engines attribute the content
 * to the organization and surface publish/update dates in results. */
export function ArticleJsonLd({
  title,
  description,
  url,
  publishedAt,
  settings,
}: {
  title: string
  description: string | null
  url: string
  publishedAt: string | null
  settings: SiteSettings
}) {
  const json = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: title,
    description: description || undefined,
    url,
    datePublished: publishedAt || undefined,
    publisher: {
      '@type': settings.organization_type || 'ProfessionalService',
      name: settings.site_name,
      logo: settings.logo_url ? { '@type': 'ImageObject', url: settings.logo_url } : undefined,
    },
  }

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(json) }} />
}