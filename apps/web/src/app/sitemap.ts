import type { MetadataRoute } from 'next'
import { getAllSitemapEntries, getSiteSettings } from '@/lib/directus'

// Without this, Next.js treats sitemap.ts as static and tries to prerender it at
// `next build` time — which calls Directus at the build-time placeholder URL and
// crashes the whole build with ECONNREFUSED (no live Directus during an isolated
// Docker build stage). Forcing dynamic also means the sitemap always reflects
// current published content instead of a snapshot frozen at the last deploy.
export const dynamic = 'force-dynamic'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [settings, entries] = await Promise.all([getSiteSettings(), getAllSitemapEntries()])
  const base = (settings.site_url || 'https://gccstartup.com').replace(/\/$/, '')

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: base, changeFrequency: 'weekly', priority: 1 },
    { url: `${base}/services`, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/jurisdictions`, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/pricing`, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/compare`, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/business`, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/guides`, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/resources`, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${base}/blog`, changeFrequency: 'weekly', priority: 0.6 },
    { url: `${base}/contact`, changeFrequency: 'yearly', priority: 0.6 },
    { url: `${base}/book-consultation`, changeFrequency: 'yearly', priority: 0.7 },
    { url: `${base}/philippines-partners`, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${base}/privacy`, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${base}/cookies`, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${base}/terms`, changeFrequency: 'yearly', priority: 0.3 },
  ]

  const fromPages = entries.pages
    .filter((p) => !p.seo_no_index && p.slug !== 'home' && !['privacy', 'cookies', 'terms'].includes(p.slug))
    .map((p) => ({ url: `${base}/${p.slug}`, lastModified: p.date_updated, changeFrequency: 'monthly' as const, priority: 0.7 }))

  const fromCountries = entries.countries
    .filter((c) => !c.seo_no_index)
    .map((c) => ({ url: `${base}/${c.slug}`, lastModified: c.date_updated, changeFrequency: 'monthly' as const, priority: 0.9 }))

  const fromServices = entries.services
    .filter((s) => !s.seo_no_index)
    .map((s) => ({ url: `${base}/services/${s.slug}`, lastModified: s.date_updated, changeFrequency: 'monthly' as const, priority: 0.9 }))

  const fromPricing = entries.pricingTiers
    .filter((t) => !t.seo_no_index)
    .map((t) => ({ url: `${base}/pricing/${t.slug}`, lastModified: t.date_updated, changeFrequency: 'monthly' as const, priority: 0.8 }))

  const fromComparisons = entries.comparisons
    .filter((c) => !c.seo_no_index)
    .map((c) => ({ url: `${base}/compare/${c.slug}`, lastModified: c.date_updated, changeFrequency: 'monthly' as const, priority: 0.8 }))

  const fromBusinessModels = entries.businessModels
    .filter((b) => !b.seo_no_index)
    .map((b) => ({ url: `${base}/business/${b.slug}`, lastModified: b.date_updated, changeFrequency: 'monthly' as const, priority: 0.7 }))

  const fromGuides = entries.guides
    .filter((g) => !g.seo_no_index)
    .map((g) => ({ url: `${base}/guides/${g.slug}`, lastModified: g.date_updated, changeFrequency: 'monthly' as const, priority: 0.7 }))

  const fromPosts = entries.posts
    .filter((p) => !p.seo_no_index)
    .map((p) => ({ url: `${base}/blog/${p.slug}`, lastModified: p.date_updated, changeFrequency: 'yearly' as const, priority: 0.5 }))

  return [...staticRoutes, ...fromCountries, ...fromServices, ...fromPricing, ...fromComparisons, ...fromBusinessModels, ...fromGuides, ...fromPages, ...fromPosts]
}
