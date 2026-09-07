import { NextRequest, NextResponse } from 'next/server'
import { requireApiKey, addCorsHeaders } from '@/lib/api-auth'

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

type RouteContext = { params: Promise<{ id: string }> }

export const GET = requireApiKey(async (request: NextRequest, context: RouteContext, key: any) => {
  try {
    const { id } = await context.params
    const webhook = stubWebhooks.find(w => w.id === id)

    if (!webhook) {
      const response = NextResponse.json({ error: 'Webhook not found' }, { status: 404 })
      return addCorsHeaders(response)
    }

    const response = NextResponse.json({ data: webhook })
    return addCorsHeaders(response)
  } catch (error: any) {
    const response = NextResponse.json({ error: error.message }, { status: 500 })
    return addCorsHeaders(response)
  }
})

export const PATCH = requireApiKey(async (request: NextRequest, context: RouteContext, key: any) => {
  try {
    const { id } = await context.params
    const webhookIndex = stubWebhooks.findIndex(w => w.id === id)

    if (webhookIndex === -1) {
      const response = NextResponse.json({ error: 'Webhook not found' }, { status: 404 })
      return addCorsHeaders(response)
    }

    const body = await request.json()
    const { url, events, secret, description, status } = body

    if (url !== undefined) {
      try {
        new URL(url)
      } catch {
        const response = NextResponse.json(
          { error: 'Invalid URL format' },
          { status: 400 }
        )
        return addCorsHeaders(response)
      }
    }

    if (events !== undefined && (!Array.isArray(events) || events.length === 0)) {
      const response = NextResponse.json(
        { error: 'events must be a non-empty array' },
        { status: 400 }
      )
      return addCorsHeaders(response)
    }

    const updated = {
      ...stubWebhooks[webhookIndex],
      ...(url !== undefined && { url }),
      ...(events !== undefined && { events }),
      ...(secret !== undefined && { secret }),
      ...(description !== undefined && { description }),
      ...(status !== undefined && { status }),
      updatedAt: new Date().toISOString(),
    }

    stubWebhooks[webhookIndex] = updated

    const response = NextResponse.json({ data: updated })
    return addCorsHeaders(response)
  } catch (error: any) {
    const response = NextResponse.json({ error: error.message }, { status: 500 })
    return addCorsHeaders(response)
  }
})

export const DELETE = requireApiKey(async (request: NextRequest, context: RouteContext, key: any) => {
  try {
    const { id } = await context.params
    const webhookIndex = stubWebhooks.findIndex(w => w.id === id)

    if (webhookIndex === -1) {
      const response = NextResponse.json({ error: 'Webhook not found' }, { status: 404 })
      return addCorsHeaders(response)
    }

    stubWebhooks.splice(webhookIndex, 1)

    const response = NextResponse.json({ data: { deleted: true, id } })
    return addCorsHeaders(response)
  } catch (error: any) {
    const response = NextResponse.json({ error: error.message }, { status: 500 })
    return addCorsHeaders(response)
  }
})

export async function OPTIONS() {
  return addCorsHeaders(new NextResponse(null, { status: 204 }))
}
