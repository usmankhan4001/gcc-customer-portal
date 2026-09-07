// Automation execution engine
//
// Lifecycle of one execution:
//   1. A trigger fires → emitAutomationTrigger (emit.ts) → evaluateTriggersForEvent
//      records an automation_events row, finds active workflows whose trigger_name
//      matches, and for each starts an execution and runs its graph synchronously.
//   2. runGraph walks the linear node list. A `wait` node parks the execution as
//      `waiting` with a resume time; the tick's advanceExecutions picks it up once
//      that time passes. A failure parks it as `failed`. Completion parks it as
//      `completed`.
//   3. If the tick budget is exhausted mid-run, the execution is parked as
//      `waiting` with an immediate resume time so the next tick continues it.
//
// Concurrency: the only state transition that claims work is `waiting` → `running`,
// applied with the optimistic-lock UPDATE shape from src/app/api/jobs/tick/route.ts
// (filter on the state the row was read with). Two ticks racing on the same waiting
// execution means exactly one matches the row; the other moves on. No new locking
// primitive was introduced.
//
// Progress is persisted in the execution's `last_error` field as a compact JSON
// resume-state blob whenever the run is parked mid-way. That field is dual-purpose:
// it holds a human error message when the execution failed, and a
// { resumeAt, nextIndex } blob when it is parked and resumable.

import { createItem, readItems, updateItem, updateItems } from '@directus/sdk'
import { registerActionHandler } from './registry'

import type { AutomationTriggerName, TriggerPayload } from './contract'
import { graphNodes, type AutomationNode } from './nodes'
import {
  getActionHandler,
  logAutomationError,
  type ActionOutcome,
  type AutomationClient,
  type AutomationExecutionItem,
  type AutomationWorkflowItem,
} from './registry'

type ResumeState = { resumeAt: string; nextIndex: number }

type LogStatus = 'running' | 'succeeded' | 'failed' | 'waiting'

function encodeResume(state: ResumeState): string {
  return JSON.stringify(state)
}

/** Reads the resume blob out of last_error; returns null when it is a real error. */
function resumeStateOf(execution: AutomationExecutionItem): ResumeState | null {
  const raw = execution.last_error
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw)
    if (
      parsed &&
      typeof parsed === 'object' &&
      typeof (parsed as { nextIndex?: unknown }).nextIndex === 'number' &&
      typeof (parsed as { resumeAt?: unknown }).resumeAt === 'string'
    ) {
      return { resumeAt: (parsed as ResumeState).resumeAt, nextIndex: (parsed as ResumeState).nextIndex }
    }
  } catch {
    // not a resume blob — it is a genuine error message
  }
  return null
}

function leadIdOf(payload: Record<string, unknown>): string | null {
  const value = (payload as { leadId?: unknown }).leadId
  return typeof value === 'string' && value ? value : null
}

// --- trigger evaluation --------------------------------------------------------

export type TriggerEvaluationSummary = {
  eventId: string | null
  matched: number
  started: number
  completed: number
  failed: number
  waiting: number
}

export async function evaluateTriggersForEvent<N extends AutomationTriggerName>(
  client: AutomationClient,
  name: N,
  payload: TriggerPayload[N],
): Promise<TriggerEvaluationSummary> {
  const summary: TriggerEvaluationSummary = { eventId: null, matched: 0, started: 0, completed: 0, failed: 0, waiting: 0 }
  const raw = payload as Record<string, unknown>
  const leadId = leadIdOf(raw)

  summary.eventId = await recordEvent(client, name, leadId, raw)

  const workflows = await activeWorkflowsForTrigger(client, name)
  for (const workflow of workflows) {
    if (!triggerMatches(workflow, name, raw)) continue
    summary.matched += 1
    const execution = await startExecution(client, workflow, leadId)
    if (!execution) continue
    summary.started += 1
    const outcome = await runGraph(client, execution, workflow, 0, null)
    if (outcome === 'completed') summary.completed += 1
    else if (outcome === 'failed') summary.failed += 1
    else if (outcome === 'waiting') summary.waiting += 1
  }

  return summary
}

