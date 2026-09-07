import { NextRequest, NextResponse } from 'next/server'
import { requireApiKey, parsePagination, parseSearch, parseFilters, addCorsHeaders } from '@/lib/api-auth'

const stubDeals = [
  { id: '1', title: 'Enterprise Deal', value: 50000, currency: 'AED', stage: 'qualified', contactId: '1', companyId: '1', assignedTo: 'user-1', expectedCloseDate: '2026-12-31', status: 'open', createdAt: new Date().toISOString() },
  { id: '2', title: 'SaaS Subscription', value: 12000, currency: 'AED', stage: 'proposal', contactId: '2', companyId: '2', assignedTo: 'user-2', expectedCloseDate: '2026-09-30', status: 'open', createdAt: new Date().toISOString() },
]

export const GET = requireApiKey(async (request: NextRequest, context: any, key: any) => {
  try {
    const { page, limit, offset } = parsePagination(request)
    const search = parseSearch(request)
    const filters = parseFilters(request)

    let deals = [...stubDeals]

    if (search) {
      const q = search.toLowerCase()
      deals = deals.filter(d => d.title.toLowerCase().includes(q))
    }

    for (const [filterKey, filterValue] of Object.entries(filters)) {
      deals = deals.filter(d => (d as any)[filterKey] === filterValue)
    }

    const total = deals.length
    const paginated = deals.slice(offset, offset + limit)

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
    const { title, value, currency = 'AED', stage = 'lead', contactId, companyId, assignedTo, expectedCloseDate, status = 'open', customAttributes = {} } = body

    if (!title?.trim()) {
      const response = NextResponse.json({ error: 'Deal title is required' }, { status: 400 })
      return addCorsHeaders(response)
    }

    const deal = {
      id: 'deal-' + Date.now(),
      title,
      value,
      currency,
      stage,
      contactId,
      companyId,
      assignedTo,
      expectedCloseDate,
      status,
      customAttributes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    const response = NextResponse.json({ data: deal }, { status: 201 })
    return addCorsHeaders(response)
  } catch (error: any) {
    const response = NextResponse.json({ error: error.message }, { status: 500 })
    return addCorsHeaders(response)
  }
})

export async function OPTIONS() {
  return addCorsHeaders(new NextResponse(null, { status: 204 }))
}
