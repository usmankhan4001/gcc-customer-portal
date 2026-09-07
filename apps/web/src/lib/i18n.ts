export type Locale = { code: string; name: string; dir: 'ltr' | 'rtl' }

/** Static list (not filesystem-read) so it can be imported into edge middleware.
 * Client-safe (no next/headers) — server-only helpers live in ./i18n-server.ts, keep
 * it that way. Flag graphics are looked up separately via LOCALE_FLAG_CODE + <Flag>,
 * not stored here. */
export const LOCALES: Locale[] = [
  { code: 'en', name: 'English', dir: 'ltr' },
  { code: 'ar', name: 'العربية', dir: 'rtl' },
  { code: 'zh', name: '简体中文', dir: 'ltr' },
  { code: 'de', name: 'Deutsch', dir: 'ltr' },
  { code: 'fr', name: 'Français', dir: 'ltr' },
  { code: 'nl', name: 'Nederlands', dir: 'ltr' },
  { code: 'es', name: 'Español', dir: 'ltr' },
  { code: 'it', name: 'Italiano', dir: 'ltr' },
]

export const DEFAULT_LOCALE = 'en'
export const LOCALE_CODES = LOCALES.map((l) => l.code)
export const LOCALE_HEADER = 'x-locale'

export function isLocale(code: string): boolean {
  return LOCALE_CODES.includes(code)
}

export function getLocaleInfo(code: string): Locale {
  return LOCALES.find((l) => l.code === code) ?? LOCALES[0]
}

/**
 * Looks up a translated field with English fallback. `item.translations` is a JSON blob
 * shaped `{ [localeCode]: { [fieldName]: value } }`, additive on top of the base English
 * fields — no translation data is populated yet (infrastructure-only pass), so every
 * lookup currently falls through to the English value. That's expected, not a bug.
 *
 * Array-shaped fields (benefits, faq, process, documents, who_for, etc.) are translated
 * as a single whole-field JSON blob rather than per-item/per-key — i.e. a translation
 * entry stores the *entire* translated array under one field name, e.g.
 * `translations: { nl: { faq: [{ q: '...', a: '...' }, ...] } }`. This is simplest and
 * keeps `translate()` a single generic lookup instead of needing separate array-path
 * plumbing; it does mean a translator must resupply the whole array if any one item
 * changes, which is an acceptable tradeoff for how infrequently these arrays change.
 * The return type is `T[K]`, matching the base field's type, since a translation is
 * expected to be shaped identically to the English value it's standing in for.
 */
export function translate<T extends Record<string, unknown>, K extends keyof T & string>(
  item: T & { translations?: Record<string, Record<string, unknown>> },
  locale: string,
  field: K,
): T[K] {
  if (locale === DEFAULT_LOCALE) return item[field]
  const translated = item.translations?.[locale]?.[field]
  return (translated as T[K] | undefined) ?? item[field]
}

/** Strips a known locale prefix from a pathname, e.g. /de/uae -> /uae. Returns the path unchanged if no locale prefix is present. */
export function stripLocalePrefix(pathname: string): { locale: string; path: string } {
  const segments = pathname.split('/')
  const maybeLocale = segments[1]
  if (maybeLocale && isLocale(maybeLocale)) {
    return { locale: maybeLocale, path: '/' + segments.slice(2).join('/') || '/' }
  }
  return { locale: DEFAULT_LOCALE, path: pathname }
}

/** Builds a localized href for the language switcher, e.g. localizeHref('/uae', 'de') -> '/de/uae'. */
export function localizeHref(path: string, locale: string): string {
  const { path: bare } = stripLocalePrefix(path)
  if (locale === DEFAULT_LOCALE) return bare
  return `/${locale}${bare === '/' ? '' : bare}`
}