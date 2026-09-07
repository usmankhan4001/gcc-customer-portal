import type { Metadata } from 'next'
import type { SiteSettings } from '@/lib/directus'

type SeoFields = {
  seo_meta_title: string | null
  seo_meta_description: string | null
  seo_canonical_url: string | null
  seo_no_index: boolean
  seo_og_image: string | null
  seo_og_title: string | null
  seo_og_description: string | null
}

/** Builds a Next.js Metadata object from a content item's seo_* fields + the sitewide
 * settings singleton — the one place that turns admin-editable SEO fields into actual
 * <head> tags, so every page route uses the same logic instead of five near-duplicates.
 * `path` is this page's own route (e.g. "/uae") — used as the canonical fallback when
 * seo_canonical_url isn't set, so every page gets a real canonical instead of none. */
export function buildMetadata(item: SeoFields, fallbackTitle: string, settings: SiteSettings, path?: string): Metadata {
  // Root layout's title template already appends "| {site_name}" — if a CMS-entered
  // title already ends with the site name (its own em-dash suffix, say), stripping it
  // here avoids a doubled "... | GCC Startup | GCC Startup".
  const siteNameSuffix = new RegExp(`[\\s|—-]+${settings.site_name}\\s*$`, 'i')
  const rawTitle = item.seo_meta_title || fallbackTitle
  const title = rawTitle.replace(siteNameSuffix, '').trim()
  const description = item.seo_meta_description || settings.site_tagline || undefined
  const ogImage = item.seo_og_image || settings.default_og_image || undefined
  const canonical = item.seo_canonical_url || path

  return {
    title,
    description,
    alternates: canonical ? { canonical } : undefined,
    robots: item.seo_no_index ? { index: false, follow: false } : { index: true, follow: true },
    openGraph: {
      title: item.seo_og_title || title,
      description: item.seo_og_description || description,
      siteName: settings.site_name,
      images: ogImage ? [{ url: ogImage, width: 1200, height: 630 }] : undefined,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: item.seo_og_title || title,
      description: item.seo_og_description || description,
      images: ogImage ? [ogImage] : undefined,
      site: settings.twitter_handle || undefined,
    },
  }
}