async function recordEvent(
  client: AutomationClient,
  name: AutomationTriggerName,
  leadId: string | null,
  payload: Record<string, unknown>,
): Promise<string | null> {
  try {
    const created = await client.request(
      createItem('automation_events', { event_name: name, lead_id: leadId, payload }, { fields: ['id'] }),
    )
    return typeof created.id === 'string' ? created.id : null
  } catch (error) {
    logAutomationError(`recordEvent(${name})`, error)
    return null
  }
}

async function activeWorkflowsForTrigger(
  client: AutomationClient,
  name: AutomationTriggerName,
): Promise<AutomationWorkflowItem[]> {
  try {
    return await client.request(
      readItems('automation_workflows', {
        filter: { status: { _eq: 'active' }, trigger_name: { _eq: name } },
        limit: -1,
      }),
    )
  } catch (error) {
    logAutomationError(`activeWorkflowsForTrigger(${name})`, error)
    return []
  }
}

/** Trigger-config filtering: each trigger type can narrow which events start a workflow. */
function triggerMatches(workflow: AutomationWorkflowItem, name: AutomationTriggerName, payload: Record<string, unknown>): boolean {
  const config = workflow.trigger_config
  if (!config || typeof config !== 'object') return true

  // lead.stage_changed — only fire when the lead moved to the configured stage
  if (name === 'lead.stage_changed') {
    const stage = (config as { stage?: unknown }).stage
    if (typeof stage === 'string' && stage) return (payload as { stage?: unknown }).stage === stage
  }

  // whatsapp.message_received — keyword matching against the inbound body
  if (name === 'whatsapp.message_received') {
    const keyword = (config as { keyword?: unknown }).keyword
    const matchType = (config as { match_type?: unknown }).match_type
    if (typeof keyword === 'string' && keyword.trim()) {
      // Extract the body from the raw Meta message shape
      const message = (payload as { message?: Record<string, unknown> }).message
      const textBody = (message?.text as Record<string, unknown> | undefined)?.body
      const body = typeof textBody === 'string' ? textBody.trim().toLowerCase() : ''
      const kw = keyword.trim().toLowerCase()
      if (matchType === 'exact') return body === kw
      if (matchType === 'starts_with') return body.startsWith(kw)
      return body.includes(kw) // default: contains
    }
  }

  return true
}

async function startExecution(
  client: AutomationClient,
  workflow: AutomationWorkflowItem,
  leadId: string | null,
): Promise<AutomationExecutionItem | null> {
  try {
    return await client.request(
      createItem(
        'automation_executions',
        { workflow: workflow.id, lead_id: leadId, status: 'running', started_at: new Date().toISOString() },
        { fields: ['id', 'workflow', 'lead_id', 'status', 'started_at', 'finished_at', 'last_error', 'date_created'] },
      ),
    )
  } catch (error) {
    logAutomationError('startExecution', error)
    return null
  }
}

// --- graph execution -----------------------------------------------------------

