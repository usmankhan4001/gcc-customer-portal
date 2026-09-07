import { NextResponse } from 'next/server'
import { createItem, readItems, updateItem } from '@directus/sdk'
import { directusFromSession } from '@/lib/auth'
import { portalDirectus } from '@/lib/portal'

export const runtime = 'nodejs'

const MAX_BODY = 5000

type Context = { params: Promise<{ id: string }> }

function apiError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status })
}

export async function GET(_req: Request, { params }: Context) {
  const client = await directusFromSession()
  if (!client) return apiError('Unauthorized', 401)

  const { id } = await params
  const ticket = await portalDirectus()
    .request(readItems('tickets', { fields: ['id', 'ticket_number', 'subject', 'status', 'priority', 'lead_id', 'date_created'], filter: { id: { _eq: id } }, limit: 1 }))
    .catch(() => [])
  if (!ticket[0]) return apiError('Ticket not found', 404)

  const messages = await portalDirectus()
    .request(readItems('ticket_messages', {
      filter: { ticket: { _eq: id } },
      fields: ['id', 'author_type', 'body', 'date_created'],
      sort: ['date_created'],
      limit: -1,
    }))
    .catch(() => [])

  return NextResponse.json({ ticket: ticket[0], messages })
}

export async function POST(req: Request, { params }: Context) {
  const client = await directusFromSession()
  if (!client) return apiError('Unauthorized', 401)

  const { id } = await params
  const ticket = await portalDirectus()
    .request(readItems('tickets', { fields: ['id'], filter: { id: { _eq: id } }, limit: 1 }))
    .catch(() => [])
  if (!ticket[0]) return apiError('Ticket not found', 404)

  let parsed: unknown
  try {
    parsed = await req.json()
  } catch {
    return apiError('Invalid request', 400)
  }
  const body = typeof (parsed as { body?: unknown })?.body === 'string' ? (parsed as { body: string }).body.trim() : ''
  if (!body || body.length > MAX_BODY) return apiError('Reply is required and must be 5000 characters or fewer', 400)

  const message = await portalDirectus()
    .request(createItem('ticket_messages', { ticket: id, author_type: 'staff', body }))
    .catch((error) => {
      console.error('[admin/tickets] failed to add staff reply', error)
      return null
    })
  if (!message) return apiError('Could not send the reply', 503)

  // A staff reply reopens a closed ticket so the customer sees the response.
  await portalDirectus()
    .request(updateItem('tickets', id, { status: 'open' }))
    .catch(() => {})

  return NextResponse.json(
    { message: { id: message.id, author_type: 'staff', body, date_created: message.date_created } },
    { status: 201 },
  )
}
