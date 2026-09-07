import { NextResponse } from 'next/server'
import { readUsers } from '@directus/sdk'
import { directusFromSession } from '@/lib/auth'
import { apiError, directusError } from '../_shared'

export async function GET() {
  const client = await directusFromSession()
  if (!client) return apiError('Unauthorized', 401)

  try {
    const users = await client.request(
      readUsers({
        fields: ['id', 'first_name', 'last_name', 'email'],
        filter: { status: { _eq: 'active' } },
        sort: ['first_name', 'last_name', 'email'],
        limit: 200,
      }),
    )
    return NextResponse.json({ users })
  } catch (error) {
    console.warn('[admin/crm/users] Could not load users from Directus, defaulting to empty list', error)
    return NextResponse.json({ users: [] })
  }
}
