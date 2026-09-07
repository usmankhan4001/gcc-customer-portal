import { NextRequest, NextResponse } from 'next/server'
import { requireApiKey, addCorsHeaders } from '@/lib/api-auth'

const stubCampaigns = [
  { id: '1', name: 'Welcome Series', type: 'whatsapp', status: 'active', audience: { segmentId: 'seg-1', count: 150 }, sent: 150, delivered: 145, read: 120, replied: 35, createdAt: new Date().toISOString() },
]

type RouteContext = { params: Promise<{ id: string }> }

export const POST = requireApiKey(async (request: NextRequest, context: RouteContext, key: any) => {
  try {
    const { id } = await context.params
    const campaign = stubCampaigns.find(c => c.id === id)

    if (!campaign) {
      const response = NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
      return addCorsHeaders(response)
    }

    if (campaign.status === 'completed') {
      const response = NextResponse.json({ error: 'Campaign already completed' }, { status: 400 })
      return addCorsHeaders(response)
    }

    // TODO: Queue messages for dispatch
    const dispatchResult = {
      campaignId: id,
      status: 'dispatching',
      totalRecipients: campaign.audience.count,
      queuedAt: new Date().toISOString(),
    }

    const response = NextResponse.json({ data: dispatchResult }, { status: 202 })
    return addCorsHeaders(response)
  } catch (error: any) {
    const response = NextResponse.json({ error: error.message }, { status: 500 })
    return addCorsHeaders(response)
  }
})

export async function OPTIONS() {
  return addCorsHeaders(new NextResponse(null, { status: 204 }))
}
