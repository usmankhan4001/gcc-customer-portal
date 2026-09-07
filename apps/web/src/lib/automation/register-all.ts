// Integration wiring: registers every cross-track automation action into Track A's
// registry so a single workflow can touch email, WhatsApp and support tickets.
//
// Each track owns a self-contained registration function (email -> registerEmailActions,
// WhatsApp -> registerSendWhatsappAction) whose handler signature differs from Track A's
// engine `ActionHandler` (it gets a payload, not a ctx). This module adapts those to the
// engine's `ActionHandler` shape and registers `create_ticket` (Support) here too, since
// that action has no per-track registration function.
//
// This file is the whole-set seam the four parallel tracks were built to meet at. It is
// imported once by emit.ts so the handlers exist before any trigger can dispatch.

import { createItem, readItems } from '@directus/sdk'
import type { ActionPayload, AutomationActionName } from './contract'
import { registerActionHandler } from './registry'
import type { ActionOutcome } from './registry'
import { logAutomationError } from './registry'
import { registerEmailActions, type EmailActionHandler } from '@/lib/email/automation-actions'
import { registerSendWhatsappAction } from '@/lib/whatsapp/actions'
import { portalDirectus } from '@/lib/portal'
import { nextTicketNumber } from '@/lib/ticket-number'

function emailAdapter<N extends AutomationActionName>(name: N, handler: EmailActionHandler<N>) {
  registerActionHandler(name as AutomationActionName, async (_ctx, payload) => {
    const result = await handler(payload as ActionPayload[N])
    return result.ok
      ? { ok: true, status: 'succeeded' as const }
      : { ok: false, status: 'failed' as const, error: result.error }
  })
}

export function registerAllActions(): void {
  registerEmailActions({ register: emailAdapter })

  registerSendWhatsappAction((name, handler) => {
    registerActionHandler(name, async (_ctx, payload) => {
      const result = await handler(payload as ActionPayload['send_whatsapp'])
      return result.ok
        ? { ok: true, status: 'succeeded' as const }
        : { ok: false, status: 'failed' as const }
    })
  })

  // create_ticket: Support-facing. The engine runs server-side under the service token
  // (granted create on tickets/ticket_messages), and ticket_number is derived from the
  // max existing (same logic the customer portal uses) so numbers stay monotonic.
  registerActionHandler('create_ticket', async (_ctx, payload): Promise<ActionOutcome> => {
    const subject = String(payload.subject ?? '').trim()
    if (!subject) return { ok: false, status: 'failed', error: 'create_ticket requires a subject' }
    try {
      const client = portalDirectus()
      const existing = await client.request(
        readItems('tickets', { fields: ['ticket_number'], limit: -1 }),
      ).catch(() => [])
      const ticketNumber = nextTicketNumber(existing.map((t) => t.ticket_number))
      const ticket = await client.request(
        createItem('tickets', {
          ticket_number: ticketNumber,
          lead_id: typeof payload.leadId === 'string' ? payload.leadId : null,
          subject,
          status: 'open',
          priority: 'normal',
          channel: 'internal',
        }),
      )
      const body = String(payload.body ?? '').trim()
      if (body) {
        await client.request(createItem('ticket_messages', { ticket: ticket.id, author_type: 'staff', body }))
      }
      return { ok: true, status: 'succeeded' }
    } catch (error) {
      logAutomationError('create_ticket', error)
      const message = error instanceof Error ? error.message : 'unknown error'
      return { ok: false, status: 'failed', error: message.slice(0, 300) }
    }
  })
}
