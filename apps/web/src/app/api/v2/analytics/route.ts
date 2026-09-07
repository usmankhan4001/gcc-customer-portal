import { NextRequest, NextResponse } from 'next/server'
import { requireApiKey, addCorsHeaders } from '@/lib/api-auth'

export const GET = requireApiKey(async (request: NextRequest, context: any, key: any) => {
  try {
    // TODO: Query actual analytics from database
    const overview = {
      contacts: { total: 1250, newThisMonth: 85, active: 980 },
      companies: { total: 340, newThisMonth: 12 },
      deals: { total: 89, open: 42, won: 28, lost: 19, totalValue: 2450000, currency: 'AED' },
      leads: { total: 560, newThisMonth: 45, qualified: 180 },
      conversations: { total: 890, active: 156, averageResponseTime: '2.3h' },
      campaigns: { total: 24, active: 5, totalSent: 15000, deliveryRate: 0.96 },
      period: { start: '2026-08-01', end: '2026-08-31' },
    }

    const response = NextResponse.json({ data: overview })
    return addCorsHeaders(response)
  } catch (error: any) {
    const response = NextResponse.json({ error: error.message }, { status: 500 })
    return addCorsHeaders(response)
  }
})

export async function OPTIONS() {
  return addCorsHeaders(new NextResponse(null, { status: 204 }))
}
