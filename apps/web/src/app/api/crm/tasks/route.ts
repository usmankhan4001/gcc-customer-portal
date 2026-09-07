import { NextResponse } from 'next/server'
import { readItems } from '@directus/sdk'
import { directusFromSession } from '@/lib/auth'
import { apiError, directusError } from '../_shared'

const TASK_FIELDS = [
  'id', 'title', 'description', 'status', 'priority', 'due_at', 'completed_at', 'date_created',
  'date_updated', 'lead_id.id', 'lead_id.name', 'lead_id.email', 'lead_id.status',
  'assigned_to.id', 'assigned_to.first_name', 'assigned_to.last_name', 'assigned_to.email',
] as const

export async function GET(req: Request) {
  const client = await directusFromSession()
  if (!client) return apiError('Unauthorized', 401)
  const params = new URL(req.url).searchParams
  const status = params.get('status') ?? 'active'
  const assignedTo = params.get('assigned_to') ?? 'all'
  if (!['active', 'open', 'in_progress', 'completed', 'cancelled', 'all'].includes(status)) return apiError('Invalid task status filter', 400)
  if (!['all', 'unassigned'].includes(assignedTo) && !/^[A-Za-z0-9_-]{1,128}$/.test(assignedTo)) return apiError('Invalid task assignee filter', 400)

  const and: Record<string, unknown>[] = []
  if (status === 'active') and.push({ status: { _in: ['open', 'in_progress'] } })
  else if (status !== 'all') and.push({ status: { _eq: status } })
  if (assignedTo === 'unassigned') and.push({ assigned_to: { _null: true } })
  else if (assignedTo !== 'all') and.push({ assigned_to: { _eq: assignedTo } })

  try {
    const tasks = await client.request(readItems('lead_tasks', {
      fields: [...TASK_FIELDS],
      filter: and.length ? { _and: and } : undefined,
      sort: ['due_at', '-priority', '-date_created'],
      limit: 300,
    }))
    return NextResponse.json({ tasks })
  } catch (error) {
    console.warn('[admin/crm/tasks] Could not load lead_tasks from Directus, defaulting to empty list', error)
    return NextResponse.json({ tasks: [] })
  }
}
