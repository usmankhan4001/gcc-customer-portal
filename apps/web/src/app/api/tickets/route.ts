import { NextResponse } from 'next/server'
import { readItems, updateItem } from '@directus/sdk'
import { directusFromSession } from '@/lib/auth'
import { portalDirectus, type TicketStatus } from '@/lib/portal'

export const runtime = 'nodejs'

function apiError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status })
}

const STATUSES: TicketStatus[] = ['open', 'pending', 'resolved', 'closed']
const PRIORITIES = ['low', 'normal', 'high', 'urgent']

const TICKET_FIELDS = [
  'id',
  'ticket_number',
  'lead_id',
  'subject',
  'status',
  'priority',
  'assigned_to.id',
  'assigned_to.first_name',
  'assigned_to.last_name',
  'assigned_to.email',
  'channel',
  'date_created',
  'date_updated',
] as const

export async function GET(req: Request) {
  const client = await directusFromSession()
  if (!client) return apiError('Unauthorized', 401)

  const params = new URL(req.url).searchParams
  const status = params.get('status') ?? 'all'
  if (status !== 'all' && !STATUSES.includes(status as TicketStatus)) return apiError('Invalid status filter', 400)

  const filter = status === 'all' ? undefined : { status: { _eq: status as TicketStatus } }

  // Pagination: page is 1-based, page_size defaults to 25 and caps at 100.
  const page = Math.max(1, Number(params.get('page') ?? 1))
  const pageSize = Math.min(100, Math.max(1, Number(params.get('page_size') ?? 25)))
  const offset = (page - 1) * pageSize
  // Fetch one extra to detect if a next page exists.
  const fetchLimit = pageSize + 1

  const allTickets = await portalDirectus()
    .request(readItems('tickets', { fields: [...TICKET_FIELDS], filter, sort: ['-date_updated'], limit: fetchLimit, offset }))
    .catch((error) => {
      console.error('[admin/tickets] failed to load tickets', error)
      return null
    })
  if (allTickets === null) return apiError('Could not load tickets', 500)

  const hasNext = allTickets.length > pageSize
  const tickets = hasNext ? allTickets.slice(0, pageSize) : allTickets

  return NextResponse.json({ tickets, page, page_size: pageSize, hasNext })
}

export async function PATCH(req: Request) {
  const client = await directusFromSession()
  if (!client) return apiError('Unauthorized', 401)

  let parsed: unknown
  try {
    parsed = await req.json()
  } catch {
    return apiError('Invalid request', 400)
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return apiError('Invalid request', 400)

  const { id, status, priority, assigned_to } = parsed as {
    id?: unknown
    status?: unknown
    priority?: unknown
    assigned_to?: unknown
  }
  if (typeof id !== 'string' || !id) return apiError('Ticket id is required', 400)

  const patch: Record<string, unknown> = {}
  if (status !== undefined) {
    if (typeof status !== 'string' || !STATUSES.includes(status as TicketStatus)) return apiError('Invalid status', 400)
    patch.status = status
  }
  if (priority !== undefined) {
    if (typeof priority !== 'string' || !PRIORITIES.includes(priority)) return apiError('Invalid priority', 400)
    patch.priority = priority
  }
  if (assigned_to !== undefined) {
    if (assigned_to !== null && (typeof assigned_to !== 'string' || !/^[A-Za-z0-9_-]{1,128}$/.test(assigned_to))) {
      return apiError('Invalid assignee', 400)
    }
    patch.assigned_to = assigned_to
  }
  if (Object.keys(patch).length === 0) return apiError('Nothing to update', 400)

  const updated = await portalDirectus()
    .request(updateItem('tickets', id, patch as never))
    .catch((error) => {
      console.error('[admin/tickets] failed to update ticket', error)
      return null
    })
  if (!updated) return apiError('Could not update ticket', 500)

  return NextResponse.json({ ticket: updated })
}
