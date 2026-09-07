import { NextRequest, NextResponse } from 'next/server'
import { requireApiKey, parsePagination, parseSearch, parseFilters, addCorsHeaders } from '@/lib/api-auth'

const stubCampaigns = [
  { id: '1', name: 'Welcome Series', type: 'whatsapp', status: 'active', audience: { segmentId: 'seg-1', count: 150 }, sent: 150, delivered: 145, read: 120, replied: 35, createdAt: new Date().toISOString() },
  { id: '2', name: 'Q2 Promo', type: 'email', status: 'draft', audience: { segmentId: 'seg-2', count: 500 }, sent: 0, delivered: 0, read: 0, replied: 0, createdAt: new Date().toISOString() },
]

export const GET = requireApiKey(async (request: NextRequest, context: any, key: any) => {
  try {
    const { page, limit, offset } = parsePagination(request)
    const search = parseSearch(request)
    const filters = parseFilters(request)

    let campaigns = [...stubCampaigns]

    if (search) {
      const q = search.toLowerCase()
      campaigns = campaigns.filter(c => c.name.toLowerCase().includes(q))
    }

    for (const [filterKey, filterValue] of Object.entries(filters)) {
      campaigns = campaigns.filter(c => (c as any)[filterKey] === filterValue)
    }

    const total = campaigns.length
    const paginated = campaigns.slice(offset, offset + limit)

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
    const { name, type = 'whatsapp', templateId, audience, status = 'draft', scheduledAt, customAttributes = {} } = body

    if (!name?.trim()) {
      const response = NextResponse.json({ error: 'Campaign name is required' }, { status: 400 })
      return addCorsHeaders(response)
    }

    const campaign = {
      id: 'campaign-' + Date.now(),
      name,
      type,
      templateId,
      audience: audience || { segmentId: null, count: 0 },
      status,
      scheduledAt,
      sent: 0,
      delivered: 0,
      read: 0,
      replied: 0,
      customAttributes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    const response = NextResponse.json({ data: campaign }, { status: 201 })
    return addCorsHeaders(response)
  } catch (error: any) {
    const response = NextResponse.json({ error: error.message }, { status: 500 })
    return addCorsHeaders(response)
  }
})

export async function OPTIONS() {
  return addCorsHeaders(new NextResponse(null, { status: 204 }))
}
