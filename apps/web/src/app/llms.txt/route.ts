import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/** llms.txt (https://llmstxt.org) — a plaintext index of the site's key content for
 * AI answer engines/LLM crawlers to consume directly, separate from the HTML sitemap.
 * TODO: Replace with Drizzle queries once content is migrated. */
export async function GET() {
  const content = `# GCC Startup
# Company formation services in UAE, Hong Kong, Singapore, UK
# https://gccstartup.com
`
  return new NextResponse(content, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}
