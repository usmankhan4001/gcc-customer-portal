export { dispatchWebhook, registerWebhookEvent, getWebhookPayload } from './dispatcher'
export type { WebhookPayload, WebhookDeliveryResult } from './dispatcher'
import './events' // Side-effect import to register all events
