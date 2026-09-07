import { NextRequest, NextResponse } from 'next/server'
import { requireApiKey, addCorsHeaders } from '@/lib/api-auth'
import { dispatchWebhook, getWebhookPayload } from '@/lib/webhooks'

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

type RouteContext = { params: Promise<{ id: string }> }

// POST /api/v2/webhooks/[id]/test — Send a test event
export const POST = requireApiKey(async (request: NextRequest, context: RouteContext, key: any) => {
  try {
    const { id } = await context.params
    const webhook = stubWebhooks.find(w => w.id === id)

    if (!webhook) {
      const response = NextResponse.json({ error: 'Webhook not found' }, { status: 404 })
      return addCorsHeaders(response)
    }

    const body = await request.json().catch(() => ({}))
    const event = body.event || 'webhook.test'

    if (webhook.events.length > 0 && !webhook.events.includes(event)) {
      // Allow test events even if not in subscribed events list
      // But warn about it
    }

    const testData = getWebhookPayload(event, {
      id: 'test_' + Date.now(),
      message: 'This is a test webhook delivery',
      timestamp: new Date().toISOString(),
    })

    const result = await dispatchWebhook(webhook.url, webhook.secret, event, testData)

    // Log the delivery attempt
    const delivery = {
      id: 'dlv_' + Date.now(),
      webhookId: id,
      event,
      statusCode: result.statusCode,
      success: result.success,
      error: result.error,
      attempts: result.attempts,
      payload: testData,
      deliveredAt: new Date().toISOString(),
    }

    stubDeliveries.push(delivery)

    const response = NextResponse.json({
      data: {
        deliveryId: delivery.id,
        event,
        success: result.success,
        statusCode: result.statusCode,
        error: result.error,
        attempts: result.attempts,
      },
    })
    return addCorsHeaders(response)
  } catch (error: any) {
    const response = NextResponse.json({ error: error.message }, { status: 500 })
    return addCorsHeaders(response)
  }
})

export async function OPTIONS() {
  return addCorsHeaders(new NextResponse(null, { status: 204 }))
}
