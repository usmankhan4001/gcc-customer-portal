import type { ComparisonType } from '@/lib/programmatic/derive'

// Local item shapes for the programmatic SEO collections. The parallel getters in
// src/lib/directus.ts return structurally identical records; these local types keep
// the rendering layer self-contained so it only depends on the documented contract.

type SeoAeoTail = {
  aeo_llm_summary: string | null
  aeo_target_questions: Array<{ item: string }> | null
  internal_links: unknown
  external_citations: unknown
  seo_meta_title: string | null
  seo_meta_description: string | null
  seo_canonical_url: string | null
  seo_no_index: boolean
  seo_og_image: string | null
  seo_og_title: string | null
  seo_og_description: string | null
}

export type ComparisonItem = {
  id: string
  date_created: string
  date_updated: string
  status: 'draft' | 'published' | 'archived'
  slug: string
  jurisdiction_a: string | null
  jurisdiction_b: string | null
  comparison_type: ComparisonType
  headline: string | null
  intro: string | null
  verdict: Array<{ option: 'a' | 'b' | 'depends'; condition: string; reasoning: string }>
  compare_rows: Array<{ label: string; a: string; b: string }> | null
  faq: Array<{ q: string; a: string }>
  priority: 'index' | 'noindex'
  blocks?: unknown | null
} & SeoAeoTail

export type BusinessModelItem = {
  id: string
  date_created: string
  date_updated: string
  status: 'draft' | 'published' | 'archived'
  slug: string
  name: string
  icon: string | null
  intro: string | null
  pain_points: Array<{ item: string }>
  keywords: Array<{ item: string }>
  recommended_jurisdictions: Array<{ item: string }>
  faq: Array<{ q: string; a: string }>
  blocks?: unknown | null
} & SeoAeoTail

export type GuideItem = {
  id: string
  date_created: string
  date_updated: string
  status: 'draft' | 'published' | 'archived'
  slug: string
  guide_type: 'cost' | 'banking' | 'glossary' | 'city'
  title: string
  jurisdiction_slug: string | null
  term: string | null
  definition: string | null
  intro: string | null
  faq: Array<{ q: string; a: string }>
  priority: 'index' | 'noindex'
  blocks?: unknown | null
} & SeoAeoTail

export type FaqPair = { q: string; a: string }
