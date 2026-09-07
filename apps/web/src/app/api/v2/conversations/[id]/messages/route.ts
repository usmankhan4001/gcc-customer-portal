import { NextRequest, NextResponse } from 'next/server'
import { requireApiKey, parsePagination, addCorsHeaders } from '@/lib/api-auth'

const stubMessages = [
  { id: '1', conversationId: '1', direction: 'inbound', content: 'Hello, I need help', channel: 'whatsapp', status: 'delivered', createdAt: new Date().toISOString() },
  { id: '2', conversationId: '1', direction: 'outbound', content: 'Hi! How can I assist you?', channel: 'whatsapp', status: 'sent', createdAt: new Date().toISOString() },
]

type RouteContext = { params: Promise<{ id: string }> }

export const GET = requireApiKey(async (request: NextRequest, context: RouteContext, key: any) => {
  try {
    const { id } = await context.params
    const { page, limit, offset } = parsePagination(request)

    const messages = stubMessages.filter(m => m.conversationId === id)
    const total = messages.length
    const paginated = messages.slice(offset, offset + limit)

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

export const POST = requireApiKey(async (request: NextRequest, context: RouteContext, key: any) => {
  try {
    const { id } = await context.params
    const body = await request.json()
    const { content, channel = 'whatsapp', direction = 'outbound', mediaUrl } = body

    if (!content?.trim()) {
      const response = NextResponse.json({ error: 'Message content is required' }, { status: 400 })
      return addCorsHeaders(response)
    }

    const message = {
      id: 'msg-' + Date.now(),
      conversationId: id,
      direction,
      content,
      channel,
      mediaUrl,
      status: 'sent',
      createdAt: new Date().toISOString(),
    }

    const response = NextResponse.json({ data: message }, { status: 201 })
    return addCorsHeaders(response)
  } catch (error: any) {
    const response = NextResponse.json({ error: error.message }, { status: 500 })
    return addCorsHeaders(response)
  }
})

export async function OPTIONS() {
  return addCorsHeaders(new NextResponse(null, { status: 204 }))
}
