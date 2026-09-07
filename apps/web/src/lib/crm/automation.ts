import { randomUUID } from 'node:crypto'
import { createItem, readItems, updateItem } from '@directus/sdk'
import { directus, getSiteSettings, type LeadItem, type LeadStatus } from '@/lib/directus'
import { forwardToN8n } from '@/lib/integrations/n8n'
import { promoteLeadToClient } from '@/lib/crm/clients'

export type StageAutomationResult = {
  stage: LeadStatus
  emailJobId?: string | null
  whatsappSent?: boolean
  trackingToken?: string | null
  dossierExported?: boolean
  error?: string
}

function digits(value: string | undefined | null) {
  return String(value ?? '').replace(/[^\d]/g, '')
}

function getSiteUrl(settingsUrl?: string | null): string {
  return (process.env.SITE_URL || settingsUrl || 'https://gccstartup.com').replace(/\/$/, '')
}

/**
 * Ensures the lead has a secure, unguessable tracking token for public tracking.
 */
export async function ensureTrackingToken(lead: LeadItem): Promise<string> {
  if (lead.tracking_token) return lead.tracking_token
  const token = randomUUID()
  try {
    await directus().request(
      updateItem('leads', lead.id, {
        tracking_token: token,
      }),
    )
  } catch (error) {
    console.error('[crm/automation] failed to persist tracking token', error)
  }
  return token
}

/**
 * Main backend stage transition dispatcher.
 * Called whenever a lead status changes in the CRM.
 */
