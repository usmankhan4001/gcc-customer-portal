import { NextRequest, NextResponse } from 'next/server'
import { requireApiKey, parsePagination, parseSearch, parseFilters, addCorsHeaders } from '@/lib/api-auth'

const stubConversations = [
  { id: '1', contactId: '1', channel: 'whatsapp', status: 'active', lastMessageAt: new Date().toISOString(), assignedTo: 'user-1', createdAt: new Date().toISOString() },
  { id: '2', contactId: '2', channel: 'email', status: 'active', lastMessageAt: new Date().toISOString(), assignedTo: 'user-2', createdAt: new Date().toISOString() },
]

export const GET = requireApiKey(async (request: NextRequest, context: any, key: any) => {
  try {
    const { page, limit, offset } = parsePagination(request)
    const search = parseSearch(request)
    const filters = parseFilters(request)

    let conversations = [...stubConversations]

    if (search) {
      const q = search.toLowerCase()
      conversations = conversations.filter(c => c.channel.toLowerCase().includes(q))
    }

    for (const [filterKey, filterValue] of Object.entries(filters)) {
      conversations = conversations.filter(c => (c as any)[filterKey] === filterValue)
    }

    const total = conversations.length
    const paginated = conversations.slice(offset, offset + limit)

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
    const { contactId, channel = 'whatsapp', assignedTo, customAttributes = {} } = body

    if (!contactId?.trim()) {
      const response = NextResponse.json({ error: 'Contact ID is required' }, { status: 400 })
      return addCorsHeaders(response)
    }

    const conversation = {
      id: 'conv-' + Date.now(),
      contactId,
      channel,
      status: 'active',
      lastMessageAt: new Date().toISOString(),
      assignedTo,
      customAttributes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    const response = NextResponse.json({ data: conversation }, { status: 201 })
    return addCorsHeaders(response)
  } catch (error: any) {
    const response = NextResponse.json({ error: error.message }, { status: 500 })
    return addCorsHeaders(response)
  }
})

export async function OPTIONS() {
  return addCorsHeaders(new NextResponse(null, { status: 204 }))
}
