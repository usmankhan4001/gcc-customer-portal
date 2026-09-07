import { registerWebhookEvent } from './dispatcher'

// Register all platform events that webhooks can subscribe to
// Each event defines how to transform the raw data into a webhook payload

// CRM Events
registerWebhookEvent('contact.created', (data) => ({
  contact: { id: data.id, email: data.email, name: data.displayName },
  source: data.source,
}))

registerWebhookEvent('contact.updated', (data) => ({
  contact: { id: data.id, email: data.email, name: data.displayName },
  changes: data.changes,
}))

registerWebhookEvent('contact.stage_changed', (data) => ({
  contact: { id: data.id, email: data.email },
  oldStage: data.oldStage,
  newStage: data.newStage,
}))

registerWebhookEvent('deal.created', (data) => ({
  deal: { id: data.id, title: data.title, value: data.value, currency: data.currency },
  contact: { id: data.contactId },
}))

registerWebhookEvent('deal.won', (data) => ({
  deal: { id: data.id, title: data.title, value: data.value, currency: data.currency },
  contact: { id: data.contactId },
  closedAt: data.closedAt,
}))

registerWebhookEvent('deal.lost', (data) => ({
  deal: { id: data.id, title: data.title, value: data.value, currency: data.currency },
  contact: { id: data.contactId },
  closeReason: data.closeReason,
}))

registerWebhookEvent('lead.captured', (data) => ({
  lead: { id: data.id, email: data.email, source: data.source, tool: data.tool },
}))

registerWebhookEvent('lead.converted', (data) => ({
  lead: { id: data.leadId },
  contact: { id: data.contactId },
}))

// Conversation Events
registerWebhookEvent('message.received', (data) => ({
  conversation: { id: data.conversationId, channel: data.channel },
  message: { id: data.id, body: data.body, direction: data.direction },
  contact: { id: data.contactId },
}))

registerWebhookEvent('conversation.assigned', (data) => ({
  conversation: { id: data.id, channel: data.channel },
  assignedTo: data.assignedTo,
}))

// Campaign Events
registerWebhookEvent('campaign.dispatched', (data) => ({
  campaign: { id: data.id, name: data.name, type: data.type },
  recipientCount: data.recipientCount,
}))

registerWebhookEvent('campaign.completed', (data) => ({
  campaign: { id: data.id, name: data.name, type: data.type },
  stats: { sent: data.sent, delivered: data.delivered, failed: data.failed },
}))

// Email Events
registerWebhookEvent('email.sent', (data) => ({
  email: { id: data.id, to: data.toEmail, subject: data.subject },
  campaign: data.campaignId ? { id: data.campaignId } : null,
}))

registerWebhookEvent('email.opened', (data) => ({
  email: { id: data.id, to: data.toEmail },
  openedAt: data.openedAt,
}))

registerWebhookEvent('email.clicked', (data) => ({
  email: { id: data.id, to: data.toEmail },
  clickedAt: data.clickedAt,
  url: data.url,
}))

registerWebhookEvent('email.bounced', (data) => ({
  email: { id: data.id, to: data.toEmail },
  bounceType: data.bounceType,
  reason: data.failureReason,
}))

// Support Events
registerWebhookEvent('ticket.created', (data) => ({
  ticket: { id: data.id, number: data.ticketNumber, subject: data.subject, priority: data.priority },
  contact: { id: data.contactId },
}))

registerWebhookEvent('ticket.resolved', (data) => ({
  ticket: { id: data.id, number: data.ticketNumber },
  resolvedAt: data.resolvedAt,
}))

// Automation Events
registerWebhookEvent('flow.enrollment_created', (data) => ({
  flow: { id: data.flowId },
  contact: { id: data.contactId },
  enrollment: { id: data.id },
}))

registerWebhookEvent('flow.completed', (data) => ({
  flow: { id: data.flowId },
  contact: { id: data.contactId },
  completedAt: data.completedAt,
}))

// Order Events (from Customer Portal)
registerWebhookEvent('order.paid', (data) => ({
  order: { id: data.id, amount: data.amountTotal, currency: data.currency },
  contact: { id: data.userId },
  company: data.companyId ? { id: data.companyId } : null,
}))

registerWebhookEvent('order.payment_failed', (data) => ({
  order: { id: data.id, amount: data.amountTotal, currency: data.currency },
  contact: { id: data.userId },
  error: data.error,
}))

// System Events
registerWebhookEvent('user.created', (data) => ({
  user: { id: data.id, email: data.email, name: data.name, role: data.role },
}))

registerWebhookEvent('user.role_changed', (data) => ({
  user: { id: data.id, email: data.email },
  oldRole: data.oldRole,
  newRole: data.newRole,
}))
