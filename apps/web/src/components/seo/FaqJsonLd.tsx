import { serializeJsonLd } from '@/lib/json-ld'

/** FAQPage structured data — the single highest-leverage schema for AEO. Answer
 * engines (Google AI Overviews, ChatGPT search, Perplexity) lift Q&A pairs marked up
 * this way directly into answers. Every country/service/pricing page already has
 * real FAQ content in Directus; this just makes it machine-readable too. Renders
 * nothing if there's no FAQ content (never emit an empty FAQPage block). */
export function FaqJsonLd({ faq }: { faq: Array<{ q: string; a: string }> }) {
  if (!faq?.length) return null

  const json = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faq.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  }

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(json) }} />
}