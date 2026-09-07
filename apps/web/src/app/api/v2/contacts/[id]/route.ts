import { NextRequest, NextResponse } from 'next/server'
import { requireApiKey, addCorsHeaders } from '@/lib/api-auth'

// TODO: Replace with actual database queries
const stubContacts = [
  { id: '1', firstName: 'John', lastName: 'Doe', email: 'john@example.com', phone: '+971501234567', companyId: '1', status: 'active', createdAt: new Date().toISOString() },
  { id: '2', firstName: 'Jane', lastName: 'Smith', email: 'jane@example.com', phone: '+971507654321', companyId: '2', status: 'active', createdAt: new Date().toISOString() },
]

type RouteContext = { params: Promise<{ id: string }> }

export const GET = requireApiKey(async (request: NextRequest, context: RouteContext, key: any) => {
  try {
    const { id } = await context.params
    const contact = stubContacts.find(c => c.id === id)

    if (!contact) {
      const response = NextResponse.json({ error: 'Contact not found' }, { status: 404 })
      return addCorsHeaders(response)
    }

    const response = NextResponse.json({ data: contact })
    return addCorsHeaders(response)
  } catch (error: any) {
    const response = NextResponse.json({ error: error.message }, { status: 500 })
    return addCorsHeaders(response)
  }
})

export const PATCH = requireApiKey(async (request: NextRequest, context: RouteContext, key: any) => {
  try {
    const { id } = await context.params
    const contact = stubContacts.find(c => c.id === id)

    if (!contact) {
      const response = NextResponse.json({ error: 'Contact not found' }, { status: 404 })
      return addCorsHeaders(response)
    }

    const body = await request.json()
    const updated = { ...contact, ...body, id, updatedAt: new Date().toISOString() }

    // TODO: Update in database
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
    const contact = stubContacts.find(c => c.id === id)

    if (!contact) {
      const response = NextResponse.json({ error: 'Contact not found' }, { status: 404 })
      return addCorsHeaders(response)
    }

    // TODO: Delete from database
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
