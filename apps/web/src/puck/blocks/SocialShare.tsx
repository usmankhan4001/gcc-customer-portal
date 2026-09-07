'use client'

import { useState } from 'react'
import type { ComponentConfig } from '@puckeditor/core'
import { Link2, Check } from 'lucide-react'

export type SocialShareProps = {
  shareUrl: string
  shareTitle: string
}

/** lucide-react (this project's icon set) dropped brand/wordmark icons a while
 * back — there's no `Twitter`/`Linkedin`/`Facebook` export to import — so these
 * three are small inline SVGs (no new dependency) rather than reaching for a
 * brand-icon package just for a share row. */
function XIcon() {
  return (
    <svg width={15} height={15} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M18.9 2H22l-7.6 8.7L23.3 22h-7.1l-5.5-6.6L4.4 22H1.2l8.1-9.3L.9 2h7.3l5 6.1L18.9 2Zm-1.2 18h1.9L6.4 3.9H4.3L17.7 20Z" />
    </svg>
  )
}
function LinkedinIcon() {
  return (
    <svg width={15} height={15} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M4.98 3.5C4.98 4.88 3.87 6 2.5 6S0 4.88 0 3.5 1.12 1 2.5 1s2.48 1.12 2.48 2.5ZM.24 8.25h4.5V23H.24V8.25ZM8.25 8.25h4.31v2.02h.06c.6-1.13 2.07-2.33 4.26-2.33 4.55 0 5.39 3 5.39 6.9V23h-4.5v-6.28c0-1.5-.03-3.42-2.08-3.42-2.09 0-2.41 1.63-2.41 3.31V23h-4.5V8.25Z" />
    </svg>
  )
}
function FacebookIcon() {
  return (
    <svg width={15} height={15} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06c0 5 3.66 9.16 8.44 9.94v-7.03H7.9v-2.9h2.54V9.85c0-2.51 1.49-3.9 3.77-3.9 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56v1.88h2.78l-.44 2.9h-2.34V22c4.78-.78 8.44-4.94 8.44-9.94Z" />
    </svg>
  )
}

/** Share-link row for a blog post. Puck blocks render the same way in the editor
 * canvas and on the public page, and have no access to the browser's real
 * `window.location` at author time (and no request context at all in the editor) —
 * so instead of trying to auto-derive the URL, the editor fills in the real
 * published URL/title as plain text per-post. Plain `https://twitter.com/intent/...`
 * style links, no new share-widget dependency. */
function SocialShareRender({ shareUrl, shareTitle }: SocialShareProps) {
  const [copied, setCopied] = useState(false)
  const url = encodeURIComponent(shareUrl || '')
  const title = encodeURIComponent(shareTitle || '')

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(shareUrl || '')
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // clipboard API unavailable — silently no-op, link is still visible in the address bar
    }
  }

  return (
    <div className="social-share">
      <span className="social-share-label">Share this article</span>
      <div className="social-share-row">
        <a
          href={`https://twitter.com/intent/tweet?url=${url}&text=${title}`}
          target="_blank"
          rel="noopener noreferrer"
          className="social-share-btn"
          aria-label="Share on X"
        >
          <XIcon />
        </a>
        <a
          href={`https://www.linkedin.com/sharing/share-offsite/?url=${url}`}
          target="_blank"
          rel="noopener noreferrer"
          className="social-share-btn"
          aria-label="Share on LinkedIn"
        >
          <LinkedinIcon />
        </a>
        <a
          href={`https://www.facebook.com/sharer/sharer.php?u=${url}`}
          target="_blank"
          rel="noopener noreferrer"
          className="social-share-btn"
          aria-label="Share on Facebook"
        >
          <FacebookIcon />
        </a>
        <button type="button" onClick={copyLink} className="social-share-btn" aria-label="Copy link">
          {copied ? <Check size={16} aria-hidden /> : <Link2 size={16} aria-hidden />}
        </button>
      </div>
    </div>
  )
}

export const SocialShare: ComponentConfig<SocialShareProps> = {
  fields: {
    shareUrl: { type: 'text' },
    shareTitle: { type: 'text' },
  },
  defaultProps: {
    shareUrl: '',
    shareTitle: '',
  },
  render: (props) => <SocialShareRender {...props} />,
}
