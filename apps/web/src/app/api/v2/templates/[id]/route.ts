import { NextRequest, NextResponse } from 'next/server'
import { requireApiKey, addCorsHeaders } from '@/lib/api-auth'

const stubTemplates = [
  { id: '1', name: 'Welcome Message', type: 'whatsapp', category: 'marketing', language: 'en', status: 'approved', content: 'Hello {{firstName}}, welcome to {{companyName}}!', variables: ['firstName', 'companyName'], createdAt: new Date().toISOString() },
  { id: '2', name: 'Order Confirmation', type: 'email', category: 'transactional', language: 'en', status: 'approved', content: '<h1>Order #{{orderId}} confirmed</h1>', variables: ['orderId'], createdAt: new Date().toISOString() },
]

type RouteContext = { params: Promise<{ id: string }> }

export const GET = requireApiKey(async (request: NextRequest, context: RouteContext, key: any) => {
  try {
    const { id } = await context.params
    const template = stubTemplates.find(t => t.id === id)

    if (!template) {
      const response = NextResponse.json({ error: 'Template not found' }, { status: 404 })
      return addCorsHeaders(response)
    }

    const response = NextResponse.json({ data: template })
    return addCorsHeaders(response)
  } catch (error: any) {
    const response = NextResponse.json({ error: error.message }, { status: 500 })
    return addCorsHeaders(response)
  }
})

export const PATCH = requireApiKey(async (request: NextRequest, context: RouteContext, key: any) => {
  try {
    const { id } = await context.params
    const template = stubTemplates.find(t => t.id === id)

    if (!template) {
      const response = NextResponse.json({ error: 'Template not found' }, { status: 404 })
      return addCorsHeaders(response)
    }

    const body = await request.json()
    const updated = { ...template, ...body, id, updatedAt: new Date().toISOString() }

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
    const template = stubTemplates.find(t => t.id === id)

    if (!template) {
      const response = NextResponse.json({ error: 'Template not found' }, { status: 404 })
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
