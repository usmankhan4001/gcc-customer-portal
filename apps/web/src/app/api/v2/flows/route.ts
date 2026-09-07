import { NextRequest, NextResponse } from 'next/server'
import { requireApiKey, parsePagination, parseSearch, parseFilters, addCorsHeaders } from '@/lib/api-auth'

const stubFlows = [
  { id: '1', name: 'Welcome Flow', status: 'active', trigger: { type: 'keyword', value: 'start' }, nodeCount: 5, executionCount: 230, createdAt: new Date().toISOString() },
  { id: '2', name: 'Lead Nurture', status: 'draft', trigger: { type: 'tag_added', value: 'lead' }, nodeCount: 8, executionCount: 0, createdAt: new Date().toISOString() },
]

export const GET = requireApiKey(async (request: NextRequest, context: any, key: any) => {
  try {
    const { page, limit, offset } = parsePagination(request)
    const search = parseSearch(request)
    const filters = parseFilters(request)

    let flows = [...stubFlows]

    if (search) {
      const q = search.toLowerCase()
      flows = flows.filter(f => f.name.toLowerCase().includes(q))
    }

    for (const [filterKey, filterValue] of Object.entries(filters)) {
      flows = flows.filter(f => (f as any)[filterKey] === filterValue)
    }

    const total = flows.length
    const paginated = flows.slice(offset, offset + limit)

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
    const { name, trigger, nodes = [], status = 'draft', customAttributes = {} } = body

    if (!name?.trim()) {
      const response = NextResponse.json({ error: 'Flow name is required' }, { status: 400 })
      return addCorsHeaders(response)
    }

    const flow = {
      id: 'flow-' + Date.now(),
      name,
      trigger: trigger || { type: 'manual', value: null },
      nodes,
      nodeCount: nodes.length,
      executionCount: 0,
      status,
      customAttributes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    const response = NextResponse.json({ data: flow }, { status: 201 })
    return addCorsHeaders(response)
  } catch (error: any) {
    const response = NextResponse.json({ error: error.message }, { status: 500 })
    return addCorsHeaders(response)
  }
})

export async function OPTIONS() {
  return addCorsHeaders(new NextResponse(null, { status: 204 }))
}
