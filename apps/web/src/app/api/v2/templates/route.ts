import { NextRequest, NextResponse } from 'next/server'
import { requireApiKey, parsePagination, parseSearch, parseFilters, addCorsHeaders } from '@/lib/api-auth'

const stubTemplates = [
  { id: '1', name: 'Welcome Message', type: 'whatsapp', category: 'marketing', language: 'en', status: 'approved', content: 'Hello {{firstName}}, welcome to {{companyName}}!', variables: ['firstName', 'companyName'], createdAt: new Date().toISOString() },
  { id: '2', name: 'Order Confirmation', type: 'email', category: 'transactional', language: 'en', status: 'approved', content: '<h1>Order #{{orderId}} confirmed</h1>', variables: ['orderId'], createdAt: new Date().toISOString() },
]

export const GET = requireApiKey(async (request: NextRequest, context: any, key: any) => {
  try {
    const { page, limit, offset } = parsePagination(request)
    const search = parseSearch(request)
    const filters = parseFilters(request)

    let templates = [...stubTemplates]

    if (search) {
      const q = search.toLowerCase()
      templates = templates.filter(t => t.name.toLowerCase().includes(q))
    }

    for (const [filterKey, filterValue] of Object.entries(filters)) {
      templates = templates.filter(t => (t as any)[filterKey] === filterValue)
    }

    const total = templates.length
    const paginated = templates.slice(offset, offset + limit)

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
    const { name, type = 'whatsapp', category = 'marketing', language = 'en', content, variables = [], status = 'draft', customAttributes = {} } = body

    if (!name?.trim() || !content?.trim()) {
      const response = NextResponse.json({ error: 'Name and content are required' }, { status: 400 })
      return addCorsHeaders(response)
    }

    const template = {
      id: 'template-' + Date.now(),
      name,
      type,
      category,
      language,
      content,
      variables,
      status,
      customAttributes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    const response = NextResponse.json({ data: template }, { status: 201 })
    return addCorsHeaders(response)
  } catch (error: any) {
    const response = NextResponse.json({ error: error.message }, { status: 500 })
    return addCorsHeaders(response)
  }
})

export async function OPTIONS() {
  return addCorsHeaders(new NextResponse(null, { status: 204 }))
}
