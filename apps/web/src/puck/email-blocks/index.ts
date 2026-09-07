import { EmailButton } from './EmailButton'
import { EmailColumns } from './EmailColumns'
import { EmailCtaCard } from './EmailCtaCard'
import { EmailDivider } from './EmailDivider'
import { EmailFooter } from './EmailFooter'
import { EmailHeading } from './EmailHeading'
import { EmailHero } from './EmailHero'
import { EmailImage } from './EmailImage'
import { EmailQuote } from './EmailQuote'
import { EmailSpacer } from './EmailSpacer'
import { EmailText } from './EmailText'
import type { EmailBlockRenderer } from './shared'

/**
 * The registry `src/lib/email/render.ts` walks, and the source of truth for
 * `src/puck/email-config.tsx`'s component map. Keeping both sides on one object
 * is what guarantees the editor can never offer a block the renderer would skip.
 *
 * Insertion order here is the order the blocks appear in the designer's picker.
 */
export const EMAIL_BLOCKS = {
  EmailHero,
  EmailHeading,
  EmailText,
  EmailButton,
  EmailImage,
  EmailColumns,
  EmailQuote,
  EmailCtaCard,
  EmailDivider,
  EmailSpacer,
  EmailFooter,
} satisfies Record<string, EmailBlockRenderer>

export type EmailBlockName = keyof typeof EMAIL_BLOCKS

export const EMAIL_BLOCK_TYPES = Object.keys(EMAIL_BLOCKS) as EmailBlockName[]

export function getEmailBlock(type: unknown): EmailBlockRenderer | null {
  if (typeof type !== 'string') return null
  return Object.hasOwn(EMAIL_BLOCKS, type) ? EMAIL_BLOCKS[type as EmailBlockName] : null
}

export { fallbackFooter } from './EmailFooter'
export * from './shared'
export type { EmailHeroProps } from './EmailHero'
export type { EmailHeadingProps } from './EmailHeading'
export type { EmailTextProps } from './EmailText'
export type { EmailButtonProps } from './EmailButton'
export type { EmailImageProps } from './EmailImage'
export type { EmailColumnsProps, EmailColumn } from './EmailColumns'
export type { EmailQuoteProps } from './EmailQuote'
export type { EmailCtaCardProps } from './EmailCtaCard'
export type { EmailDividerProps } from './EmailDivider'
export type { EmailSpacerProps } from './EmailSpacer'
export type { EmailFooterProps, EmailFooterLink } from './EmailFooter'