async function runGraph(
  client: AutomationClient,
  execution: AutomationExecutionItem,
  workflow: AutomationWorkflowItem,
  startIndex: number,
  deadlineAt: number | null | undefined,
): Promise<'completed' | 'failed' | 'waiting'> {
  const nodes = graphNodes(workflow.graph)
  let index = startIndex

  while (index < nodes.length) {
    if (deadlineAt && Date.now() > deadlineAt) {
      await parkExecution(client, execution, { resumeAt: new Date().toISOString(), nextIndex: index })
      return 'waiting'
    }

    const node = nodes[index]
    const logId = await writeLog(client, execution.id, node, 'running')
    // Condition nodes: evaluate the field against lead data and branch.
    // The handler returns branchTo with the target node id.
    let outcome: ActionOutcome | null = null
    if (node.action === 'condition' && node.config) {
      const leadId = execution.lead_id
      const field = String(node.config.field ?? '')
      const operator = String(node.config.operator ?? 'equals')
      const compareValue = String(node.config.value ?? '')
      if (!leadId || !field) {
        outcome = { ok: false, status: 'failed', error: 'condition requires lead_id and config.field' }
      } else {
        const fieldValue = await resolveLeadField(client, leadId, field)
        const result = evaluateCondition(fieldValue, operator, compareValue)
        outcome = {
          ok: true,
          status: 'succeeded',
          branchTo: result ? node.yesEdge : node.noEdge,
        }
      }
    } else {
      outcome = await dispatchAction(client, execution, node)
    }

    // branchTo: condition nodes return a target node id — resolve it to an index
    // so runGraph jumps there instead of advancing sequentially.
    if (outcome && outcome.branchTo) {
      const targetIdx = nodes.findIndex((n) => n.id === outcome.branchTo)
      if (targetIdx >= 0) {
        // Set index to targetIdx - 1 so the index += 1 below lands on targetIdx
        index = targetIdx - 1
      } else {
        console.error(`[automation] branchTo node "${outcome.branchTo}" not found — falling through`)
      }
    }

    if (outcome && outcome.status === 'waiting') {
      const resumeAt = outcome.resumeAt ?? new Date().toISOString()
      await updateLog(client, logId, 'waiting', resumeAt)
      await parkExecution(client, execution, { resumeAt, nextIndex: index + 1 })
      return 'waiting'
    }

    if (!outcome || !outcome.ok) {
      const message = outcome?.error ?? 'action failed'
      await updateLog(client, logId, 'failed', message)
      await failExecution(client, execution, message)
      return 'failed'
    }

    await updateLog(client, logId, 'succeeded', null)
    index += 1
  }

  await completeExecution(client, execution)
  return 'completed'
}

async function dispatchAction(client: AutomationClient, execution: AutomationExecutionItem, node: AutomationNode): Promise<ActionOutcome> {
  const payload = node.config ?? {}

  // Any track may register a handler (email.*, create_ticket, send_whatsapp). A
  // registered handler wins over the built-ins so a track can override behaviour.
  const handler = getActionHandler(node.action)
  if (handler) return handler({ client, execution, node }, payload)

  switch (node.action) {
    case 'wait':
      return handleWait(payload)
    case 'call_webhook':
      return handleWebhook(payload)
    case 'create_task':
      return handleCreateTask(client, payload)
    case 'update_lead_field':
      return handleUpdateLeadField(client, payload)
    default:
      // No handler registered yet (another track owns this action). Fail-safe no-op:
      // log and continue so a workflow is never blocked by an integration that has
      // not shipped. Mirrors the optional-integration invariant in CLAUDE.md §2.9.
      console.warn(`[automation] no handler registered for action "${node.action}" — skipping`)
      return { ok: true, status: 'succeeded' }
  }
}

// --- built-in actions ----------------------------------------------------------
// ---------------------------------------------------------------------------
// Condition, delay, and delay_until helpers
// ---------------------------------------------------------------------------

/**
 * Resolve a potentially nested field path on a Directus lead record.
 * Supports dot notation (e.g. "country.name") by traversing the response
 * object one level at a time. Returns undefined when any segment is missing.
 *
 * The lead is fetched once and cached for the lifetime of a single workflow
 * execution — repeated condition nodes in the same graph should not re-fetch.
 */
const _leadCache = new Map<string, Record<string, unknown>>()
export async function resolveLeadField(
  client: AutomationClient,
  leadId: string,
  fieldPath: string,
): Promise<unknown> {
  let lead = _leadCache.get(leadId)
  if (!lead) {
    const { readItems } = await import('@directus/sdk')
    const items = await client.request(
      readItems('leads', {
        filter: { id: { _eq: leadId } },
        limit: 1,
      }),
    ) as unknown as Record<string, unknown>[]
    lead = items?.[0] ?? {}
    _leadCache.set(leadId, lead)
  }
  const segments = fieldPath.split('.')
  let value: unknown = lead
  for (const segment of segments) {
    if (value === null || value === undefined || typeof value !== 'object') {
      return undefined
    }
    value = (value as Record<string, unknown>)[segment]
  }
  return value
}

/**
 * Evaluate a condition against lead data. Supports seven operators.
 * Returns true when the condition is satisfied, false otherwise.
 */
