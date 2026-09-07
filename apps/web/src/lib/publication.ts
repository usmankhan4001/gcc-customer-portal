export const PUBLICATION_STATUSES = ['draft', 'published', 'archived'] as const
export type PublicationStatus = (typeof PUBLICATION_STATUSES)[number]

export const REVIEW_STATUSES = ['unreviewed', 'in_review', 'approved', 'changes_requested'] as const
export type ReviewStatus = (typeof REVIEW_STATUSES)[number]

export type EditorialFields = {
  status: PublicationStatus
  publish_at: string | null
  unpublish_at: string | null
  review_status: ReviewStatus
  reviewer: string | null
  content_review_due: string | null
}

export type ContentCollection =
  | 'pages'
  | 'posts'
  | 'countries'
  | 'services'
  | 'pricing_tiers'
  | 'comparisons'
  | 'business_models'
  | 'guides'

export function publicPublicationFilter(now = new Date().toISOString()) {
  return {
    _and: [
      { status: { _eq: 'published' as const } },
      { publish_at: { _lte: now } },
      { _or: [{ unpublish_at: { _null: true } }, { unpublish_at: { _gt: now } }] },
    ],
  }
}

function hasPuckBlocks(value: unknown) {
  if (!value || typeof value !== 'object') return false
  const content = (value as { content?: unknown }).content
  return Array.isArray(content) && content.length > 0
}

/** The field that names an item in each collection — used for publish validation. */
const TITLE_FIELD: Record<ContentCollection, string> = {
  pages: 'title',
  posts: 'title',
  countries: 'name',
  services: 'name',
  pricing_tiers: 'name',
  comparisons: 'headline',
  business_models: 'name',
  guides: 'title',
}

const TITLE_LABEL: Record<string, string> = { title: 'Title', name: 'Name', headline: 'Headline' }

/** Collections whose pages render fine without Puck blocks (the programmatic layer
 * derives its sections from structured fields, so blocks are an enhancement). */
const BLOCKS_OPTIONAL: ContentCollection[] = ['posts', 'comparisons', 'business_models', 'guides']

export function prepareEditorialUpdate(
  collection: ContentCollection,
  current: Record<string, unknown>,
  requested: Record<string, unknown>,
  now = new Date().toISOString(),
) {
  const update = { ...requested }
  if (update.status !== 'published') return { update }

  const merged = { ...current, ...update }
  const titleField = TITLE_FIELD[collection]
  const titleLabel = TITLE_LABEL[titleField]
  const errors: string[] = []

  if (typeof merged[titleField] !== 'string' || !merged[titleField].trim()) errors.push(`${titleLabel} is required.`)
  if (typeof merged.slug !== 'string' || !merged.slug.trim()) errors.push('Slug is required.')
  // Posts remain prose-driven; programmatic pages render from structured fields.
  if (!BLOCKS_OPTIONAL.includes(collection) && !hasPuckBlocks(merged.blocks)) errors.push('Add at least one Puck block before publishing.')

  if (errors.length) return { update, error: errors.join(' ') }

  if (!merged.publish_at) update.publish_at = now
  if (collection === 'posts' && !merged.published_at) update.published_at = update.publish_at || merged.publish_at || now

  return { update }
}
