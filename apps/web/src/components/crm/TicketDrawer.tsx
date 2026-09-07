'use client'

import { useEffect, useState } from 'react'
import { Send, X } from 'lucide-react'
import { useToast } from '@/components/ui/ToastProvider'
import { userLabel } from '@/components/crm/types'

type AdminTicket = {
  id: string
  ticket_number?: string | null
  lead_id?: string | null
  subject?: string | null
  status?: string | null
  priority?: string | null
  assigned_to?: { id: string; first_name?: string | null; last_name?: string | null; email?: string | null } | string | null
  channel?: string | null
  date_created?: string
  date_updated?: string
}

type TicketMessage = {
  id: string
  author_type?: 'customer' | 'staff' | null
  body?: string | null
  date_created?: string
}

type CannedResponse = { id: string; question?: string; answer?: string }

const STATUSES = ['open', 'pending', 'resolved', 'closed']
const PRIORITIES = ['low', 'normal', 'high', 'urgent']

function formatWhen(value?: string | null) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
}

export function TicketDrawer({
  ticket,
  onClose,
  onChanged,
}: {
  ticket: AdminTicket
  onClose: () => void
  onChanged: () => void
}) {
  const { success: showSuccess, error: showError } = useToast()
  const [messages, setMessages] = useState<TicketMessage[]>([])
  const [canned, setCanned] = useState<CannedResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [reply, setReply] = useState('')
  const [sending, setSending] = useState(false)
  const [status, setStatus] = useState(ticket.status || 'open')
  const [priority, setPriority] = useState(ticket.priority || 'normal')
  const [assignee, setAssignee] = useState('')

  useEffect(() => {
    setLoading(true)
    setLoadError(false)
    fetch(`/api/tickets/${ticket.id}/messages`)
      .then(async (res) => {
        if (!res.ok) throw new Error('Failed to load thread')
        const data = (await res.json()) as { messages: TicketMessage[] }
        setMessages(data.messages)
      })
      .catch(() => setLoadError(true))
      .finally(() => setLoading(false))

    fetch('/api/portal/faq')
      .then(async (res) => {
        if (!res.ok) return
        const data = (await res.json()) as { faqs: CannedResponse[] }
        setCanned(data.faqs)
      })
      .catch(() => {})
  }, [ticket.id])

  function patch(payload: Record<string, unknown>) {
    fetch('/api/tickets', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: ticket.id, ...payload }),
    })
      .then(async (res) => {
        if (!res.ok) throw new Error('Update failed')
        showSuccess('Ticket updated')
        onChanged()
      })
      .catch((error) => showError(error instanceof Error ? error.message : 'Could not update ticket'))
  }

  function sendReply() {
    const body = reply.trim()
    if (!body || sending) return
    setSending(true)
    fetch(`/api/tickets/${ticket.id}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body }),
    })
      .then(async (res) => {
        if (!res.ok) throw new Error('Reply failed')
        const data = (await res.json()) as { message: TicketMessage }
        setMessages([...messages, data.message])
        setReply('')
        showSuccess('Reply sent')
        onChanged()
      })
      .catch((error) => showError(error instanceof Error ? error.message : 'Could not send reply'))
      .finally(() => setSending(false))
  }

  return (
    <div className="tickets-drawer-layer" role="dialog" aria-modal="true" aria-label={`Ticket ${ticket.ticket_number || ticket.id}`}>
      <button type="button" className="tickets-drawer-backdrop" onClick={onClose} aria-label="Close ticket" />
      <aside className="tickets-drawer">
        <header className="tickets-drawer-header">
          <div>
            <span className="tickets-drawer-eyebrow">{ticket.ticket_number || 'Ticket'}</span>
            <h2>{ticket.subject || 'Untitled'}</h2>
            <span className="tickets-drawer-meta">
              {ticket.lead_id || 'No customer email'} · {status} · {priority}
            </span>
          </div>
          <button type="button" className="tickets-icon-button" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </header>

        <div className="tickets-drawer-controls">
          <label>
            Status
            <select value={status} onChange={(event) => setStatus(event.target.value)} onBlur={() => patch({ status })}>
              {STATUSES.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </label>
          <label>
            Priority
            <select value={priority} onChange={(event) => setPriority(event.target.value)} onBlur={() => patch({ priority })}>
              {PRIORITIES.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </label>
        </div>

        {loading ? (
          <div className="tickets-drawer-state">Loading the thread…</div>
        ) : loadError ? (
          <div className="tickets-drawer-state">Could not load this thread.</div>
        ) : (
          <div className="tickets-thread">
            {messages.length === 0 && <div className="tickets-thread-empty">No messages yet.</div>}
            {messages.map((message) => (
              <article key={message.id} className={`tickets-message ${message.author_type === 'staff' ? 'staff' : 'customer'}`}>
                <div className="tickets-message-head">
                  <strong>{message.author_type === 'staff' ? 'GCC Startup' : 'Customer'}</strong>
                  <span>{formatWhen(message.date_created)}</span>
                </div>
                <p>{message.body}</p>
              </article>
            ))}
          </div>
        )}

        {canned.length > 0 && (
          <div className="tickets-canned">
            <span className="tickets-canned-label">Quick replies</span>
            {canned.map((item) => (
              <button
                key={item.id}
                type="button"
                className="tickets-canned-btn"
                onClick={() => setReply(item.answer || '')}
                title={item.question}
              >
                {item.question}
              </button>
            ))}
          </div>
        )}

        <form
          className="tickets-reply"
          onSubmit={(event) => {
            event.preventDefault()
            sendReply()
          }}
        >
          <textarea
            value={reply}
            onChange={(event) => setReply(event.target.value)}
            placeholder="Write a reply to the customer…"
            aria-label="Reply"
            rows={4}
          />
          <button type="submit" className="btn btn-primary" disabled={sending || !reply.trim()}>
            <Send size={15} />
            {sending ? 'Sending…' : 'Send reply'}
          </button>
        </form>
      </aside>
    </div>
  )
}
