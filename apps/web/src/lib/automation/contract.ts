// FROZEN shared automation contract — the single coordination artifact for the
// parallel phase.
//
// Four workstreams build against this file before the automation engine exists:
//   A. Automation Builder (the engine + the visual editor)
//   B. Email Marketing
//   C. WhatsApp-in-CRM
//   D. Support Portal
//
// Because all four tracks compile against the same names and payload shapes, the
// trigger and action names below must NOT change during the parallel phase. Adding a
// new name is allowed (it is additive-friendly); renaming or removing one is not —
// it would silently break the other three tracks' call sites. The engine (Track A)
// is the only consumer that may later edit the *body* of emit.ts; B/C/D only ever
// call it.
//
// Payload shapes are typed concretely where the shape is already decided, and with a
// permissive but documented `Record<string, unknown>` where it is genuinely not yet
// decided. Never use `any` here — the whole point of a frozen contract is that the
// other tracks can rely on the types.

/** Every trigger the automation engine can react to, pre-enumerated in full. */
export type AutomationTriggerName =
  | 'lead.created'
  | 'lead.stage_changed'
  | 'form.submitted'
  | 'ticket.created'
  | 'whatsapp.message_received'
  | 'date.renewal_window'
  | 'email.opened'
  | 'email.clicked'
  | 'email.bounced'
  | 'email.unsubscribed'
  | 'email.campaign_sent'

/** Every action the automation engine can run, pre-enumerated in full. */
export type AutomationActionName =
  | 'create_task'
  | 'update_lead_field'
  | 'create_ticket'
  | 'wait'
  | 'call_webhook'
  | 'send_whatsapp'
  | 'email.send_campaign'
  | 'email.send_template'
  | 'email.add_to_segment'
  | 'email.remove_from_segment'
  | 'email.start_flow'
  | 'email.stop_flow'
  | 'condition'
  | 'delay'
  | 'delay_until'

/** A lead id in the Directus `leads` collection. */
export type LeadId = string
/** A ticket id in the Directus `tickets` collection. */
export type TicketId = string
/** A campaign id in the Directus `email_campaigns` collection. */
export type CampaignId = string
/** A template id in the Directus `email_templates` collection. */
export type TemplateId = string
/** A segment id in the Directus `email_segments` collection. */
export type SegmentId = string
/** A flow id in the Directus `email_flows` collection. */
export type FlowId = string

/** The CRM pipeline stage a lead moved to (see the CRM skill for the stage names). */
export type PipelineStage = string

/**
 * Payload for each trigger name. The map key is the trigger name and the value is
 * that trigger's payload, so `TriggerPayload['lead.created']` resolves to the
 * concrete shape. Fields marked "not yet decided" are a documented
 * `Record<string, unknown>` until the owning track pins them down.
 */
export type TriggerPayload = {
  /** A lead was created. Carries the new lead's id. */
  'lead.created': {
    leadId: LeadId
  }
  /** A lead moved between pipeline stages. Carries the lead id and the stage it
   * moved to. */
  'lead.stage_changed': {
    leadId: LeadId
    stage: PipelineStage
  }
  /** A generic website form was submitted (the form_submissions catch-all).
   * Carries the form name and the submitted payload, which is not yet decided. */
  'form.submitted': {
    formName: string
    /** Not yet decided — the raw submitted form data. */
    data: Record<string, unknown>
  }
  /** A support ticket was created. Carries the ticket id and the lead it belongs to,
   * when the ticket is linked to a lead. */
  'ticket.created': {
    ticketId: TicketId
    leadId?: LeadId
  }
  /** An inbound WhatsApp message arrived. Carries the lead id (when known) and the
   * raw message shape, which is not yet decided. */
  'whatsapp.message_received': {
    leadId?: LeadId
    /** Not yet decided — the Meta Cloud API inbound message shape. */
    message: Record<string, unknown>
  }
  /** A subscription's renewal window opened. Carries the lead id. */
  'date.renewal_window': {
    leadId: LeadId
  }
  /** A campaign email was opened. */
  'email.opened': {
    leadId: LeadId
    campaignId: CampaignId
  }
  /** A link in a campaign email was clicked. */
  'email.clicked': {
    leadId: LeadId
    campaignId: CampaignId
    url: string
  }
  /** A campaign email bounced. */
  'email.bounced': {
    leadId: LeadId
    campaignId: CampaignId
  }
  /** A lead unsubscribed from marketing email. */
  'email.unsubscribed': {
    leadId: LeadId
  }
  /** A campaign finished sending. */
  'email.campaign_sent': {
    campaignId: CampaignId
  }
}

/**
 * Payload for each action name. Same shape as `TriggerPayload` — the map key is the
 * action name and the value is that action's payload.
 */
export type ActionPayload = {
  /** Create a task on a lead. */
  'create_task': {
    leadId: LeadId
    title: string
    dueAt?: string
  }
  /** Update a single field on a lead. */
  'update_lead_field': {
    leadId: LeadId
    field: string
    value: unknown
  }
  /** Create a support ticket. */
  'create_ticket': {
    leadId?: LeadId
    subject: string
    body?: string
  }
  /** Pause the run for a delay before continuing. */
  'wait': {
    /** Delay in seconds. */
    seconds: number
  }
  /** Fire an outbound webhook. */
  'call_webhook': {
    url: string
    /** Optional JSON payload; the engine sends an empty body when omitted. */
    payload?: Record<string, unknown>
  }
  /** Send a WhatsApp message to a recipient. Either a template id or free text. */
  'send_whatsapp': {
    recipient: string
    templateId?: string
    text?: string
  }
  /** Send a campaign to a lead. */
  'email.send_campaign': {
    leadId: LeadId
    campaignId: CampaignId
  }
  /** Send a single template to a lead. */
  'email.send_template': {
    leadId: LeadId
    templateId: TemplateId
  }
  /** Add a lead to a segment. */
  'email.add_to_segment': {
    leadId: LeadId
    segmentId: SegmentId
  }
  /** Remove a lead from a segment. */
  'email.remove_from_segment': {
    leadId: LeadId
    segmentId: SegmentId
  }
  /** Enroll a lead in a drip flow. */
  'email.start_flow': {
    leadId: LeadId
    flowId: FlowId
  }
  /** Stop a lead's enrollment in a drip flow. */
  'email.stop_flow': {
    leadId: LeadId
    flowId: FlowId
  }
  /** Evaluate a condition against lead data and branch to yesEdge or noEdge. */
  'condition': {
    field: string
    operator:
      | 'equals'
      | 'not_equals'
      | 'contains'
      | 'greater_than'
      | 'less_than'
      | 'is_empty'
      | 'is_not_empty'
    value: string
  }
  /** Pause the run for a human-readable duration before continuing. */
  'delay': {
    duration: number
    unit: 'minutes' | 'hours' | 'days'
  }
  /** Pause the run until a cron expression fires. */
  'delay_until': {
    cron: string
  }
}
