import type {
  DirectusUserSummary,
  EmailEventItem,
  LeadActivityItem,
  LeadConsentItem,
  LeadItem,
  LeadStageHistoryItem,
  LeadTaskItem,
} from '@/lib/directus'

export type CRMLead = Omit<LeadItem, 'assigned_to'> & {
  assigned_to?: DirectusUserSummary | string | null
}

export type CRMTask = Omit<LeadTaskItem, 'lead_id' | 'assigned_to'> & {
  lead_id: Pick<CRMLead, 'id' | 'name' | 'email' | 'status'> | string
  assigned_to?: DirectusUserSummary | string | null
}

export type LeadDetailPayload = {
  lead: CRMLead
  activities: LeadActivityItem[]
  tasks: CRMTask[]
  stageHistory: LeadStageHistoryItem[]
  consents: LeadConsentItem[]
  emailEvents: EmailEventItem[]
}

export function userLabel(user?: DirectusUserSummary | string | null) {
  if (!user) return 'Unassigned'
  if (typeof user === 'string') return user
  const name = [user.first_name, user.last_name].filter(Boolean).join(' ')
  return name || user.email || 'Unknown user'
}

export function userId(user?: DirectusUserSummary | string | null) {
  if (!user) return ''
  return typeof user === 'string' ? user : user.id
}

export function formatMoney(value?: number | string | null, currency = 'USD') {
  if (value === null || value === undefined) return null
  const amount = Number(value)
  if (!Number.isFinite(amount)) return null
  return new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount)
}

export function formatShortDate(value?: string | null, withTime = false) {
  if (!value) return 'Not set'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
    hour: withTime ? 'numeric' : undefined,
    minute: withTime ? '2-digit' : undefined,
  }).format(date)
}

export function isOverdue(value?: string | null) {
  return Boolean(value && new Date(value).getTime() < Date.now())
}

export async function crmFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init)
  const data = await response.json().catch(() => ({})) as { error?: string }
  if (!response.ok) throw new Error(data.error || 'CRM request failed')
  return data as T
}
