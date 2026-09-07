// Fail-safe Meta Cloud API WhatsApp client, mirroring the shape of the other
// integrations (n8n.ts, sender.ts): when the META_WHATSAPP_* env vars are unset the
// send functions are no-ops that log a warning and return false rather than throw,
// so an unconfigured system degrades to a logged warning and never takes down a
// caller. Additive to — and deliberately separate from — the existing outbound-only
// WAHA/n8n path (src/lib/integrations/n8n.ts → whatsapp_log), which keeps running
// unchanged.

const GRAPH_BASE = 'https://graph.facebook.com'

/**
 * Posts a message to the Meta Graph API. Returns true when Meta accepted the send.
 * The bool-only contract keeps this a no-op that can never throw; the admin thread
 * panel records its own outbound thread row rather than relying on a returned wamid.
 */
async function graphPost(endpoint: string, body: Record<string, unknown>): Promise<boolean> {
  const token = process.env.META_WHATSAPP_ACCESS_TOKEN
  const phoneNumberId = process.env.META_WHATSAPP_PHONE_NUMBER_ID
  if (!token || !phoneNumberId) {
    console.warn(
      '[whatsapp] META_WHATSAPP_ACCESS_TOKEN / META_WHATSAPP_PHONE_NUMBER_ID not set — send is a no-op',
    )
    return false
  }

  const version = process.env.META_WHATSAPP_GRAPH_VERSION ?? 'v20.0'
  const url = `${GRAPH_BASE}/${version}/${phoneNumberId}/${endpoint}`
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (!res.ok) {
      const detail = await res.text().catch(() => null)
      console.error(`[whatsapp] Meta Graph returned ${res.status}${detail ? `: ${detail.slice(0, 500)}` : ''}`)
      return false
    }
    return true
  } catch (error) {
    console.error('[whatsapp] Meta Graph send failed', error)
    return false
  }
}

/**
 * Sends a free-form text message inside Meta's 24-hour customer-service window.
 * Outside that window sendWhatsappTemplate should be used instead (templates are the
 * only send type Meta allows past the window).
 */
export async function sendWhatsappText(to: string, body: string): Promise<boolean> {
  if (!body.trim() || !to.trim()) return false
  return graphPost('messages', {
    messaging_product: 'whatsapp',
    to,
    type: 'text',
    text: { body },
  })
}

/**
 * Sends an approved interactive template. `templateName` is the template's name on
 * Meta (mirrors `whatsapp_templates_cache.name`). Template sends are the correct lane
 * for the opted_out-aware outbound used outside Meta's customer-service window.
 */
export async function sendWhatsappTemplate(
  to: string,
  templateName: string,
  languageCode = 'en',
): Promise<boolean> {
  if (!templateName.trim() || !to.trim()) return false
  return graphPost('messages', {
    messaging_product: 'whatsapp',
    to,
    type: 'template',
    template: { name: templateName, language: { code: languageCode } },
  })
}

/**
 * Campaign-grade template send that returns the full Meta API response so the
 * dispatcher can extract the wamid (message ID). Unlike the boolean-only
 * sendWhatsappTemplate, this returns null when Meta env vars are unset or the
 * call fails — the dispatcher uses null to mark the message as failed.
 */
export async function sendWhatsappTemplateWithMeta(
  to: string,
  templateName: string,
  languageCode = 'en',
  options?: {
    headerMediaUrl?: string
    headerVariables?: string[]
    bodyVariables?: string[]
  },
): Promise<{ wamid: string } | null> {
  const token = process.env.META_WHATSAPP_ACCESS_TOKEN
  const phoneNumberId = process.env.META_WHATSAPP_PHONE_NUMBER_ID
  if (!token || !phoneNumberId || !templateName.trim() || !to.trim()) return null

  const version = process.env.META_WHATSAPP_GRAPH_VERSION ?? 'v20.0'
  const url = `${GRAPH_BASE}/${version}/${phoneNumberId}/messages`

  // Build template components for variables
  const components: Array<Record<string, unknown>> = []

  if (options?.headerMediaUrl) {
    components.push({
      type: 'header',
      parameters: [
        {
          type: 'image',
          image: { link: options.headerMediaUrl },
        },
      ],
    })
  } else if (options?.headerVariables?.length) {
    components.push({
      type: 'header',
      parameters: options.headerVariables.map((v) => ({
        type: 'text',
        text: v,
      })),
    })
  }

  if (options?.bodyVariables?.length) {
    components.push({
      type: 'body',
      parameters: options.bodyVariables.map((v) => ({
        type: 'text',
        text: v,
      })),
    })
  }

  const body: Record<string, unknown> = {
    messaging_product: 'whatsapp',
    to,
    type: 'template',
    template: {
      name: templateName,
      language: { code: languageCode },
      ...(components.length ? { components } : {}),
    },
  }

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (!res.ok) {
      const detail = await res.text().catch(() => null)
      console.error(`[whatsapp] Meta Graph returned ${res.status}${detail ? `: ${detail.slice(0, 500)}` : ''}`)
      return null
    }
    const json = await res.json().catch(() => null)
    const wamid = json?.messages?.[0]?.id
    return wamid ? { wamid } : null
  } catch (error) {
    console.error('[whatsapp] Meta Graph template send failed', error)
    return null
  }
}
