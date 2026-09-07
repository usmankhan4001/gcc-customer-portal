// Self-registers the `send_whatsapp` automation action into Track A's registry.
//
// Track A owns the real registry file (src/lib/automation/registry.ts), which does
// not exist yet. So compile-safe admission is via a small, self-contained register
// function whose signature is defined here rather than importing the not-yet-landed
// registry. Once Track A's engine lands it calls registerSendWhatsappAction() with
// its own registerActionHandler(), and nothing in this file changes.
//
// The payload shape is pinned to the frozen contract's ActionPayload['send_whatsapp']
// so a future engine change breaks the typecheck here instead of silently diverging.

import type { AutomationActionName, ActionPayload } from '@/lib/automation/contract'
import { sendWhatsappTemplate, sendWhatsappText } from './client'

export type SendWhatsappPayload = ActionPayload['send_whatsapp']
export type SendWhatsappResult = { ok: boolean }

/** The shape Track A's registerActionHandler must satisfy to onboard `send_whatsapp`. */
export type SendWhatsappRegister = (
  name: AutomationActionName,
  handler: (payload: SendWhatsappPayload) => Promise<SendWhatsappResult>,
) => unknown

/**
 * Registers the `send_whatsapp` handler. Additive and idempotent by design: it only
 * registers a handler for the one action name this track owns.
 */
export function registerSendWhatsappAction(register: SendWhatsappRegister): void {
  register('send_whatsapp', runSendWhatsapp)
}

/**
 * Runs the `send_whatsapp` action. `templateId` (a template name at the Meta layer)
 * wins over free text; when neither is present the send is refused. Outbound sends are
 * deliberately NOT gated on the conversation's opted_out here — that flag governs
 * broadcast-style template sends outside Meta's 24-hour customer-service window and
 * must be enforced by the automations using this action, not conflated with in-window
 * free-form replies.
 */
export async function runSendWhatsapp(payload: SendWhatsappPayload): Promise<SendWhatsappResult> {
  const recipient = payload.recipient?.trim()
  if (!recipient) return { ok: false }

  const ok = payload.templateId
    ? await sendWhatsappTemplate(recipient, payload.templateId)
    : payload.text
      ? await sendWhatsappText(recipient, payload.text)
      : false
  return { ok }
}
