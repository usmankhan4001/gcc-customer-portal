import { NextRequest, NextResponse } from 'next/server'
import { requireApiKey, parsePagination, addCorsHeaders } from '@/lib/api-auth'

// TODO: Replace with actual database queries
const stubWebhooks = [
  { id: 'wh_1', url: 'https://example.com/webhooks/gcc', status: 'active' },
  { id: 'wh_2', url: 'https://staging.example.com/webhooks', status: 'active' },
]

const stubDeliveries = [
  {
    id: 'dlv_1',
    webhookId: 'wh_1',
    event: 'contact.created',
    statusCode: 200,
    success: true,
    error: null,
    attempts: 1,
    payload: {
      id: 'test_001',
      event: 'contact.created',
      timestamp: '2026-09-07T12:00:00Z',
      data: { contact: { id: 'c_1', email: 'john@example.com', name: 'John Doe' }, source: 'form' },
    },
    deliveredAt: '2026-09-07T12:00:00Z',
  },
  {
    id: 'dlv_2',
    webhookId: 'wh_1',
    event: 'deal.won',
    statusCode: 500,
    success: false,
    error: 'HTTP 500: Internal Server Error',
    attempts: 3,
    payload: {
      id: 'test_002',
      event: 'deal.won',
      timestamp: '2026-09-07T12:30:00Z',
      data: { deal: { id: 'd_1', title: 'Enterprise Plan', value: 50000, currency: 'AED' }, contact: { id: 'c_2' } },
    },
    deliveredAt: '2026-09-07T12:30:00Z',
  },
  {
    id: 'dlv_3',
    webhookId: 'wh_2',
    event: 'lead.captured',
    statusCode: 200,
    success: true,
    error: null,
    attempts: 1,
    payload: {
      id: 'test_003',
      event: 'lead.captured',
      timestamp: '2026-09-07T14:00:00Z',
      data: { lead: { id: 'l_1', email: 'jane@example.com', source: 'website', tool: 'contact-form' } },
    },
    deliveredAt: '2026-09-07T14:00:00Z',
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

    const { page, limit, offset } = parsePagination(request)
    const { searchParams } = new URL(request.url)
    const event = searchParams.get('event')
    const status = searchParams.get('status') // 'success' | 'failed'

    let deliveries = stubDeliveries.filter(d => d.webhookId === id)

    if (event) {
      deliveries = deliveries.filter(d => d.event === event)
    }

    if (status === 'success') {
      deliveries = deliveries.filter(d => d.success)
    } else if (status === 'failed') {
      deliveries = deliveries.filter(d => !d.success)
    }

    // Sort by most recent first
    deliveries.sort((a, b) => new Date(b.deliveredAt).getTime() - new Date(a.deliveredAt).getTime())

    const total = deliveries.length
    const paginated = deliveries.slice(offset, offset + limit)

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

export async function OPTIONS() {
  return addCorsHeaders(new NextResponse(null, { status: 204 }))
}
