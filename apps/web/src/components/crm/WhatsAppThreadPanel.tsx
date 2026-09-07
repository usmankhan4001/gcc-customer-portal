'use client'

import { useEffect, useRef, useState, type FormEvent } from 'react'
import { MessageSquareText, Send, ShieldAlert } from 'lucide-react'
import { crmFetch, formatShortDate, type CRMLead } from './types'

type WhatsAppMessage = {
  id: string
  direction: 'inbound' | 'outbound'
  wa_message_id: string | null
  status: string | null
  body: string | null
  date_created: string
}

type WhatsAppConversation = {
  id: string
  contact_wa_id: string | null
  status: string | null
  opted_out: boolean
}

type ThreadPayload = {
  conversation: WhatsAppConversation | null
  messages: WhatsAppMessage[]
  configured: boolean
}

// Two-way WhatsApp thread for a lead, mounted inside LeadDrawer next to the standard
// KYC-pack button. Reads through the admin session token, sends through the same
// fail-safe Meta client the automation action uses. Free-form replies here are the
// in-window lane; broadcast-style template sends are gated separately by the
// conversations.opted_out flag, which is out of scope for this in-window panel.
export function WhatsAppThreadPanel({ lead }: { lead: CRMLead }) {
  const [conversation, setConversation] = useState<WhatsAppConversation | null>(null)
  const [messages, setMessages] = useState<WhatsAppMessage[]>([])
  const [configured, setConfigured] = useState(false)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [draft, setDraft] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const endRef = useRef<HTMLDivElement>(null)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const result = await crmFetch<ThreadPayload>(`/api/crm/whatsapp?lead_id=${lead.id}`)
      setConversation(result.conversation)
      setMessages(result.messages)
      setConfigured(result.configured)
      if (!result.conversation) {
        setNotice('No inbound WhatsApp message has linked this lead yet. Replies open once a conversation exists.')
      } else {
        setNotice(null)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load WhatsApp thread')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lead.id])

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages.length])

  async function sendMessage(event: FormEvent) {
    event.preventDefault()
    const body = draft.trim()
    if (!body || sending) return
    setSending(true)
    setError(null)
    try {
      const result = await crmFetch<{ ok: boolean; message: WhatsAppMessage }>('/api/crm/whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lead_id: lead.id, body }),
      })
      setDraft('')
      if (result.message) setMessages((prev) => [...prev, result.message])
      else await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Send failed')
    } finally {
      setSending(false)
    }
  }

  const muted = Boolean(conversation?.opted_out)
  const readyToRender = !loading && !error && !notice

  return (
    <div className="wa-thread">
      <div className="wa-thread-header">
        <div className="wa-thread-title">
          <MessageSquareText size={13} /> WhatsApp thread
        </div>
        {conversation && (
          <span className="wa-thread-phone">{conversation.contact_wa_id?.replace(/^\+?/, '') || '—'}</span>
        )}
      </div>

      {loading && <div className="crm-compact-empty">Loading WhatsApp thread…</div>}

      {!loading && error && <div className="crm-compact-empty wa-thread-error">{error}</div>}

      {!loading && !error && notice && <div className="crm-compact-empty">{notice}</div>}

      {readyToRender && (
        <>
          {!configured && (
            <div className="wa-thread-config-warn">
              <ShieldAlert size={13} /> META_WHATSAPP_* is not configured — sending is disabled.
            </div>
          )}

          <div className="wa-thread-container">
            {messages.map((message) => {
              const inbound = message.direction === 'inbound'
              return (
                <div
                  key={message.id}
                  className={`wa-thread-bubble ${inbound ? 'inbound' : 'outbound'}`}
                >
                  <div>{message.body || <em>Media / unsupported message</em>}</div>
                  <div className="wa-thread-bubble-time">
                    <span>{formatShortDate(message.date_created, true)}</span>
                    {!inbound && <span>{message.status || 'sent'}</span>}
                  </div>
                </div>
              )
            })}
            {messages.length === 0 && (
              <div className="crm-compact-empty">No messages yet in this thread.</div>
            )}
            <div ref={endRef} />
          </div>

          <form onSubmit={sendMessage} className="wa-thread-form">
            <input
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder={muted ? 'Opted-out conversation — sending limited to templates' : 'Type a reply…'}
              maxLength={4096}
              disabled={!configured || sending || muted}
              aria-label="WhatsApp reply body"
              className="wa-thread-input"
            />
            <button
              type="submit"
              className="btn btn-primary wa-thread-send"
              disabled={!configured || sending || muted || !draft.trim()}
            >
              <Send size={12} /> {sending ? 'Sending…' : 'Send'}
            </button>
          </form>
        </>
      )}
    </div>
  )
}
