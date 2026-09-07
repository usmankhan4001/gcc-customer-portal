import { NextRequest, NextResponse } from 'next/server'
import { requireApiKey, addCorsHeaders } from '@/lib/api-auth'

const stubCompanies = [
  { id: '1', name: 'Acme Corp', industry: 'Technology', size: '50-100', website: 'https://acme.com', email: 'info@acme.com', phone: '+971501234567', address: 'Dubai, UAE', status: 'active', createdAt: new Date().toISOString() },
  { id: '2', name: 'Globex Inc', industry: 'Finance', size: '100-500', website: 'https://globex.com', email: 'info@globex.com', phone: '+971507654321', address: 'Abu Dhabi, UAE', status: 'active', createdAt: new Date().toISOString() },
]

type RouteContext = { params: Promise<{ id: string }> }

export const GET = requireApiKey(async (request: NextRequest, context: RouteContext, key: any) => {
  try {
    const { id } = await context.params
    const company = stubCompanies.find(c => c.id === id)

    if (!company) {
      const response = NextResponse.json({ error: 'Company not found' }, { status: 404 })
      return addCorsHeaders(response)
    }

    const response = NextResponse.json({ data: company })
    return addCorsHeaders(response)
  } catch (error: any) {
    const response = NextResponse.json({ error: error.message }, { status: 500 })
    return addCorsHeaders(response)
  }
})

export const PATCH = requireApiKey(async (request: NextRequest, context: RouteContext, key: any) => {
  try {
    const { id } = await context.params
    const company = stubCompanies.find(c => c.id === id)

    if (!company) {
      const response = NextResponse.json({ error: 'Company not found' }, { status: 404 })
      return addCorsHeaders(response)
    }

    const body = await request.json()
    const updated = { ...company, ...body, id, updatedAt: new Date().toISOString() }

    const response = NextResponse.json({ data: updated })
    return addCorsHeaders(response)
  } catch (error: any) {
    const response = NextResponse.json({ error: error.message }, { status: 500 })
    return addCorsHeaders(response)
  }
})

export const DELETE = requireApiKey(async (request: NextRequest, context: RouteContext, key: any) => {
  try {
    const { id } = await context.params
    const company = stubCompanies.find(c => c.id === id)

    if (!company) {
      const response = NextResponse.json({ error: 'Company not found' }, { status: 404 })
      return addCorsHeaders(response)
    }

    const response = NextResponse.json({ data: { deleted: true, id } })
    return addCorsHeaders(response)
  } catch (error: any) {
    const response = NextResponse.json({ error: error.message }, { status: 500 })
    return addCorsHeaders(response)
  }
})

export async function OPTIONS() {
  return addCorsHeaders(new NextResponse(null, { status: 204 }))
}
