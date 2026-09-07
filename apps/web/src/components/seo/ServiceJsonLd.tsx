import type { SiteSettings } from '@/lib/directus'
import { serializeJsonLd } from '@/lib/json-ld'

/** Service structured data for /services/[slug] pages — describes the offering itself
 * (not just the organization), which is what lets an answer engine match a query like
 * "who does nominee UBO setup in Hong Kong" directly to this page rather than just the
 * homepage. */
export function ServiceJsonLd({
  name,
  description,
  url,
  settings,
}: {
  name: string
  description: string | null
  url: string
  settings: SiteSettings
}) {
  const json = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name,
    serviceType: name,
    description: description || undefined,
    url,
    provider: {
      '@type': settings.organization_type || 'ProfessionalService',
      name: settings.site_name,
      url: settings.site_url || undefined,
      telephone: settings.contact_phone || undefined,
      email: settings.contact_email || undefined,
    },
    areaServed: [
      { '@type': 'Country', name: 'United Arab Emirates' },
      { '@type': 'Country', name: 'Hong Kong' },
      { '@type': 'Country', name: 'Singapore' },
      { '@type': 'Country', name: 'Bahrain' },
      { '@type': 'Country', name: 'Ireland' },
      { '@type': 'Country', name: 'British Virgin Islands' },
      { '@type': 'Country', name: 'Cayman Islands' },
      { '@type': 'Country', name: 'Oman' },
      { '@type': 'Country', name: 'Qatar' },
    ],
    termsOfService: `${(settings.site_url || '').replace(/\/$/, '')}/terms`,
  }

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(json) }} />
}