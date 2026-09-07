import { NextResponse } from 'next/server'
import { createItem, readItem, readItems, updateItem } from '@directus/sdk'
import { directusFromSession } from '@/lib/auth'
import {
  apiError,
  directusError,
  hasOnlyFields,
  nullableText,
  readJsonObject,
  validDate,
  validId,
} from '../../_shared'

import { dispatchStageAutomations } from '@/lib/crm/automation'
import { emitAutomationTrigger } from '@/lib/automation/emit'
import type { LeadItem, LeadStatus } from '@/lib/directus'

const LEAD_FIELDS = [
  'id', 'name', 'email', 'phone', 'phone_digits', 'country', 'interest', 'message', 'source',
  'page', 'tool_slug', 'answers', 'date_created', 'status', 'utm_source', 'utm_medium',
  'utm_campaign', 'utm_content', 'utm_term', 'referrer', 'notes', 'assigned_to.id',
  'assigned_to.first_name', 'assigned_to.last_name', 'assigned_to.email', 'priority',
  'next_follow_up_at', 'estimated_value', 'currency', 'lost_reason', 'consent_status',
  'consent_at', 'sender_subscriber_id', 'email_subscription_status', 'email_suppressed_at',
  'sender_status', 'sender_last_synced_at', 'order_number', 'tracking_token', 'jurisdiction',
  'package_type', 'company_name_choice_1', 'company_name_choice_2', 'payment_status',
  'payment_reference', 'amount_paid', 'preliminary_documents', 'official_documents',
  'kyc_status', 'kyc_notes', 'incorporation_date', 'annual_renewal_date', 'tax_filing_deadline',
] as const
const ACTIVITY_FIELDS = [
  'id', 'lead_id', 'type', 'title', 'description', 'occurred_at', 'metadata', 'date_created',
  'user_created.id', 'user_created.first_name', 'user_created.last_name', 'user_created.email',
] as const
const TASK_FIELDS = [
  'id', 'lead_id', 'title', 'description', 'status', 'priority', 'due_at', 'completed_at',
  'date_created', 'date_updated', 'assigned_to.id', 'assigned_to.first_name',
  'assigned_to.last_name', 'assigned_to.email', 'user_created.id', 'user_created.first_name',
  'user_created.last_name', 'user_created.email',
] as const
const STAGE_FIELDS = [
  'id', 'lead_id', 'from_stage', 'to_stage', 'date_created', 'changed_by.id',
  'changed_by.first_name', 'changed_by.last_name', 'changed_by.email',
] as const
const CONSENT_FIELDS = ['id', 'lead_id', 'consent_type', 'granted', 'source', 'policy_version', 'captured_at', 'date_created'] as const
const EMAIL_FIELDS = ['id', 'lead_id', 'event_type', 'subject', 'provider_message_id', 'occurred_at', 'metadata', 'date_created'] as const

