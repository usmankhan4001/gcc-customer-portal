import { LOCALES, DEFAULT_LOCALE, localizeHref } from '@/lib/i18n'

/**
 * Builds the `alternates.languages` map for a templated (non-Puck) page — but ONLY for
 * locales that actually have real translated content for this specific item, plus
 * English and `x-default` always. Listing all 8 locales regardless of content would tell
 * search engines every locale-prefixed URL is a legitimate, distinct-language equivalent
 * of this page — but 6 of them would just be the identical English text falling through
 * translate(), which is a duplicate-content signal, not a helpful hint. An untranslated
 * locale route still renders (English fallback) and is still crawlable; it just shouldn't
 * be asserted as a real language alternate until it has its own content.
 *
 * `siteUrl` should be the sitewide `site_url` setting (already trimmed of trailing
 * slash by callers), `path` the page's own bare (English) path (e.g. "/uae"), and
 * `translatedLocales` the locale codes this item actually has a `translations` entry for.
 */
export function buildHreflangAlternates(siteUrl: string, path: string, translatedLocales: string[] = []): Record<string, string> {
  const base = siteUrl.replace(/\/$/, '')
  const codes = new Set([DEFAULT_LOCALE, ...translatedLocales.filter((c) => LOCALES.some((l) => l.code === c))])
  const alternates: Record<string, string> = {}
  for (const code of codes) {
    alternates[code] = `${base}${localizeHref(path, code)}`
  }
  alternates['x-default'] = `${base}${path}`
  return alternates
}
