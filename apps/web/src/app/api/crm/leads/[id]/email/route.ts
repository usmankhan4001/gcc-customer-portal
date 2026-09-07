import { NextResponse } from 'next/server'
import { directusFromSession } from '@/lib/auth'
import { emailDirectus } from '@/lib/email/client'
import { sendMarketingMessage } from '@/lib/email/send'
import { apiError, directusError, readJsonObject, validId } from '../../../../_operations'

type RouteContext = { params: Promise<{ id: string }> }

/**
 * Instant "send email to this lead" action for the lead drawer. Goes through the exact
 * same suppression-gated audience path the campaign composer uses (assertMarketable →
 * unsubscribe link → sendMarketingMessage), so a staff quick-send can never bypass
 * consent or suppression. The template is required; the subject is optional.
 */
export async function POST(req: Request, { params }: RouteContext) {
  const client = await directusFromSession()
  if (!client) return apiError('Unauthorized', 401)
  const { id } = await params
  if (!validId(id)) return apiError('Invalid lead id', 400)

  const body = await readJsonObject(req)
  if (!body) return apiError('Request body must be a JSON object', 400)

  const templateId = typeof body.templateId === 'string' ? body.templateId.trim() : ''
  if (!validId(templateId)) return apiError('A valid template is required', 400)
  const subjectOverride = typeof body.subject === 'string' && body.subject.trim() ? body.subject.trim().slice(0, 200) : null

  try {
    const result = await sendMarketingMessage(emailDirectus(), {
      leadId: id,
      templateId,
      subjectOverride,
      eventKey: `admin:quick-send:${id}:${templateId}:${Date.now()}`,
      activityTitle: 'Staff quick email',
      activityDescription: 'Sent from the lead drawer instant action',
    })
    if (!result.ok) return apiError(result.error ?? 'Could not send email', 422)
    return NextResponse.json({ ok: true, job: result })
  } catch (error) {
    return directusError(error, 'Could not send email to lead')
  }
}
