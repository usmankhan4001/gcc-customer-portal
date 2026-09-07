import { NextRequest, NextResponse } from 'next/server'
import { requireApiKey, parsePagination, parseSearch, parseFilters, addCorsHeaders } from '@/lib/api-auth'
import { dispatchWebhook, getWebhookPayload } from '@/lib/webhooks'

// Webhook subscription registry
// TODO: Replace with actual database queries
const stubWebhooks = [
  {
    id: 'wh_1',
    url: 'https://example.com/webhooks/gcc',
    events: ['contact.created', 'contact.updated', 'deal.won'],
    secret: 'whsec_abc123def456',
    status: 'active',
    description: 'Production webhook for CRM events',
    createdAt: '2026-09-01T10:00:00Z',
    updatedAt: '2026-09-01T10:00:00Z',
  },
  {
    id: 'wh_2',
    url: 'https://staging.example.com/webhooks',
    events: ['lead.captured', 'ticket.created'],
    secret: 'whsec_xyz789uvw012',
    status: 'active',
    description: 'Staging webhook for lead events',
    createdAt: '2026-09-05T14:30:00Z',
    updatedAt: '2026-09-05T14:30:00Z',
  },
]

const stubDeliveries: any[] = []

export const GET = requireApiKey(async (request: NextRequest, context: any, key: any) => {
  try {
    const { page, limit, offset } = parsePagination(request)
    const search = parseSearch(request)
    const filters = parseFilters(request)

    let webhooks = [...stubWebhooks]

    if (search) {
      const q = search.toLowerCase()
      webhooks = webhooks.filter(w =>
        w.url.toLowerCase().includes(q) ||
        w.description.toLowerCase().includes(q) ||
        w.events.some(e => e.includes(q))
      )
    }

    for (const [filterKey, filterValue] of Object.entries(filters)) {
      webhooks = webhooks.filter(w => (w as any)[filterKey] === filterValue)
    }

    const total = webhooks.length
    const paginated = webhooks.slice(offset, offset + limit)

    const response = NextResponse.json({
      data: paginated,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    })
    return addCorsHeaders(response)
  } catch (error: any) {
    const response = NextResponse.json({ error: error.message }, { status: 500 })
    return addCorsHeaders(response)
  }
})

export const POST = requireApiKey(async (request: NextRequest, context: any, key: any) => {
  try {
    const body = await request.json()
    const { url, events, secret, description = '' } = body

    if (!url?.trim()) {
      const response = NextResponse.json(
        { error: 'url is required' },
        { status: 400 }
      )
      return addCorsHeaders(response)
    }

    if (!events || !Array.isArray(events) || events.length === 0) {
      const response = NextResponse.json(
        { error: 'events must be a non-empty array' },
        { status: 400 }
      )
      return addCorsHeaders(response)
    }

    // Validate URL format
    try {
      new URL(url)
    } catch {
      const response = NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      )
      return addCorsHeaders(response)
    }

    const webhook = {
      id: 'wh_' + Date.now(),
      url,
      events,
      secret: secret || 'whsec_' + require('crypto').randomBytes(24).toString('hex'),
      status: 'active',
      description,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    // TODO: Insert into database
    stubWebhooks.push(webhook)

    const response = NextResponse.json({ data: webhook }, { status: 201 })
    return addCorsHeaders(response)
  } catch (error: any) {
    const response = NextResponse.json({ error: error.message }, { status: 500 })
    return addCorsHeaders(response)
  }
})

export async function OPTIONS() {
  return addCorsHeaders(new NextResponse(null, { status: 204 }))
}
