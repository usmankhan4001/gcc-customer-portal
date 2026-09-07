import { NextResponse } from 'next/server'
import { createItem } from '@directus/sdk'
import { directusFromSession } from '@/lib/auth'
import { apiError, cleanText, directusError, hasOnlyFields, nullableText, readJsonObject, validDate, validId } from '../../../_shared'

const FIELDS = ['title', 'description', 'priority', 'due_at', 'assigned_to'] as const
const PRIORITIES = ['low', 'normal', 'high', 'urgent']
const RESPONSE_FIELDS = [
  'id', 'lead_id', 'title', 'description', 'status', 'priority', 'due_at', 'completed_at',
  'date_created', 'date_updated', 'assigned_to.id', 'assigned_to.first_name',
  'assigned_to.last_name', 'assigned_to.email', 'user_created.id', 'user_created.first_name',
  'user_created.last_name', 'user_created.email',
] as const

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const client = await directusFromSession()
  if (!client) return apiError('Unauthorized', 401)
  const { id } = await params
  if (!validId(id)) return apiError('Invalid lead id', 400)

  const body = await readJsonObject(req)
  if (!body) return apiError('Request body must be a JSON object', 400)
  if (!hasOnlyFields(body, FIELDS)) return apiError('Request contains unsupported task fields', 400)
  const title = cleanText(body.title, 200, false)
  if (!title) return apiError('Task title is required and must be 200 characters or fewer', 400)
  const description = nullableText(body.description, 3000)
  if (description === undefined) return apiError('Task details must be 3,000 characters or fewer', 400)
  const priority = body.priority ?? 'normal'
  if (typeof priority !== 'string' || !PRIORITIES.includes(priority)) return apiError('Invalid task priority', 400)
  const dueAt = body.due_at ?? null
  if (!validDate(dueAt)) return apiError('Invalid task due date', 400)
  const assignedTo = body.assigned_to ?? null
  if (assignedTo !== null && (typeof assignedTo !== 'string' || !validId(assignedTo))) return apiError('Invalid task assignee', 400)

  try {
    const task = await client.request(createItem('lead_tasks', {
      lead_id: id,
      title,
      description,
      status: 'open',
      priority,
      due_at: dueAt,
      assigned_to: assignedTo,
    }, { fields: [...RESPONSE_FIELDS] }))
    return NextResponse.json({ task }, { status: 201 })
  } catch (error) {
    return directusError(error, 'Could not create task')
  }
}
