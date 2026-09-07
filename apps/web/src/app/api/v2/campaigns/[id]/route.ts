import { NextRequest, NextResponse } from 'next/server'
import { requireApiKey, addCorsHeaders } from '@/lib/api-auth'

const stubCampaigns = [
  { id: '1', name: 'Welcome Series', type: 'whatsapp', status: 'active', audience: { segmentId: 'seg-1', count: 150 }, sent: 150, delivered: 145, read: 120, replied: 35, createdAt: new Date().toISOString() },
  { id: '2', name: 'Q2 Promo', type: 'email', status: 'draft', audience: { segmentId: 'seg-2', count: 500 }, sent: 0, delivered: 0, read: 0, replied: 0, createdAt: new Date().toISOString() },
]

type RouteContext = { params: Promise<{ id: string }> }

export const GET = requireApiKey(async (request: NextRequest, context: RouteContext, key: any) => {
  try {
    const { id } = await context.params
    const campaign = stubCampaigns.find(c => c.id === id)

    if (!campaign) {
      const response = NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
      return addCorsHeaders(response)
    }

    const response = NextResponse.json({ data: campaign })
    return addCorsHeaders(response)
  } catch (error: any) {
    const response = NextResponse.json({ error: error.message }, { status: 500 })
    return addCorsHeaders(response)
  }
})

export const PATCH = requireApiKey(async (request: NextRequest, context: RouteContext, key: any) => {
  try {
    const { id } = await context.params
    const campaign = stubCampaigns.find(c => c.id === id)

    if (!campaign) {
      const response = NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
      return addCorsHeaders(response)
    }

    const body = await request.json()
    const updated = { ...campaign, ...body, id, updatedAt: new Date().toISOString() }

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
    const campaign = stubCampaigns.find(c => c.id === id)

    if (!campaign) {
      const response = NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
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