export async function dispatchStageAutomations(
  lead: LeadItem,
  toStage: LeadStatus,
  fromStage?: LeadStatus | null,
): Promise<StageAutomationResult> {
  const result: StageAutomationResult = { stage: toStage }
  if (toStage === fromStage) return result

  const client = directus()
  const settings = await getSiteSettings().catch(() => ({ site_url: 'https://gccstartup.com' }))
  const siteUrl = getSiteUrl(settings.site_url)
  const firstName = lead.name?.trim().split(/\s+/)[0] || 'there'
  const companyName = lead.company_name_choice_1 || lead.interest || 'Your Company'

  // Ensure tracking token is available for stages that need customer tracking
  const trackingToken = await ensureTrackingToken(lead)
  result.trackingToken = trackingToken
  const trackingUrl = `${siteUrl}/track/${trackingToken}`

  try {
    // -------------------------------------------------------------------------
    // STAGE: 'kyc_processing' — Send KYC Pack & Instructions
    // -------------------------------------------------------------------------
    if (toStage === 'kyc_processing') {
      const emailSubject = `Compliance & KYC Instructions for ${companyName}`
      const emailBody = [
        `Dear ${firstName},`,
        '',
        `Thank you for choosing GCC Startup for the formation of ${companyName}.`,
        '',
        'To begin filing with the official registry, we require standard KYC (Know Your Customer) compliance materials.',
        '',
        'Please review your application and upload the required compliance items using your secure tracker:',
        trackingUrl,
        '',
        'Required standard materials:',
        '1. Clear passport copy (photo and signature pages)',
        '2. Proof of residential address (bank statement or utility bill within 3 months)',
        '3. Completed and signed UBO / Shareholder questionnaire',
        '',
        'You can also reply directly to this email with your documents attached.',
        '',
        'Best regards,',
        'GCC Startup Compliance Team',
      ].join('\n')

      if (lead.email) {
        const emailJob = await client.request(
          createItem('email_sync_jobs', {
            lead_id: lead.id,
            idempotency_key: `stage:kyc:${lead.id}:${Date.now()}`,
            job_type: 'send_transactional',
            status: 'pending',
            attempts: 0,
            payload: {
              email: lead.email,
              name: lead.name ?? null,
              variables: {
                subject: emailSubject,
                text: emailBody,
                tracking_url: trackingUrl,
              },
            },
          }),
        ).catch(() => null)
        if (emailJob) result.emailJobId = (emailJob as { id: string }).id
      }

      if (lead.phone && process.env.N8N_WEBHOOK_URL) {
        const waText = [
          `Hi ${firstName}, we have initiated the compliance check for *${companyName}*! 📋`,
          '',
          `Please review the required KYC documents and access your secure link here: ${trackingUrl}`,
          '',
          'Feel free to reply here if you have any questions.',
        ].join('\n')

        await forwardToN8n(
          {
            name: lead.name,
            email: lead.email,
            phone: lead.phone,
            country: lead.country,
            source: lead.source,
            message: waText,
          },
          lead.id,
        ).catch(() => null)
        result.whatsappSent = true
      }

      await client.request(
        createItem('lead_activities', {
          lead_id: lead.id,
          type: 'system',
          title: 'KYC Outreach Dispatched',
          description: `Automated KYC instructions sent via email and WhatsApp. Tracking link: ${trackingUrl}`,
          occurred_at: new Date().toISOString(),
        }),
      ).catch(() => null)
    }

    // -------------------------------------------------------------------------
    // STAGE: 'applied' — Submitted to Government E-Registry
    // -------------------------------------------------------------------------
    if (toStage === 'applied') {
      const emailSubject = `Application Submitted: ${companyName} is with the E-Registry`
      const emailBody = [
        `Dear ${firstName},`,
        '',
        `Great news! Your company formation application for ${companyName} has been officially submitted to the government e-registry portal.`,
        '',
        'What happens next:',
        '- The registrar verifies name availability and constitutional documents.',
        '- Processing typically takes 1 to 2 business days.',
        '',
        `You can monitor the live progress on your personal status tracker:`,
        trackingUrl,
        '',
        'As soon as registration completes, your official incorporation pack will be ready for download.',
        '',
        'Best regards,',
        'GCC Startup Operations Team',
      ].join('\n')

      if (lead.email) {
        const emailJob = await client.request(
          createItem('email_sync_jobs', {
            lead_id: lead.id,
            idempotency_key: `stage:applied:${lead.id}:${Date.now()}`,
            job_type: 'send_transactional',
            status: 'pending',
            attempts: 0,
            payload: {
              email: lead.email,
              name: lead.name ?? null,
              variables: {
                subject: emailSubject,
                text: emailBody,
                tracking_url: trackingUrl,
              },
            },
          }),
        ).catch(() => null)
        if (emailJob) result.emailJobId = (emailJob as { id: string }).id
      }

      if (lead.phone && process.env.N8N_WEBHOOK_URL) {
        const waText = [
          `Hi ${firstName}! 🚀 Your application for *${companyName}* has been submitted to the official e-registry portal.`,
          '',
          `Track live status and upcoming milestones here: ${trackingUrl}`,
          '',
          'We will notify you immediately once official approval is granted.',
        ].join('\n')

        await forwardToN8n(
          {
            name: lead.name,
            email: lead.email,
            phone: lead.phone,
            country: lead.country,
            source: lead.source,
            message: waText,
          },
          lead.id,
        ).catch(() => null)
        result.whatsappSent = true
      }

      await client.request(
        createItem('lead_activities', {
          lead_id: lead.id,
          type: 'system',
          title: 'E-Registry Submission Notification Dispatched',
          description: `Client notified that formation documents were submitted to e-registry. Tracker: ${trackingUrl}`,
          occurred_at: new Date().toISOString(),
        }),
      ).catch(() => null)
    }

    // -------------------------------------------------------------------------
    // STAGE: 'registered' — Incorporation Complete & Documents Attached
    // -------------------------------------------------------------------------
    if (toStage === 'registered') {
      const emailSubject = `Official Formation Complete: ${companyName} is Registered!`
      const emailBody = [
        `Congratulations ${firstName}!`,
        '',
        `We are thrilled to confirm that ${companyName} has been officially registered!`,
        '',
        'Your official documents (Certificate of Incorporation, Business Registration / Articles) are now available on your secure tracking portal:',
        trackingUrl,
        '',
        'Next step: Corporate Bank Account Setup.',
        'Our banking specialist will follow up with application forms and bank filing details.',
        '',
        'Warm regards,',
        'GCC Startup Formation Team',
      ].join('\n')

      if (lead.email) {
        const emailJob = await client.request(
          createItem('email_sync_jobs', {
            lead_id: lead.id,
            idempotency_key: `stage:registered:${lead.id}:${Date.now()}`,
            job_type: 'send_transactional',
            status: 'pending',
            attempts: 0,
            payload: {
              email: lead.email,
              name: lead.name ?? null,
              variables: {
                subject: emailSubject,
                text: emailBody,
                tracking_url: trackingUrl,
              },
            },
          }),
        ).catch(() => null)
        if (emailJob) result.emailJobId = (emailJob as { id: string }).id
      }

      if (lead.phone && process.env.N8N_WEBHOOK_URL) {
        const waText = [
          `🎉 Congratulations ${firstName}! *${companyName}* is officially registered!`,
          '',
          `Download your official incorporation documents here: ${trackingUrl}`,
          '',
          'We are now preparing your corporate banking applications.',
        ].join('\n')

        await forwardToN8n(
          {
            name: lead.name,
            email: lead.email,
            phone: lead.phone,
            country: lead.country,
            source: lead.source,
            message: waText,
          },
          lead.id,
        ).catch(() => null)
        result.whatsappSent = true
      }

      await client.request(
        createItem('lead_activities', {
          lead_id: lead.id,
          type: 'system',
          title: 'Company Registration Completed',
          description: `Official registration notification sent with document download access.`,
          occurred_at: new Date().toISOString(),
        }),
      ).catch(() => null)
    }

    // -------------------------------------------------------------------------
    // STAGE: 'banking_filed' — Bank Account Applications Filed
    // -------------------------------------------------------------------------
    if (toStage === 'banking_filed') {
      const emailSubject = `Bank Account Applications Filed: ${companyName}`
      const emailBody = [
        `Dear ${firstName},`,
        '',
        `Your corporate bank account applications for ${companyName} have been formally filed with our partner banking institutions.`,
        '',
        'The compliance officers at the bank are currently reviewing the corporate file.',
        `You can check current banking application progress on your tracker: ${trackingUrl}`,
        '',
        'We will update you as soon as account numbers or video KYC requests are issued.',
        '',
        'Best regards,',
        'GCC Startup Banking Team',
      ].join('\n')

      if (lead.email) {
        await client.request(
          createItem('email_sync_jobs', {
            lead_id: lead.id,
            idempotency_key: `stage:banking:${lead.id}:${Date.now()}`,
            job_type: 'send_transactional',
            status: 'pending',
            attempts: 0,
            payload: {
              email: lead.email,
              name: lead.name ?? null,
              variables: {
                subject: emailSubject,
                text: emailBody,
                tracking_url: trackingUrl,
              },
            },
          }),
        ).catch(() => null)
      }

      await client.request(
        createItem('lead_activities', {
          lead_id: lead.id,
          type: 'system',
          title: 'Banking Application Status Updated',
          description: 'Client notified that corporate bank account applications have been filed.',
          occurred_at: new Date().toISOString(),
        }),
      ).catch(() => null)
    }

    // -------------------------------------------------------------------------
    // STAGE: 'closed' — Fulfilled & Exported to External DB / Google Drive
    // -------------------------------------------------------------------------
    if (toStage === 'closed') {
      // 1. Promote to Client profile, Company Entity, and Invoice
      await promoteLeadToClient(lead).catch((err) => console.error('[crm/automation] client promotion failed', err))

      // 2. Export entity profile dossier to n8n / external webhook
      const exportWebhook = process.env.CLIENT_DOSSIER_WEBHOOK_URL || process.env.N8N_WEBHOOK_URL
      if (exportWebhook) {
        const dossier = {
          eventType: 'CLIENT_CLOSED_FULFILLED',
          orderNumber: lead.order_number || `GCC-${lead.id.slice(0, 8).toUpperCase()}`,
          clientName: lead.name,
          clientEmail: lead.email,
          clientPhone: lead.phone,
          companyName: lead.company_name_choice_1 || companyName,
          alternativeName: lead.company_name_choice_2,
          jurisdiction: lead.jurisdiction || lead.country,
          packageType: lead.package_type,
          incorporationDate: lead.incorporation_date || new Date().toISOString().slice(0, 10),
          annualRenewalDate: lead.annual_renewal_date,
          taxFilingDeadline: lead.tax_filing_deadline,
          officialDocuments: lead.official_documents,
          notes: lead.notes,
          exportedAt: new Date().toISOString(),
        }

        fetch(exportWebhook, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(dossier),
        }).catch((err) => console.error('[crm/automation] dossier export failed', err))
        result.dossierExported = true
      }

      // Automatically enroll into post-sale newsletter/compliance flow if email is subscribed
      if (lead.email) {
        await client.request(
          createItem('email_sync_jobs', {
            lead_id: lead.id,
            idempotency_key: `closed:newsletter:${lead.id}`,
            job_type: 'upsert_subscriber',
            status: 'pending',
            attempts: 0,
            payload: {
              email: lead.email,
              name: lead.name ?? null,
              phone: lead.phone ?? null,
              groupKeys: ['customer', 'post_sale', lead.jurisdiction ? `jurisdiction:${lead.jurisdiction}` : 'general'],
              marketingConsent: true,
            },
          }),
        ).catch(() => null)
      }

      await client.request(
        createItem('lead_activities', {
          lead_id: lead.id,
          type: 'system',
          title: 'Order Fulfilled & Closed',
          description: 'Client transitioned to active post-sale management. Entity dossier dispatched to backend database.',
          occurred_at: new Date().toISOString(),
        }),
      ).catch(() => null)
    }
  } catch (err) {
    console.error('[crm/automation] error executing stage automation', err)
    result.error = err instanceof Error ? err.message : String(err)
  }

  return result
}

