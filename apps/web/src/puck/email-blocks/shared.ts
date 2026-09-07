import type { DefaultComponentProps, Fields } from '@puckeditor/core'

/**
 * Shared primitives for the email block renderers.
 *
 * Everything under `src/puck/email-blocks/` is deliberately plain TypeScript with
 * no React import. `src/lib/email/render.ts` pulls these modules into API routes,
 * the outbox drainer and Vitest's `node` environment, none of which can carry a
 * JSX runtime. `src/puck/email-config.tsx` wraps the very same `toHtml()` output
 * in the editor preview, so what the designer shows is byte-identical to what is
 * handed to the transport.
 *
 * Email HTML is not web HTML. No flex, no grid, no external stylesheet, no
 * shorthand an Outlook rendering engine would drop. Every block emits a
 * presentation table with its styles written inline, which is also the reason no
 * CSS-inliner dependency is needed anywhere in this codebase.
 */

/** Hard ceiling for the content column. Wider than this and Outlook's reading
 * pane starts side-scrolling, which no mobile client recovers from. */
export const EMAIL_MAX_WIDTH = 600

/** Lifted from `src/styles/tokens.css`. Duplicated as literals on purpose: mail
 * clients strip CSS custom properties, so every colour has to arrive as a hex
 * string inside a style attribute. Keep in step with tokens.css by hand. */
export const EMAIL_PALETTE = {
  orange: '#F26522',
  orangeDark: '#C9511A',
  orangeLight: '#FEF1E9',
  navy: '#0A142F',
  navyDeep: '#060D20',
  blue: '#1B4FD8',
  text: '#0F172A',
  textSecondary: '#334155',
  textTertiary: '#64748B',
  border: '#E2E8F0',
  borderStrong: '#CBD5E1',
  surface: '#FFFFFF',
  surfaceAlt: '#F8FAFC',
  white: '#FFFFFF',
} as const

/* Satoshi and Clash Display are self-hosted web fonts; a mail client will never
   load them, so the stack starts at the system UI face and ends at Arial. */
export const EMAIL_FONT =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Helvetica, Arial, sans-serif"
export const EMAIL_HEADING_FONT = EMAIL_FONT

export type EmailRenderContext = {
  siteUrl: string
  brandName: string
  brandAddress: string
  unsubscribeUrl: string
  webVersionUrl: string
}

export const DEFAULT_RENDER_CONTEXT: EmailRenderContext = {
  siteUrl: 'https://gccstartup.com',
  brandName: 'GCC Startup',
  brandAddress: '',
  unsubscribeUrl: '',
  webVersionUrl: '',
}

/* ---------- coercion -------------------------------------------------------
   Block props arrive from a json column, so any one of them may be null, a
   number, or an object left behind by an older version of the block. Coercing on
   read is what lets renderEmail() honour its "never throws" contract without a
   try/catch wrapped around every field access. */

export function str(value: unknown, fallback = ''): string {
  if (typeof value === 'string') return value
  if (typeof value === 'number' && Number.isFinite(value)) return String(value)
  if (typeof value === 'boolean') return value ? 'true' : 'false'
  return fallback
}

export function num(value: unknown, fallback: number): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value)
    if (Number.isFinite(parsed)) return parsed
  }
  return fallback
}

export function bool(value: unknown, fallback = false): boolean {
  if (typeof value === 'boolean') return value
  if (value === 'true') return true
  if (value === 'false') return false
  return fallback
}

export function arr(value: unknown): Record<string, unknown>[] {
  if (!Array.isArray(value)) return []
  return value.filter((item): item is Record<string, unknown> => typeof item === 'object' && item !== null)
}

export function oneOf<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  const raw = str(value)
  return (allowed as readonly string[]).includes(raw) ? (raw as T) : fallback
}

/* ---------- escaping ------------------------------------------------------- */

export function escapeHtml(value: unknown): string {
  return str(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/**
 * Anything that is not an http(s), mailto or tel link — or an anchor, a root
 * relative path, or a bare merge tag the transport substitutes later — collapses
 * to '#'. A `blocks` column is editable by anyone with CMS access, and a
 * `javascript:` href sitting in a webmail preview pane is a stored XSS vector.
 */
export function safeUrl(value: unknown, fallback = '#'): string {
  const raw = str(value).trim()
  if (!raw) return fallback
  if (raw.startsWith('#')) return raw
  if (raw.startsWith('/')) return raw
  if (/^\{\{\s*[\w.-]+\s*\}\}$/.test(raw)) return raw
  if (/^(https?:|mailto:|tel:)/i.test(raw)) return raw
  if (/^[\w.-]+\.[a-z]{2,}(\/|$|\?)/i.test(raw)) return 'https://' + raw
  return fallback
}

/** Every `href` goes through this: safe-listed, then attribute-escaped. */
export function hrefAttr(value: unknown, fallback = '#'): string {
  return escapeHtml(safeUrl(value, fallback))
}

/* ---------- inline formatting ----------------------------------------------
   Editors need bold, italics and links inside a paragraph without being handed a
   raw HTML box, which would put script injection one paste away. The blocks
   therefore accept a markdown-lite subset — **bold**, *italic*, [text](url) —
   applied strictly *after* the whole string has been escaped, so no author-typed
   angle bracket can reach the output as markup. Merge tags survive untouched
   because braces are not escaped. */

const LINK_STYLE = 'color:' + EMAIL_PALETTE.orange + ';text-decoration:underline;'

export function inlineHtml(value: unknown): string {
  let out = escapeHtml(value)
  out = out.replace(/\[([^\]\n]+)\]\(([^)\s]+)\)/g, (_match, label: string, url: string) => {
    // `url` arrives already escaped, so undo the entity encoding safeUrl needs to
    // inspect and let hrefAttr re-escape it for the attribute.
    const raw = url.replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"')
    return '<a href="' + hrefAttr(raw) + '" style="' + LINK_STYLE + '" target="_blank" rel="noopener">' + label + '</a>'
  })
  out = out.replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>')
  out = out.replace(/\*([^*\n]+)\*/g, '<em>$1</em>')
  out = out.replace(/\r?\n/g, '<br />')
  return out
}