function evaluateCondition(
  fieldValue: unknown,
  operator: string,
  compareValue: string,
): boolean {
  const str = fieldValue === null || fieldValue === undefined ? '' : String(fieldValue)
  switch (operator) {
    case 'equals':
      return str === compareValue
    case 'not_equals':
      return str !== compareValue
    case 'contains':
      return str.includes(compareValue)
    case 'greater_than':
      return Number(str) > Number(compareValue)
    case 'less_than':
      return Number(str) < Number(compareValue)
    case 'is_empty':
      return str === '' || str === 'undefined' || str === 'null'
    case 'is_not_empty':
      return str !== '' && str !== 'undefined' && str !== 'null'
    default:
      return false
  }
}

/**
 * Compute the next fire time from a cron expression (5-field, UTC).
 * Uses a lightweight parser — does not pull in a cron library.
 * Returns the next Date that matches, or null on invalid expressions.
 *
 * Supports: minute hour dayOfMonth month dayOfWeek (all 1-indexed except dayOfWeek where 0=Sun).
 */
function nextCronFire(cronExpr: string): Date | null {
  const parts = cronExpr.trim().split(/\s+/)
  if (parts.length !== 5) return null
  const [minExpr, hourExpr, domExpr, monthExpr, dowExpr] = parts
  const now = new Date()
  // Scan forward from the next minute for at most 366 days (1 year)
  const start = new Date(now)
  start.setSeconds(0)
  start.setMilliseconds(0)
  start.setMinutes(start.getMinutes() + 1)
  for (let i = 0; i < 525600; i++) {
    const candidate = new Date(start.getTime() + i * 60_000)
    if (matchesCronField(minExpr, candidate.getMinutes()) &&
      matchesCronField(hourExpr, candidate.getHours()) &&
      matchesCronField(domExpr, candidate.getDate()) &&
      matchesCronField(monthExpr, candidate.getMonth() + 1) &&
      matchesCronField(dowExpr, candidate.getDay())) {
      return candidate
    }
  }
  return null
}

/** Check whether a single cron field matches a numeric value. */
function matchesCronField(field: string, value: number): boolean {
  if (field === '*') return true
  if (field.includes(',')) {
    return field.split(',').some((part) => matchesCronField(part.trim(), value))
  }
  if (field.includes('-')) {
    const [lo, hi] = field.split('-').map(Number)
    return value >= lo && value <= hi
  }
  if (field.includes('/')) {
    const [start, step] = field.split('/').map(Number)
    return value >= start && (value - start) % step === 0
  }
  return Number(field) === value
}

// ---------------------------------------------------------------------------
// Register built-in engine handlers
// ---------------------------------------------------------------------------
// delay: park the execution for a human-readable duration.
registerActionHandler('delay', async (_ctx, payload): Promise<ActionOutcome> => {
  const duration = Number(payload.duration ?? 0)
  const unit = String(payload.unit ?? 'minutes')
  if (duration <= 0) return { ok: false, status: 'failed', error: 'delay requires duration > 0' }
  const ms = unit === 'hours' ? duration * 3_600_000
    : unit === 'days' ? duration * 86_400_000
    : duration * 60_000 // minutes (default)
  const resumeAt = new Date(Date.now() + ms).toISOString()
  return { ok: true, status: 'waiting', resumeAt }
})

// delay_until: park the execution until a cron expression next fires.
registerActionHandler('delay_until', async (_ctx, payload): Promise<ActionOutcome> => {
  const cron = String(payload.cron ?? '')
  if (!cron) return { ok: false, status: 'failed', error: 'delay_until requires a cron expression' }
  const next = nextCronFire(cron)
  if (!next) return { ok: false, status: 'failed', error: `no matching cron fire found for "${cron}" within 1 year` }
  return { ok: true, status: 'waiting', resumeAt: next.toISOString() }
})

function handleWait(payload: Record<string, unknown>): ActionOutcome {
  const seconds = typeof payload.seconds === 'number' && payload.seconds > 0 ? payload.seconds : 0
  const resumeAt = new Date(Date.now() + seconds * 1_000).toISOString()
  return { ok: true, status: 'waiting', resumeAt }
}