const WRITE_FIELDS = [
  'status', 'assigned_to', 'priority', 'next_follow_up_at', 'estimated_value', 'lost_reason',
  'notes', 'company_name_choice_1', 'company_name_choice_2', 'official_documents',
  'preliminary_documents', 'kyc_status', 'kyc_notes', 'incorporation_date', 'annual_renewal_date',
  'tax_filing_deadline',
] as const
const STATUSES = [
  'new', 'contacted', 'qualified', 'paid_application', 'kyc_processing', 'kyc_received',
  'applied', 'registered', 'banking_filed', 'closed', 'won', 'lost',
]
const PRIORITIES = ['low', 'normal', 'high', 'urgent']
const KYC_STATUSES = ['pending', 'sent', 'received', 'approved', 'rejected']

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const client = await directusFromSession()
  if (!client) return apiError('Unauthorized', 401)
  const { id } = await params
  if (!validId(id)) return apiError('Invalid lead id', 400)

  try {
    // Use Promise.allSettled so a failure in one collection (e.g. 403 on
    // email_events) does not blank the entire lead detail page.  Each
    // collection degrades to an empty array, and the error is logged with
    // the collection name — per CLAUDE.md §5.
    const COLLECTION_NAMES = ['lead', 'activities', 'tasks', 'stageHistory', 'consents', 'emailEvents']
    const settled = await Promise.allSettled([
      client.request(readItem('leads', id, { fields: [...LEAD_FIELDS] })),
      client.request(readItems('lead_activities', { fields: [...ACTIVITY_FIELDS], filter: { lead_id: { _eq: id } }, sort: ['-occurred_at', '-date_created'], limit: 100 })),
      client.request(readItems('lead_tasks', { fields: [...TASK_FIELDS], filter: { lead_id: { _eq: id } }, sort: ['status', 'due_at', '-date_created'], limit: 100 })),
      client.request(readItems('lead_stage_history', { fields: [...STAGE_FIELDS], filter: { lead_id: { _eq: id } }, sort: ['-date_created'], limit: 100 })),
      client.request(readItems('lead_consents', { fields: [...CONSENT_FIELDS], filter: { lead_id: { _eq: id } }, sort: ['-captured_at', '-date_created'], limit: 50 })),
      client.request(readItems('email_events', { fields: [...EMAIL_FIELDS], filter: { lead_id: { _eq: id } }, sort: ['-occurred_at', '-date_created'], limit: 100 })),
    ])

    const lead = settled[0].status === 'fulfilled' ? settled[0].value : null
    if (!lead) {
      const reason = settled[0].status === 'rejected' ? settled[0].reason : 'Lead not found'
      console.error('[crm/leads] lead read failed', reason)
      return directusError(reason, 'Could not load lead details')
    }

    const activities = settled[1].status === 'fulfilled' ? settled[1].value : []
    const tasks = settled[2].status === 'fulfilled' ? settled[2].value : []
    const stageHistory = settled[3].status === 'fulfilled' ? settled[3].value : []
    const consents = settled[4].status === 'fulfilled' ? settled[4].value : []
    const emailEvents = settled[5].status === 'fulfilled' ? settled[5].value : []

    // Log each failure so it is visible in docker compose logs.
    settled.forEach((result, i) => {
      if (result.status === 'rejected') {
        console.error(`[crm/leads] ${COLLECTION_NAMES[i]} read failed for lead ${id}`, result.reason)
      }
    })

    return NextResponse.json({ lead, activities, tasks, stageHistory, consents, emailEvents })
  } catch (error) {
    return directusError(error, 'Could not load lead details')
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const client = await directusFromSession()
  if (!client) return apiError('Unauthorized', 401)
  const { id } = await params
  if (!validId(id)) return apiError('Invalid lead id', 400)

  const body = await readJsonObject(req)
  if (!body) return apiError('Request body must be a JSON object', 400)
  if (!hasOnlyFields(body, WRITE_FIELDS)) return apiError('Request contains unsupported CRM fields', 400)
  if (Object.keys(body).length === 0) return apiError('At least one CRM field is required', 400)

  const payload: Record<string, unknown> = {}
  if ('status' in body) {
    if (typeof body.status !== 'string' || !STATUSES.includes(body.status)) return apiError('Invalid lead status', 400)
    payload.status = body.status
  }
  if ('priority' in body) {
    if (body.priority !== null && (typeof body.priority !== 'string' || !PRIORITIES.includes(body.priority))) return apiError('Invalid lead priority', 400)
    payload.priority = body.priority
  }
  if ('assigned_to' in body) {
    if (body.assigned_to !== null && (typeof body.assigned_to !== 'string' || !validId(body.assigned_to))) return apiError('Invalid assignee id', 400)
    payload.assigned_to = body.assigned_to
  }
  if ('next_follow_up_at' in body) {
    if (!validDate(body.next_follow_up_at)) return apiError('Invalid follow-up date', 400)
    payload.next_follow_up_at = body.next_follow_up_at
  }
  if ('estimated_value' in body) {
    if (body.estimated_value !== null && (typeof body.estimated_value !== 'number' || !Number.isFinite(body.estimated_value) || body.estimated_value < 0 || body.estimated_value > 1_000_000_000)) {
      return apiError('Estimated value must be between 0 and 1,000,000,000', 400)
    }
    payload.estimated_value = body.estimated_value
  }
  if ('lost_reason' in body) {
    const lostReason = nullableText(body.lost_reason, 500)
    if (lostReason === undefined) return apiError('Lost reason must be 500 characters or fewer', 400)
    payload.lost_reason = lostReason
  }
  if ('notes' in body) {
    const notes = nullableText(body.notes, 5000)
    if (notes === undefined) return apiError('Notes must be 5000 characters or fewer', 400)
    payload.notes = notes
  }
  if ('company_name_choice_1' in body) {
    const name1 = nullableText(body.company_name_choice_1, 200)
    if (name1 === undefined) return apiError('Company name choice 1 must be 200 characters or fewer', 400)
    payload.company_name_choice_1 = name1
  }
  if ('company_name_choice_2' in body) {
    const name2 = nullableText(body.company_name_choice_2, 200)
    if (name2 === undefined) return apiError('Company name choice 2 must be 200 characters or fewer', 400)
    payload.company_name_choice_2 = name2
  }
  if ('kyc_status' in body) {
    if (body.kyc_status !== null && (typeof body.kyc_status !== 'string' || !KYC_STATUSES.includes(body.kyc_status))) {
      return apiError('Invalid KYC status', 400)
    }
    payload.kyc_status = body.kyc_status
  }
  if ('kyc_notes' in body) {
    payload.kyc_notes = nullableText(body.kyc_notes, 2000)
  }
  if ('official_documents' in body) {
    if (body.official_documents !== null && !Array.isArray(body.official_documents)) {
      return apiError('Official documents must be an array', 400)
    }
    payload.official_documents = body.official_documents
  }
  if ('preliminary_documents' in body) {
    if (body.preliminary_documents !== null && !Array.isArray(body.preliminary_documents)) {
      return apiError('Preliminary documents must be an array', 400)
    }
    payload.preliminary_documents = body.preliminary_documents
  }
  if ('incorporation_date' in body) {
    if (body.incorporation_date && !validDate(body.incorporation_date)) return apiError('Invalid incorporation date', 400)
    payload.incorporation_date = body.incorporation_date
  }
  if ('annual_renewal_date' in body) {
    if (body.annual_renewal_date && !validDate(body.annual_renewal_date)) return apiError('Invalid annual renewal date', 400)
    payload.annual_renewal_date = body.annual_renewal_date
  }
  if ('tax_filing_deadline' in body) {
    if (body.tax_filing_deadline && !validDate(body.tax_filing_deadline)) return apiError('Invalid tax filing deadline', 400)
    payload.tax_filing_deadline = body.tax_filing_deadline
  }

  try {
    let previousStatus: string | null = null
    if (payload.status !== undefined) {
      const current = await client.request(readItem('leads', id, { fields: ['id', 'status'] })) as { status?: string | null }
      previousStatus = current.status ?? 'new'
    }

    const lead = await client.request(updateItem('leads', id, payload, { fields: [...LEAD_FIELDS] })) as LeadItem
    const nextStatus = typeof payload.status === 'string' ? (payload.status as LeadStatus) : null
    if (nextStatus && nextStatus !== previousStatus) {
      await client.request(createItem('lead_stage_history', { lead_id: id, from_stage: previousStatus, to_stage: nextStatus }))
      // Fire backend automation asynchronously without blocking the response
      dispatchStageAutomations(lead, nextStatus, previousStatus as LeadStatus).catch((err) =>
        console.error('[crm/leads] stage automation error', err),
      )
      // Fire the automation engine's lead.stage_changed trigger so active workflows
      // react to the real stage change (the manual "run automations" route in
      // [id]/automation fires the same trigger on demand — this is the live path).
      // Fire-and-forget: never block the PATCH response.
      void emitAutomationTrigger('lead.stage_changed', { leadId: id, stage: nextStatus }).catch(() => {})
    }

    return NextResponse.json({ lead })
  } catch (error) {
    return directusError(error, 'Could not update lead')
  }
}
