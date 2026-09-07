type InternalLink = { url?: string; anchor?: string; label?: string }
type ExternalCitation = { url?: string; title?: string; label?: string; rel?: string }

function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : []
}

function relAttr(rel?: string): string | undefined {
  if (!rel || rel === 'none') return undefined
  return rel
}

/** Renders the internal_links/external_citations JSON fields (admin's SEO & AEO tab)
 * as a real "Further Reading" block — previously these were pure data entry with no
 * downstream consumer anywhere on the site. Renders nothing if both are empty. */
export function RelatedLinks({
  internalLinks,
  externalCitations,
}: {
  internalLinks?: unknown
  externalCitations?: unknown
}) {
  const internal = asArray<InternalLink>(internalLinks).filter((l) => l.url)
  const external = asArray<ExternalCitation>(externalCitations).filter((l) => l.url)

  if (!internal.length && !external.length) return null

  return (
    <section className="wrap-narrow" style={{ padding: 'var(--space-8) 0' }}>
      <h3 style={{ fontSize: 18, marginBottom: 'var(--space-4)' }}>Further Reading</h3>
      <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
        {internal.map((l, i) => (
          <li key={`internal-${i}`}>
            <a href={l.url} className="link">
              {l.anchor || l.label || l.url}
            </a>
          </li>
        ))}
        {external.map((l, i) => (
          <li key={`external-${i}`}>
            <a href={l.url} className="link" target="_blank" rel={['noreferrer', relAttr(l.rel)].filter(Boolean).join(' ')}>
              {l.title || l.label || l.url}
            </a>
          </li>
        ))}
      </ul>
    </section>
  )
}