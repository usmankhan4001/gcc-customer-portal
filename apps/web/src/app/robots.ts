import type { MetadataRoute } from 'next'
import { getSiteSettings } from '@/lib/directus'

// See sitemap.ts for why this is required — same static-prerender-at-build-time issue.
export const dynamic = 'force-dynamic'

export default async function robots(): Promise<MetadataRoute.Robots> {
  const settings = await getSiteSettings()
  const base = (settings.site_url || 'https://gccstartup.com').replace(/\/$/, '')

  return {
    rules: [
      { userAgent: '*', allow: '/', disallow: ['/admin', '/api'] },
      // Explicit allow for AI & answer-engine crawlers to maximize citation & visibility in
      // ChatGPT, Claude, Perplexity, Google Gemini / AI Overviews, Applebot, and Cohere.
      { userAgent: 'GPTBot', allow: '/', disallow: ['/admin', '/api'] },
      { userAgent: 'ChatGPT-User', allow: '/', disallow: ['/admin', '/api'] },
      { userAgent: 'ClaudeBot', allow: '/', disallow: ['/admin', '/api'] },
      { userAgent: 'anthropic-ai', allow: '/', disallow: ['/admin', '/api'] },
      { userAgent: 'PerplexityBot', allow: '/', disallow: ['/admin', '/api'] },
      { userAgent: 'Google-Extended', allow: '/', disallow: ['/admin', '/api'] },
      { userAgent: 'Applebot-Extended', allow: '/', disallow: ['/admin', '/api'] },
      { userAgent: 'Bytespider', allow: '/', disallow: ['/admin', '/api'] },
      { userAgent: 'CCBot', allow: '/', disallow: ['/admin', '/api'] },
      { userAgent: 'Amazonbot', allow: '/', disallow: ['/admin', '/api'] },
      { userAgent: 'cohere-ai', allow: '/', disallow: ['/admin', '/api'] },
    ],
    sitemap: `${base}/sitemap.xml`,
  }
}
