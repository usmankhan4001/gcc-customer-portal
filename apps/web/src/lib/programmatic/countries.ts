import { publicPublicationFilter } from '@/lib/publication'

// TODO: Replace with Drizzle queries once content is migrated.
// These stubs preserve the original function signatures and types.

export type CountrySummary = {
  id: string
  name: string
  slug: string
  flag: string | null
  region: string | null
  tax: string | null
  timeline: string | null
  from_price: string | null
  headline: string | null
  intro: string | null
  facts: Array<{ label: string; value: string }> | null
}

/** Resolves a list of country UUIDs (published only) into full country records. */
export async function getCountriesByIds(_ids: (string | null | undefined)[]): Promise<CountrySummary[]> {
  // TODO: Replace with Drizzle query once countries table is migrated
  return []
}

/** All published countries with the fields the programmatic pages need, sorted by name. */
export async function getAllCountries(): Promise<CountrySummary[]> {
  // TODO: Replace with Drizzle query once countries table is migrated
  return []
}

/** Convenience maps for name/slug lookups over a country list. */
export function countryNameById(countries: CountrySummary[], id: string | null | undefined): string | null {
  if (!id) return null
  return countries.find((c) => c.id === id)?.name ?? null
}

export function countryBySlug(countries: CountrySummary[], slug: string | null | undefined): CountrySummary | null {
  if (!slug) return null
  return countries.find((c) => c.slug === slug) ?? null
}
