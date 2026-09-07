import { NextRequest, NextResponse } from 'next/server'
import { requireApiKey, addCorsHeaders } from '@/lib/api-auth'

const stubLeads = [
  { id: '1', firstName: 'Ahmed', lastName: 'Ali', email: 'ahmed@startup.com', phone: '+971501111111', source: 'website', stage: 'new', score: 85, assignedTo: 'user-1', createdAt: new Date().toISOString() },
  { id: '2', firstName: 'Sara', lastName: 'Khan', email: 'sara@corp.com', phone: '+971502222222', source: 'referral', stage: 'contacted', score: 72, assignedTo: 'user-2', createdAt: new Date().toISOString() },
]

type RouteContext = { params: Promise<{ id: string }> }

export const GET = requireApiKey(async (request: NextRequest, context: RouteContext, key: any) => {
  try {
    const { id } = await context.params
    const lead = stubLeads.find(l => l.id === id)

    if (!lead) {
      const response = NextResponse.json({ error: 'Lead not found' }, { status: 404 })
      return addCorsHeaders(response)
    }

    const response = NextResponse.json({ data: lead })
    return addCorsHeaders(response)
  } catch (error: any) {
    const response = NextResponse.json({ error: error.message }, { status: 500 })
    return addCorsHeaders(response)
  }
})

export const PATCH = requireApiKey(async (request: NextRequest, context: RouteContext, key: any) => {
  try {
    const { id } = await context.params
    const lead = stubLeads.find(l => l.id === id)

    if (!lead) {
      const response = NextResponse.json({ error: 'Lead not found' }, { status: 404 })
      return addCorsHeaders(response)
    }

    const body = await request.json()
    const updated = { ...lead, ...body, id, updatedAt: new Date().toISOString() }

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
    const lead = stubLeads.find(l => l.id === id)

    if (!lead) {
      const response = NextResponse.json({ error: 'Lead not found' }, { status: 404 })
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
