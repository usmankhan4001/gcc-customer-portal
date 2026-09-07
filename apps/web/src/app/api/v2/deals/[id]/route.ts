import { NextRequest, NextResponse } from 'next/server'
import { requireApiKey, addCorsHeaders } from '@/lib/api-auth'

const stubDeals = [
  { id: '1', title: 'Enterprise Deal', value: 50000, currency: 'AED', stage: 'qualified', contactId: '1', companyId: '1', assignedTo: 'user-1', expectedCloseDate: '2026-12-31', status: 'open', createdAt: new Date().toISOString() },
  { id: '2', title: 'SaaS Subscription', value: 12000, currency: 'AED', stage: 'proposal', contactId: '2', companyId: '2', assignedTo: 'user-2', expectedCloseDate: '2026-09-30', status: 'open', createdAt: new Date().toISOString() },
]

type RouteContext = { params: Promise<{ id: string }> }

export const GET = requireApiKey(async (request: NextRequest, context: RouteContext, key: any) => {
  try {
    const { id } = await context.params
    const deal = stubDeals.find(d => d.id === id)

    if (!deal) {
      const response = NextResponse.json({ error: 'Deal not found' }, { status: 404 })
      return addCorsHeaders(response)
    }

    const response = NextResponse.json({ data: deal })
    return addCorsHeaders(response)
  } catch (error: any) {
    const response = NextResponse.json({ error: error.message }, { status: 500 })
    return addCorsHeaders(response)
  }
})

export const PATCH = requireApiKey(async (request: NextRequest, context: RouteContext, key: any) => {
  try {
    const { id } = await context.params
    const deal = stubDeals.find(d => d.id === id)

    if (!deal) {
      const response = NextResponse.json({ error: 'Deal not found' }, { status: 404 })
      return addCorsHeaders(response)
    }

    const body = await request.json()
    const updated = { ...deal, ...body, id, updatedAt: new Date().toISOString() }

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
    const deal = stubDeals.find(d => d.id === id)

    if (!deal) {
      const response = NextResponse.json({ error: 'Deal not found' }, { status: 404 })
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
