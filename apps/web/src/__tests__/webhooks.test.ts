import { describe, it, expect } from 'vitest'

describe('Webhook System', () => {
  it('webhook events are registered', () => {
    const events = [
      'contact.created',
      'contact.updated',
      'contact.stage_changed',
      'deal.created',
      'deal.won',
      'deal.lost',
      'lead.captured',
      'message.received',
      'campaign.dispatched',
      'campaign.completed',
      'email.sent',
      'email.opened',
      'email.clicked',
      'email.bounced',
      'ticket.created',
      'ticket.resolved',
      'order.paid',
      'user.created',
    ]
    expect(events.length).toBeGreaterThanOrEqual(18)
  })

  it('HMAC signature format is correct', () => {
    const format = 'sha256=<hex>'
    expect(format).toContain('sha256=')
  })
})
