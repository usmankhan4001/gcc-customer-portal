// Pure, deterministic data-derivation helpers for the programmatic SEO layer
// (compare / business-models / guides). No fetches, no side effects — anything
// missing just renders as an em-dash or drops out of the copy, so these functions
// never throw and never block a page render on incomplete CMS data.

export type ComparisonType = 'company-formation' | 'tax' | 'banking'

/** The subset of a country record the derive functions actually read. */
export type DerivableJurisdiction = {
  name: string
  tax?: string | null
  timeline?: string | null
  from_price?: string | null
  facts?: Array<{ label: string; value: string }> | null
}

/** Fact labels containing any of these are noise for a side-by-side — they are
 * almost always identical across GCC jurisdictions (same currency, same language,
 * same timezone, short flight) and add nothing to a comparison table. */
const SKIPPED_FACT_KEYWORDS = ['currency', 'language', 'timezone', 'flight']

const TYPE_LABEL: Record<ComparisonType, string> = {
  'company-formation': 'company formation',
  tax: 'tax positioning',
  banking: 'banking setup',
}

function text(value: string | null | undefined): string {
  return typeof value === 'string' && value.trim() ? value.trim() : '—'
}

function factIndex(facts?: Array<{ label: string; value: string }> | null) {
  const index = new Map<string, { label: string; value: string }>()
  for (const fact of facts ?? []) {
    const key = fact.label.trim().toLowerCase()
    if (key && !index.has(key)) index.set(key, fact)
  }
  return index
}

/** Builds the side-by-side comparison table for a jurisdiction pair — always the
 * tax / timeline / price-from rows, then up to 6 differing fact rows (falling back
 * to the first 4 shared labels when nothing differs). `_type` mirrors the comparison
 * type for API symmetry with deriveComparisonIntro. */
export function deriveComparisonRows(
  a: DerivableJurisdiction,
  b: DerivableJurisdiction,
  _type: ComparisonType,
): Array<{ label: string; a: string; b: string }> {
  const rows: Array<{ label: string; a: string; b: string }> = [
    { label: 'Tax treatment', a: text(a.tax), b: text(b.tax) },
    { label: 'Timeline', a: text(a.timeline), b: text(b.timeline) },
    { label: 'Price from', a: text(a.from_price), b: text(b.from_price) },
  ]

  const aFacts = factIndex(a.facts)
  const bFacts = factIndex(b.facts)

  const shared: Array<{ label: string; value: string }> = []
  for (const [key, fact] of aFacts) {
    if (!bFacts.has(key)) continue
    if (SKIPPED_FACT_KEYWORDS.some((keyword) => key.includes(keyword))) continue
    shared.push(fact)
  }

  const differing = shared.filter((fact) => {
    const other = bFacts.get(fact.label.trim().toLowerCase())
    return !!other && fact.value.trim() !== other.value.trim()
  })

  const picked = differing.length > 0 ? differing.slice(0, 6) : shared.slice(0, 4)

  for (const fact of picked) {
    const other = bFacts.get(fact.label.trim().toLowerCase())
    rows.push({ label: fact.label, a: text(fact.value), b: text(other?.value) })
  }

  return rows
}

/** 2-3 sentence, data-anchored summary of a comparison — mentions both jurisdictions
 * and the comparison type, folds in the tax/timeline/price deltas only when values
 * exist, and closes with the condition line every decision-led page shares. */
export function deriveComparisonIntro(a: DerivableJurisdiction, b: DerivableJurisdiction, type: ComparisonType): string {
  const sentences: string[] = [
    `${a.name} and ${b.name} are both popular routes for ${TYPE_LABEL[type]} in the GCC and offshore landscape, but they suit different founders.`,
  ]

  const deltas: string[] = []
  if (a.tax && b.tax) deltas.push(`tax treatment is ${a.tax} in ${a.name} and ${b.tax} in ${b.name}`)
  if (a.timeline && b.timeline) deltas.push(`setup timelines run ${a.timeline} in ${a.name} and ${b.timeline} in ${b.name}`)
  if (a.from_price && b.from_price) deltas.push(`formation starts from ${a.from_price} in ${a.name} and ${b.from_price} in ${b.name}`)
  if (deltas.length > 0) sentences.push(`${deltas.join(', and ')}.`)

  sentences.push('The right choice depends on your business model, banking needs and residency plans.')

  return sentences.join(' ')
}

/** Cost-breakdown rows for a jurisdiction guide — government fees, corporate tax and
 * setup timeline, followed by 2-4 of the jurisdiction's own fact rows. */
export function deriveCostGuideRows(c: DerivableJurisdiction): Array<{ label: string; value: string }> {
  const rows: Array<{ label: string; value: string }> = [
    { label: 'Government fees', value: text(c.from_price) },
    { label: 'Corporate tax', value: text(c.tax) },
    { label: 'Setup timeline', value: text(c.timeline) },
  ]

  for (const fact of (c.facts ?? []).slice(0, 4)) {
    rows.push({ label: fact.label, value: text(fact.value) })
  }

  return rows
}

/** 2-3 sentence persona × jurisdiction intro — references both the business model
 * and the country so the page reads as purpose-built rather than templated. */
export function derivePersonaIntro(
  model: { name: string; intro: string },
  country: { name: string; headline?: string | null; intro?: string | null },
): string {
  const countryHook =
    country.headline ||
    country.intro ||
    `the local formation route, cost structure and banking realities in ${country.name}`

  return [
    `For founders building a ${model.name}, the choice of jurisdiction shapes everything downstream — banking appetite, tax exposure and setup cost.`,
    `In ${country.name}, that trade-off is visible in ${countryHook}.`,
    `A ${model.name} specialist can map your model against ${country.name} and tell you where it fits — or where it does not.`,
  ].join(' ')
}
