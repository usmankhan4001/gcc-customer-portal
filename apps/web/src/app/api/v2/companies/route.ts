import { NextRequest, NextResponse } from 'next/server'
import { requireApiKey, parsePagination, parseSearch, parseFilters, addCorsHeaders } from '@/lib/api-auth'

const stubCompanies = [
  { id: '1', name: 'Acme Corp', industry: 'Technology', size: '50-100', website: 'https://acme.com', email: 'info@acme.com', phone: '+971501234567', address: 'Dubai, UAE', status: 'active', createdAt: new Date().toISOString() },
  { id: '2', name: 'Globex Inc', industry: 'Finance', size: '100-500', website: 'https://globex.com', email: 'info@globex.com', phone: '+971507654321', address: 'Abu Dhabi, UAE', status: 'active', createdAt: new Date().toISOString() },
]

export const GET = requireApiKey(async (request: NextRequest, context: any, key: any) => {
  try {
    const { page, limit, offset } = parsePagination(request)
    const search = parseSearch(request)
    const filters = parseFilters(request)

    let companies = [...stubCompanies]

    if (search) {
      const q = search.toLowerCase()
      companies = companies.filter(c =>
        c.name.toLowerCase().includes(q) ||
        c.industry.toLowerCase().includes(q)
      )
    }

    for (const [filterKey, filterValue] of Object.entries(filters)) {
      companies = companies.filter(c => (c as any)[filterKey] === filterValue)
    }

    const total = companies.length
    const paginated = companies.slice(offset, offset + limit)

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
    const { name, industry, size, website, email, phone, address, status = 'active', customAttributes = {} } = body

    if (!name?.trim()) {
      const response = NextResponse.json({ error: 'Company name is required' }, { status: 400 })
      return addCorsHeaders(response)
    }

    const company = {
      id: 'company-' + Date.now(),
      name,
      industry,
      size,
      website,
      email,
      phone,
      address,
      status,
      customAttributes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    const response = NextResponse.json({ data: company }, { status: 201 })
    return addCorsHeaders(response)
  } catch (error: any) {
    const response = NextResponse.json({ error: error.message }, { status: 500 })
    return addCorsHeaders(response)
  }
})

export async function OPTIONS() {
  return addCorsHeaders(new NextResponse(null, { status: 204 }))
}