/** Fire-and-forget, like forwardToN8n: log failures, never fail the workflow. */
async function handleWebhook(payload: Record<string, unknown>): Promise<ActionOutcome> {
  const url = typeof payload.url === 'string' ? payload.url.trim() : ''
  if (!url) {
    console.warn('[automation] call_webhook missing url — skipping')
    return { ok: true, status: 'succeeded' }
  }
  const body = payload.payload && typeof payload.payload === 'object' ? payload.payload : {}
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (!res.ok) {
      const text = await res.text().catch(() => null)
      console.error(`[automation] call_webhook to ${url} responded ${res.status}${text ? `: ${text.slice(0, 300)}` : ''}`)
    }
  } catch (error) {
    console.error(`[automation] call_webhook to ${url} failed`, error)
  }
  return { ok: true, status: 'succeeded' }
}

async function handleCreateTask(client: AutomationClient, payload: Record<string, unknown>): Promise<ActionOutcome> {
  const leadId = typeof payload.leadId === 'string' ? payload.leadId : ''
  const title = typeof payload.title === 'string' ? payload.title.trim() : ''
  if (!leadId || !title) return { ok: false, status: 'failed', error: 'create_task requires leadId and title' }
  const dueAt = typeof payload.dueAt === 'string' && payload.dueAt ? payload.dueAt : null
  try {
    await client.request(
      createItem('lead_tasks', { lead_id: leadId, title, due_at: dueAt, status: 'open', priority: 'normal' }),
    )
    return { ok: true, status: 'succeeded' }
  } catch (error) {
    logAutomationError('create_task', error)
    return { ok: false, status: 'failed', error: 'could not create task' }
  }
}

async function handleUpdateLeadField(client: AutomationClient, payload: Record<string, unknown>): Promise<ActionOutcome> {
  const leadId = typeof payload.leadId === 'string' ? payload.leadId : ''
  const field = typeof payload.field === 'string' ? payload.field.trim() : ''
  if (!leadId || !field) return { ok: false, status: 'failed', error: 'update_lead_field requires leadId and field' }
  try {
    await client.request(updateItem('leads', leadId, { [field]: payload.value }))
    return { ok: true, status: 'succeeded' }
  } catch (error) {
    logAutomationError('update_lead_field', error)
    return { ok: false, status: 'failed', error: 'could not update lead field' }
  }
}

// --- execution lifecycle writes ------------------------------------------------

/** Audit-trail writes are best-effort: a log failure must never fail the workflow. */
async function writeLog(client: AutomationClient, executionId: string, node: AutomationNode, status: LogStatus): Promise<string | null> {
  try {
    const created = await client.request(
      createItem('automation_execution_logs', { execution: executionId, node_id: node.id, status, message: null }, { fields: ['id'] }),
    )
    return typeof created.id === 'string' ? created.id : null
  } catch (error) {
    logAutomationError('writeLog', error)
    return null
  }
}

async function updateLog(client: AutomationClient, logId: string | null, status: LogStatus, message: string | null): Promise<void> {
  if (!logId) return
  try {
    await client.request(updateItem('automation_execution_logs', logId, { status, message }))
  } catch (error) {
    logAutomationError('updateLog', error)
  }
}

async function parkExecution(client: AutomationClient, execution: AutomationExecutionItem, resume: ResumeState): Promise<void> {
  try {
    await client.request(
      updateItem('automation_executions', execution.id, { status: 'waiting', last_error: encodeResume(resume) }),
    )
  } catch (error) {
    logAutomationError('parkExecution', error)
  }
}

async function failExecution(client: AutomationClient, execution: AutomationExecutionItem, message: string): Promise<void> {
  try {
    await client.request(
      updateItem('automation_executions', execution.id, {
        status: 'failed',
        last_error: message,
        finished_at: new Date().toISOString(),
      }),
    )
  } catch (error) {
    logAutomationError('failExecution', error)
  }
}

async function completeExecution(client: AutomationClient, execution: AutomationExecutionItem): Promise<void> {
  try {
    await client.request(
      updateItem('automation_executions', execution.id, {
        status: 'completed',
        last_error: null,
        finished_at: new Date().toISOString(),
      }),
    )
  } catch (error) {
    logAutomationError('completeExecution', error)
  }
}

