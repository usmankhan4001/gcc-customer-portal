import { NextRequest, NextResponse } from 'next/server'
import { requireApiKey, addCorsHeaders } from '@/lib/api-auth'

export const GET = requireApiKey(async (request: NextRequest, context: any, key: any) => {
  try {
    // TODO: Query actual revenue data from database
    const revenue = {
      total: 2450000,
      currency: 'AED',
      monthly: [
        { month: '2026-01', value: 180000 },
        { month: '2026-02', value: 210000 },
        { month: '2026-03', value: 195000 },
        { month: '2026-04', value: 240000 },
        { month: '2026-05', value: 280000 },
        { month: '2026-06', value: 320000 },
        { month: '2026-07', value: 350000 },
        { month: '2026-08', value: 375000 },
      ],
      bySource: [
        { source: 'Direct', value: 890000, percentage: 0.363 },
        { source: 'Referral', value: 620000, percentage: 0.253 },
        { source: 'Website', value: 480000, percentage: 0.196 },
        { source: 'Campaign', value: 460000, percentage: 0.188 },
      ],
      forecast: {
        nextMonth: 400000,
        nextQuarter: 1200000,
        confidence: 0.78,
      },
      period: { start: '2026-01-01', end: '2026-08-31' },
    }

    const response = NextResponse.json({ data: revenue })
    return addCorsHeaders(response)
  } catch (error: any) {
    const response = NextResponse.json({ error: error.message }, { status: 500 })
    return addCorsHeaders(response)
  }
})

export async function OPTIONS() {
  return addCorsHeaders(new NextResponse(null, { status: 204 }))
}
