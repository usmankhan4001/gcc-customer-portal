import { NextResponse } from 'next/server'
import { readItems } from '@directus/sdk'
import { directusFromSession } from '@/lib/auth'
import { apiError } from '../_shared'

export const runtime = 'nodejs'

export async function GET(req: Request) {
  const client = await directusFromSession()
  if (!client) return apiError('Unauthorized', 401)

  const { searchParams } = new URL(req.url)
  const type = searchParams.get('type')
  const limit = Math.min(50, Math.max(1, Number(searchParams.get('limit') || 20)))

  try {
    const filter: Record<string, unknown> = {}
    if (type) {
      filter.type = { _eq: type }
    }

    const activities = await client.request(
      readItems('lead_activities', {
        filter,
        fields: ['id', 'lead_id', 'type', 'title', 'description', 'occurred_at', 'metadata'],
        sort: ['-occurred_at'],
        limit,
      }),
    )

    return NextResponse.json({ activities })
  } catch (err) {
    console.warn('[crm/activities] fetch error', err)
    return NextResponse.json({ activities: [] })
  }
}
