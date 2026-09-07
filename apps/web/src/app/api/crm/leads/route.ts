import { NextResponse } from 'next/server'
import { readItems } from '@directus/sdk'
import { directusFromSession } from '@/lib/auth'
import { apiError, directusError } from '../_shared'

const LEAD_FIELDS = [
  'id', 'name', 'email', 'phone', 'country', 'interest', 'source', 'tool_slug', 'page',
  'status', 'date_created', 'assigned_to.id', 'assigned_to.first_name', 'assigned_to.last_name',
  'assigned_to.email', 'priority', 'next_follow_up_at', 'estimated_value', 'lost_reason',
  'currency', 'email_subscription_status',
  'order_number', 'tracking_token', 'jurisdiction', 'package_type',
  'company_name_choice_1', 'company_name_choice_2', 'payment_status', 'amount_paid',
  'kyc_status', 'annual_renewal_date', 'tax_filing_deadline',
] as const
const STATUSES = [
  'new',
  'paid_application',
  'kyc_processing',
  'kyc_received',
  'applied',
  'registered',
  'banking_filed',
  'closed',
  'won',
  'lost',
  'contacted',
  'qualified',
]
const PRIORITIES = ['low', 'normal', 'high', 'urgent']
const SORTS: Record<string, string[]> = {
  newest: ['-date_created'],
  oldest: ['date_created'],
  followup: ['next_follow_up_at', '-date_created'],
  value: ['-estimated_value', '-date_created'],
}

export async function GET(req: Request) {
  const client = await directusFromSession()
  if (!client) return apiError('Unauthorized', 401)

  const params = new URL(req.url).searchParams
  const q = (params.get('q') ?? '').trim()
  const status = params.get('status') ?? 'all'
  const priority = params.get('priority') ?? 'all'
  const assignedTo = params.get('assigned_to') ?? 'all'
  const followUp = params.get('follow_up') ?? 'all'
  const sort = params.get('sort') ?? 'newest'
  const pageParam = Math.max(1, Number(params.get('page') ?? 1))
  const pageSizeParam = Math.min(100, Math.max(1, Number(params.get('page_size') ?? 25)))

  if (q.length > 120) return apiError('Search must be 120 characters or fewer', 400)
  if (status !== 'all' && !STATUSES.includes(status)) return apiError('Invalid status filter', 400)
  if (priority !== 'all' && !PRIORITIES.includes(priority)) return apiError('Invalid priority filter', 400)
  if (!['all', 'unassigned'].includes(assignedTo) && !/^[A-Za-z0-9_-]{1,128}$/.test(assignedTo)) return apiError('Invalid assignee filter', 400)
  if (!['all', 'overdue', 'today', 'upcoming', 'none'].includes(followUp)) return apiError('Invalid follow-up filter', 400)
  if (!SORTS[sort]) return apiError('Invalid sort option', 400)

  const and: Record<string, unknown>[] = []
  if (q) {
    and.push({
      _or: ['name', 'email', 'phone', 'country', 'interest', 'source', 'tool_slug'].map((field) => ({
        [field]: { _icontains: q },
      })),
    })
  }
  if (status === 'new') and.push({ _or: [{ status: { _eq: 'new' } }, { status: { _null: true } }] })
  else if (status !== 'all') and.push({ status: { _eq: status } })
  if (priority !== 'all') and.push({ priority: { _eq: priority } })
  if (assignedTo === 'unassigned') and.push({ assigned_to: { _null: true } })
  else if (assignedTo !== 'all') and.push({ assigned_to: { _eq: assignedTo } })

  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
  const startOfTomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString()
  if (followUp === 'overdue') {
    and.push(
      { next_follow_up_at: { _lt: now.toISOString() } },
      { _or: [{ status: { _nin: ['won', 'lost'] } }, { status: { _null: true } }] },
    )
  }
  if (followUp === 'today') and.push({ next_follow_up_at: { _gte: startOfToday, _lt: startOfTomorrow } })
  if (followUp === 'upcoming') and.push({ next_follow_up_at: { _gte: startOfTomorrow } })
  if (followUp === 'none') and.push({ next_follow_up_at: { _null: true } })

  // For pagination: fetch one extra record to detect if there is a next page.
  const fetchLimit = pageSizeParam + 1
  const offset = (pageParam - 1) * pageSizeParam

  const queryFilter = and.length ? { _and: and } : undefined

  try {
    const leads = await client.request(
      readItems('leads', {
        fields: [...LEAD_FIELDS],
        filter: queryFilter,
        sort: SORTS[sort],
        limit: fetchLimit,
        offset,
      }),
    )
    const hasNext = leads.length > pageSizeParam
    const items = hasNext ? leads.slice(0, pageSizeParam) : leads
    return NextResponse.json({ leads: items, page: pageParam, page_size: pageSizeParam, hasNext })
  } catch (initialError) {
    console.warn('[admin/crm/leads] Primary query failed, attempting safe fallback query without relational expansion', initialError)
    try {
      const fallbackFields = [
        'id', 'name', 'email', 'phone', 'country', 'interest', 'source', 'status', 'date_created',
        'assigned_to', 'priority', 'next_follow_up_at', 'estimated_value', 'currency',
      ]
      const leads = await client.request(
        readItems('leads', {
          fields: fallbackFields,
          filter: queryFilter,
          sort: ['-date_created'],
          limit: fetchLimit,
          offset,
        }),
      )
      const hasNext = leads.length > pageSizeParam
      const items = hasNext ? leads.slice(0, pageSizeParam) : leads
      return NextResponse.json({ leads: items, page: pageParam, page_size: pageSizeParam, hasNext })
    } catch (fallbackError) {
      try {
        const leads = await client.request(readItems('leads', { limit: fetchLimit, offset, sort: ['-date_created'] }))
        const hasNext = leads.length > pageSizeParam
        const items = hasNext ? leads.slice(0, pageSizeParam) : leads
        return NextResponse.json({ leads: items, page: pageParam, page_size: pageSizeParam, hasNext })
      } catch (finalError) {
        console.error('[admin/crm/leads] Final lead fetch failed', finalError)
        return directusError(finalError, 'Could not load CRM leads')
      }
    }
  }
}