/** The plain-text counterpart: the same markdown-lite subset unwound into
 * something a text-only client can read, with link targets spelled out in full. */
export function inlineText(value: unknown): string {
  let out = str(value)
  out = out.replace(/\[([^\]\n]+)\]\(([^)\s]+)\)/g, (_match, label: string, url: string) => label + ' (' + url + ')')
  out = out.replace(/\*\*([^*\n]+)\*\*/g, '$1')
  out = out.replace(/\*([^*\n]+)\*/g, '$1')
  return out.replace(/\r\n/g, '\n').trim()
}

/* ---------- table scaffolding ---------------------------------------------- */

export type Align = 'left' | 'center' | 'right'
export const ALIGNMENTS: readonly Align[] = ['left', 'center', 'right']

/** The outer shell every block returns: a full-width presentation table with a
 * single padded cell. `role="presentation"` stops a screen reader announcing a
 * layout table as tabular data. */
export function blockTable(inner: string, opts: { padding?: string; background?: string; align?: Align } = {}): string {
  const padding = opts.padding ?? '0 32px'
  const bgAttr = opts.background ? ' bgcolor="' + escapeHtml(opts.background) + '"' : ''
  const bgStyle = opts.background ? 'background-color:' + escapeHtml(opts.background) + ';' : ''
  const align = opts.align ?? 'left'
  return (
    '<table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%"' +
    bgAttr +
    ' style="width:100%;border-collapse:collapse;' +
    bgStyle +
    '">' +
    '<tr><td align="' +
    align +
    '" style="padding:' +
    escapeHtml(padding) +
    ';' +
    bgStyle +
    'font-family:' +
    EMAIL_FONT +
    ';">' +
    inner +
    '</td></tr></table>'
  )
}

/** A padded anchor inside its own table cell. Rounds everywhere except older
 * Outlook, which squares the corners off — an acceptable degradation, and far
 * less fragile than the VML roundrect alternative. */
export function buttonHtml(opts: {
  text: string
  url: string
  background: string
  color: string
  border?: string
  fullWidth?: boolean
}): string {
  const label = escapeHtml(opts.text)
  if (!label) return ''
  const border = opts.border ? 'border:2px solid ' + escapeHtml(opts.border) + ';' : 'border:2px solid transparent;'
  const width = opts.fullWidth ? 'width:100%;' : ''
  return (
    '<table role="presentation" border="0" cellpadding="0" cellspacing="0" style="border-collapse:separate;' +
    width +
    '">' +
    '<tr><td align="center" bgcolor="' +
    escapeHtml(opts.background) +
    '" style="' +
    width +
    'border-radius:9999px;background-color:' +
    escapeHtml(opts.background) +
    ';' +
    border +
    'mso-padding-alt:14px 30px;">' +
    '<a href="' +
    hrefAttr(opts.url) +
    '" target="_blank" rel="noopener" style="display:inline-block;' +
    width +
    'padding:14px 30px;font-family:' +
    EMAIL_FONT +
    ';font-size:16px;font-weight:700;line-height:20px;color:' +
    escapeHtml(opts.color) +
    ';text-decoration:none;border-radius:9999px;">' +
    label +
    '</a></td></tr></table>'
  )
}

/** Joins the lines a `toText` builds up, dropping the empty ones so a mostly
 * blank block never leaves a hole in the plain-text part. */
export function textLines(...lines: (string | false | null | undefined)[]): string {
  return lines
    .map((line) => (typeof line === 'string' ? line.trim() : ''))
    .filter((line) => line.length > 0)
    .join('\n')
}

/* ---------- Puck field helpers ---------------------------------------------
   `Fields` is a type-only import, so nothing from @puckeditor/core survives into
   the emitted JavaScript and these modules stay importable from a node test. */

export const alignField: Fields<{ align: Align }>['align'] = {
  type: 'select',
  label: 'Alignment',
  options: [
    { label: 'Left', value: 'left' },
    { label: 'Center', value: 'center' },
    { label: 'Right', value: 'right' },
  ],
}

export type EmailBlockDefinition<P extends DefaultComponentProps> = {
  label: string
  fields: Fields<P>
  defaults: P
  toHtml: (props: P, ctx: EmailRenderContext) => string
  toText: (props: P, ctx: EmailRenderContext) => string
}

/** What the registry stores. The single cast lives here rather than being
 * repeated at each of the eleven registration sites. */
export type EmailBlockRenderer = {
  label: string
  fields: Record<string, unknown>
  defaults: Record<string, unknown>
  toHtml: (props: Record<string, unknown>, ctx: EmailRenderContext) => string
  toText: (props: Record<string, unknown>, ctx: EmailRenderContext) => string
}

export function defineEmailBlock<P extends DefaultComponentProps>(definition: EmailBlockDefinition<P>): EmailBlockRenderer {
  return definition as unknown as EmailBlockRenderer
}
