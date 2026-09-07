/**
 * The email transport contract.
 *
 * Every outbound email in this codebase goes through one of two lanes — Sender's
 * transactional endpoint (1:1 mail) or Sender's campaign endpoints (bulk) — and the
 * outbox drainer in `src/lib/email/send.ts` is the only place that calls the
 * transport. This interface is the seam that keeps the drainer, the flow engine and
 * the automation actions decoupled from the concrete Sender SDK: each method maps
 * 1:1 to a member of the `SenderOperation` union, so a future provider (or a test
 * double) can implement the same contract without touching any caller.
 *
 * The concrete adapter lives in `@gccstartup/shared` and is exported as
 * `senderAdapter`. Nothing outside that file and this one should import the Sender
 * functions directly.
 */
import type {
  SenderCampaign,
  SenderCampaignInput,
  SenderGroup,
  SenderRateLimit,
  SenderResult,
  SenderSubscriber,
  SenderSubscriberInput,
  SenderTemplateTransactionalInput,
  SenderTransactionalInput,
} from '@gccstartup/shared'

export type SendConfiguredTransactionalInput = {
  email: string
  name?: string
  variables?: Record<string, unknown>
  eventId?: string
}

export type EmailSender = {
  /** Sender has separate get/create/update endpoints; upsert checks by email first. */
  upsertSubscriber(input: SenderSubscriberInput): Promise<SenderResult<SenderSubscriber>>
  listGroups(): Promise<SenderResult<Array<{ id: string; title: string }>>>
  /** One transactional message. With `templateId` it uses Sender's stored template. */
  sendTransactional(
    input: SenderTransactionalInput | SenderTemplateTransactionalInput,
    templateId?: string,
  ): Promise<SenderResult<{ emailId?: string; success?: boolean; message?: string }>>
  /** Uses only server configuration and a small allowlisted set of variables. */
  sendConfiguredTransactional(input: SendConfiguredTransactionalInput): Promise<SenderResult>
  /** Creates the campaign-specific group the audience is synced into. */
  createGroup(title: string): Promise<SenderResult<SenderGroup>>
  /** Creates a real Sender campaign — the bulk lane with campaign-grade deliverability. */
  createCampaign(input: SenderCampaignInput): Promise<SenderResult<SenderCampaign>>
  /** Sends an already-created campaign immediately. Never auto-retried on a lost response. */
  sendCampaign(campaignId: string): Promise<SenderResult<SenderCampaign>>
  /** Hands scheduling to Sender. */
  scheduleCampaign(campaignId: string, scheduledAt: Date | string): Promise<SenderResult<SenderCampaign>>
  /** How long the caller should pause before its next call, from Sender's own headers. */
  throttleMs(rateLimit?: SenderRateLimit): number
}