// --- the tick: advance parked executions ---------------------------------------

export type AdvanceSummary = {
  selected: number
  advanced: number
  completed: number
  failed: number
  waiting: number
}

export async function advanceExecutions(
  client: AutomationClient,
  options: { deadlineAt?: number; limit?: number } = {},
): Promise<AdvanceSummary> {
  const limit = options.limit ?? 25
  const summary: AdvanceSummary = { selected: 0, advanced: 0, completed: 0, failed: 0, waiting: 0 }

  const candidates = await waitingExecutions(client, limit)
  const now = Date.now()
  const due = candidates.filter((execution) => {
    const resume = resumeStateOf(execution)
    return resume && new Date(resume.resumeAt).getTime() <= now
  })
  summary.selected = due.length

  for (const execution of due) {
    if (options.deadlineAt && Date.now() > options.deadlineAt) break
    if (!(await claimExecution(client, execution))) continue
    summary.advanced += 1

    const workflow = await workflowForExecution(client, execution)
    if (!workflow) {
      await failExecution(client, execution, 'workflow no longer available')
      summary.failed += 1
      continue
    }

    const resume = resumeStateOf(execution)
    const outcome = await runGraph(client, execution, workflow, resume ? resume.nextIndex : 0, options.deadlineAt)
    if (outcome === 'completed') summary.completed += 1
    else if (outcome === 'failed') summary.failed += 1
    else if (outcome === 'waiting') summary.waiting += 1
  }

  return summary
}

async function waitingExecutions(client: AutomationClient, limit: number): Promise<AutomationExecutionItem[]> {
  try {
    return await client.request(
      readItems('automation_executions', {
        filter: { status: { _eq: 'waiting' } },
        fields: ['id', 'workflow', 'lead_id', 'status', 'started_at', 'finished_at', 'last_error', 'date_created'],
        sort: ['date_created'],
        limit,
      }),
    )
  } catch (error) {
    logAutomationError('waitingExecutions', error)
    return []
  }
}

/** Optimistic lock: only one tick can flip a waiting execution to running. */
async function claimExecution(client: AutomationClient, execution: AutomationExecutionItem): Promise<boolean> {
  try {
    const claimed = await client.request(
      updateItems(
        'automation_executions',
        { filter: { id: { _eq: execution.id }, status: { _eq: 'waiting' } } },
        { status: 'running' },
        { fields: ['id'] },
      ),
    )
    return claimed.length > 0
  } catch (error) {
    logAutomationError('claimExecution', error)
    return false
  }
}

async function workflowForExecution(client: AutomationClient, execution: AutomationExecutionItem): Promise<AutomationWorkflowItem | null> {
  const workflowId = typeof execution.workflow === 'string' ? execution.workflow : execution.workflow?.id
  if (!workflowId) return null
  try {
    const items = await client.request(readItems('automation_workflows', { filter: { id: { _eq: workflowId } }, limit: 1 }))
    return items[0] ?? null
  } catch (error) {
    logAutomationError('workflowForExecution', error)
    return null
  }
}

// --- manual "run now" (used by the admin API) ----------------------------------

export async function runWorkflowNow(
  client: AutomationClient,
  workflowId: string,
  leadId?: string | null,
): Promise<{ ok: boolean; executionId?: string; status?: string; error?: string }> {
  const workflow = await workflowById(client, workflowId)
  if (!workflow) return { ok: false, error: 'workflow not found' }
  const execution = await startExecution(client, workflow, leadId ?? null)
  if (!execution) return { ok: false, error: 'could not start execution' }
  const outcome = await runGraph(client, execution, workflow, 0, null)
  return { ok: outcome !== 'failed', executionId: execution.id, status: outcome }
}

async function workflowById(client: AutomationClient, workflowId: string): Promise<AutomationWorkflowItem | null> {
  try {
    const items = await client.request(readItems('automation_workflows', { filter: { id: { _eq: workflowId } }, limit: 1 }))
    return items[0] ?? null
  } catch (error) {
    logAutomationError('workflowById', error)
    return null
  }
}
