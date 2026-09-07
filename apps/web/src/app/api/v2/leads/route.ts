import { NextRequest, NextResponse } from 'next/server'
import { requireApiKey, parsePagination, parseSearch, parseFilters, addCorsHeaders } from '@/lib/api-auth'

const stubLeads = [
  { id: '1', firstName: 'Ahmed', lastName: 'Ali', email: 'ahmed@startup.com', phone: '+971501111111', source: 'website', stage: 'new', score: 85, assignedTo: 'user-1', createdAt: new Date().toISOString() },
  { id: '2', firstName: 'Sara', lastName: 'Khan', email: 'sara@corp.com', phone: '+971502222222', source: 'referral', stage: 'contacted', score: 72, assignedTo: 'user-2', createdAt: new Date().toISOString() },
]

export const GET = requireApiKey(async (request: NextRequest, context: any, key: any) => {
  try {
    const { page, limit, offset } = parsePagination(request)
    const search = parseSearch(request)
    const filters = parseFilters(request)

    let leads = [...stubLeads]

    if (search) {
      const q = search.toLowerCase()
      leads = leads.filter(l =>
        l.firstName.toLowerCase().includes(q) ||
        l.lastName.toLowerCase().includes(q) ||
        l.email.toLowerCase().includes(q)
      )
    }

    for (const [filterKey, filterValue] of Object.entries(filters)) {
      leads = leads.filter(l => (l as any)[filterKey] === filterValue)
    }

    const total = leads.length
    const paginated = leads.slice(offset, offset + limit)

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
    const { firstName, lastName, email, phone, source = 'api', stage = 'new', score = 0, assignedTo, customAttributes = {} } = body

    if (!email?.trim() && !phone?.trim()) {
      const response = NextResponse.json({ error: 'Email or phone is required' }, { status: 400 })
      return addCorsHeaders(response)
    }

    const lead = {
      id: 'lead-' + Date.now(),
      firstName,
      lastName,
      email,
      phone,
      source,
      stage,
      score,
      assignedTo,
      customAttributes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    const response = NextResponse.json({ data: lead }, { status: 201 })
    return addCorsHeaders(response)
  } catch (error: any) {
    const response = NextResponse.json({ error: error.message }, { status: 500 })
    return addCorsHeaders(response)
  }
})

export async function OPTIONS() {
  return addCorsHeaders(new NextResponse(null, { status: 204 }))
}
