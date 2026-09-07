import { NextRequest, NextResponse } from 'next/server'
import { requireApiKey, parsePagination, parseSearch, parseFilters, addCorsHeaders } from '@/lib/api-auth'

// TODO: Replace with actual database queries
const stubContacts = [
  { id: '1', firstName: 'John', lastName: 'Doe', email: 'john@example.com', phone: '+971501234567', companyId: '1', status: 'active', createdAt: new Date().toISOString() },
  { id: '2', firstName: 'Jane', lastName: 'Smith', email: 'jane@example.com', phone: '+971507654321', companyId: '2', status: 'active', createdAt: new Date().toISOString() },
]

export const GET = requireApiKey(async (request: NextRequest, context: any, key: any) => {
  try {
    const { page, limit, offset } = parsePagination(request)
    const search = parseSearch(request)
    const filters = parseFilters(request)

    let contacts = [...stubContacts]

    if (search) {
      const q = search.toLowerCase()
      contacts = contacts.filter(c =>
        c.firstName.toLowerCase().includes(q) ||
        c.lastName.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q)
      )
    }

    for (const [filterKey, filterValue] of Object.entries(filters)) {
      contacts = contacts.filter(c => (c as any)[filterKey] === filterValue)
    }

    const total = contacts.length
    const paginated = contacts.slice(offset, offset + limit)

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
    const { firstName, lastName, email, phone, companyId, status = 'active', customAttributes = {} } = body

    if (!firstName?.trim() && !email?.trim() && !phone?.trim()) {
      const response = NextResponse.json(
        { error: 'At least one of firstName, email, or phone is required' },
        { status: 400 }
      )
      return addCorsHeaders(response)
    }

    // TODO: Insert into database
    const contact = {
      id: 'contact-' + Date.now(),
      firstName,
      lastName,
      email,
      phone,
      companyId,
      status,
      customAttributes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    const response = NextResponse.json({ data: contact }, { status: 201 })
    return addCorsHeaders(response)
  } catch (error: any) {
    const response = NextResponse.json({ error: error.message }, { status: 500 })
    return addCorsHeaders(response)
  }
})

export async function OPTIONS() {
  return addCorsHeaders(new NextResponse(null, { status: 204 }))
}
