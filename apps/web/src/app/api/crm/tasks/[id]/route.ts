import { NextResponse } from 'next/server'
import { updateItem } from '@directus/sdk'
import { directusFromSession } from '@/lib/auth'
import { apiError, cleanText, directusError, hasOnlyFields, nullableText, readJsonObject, validDate, validId } from '../../_shared'

const FIELDS = ['title', 'description', 'status', 'priority', 'due_at', 'assigned_to'] as const
const STATUSES = ['open', 'in_progress', 'completed', 'cancelled']
const PRIORITIES = ['low', 'normal', 'high', 'urgent']
const RESPONSE_FIELDS = [
  'id', 'lead_id.id', 'lead_id.name', 'lead_id.email', 'lead_id.status', 'title', 'description',
  'status', 'priority', 'due_at', 'completed_at', 'date_created', 'date_updated',
  'assigned_to.id', 'assigned_to.first_name', 'assigned_to.last_name', 'assigned_to.email',
] as const

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const client = await directusFromSession()
  if (!client) return apiError('Unauthorized', 401)
  const { id } = await params
  if (!validId(id)) return apiError('Invalid task id', 400)
  const body = await readJsonObject(req)
  if (!body) return apiError('Request body must be a JSON object', 400)
  if (!hasOnlyFields(body, FIELDS)) return apiError('Request contains unsupported task fields', 400)
  if (Object.keys(body).length === 0) return apiError('At least one task field is required', 400)

  const payload: Record<string, unknown> = {}
  if ('title' in body) {
    const title = cleanText(body.title, 200, false)
    if (!title) return apiError('Task title is required and must be 200 characters or fewer', 400)
    payload.title = title
  }
  if ('description' in body) {
    const description = nullableText(body.description, 3000)
    if (description === undefined) return apiError('Task details must be 3,000 characters or fewer', 400)
    payload.description = description
  }
  if ('status' in body) {
    if (typeof body.status !== 'string' || !STATUSES.includes(body.status)) return apiError('Invalid task status', 400)
    payload.status = body.status
    payload.completed_at = body.status === 'completed' ? new Date().toISOString() : null
  }
  if ('priority' in body) {
    if (typeof body.priority !== 'string' || !PRIORITIES.includes(body.priority)) return apiError('Invalid task priority', 400)
    payload.priority = body.priority
  }
  if ('due_at' in body) {
    if (!validDate(body.due_at)) return apiError('Invalid task due date', 400)
    payload.due_at = body.due_at
  }
  if ('assigned_to' in body) {
    if (body.assigned_to !== null && (typeof body.assigned_to !== 'string' || !validId(body.assigned_to))) return apiError('Invalid task assignee', 400)
    payload.assigned_to = body.assigned_to
  }

  try {
    const task = await client.request(updateItem('lead_tasks', id, payload, { fields: [...RESPONSE_FIELDS] }))
    return NextResponse.json({ task })
  } catch (error) {
    return directusError(error, 'Could not update task')
  }
}