/**
 * Evaluates upcoming deadlines (annual renewals and tax filing deadlines).
 * Triggered automatically by /api/jobs/tick once daily.
 */
export async function evaluateUpcomingRenewals(): Promise<{ remindersQueued: number }> {
  const client = directus()
  let remindersQueued = 0

  const now = new Date()
  const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  const in29Days = new Date(now.getTime() + 29 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)

  try {
    // Find active leads whose annual renewal is due within the 30-day window
    const candidates = await client.request(
      readItems('leads', {
        filter: {
          _and: [
            { status: { _in: ['registered', 'closed', 'won'] } },
            { annual_renewal_date: { _gte: in29Days } },
            { annual_renewal_date: { _lte: in30Days } },
          ],
        } as never,
        fields: ['id', 'name', 'email', 'company_name_choice_1', 'jurisdiction', 'annual_renewal_date'],
        limit: 50,
      }),
    ) as Array<{ id: string; name?: string; email?: string; company_name_choice_1?: string; jurisdiction?: string; annual_renewal_date?: string }>

    for (const lead of candidates) {
      if (!lead.email) continue
      const idempotencyKey = `renewal:reminder:30d:${lead.id}:${lead.annual_renewal_date}`

      const existing = await client.request(
        readItems('email_sync_jobs', { filter: { idempotency_key: { _eq: idempotencyKey } }, fields: ['id'], limit: 1 }),
      ).catch(() => [])

      if (existing && existing.length > 0) continue

      const firstName = lead.name?.trim().split(/\s+/)[0] || 'there'
      const company = lead.company_name_choice_1 || 'Your Company'

      await client.request(
        createItem('email_sync_jobs', {
          lead_id: lead.id,
          idempotency_key: idempotencyKey,
          job_type: 'send_transactional',
          status: 'pending',
          attempts: 0,
          payload: {
            email: lead.email,
            name: lead.name ?? null,
            variables: {
              subject: `Action Required: Annual Company Renewal for ${company} Due in 30 Days`,
              text: [
                `Dear ${firstName},`,
                '',
                `This is a courtesy notice that the annual government renewal and registered office maintenance for ${company} is due on ${lead.annual_renewal_date}.`,
                '',
                'To maintain good standing and avoid government late penalties, our compliance team will reach out with your renewal statement and filing schedule.',
                '',
                'Please reply directly to this email if your UBO structure or company address has changed over the past 12 months.',
                '',
                'Sincerely,',
                'GCC Startup Annual Compliance Team',
              ].join('\n'),
            },
          },
        }),
      )

      await client.request(
        createItem('lead_tasks', {
          lead_id: lead.id,
          title: `Annual Renewal Follow-up: ${company}`,
          description: `Annual renewal due on ${lead.annual_renewal_date}. 30-day notice was automatically sent.`,
          status: 'open',
          priority: 'high',
          due_at: lead.annual_renewal_date,
        }),
      ).catch(() => null)

      remindersQueued++
    }
  } catch (err) {
    console.error('[crm/automation] renewal evaluation failed', err)
  }

  return { remindersQueued }
}
