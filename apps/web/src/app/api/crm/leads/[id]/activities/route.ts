import { NextResponse } from 'next/server'
import { createItem } from '@directus/sdk'
import { directusFromSession } from '@/lib/auth'
import { apiError, cleanText, directusError, hasOnlyFields, nullableText, readJsonObject, validDate, validId } from '../../../_shared'

const FIELDS = ['type', 'title', 'description', 'occurred_at'] as const
const TYPES = ['note', 'call', 'email', 'meeting', 'whatsapp']
const RESPONSE_FIELDS = [
  'id', 'lead_id', 'type', 'title', 'description', 'occurred_at', 'metadata', 'date_created',
  'user_created.id', 'user_created.first_name', 'user_created.last_name', 'user_created.email',
] as const

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const client = await directusFromSession()
  if (!client) return apiError('Unauthorized', 401)
  const { id } = await params
  if (!validId(id)) return apiError('Invalid lead id', 400)

  const body = await readJsonObject(req)
  if (!body) return apiError('Request body must be a JSON object', 400)
  if (!hasOnlyFields(body, FIELDS)) return apiError('Request contains unsupported activity fields', 400)
  if (typeof body.type !== 'string' || !TYPES.includes(body.type)) return apiError('Invalid activity type', 400)
  const title = cleanText(body.title, 160, false)
  if (!title) return apiError('Activity title is required and must be 160 characters or fewer', 400)
  const description = nullableText(body.description, 5000)
  if (description === undefined) return apiError('Activity details must be 5,000 characters or fewer', 400)
  const occurredAt = body.occurred_at ?? new Date().toISOString()
  if (!validDate(occurredAt, false)) return apiError('Invalid activity date', 400)

  try {
    const activity = await client.request(createItem('lead_activities', {
      lead_id: id,
      type: body.type,
      title,
      description,
      occurred_at: occurredAt,
    }, { fields: [...RESPONSE_FIELDS] }))
    return NextResponse.json({ activity }, { status: 201 })
  } catch (error) {
    return directusError(error, 'Could not create activity')
  }
}
