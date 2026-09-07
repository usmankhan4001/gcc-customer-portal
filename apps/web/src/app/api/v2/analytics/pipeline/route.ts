import { NextRequest, NextResponse } from 'next/server'
import { requireApiKey, addCorsHeaders } from '@/lib/api-auth'

export const GET = requireApiKey(async (request: NextRequest, context: any, key: any) => {
  try {
    // TODO: Query actual pipeline data from database
    const pipeline = {
      stages: [
        { name: 'Lead', count: 120, value: 360000, currency: 'AED' },
        { name: 'Qualified', count: 85, value: 510000, currency: 'AED' },
        { name: 'Proposal', count: 42, value: 630000, currency: 'AED' },
        { name: 'Negotiation', count: 18, value: 450000, currency: 'AED' },
        { name: 'Closed Won', count: 28, value: 500000, currency: 'AED' },
      ],
      summary: {
        totalDeals: 293,
        totalValue: 2450000,
        weightedValue: 1837500,
        averageDealSize: 8362,
        averageTimeToClose: '45 days',
        conversionRate: 0.096,
      },
      period: { start: '2026-08-01', end: '2026-08-31' },
    }

    const response = NextResponse.json({ data: pipeline })
    return addCorsHeaders(response)
  } catch (error: any) {
    const response = NextResponse.json({ error: error.message }, { status: 500 })
    return addCorsHeaders(response)
  }
})

export async function OPTIONS() {
  return addCorsHeaders(new NextResponse(null, { status: 204 }))
}
