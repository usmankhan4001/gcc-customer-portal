import { NextResponse } from 'next/server'
import { createItem, readItems } from '@directus/sdk'
import { directusFromSession } from '@/lib/auth'
import { apiError, directusError, readJsonObject } from '../_shared'
import { sendWhatsappText } from '@/lib/whatsapp/client'

// The thread panel's backend: lists the lead's WhatsApp conversation + messages and
// sends an in-window reply. Mirrors the other /api/admin/crm routes — session-scoped
// Directus client, _shared validation helpers, directusError() mapping. This track
// owns the additive whatsapp conversation/message collections, so it owns this route.

function isConfigured() {
  return Boolean(process.env.META_WHATSAPP_ACCESS_TOKEN && process.env.META_WHATSAPP_PHONE_NUMBER_ID)
}

export async function GET(req: Request) {
  const client = await directusFromSession()
  if (!client) return apiError('Unauthorized', 401)

  const leadId = new URL(req.url).searchParams.get('lead_id')?.trim() || ''
  if (!/^[A-Za-z0-9_-]{1,128}$/.test(leadId)) return apiError('Invalid lead id', 400)

  try {
    const conversations = await client.request(
      readItems('whatsapp_conversations', {
        fields: [
          'id', 'lead_id', 'wa_phone_number_id', 'contact_wa_id', 'status', 'opted_out',
          'date_created', 'date_updated',
        ],
        filter: { lead_id: { _eq: leadId } },
        limit: 1,
      }),
    )
    const conversation = conversations[0] ?? null

    let messages: unknown[] = []
    if (conversation) {
      messages = await client.request(
        readItems('whatsapp_messages', {
          fields: ['id', 'direction', 'wa_message_id', 'status', 'body', 'date_created'],
          filter: { conversation: { _eq: String(conversation.id) } },
          sort: ['date_created'],
          limit: 200,
        }),
      )
    }

    return NextResponse.json({ conversation, messages, configured: isConfigured() })
  } catch (error) {
    return directusError(error, 'Could not load WhatsApp thread')
  }
}

export async function POST(req: Request) {
  const client = await directusFromSession()
  if (!client) return apiError('Unauthorized', 401)

  const body = await readJsonObject(req)
  if (!body) return apiError('Request body must be a JSON object', 400)

  const leadId = typeof body.lead_id === 'string' ? body.lead_id.trim() : ''
  const text = typeof body.body === 'string' ? body.body.trim() : ''
  if (!/^[A-Za-z0-9_-]{1,128}$/.test(leadId)) return apiError('Invalid lead id', 400)
  if (!text || text.length > 4096) return apiError('Message must be 1–4096 characters', 400)

  try {
    const conversations = await client.request(
      readItems('whatsapp_conversations', {
        fields: ['id', 'contact_wa_id', 'opted_out'],
        filter: { lead_id: { _eq: leadId } },
        limit: 1,
      }),
    )
    const conversation = conversations[0] as { id: string; contact_wa_id?: string | null; opted_out?: boolean } | undefined
    const contactWaId = conversation?.contact_wa_id
    if (!contactWaId) return apiError('No WhatsApp conversation linked to this lead yet', 409)

    if (!isConfigured()) return apiError('WhatsApp is not configured', 503)

    const sent = await sendWhatsappText(contactWaId, text)
    if (!sent) return apiError('WhatsApp send failed — check the server logs', 502)

    const message = await client.request(
      createItem('whatsapp_messages', {
        conversation: conversation.id,
        direction: 'outbound',
        wa_message_id: null,
        status: 'sent',
        body: text,
      }),
    )
    return NextResponse.json({ ok: true, message })
  } catch (error) {
    return directusError(error, 'Could not send WhatsApp message')
  }
}
