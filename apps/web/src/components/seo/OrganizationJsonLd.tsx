import type { SiteSettings } from '@/lib/directus'
import { serializeJsonLd } from '@/lib/json-ld'

/** Sitewide Organization/ProfessionalService structured data — rendered once in the
 * root layout so every page carries it. This is the single most load-bearing piece
 * for AEO: answer engines use it to identify who's behind the site, how to contact
 * them, and which social profiles to trust as the same entity. */
export function OrganizationJsonLd({ settings }: { settings: SiteSettings }) {
  const sameAs = [settings.social_facebook, settings.social_instagram, settings.social_linkedin, settings.social_twitter].filter(
    Boolean,
  )

  const json = {
    '@context': 'https://schema.org',
    '@type': settings.organization_type || 'ProfessionalService',
    name: settings.site_name,
    description: settings.site_tagline || undefined,
    url: settings.site_url || undefined,
    logo: settings.logo_url || undefined,
    image: settings.default_og_image || undefined,
    telephone: settings.contact_phone || undefined,
    email: settings.contact_email || undefined,
    sameAs: sameAs.length ? sameAs : undefined,
  }

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(json) }} />
}