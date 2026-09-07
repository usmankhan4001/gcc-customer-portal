/**
 * Platform event definitions.
 * Each key is an event type; the value is the payload shape.
 */

// ─── CRM Events ──────────────────────────────────────────────────────────────

export interface ContactCreatedPayload {
  contactId: string
  email: string
  name: string
  source: string
}

export interface ContactUpdatedPayload {
  contactId: string
  changes: Record<string, unknown>
}

export interface ContactDeletedPayload {
  contactId: string
}

export interface DealWonPayload {
  dealId: string
  contactId: string
  value: number
  currency: string
}

export interface DealLostPayload {
  dealId: string
  contactId: string
  reason?: string
}

export interface DealCreatedPayload {
  dealId: string
  contactId: string
  title: string
  value: number
}

export interface DealUpdatedPayload {
  dealId: string
  changes: Record<string, unknown>
}

export interface TaskCreatedPayload {
  taskId: string
  dealId?: string
  contactId?: string
  assigneeId: string
}

export interface TaskCompletedPayload {
  taskId: string
  assigneeId: string
}

// ─── CMS Events ──────────────────────────────────────────────────────────────

export interface ContentPublishedPayload {
  contentId: string
  slug: string
  type: string
}

export interface ContentUnpublishedPayload {
  contentId: string
  slug: string
}

export interface LeadMagnetCapturedPayload {
  leadMagnetId: string
  contactId: string
  email: string
}

// ─── Portal Events ───────────────────────────────────────────────────────────

export interface OrderPaidPayload {
  orderId: string
  contactId: string
  amount: number
  currency: string
}

export interface DocumentUploadedPayload {
  documentId: string
  contactId: string
  key: string
  mimeType: string
}

export interface DocumentSignedPayload {
  documentId: string
  contactId: string
}

// ─── System Events ───────────────────────────────────────────────────────────

export interface UserCreatedPayload {
  userId: string
  email: string
  role: string
}

export interface UserUpdatedPayload {
  userId: string
  changes: Record<string, unknown>
}

export interface UserDeletedPayload {
  userId: string
}

export interface IntegrationFailedPayload {
  integrationId: string
  service: string
  error: string
}

export interface IntegrationRecoveredPayload {
  integrationId: string
  service: string
}

// ─── Event Map ───────────────────────────────────────────────────────────────

export interface EventMap {
  'contact.created': ContactCreatedPayload
  'contact.updated': ContactUpdatedPayload
  'contact.deleted': ContactDeletedPayload
  'deal.created': DealCreatedPayload
  'deal.updated': DealUpdatedPayload
  'deal.won': DealWonPayload
  'deal.lost': DealLostPayload
  'task.created': TaskCreatedPayload
  'task.completed': TaskCompletedPayload
  'content.published': ContentPublishedPayload
  'content.unpublished': ContentUnpublishedPayload
  'lead_magnet.captured': LeadMagnetCapturedPayload
  'order.paid': OrderPaidPayload
  'document.uploaded': DocumentUploadedPayload
  'document.signed': DocumentSignedPayload
  'user.created': UserCreatedPayload
  'user.updated': UserUpdatedPayload
  'user.deleted': UserDeletedPayload
  'integration.failed': IntegrationFailedPayload
  'integration.recovered': IntegrationRecoveredPayload
}
