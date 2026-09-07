import { serializeJsonLd } from '@/lib/json-ld'

/** BreadcrumbList structured data — helps answer engines and search results understand
 * where a page sits in the site hierarchy (shown as the breadcrumb trail under a
 * search result). `items` is ordered root-first; each needs a name and absolute URL. */
export function BreadcrumbJsonLd({ items }: { items: Array<{ name: string; url: string }> }) {
  if (!items?.length) return null

  const json = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  }

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(json) }} />
}