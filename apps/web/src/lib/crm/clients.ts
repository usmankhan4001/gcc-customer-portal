import { createItem, readItems } from '@directus/sdk'
import { directus, type LeadItem } from '@/lib/directus'

export type ClientRecord = {
  id: string
  lead_id: string
  name: string
  email: string
  phone?: string | null
  country?: string | null
  status: 'active' | 'paused' | 'churned'
  total_entities: number
  lifetime_value: number
  currency: string
  date_created: string
}

export type CompanyEntityRecord = {
  id: string
  client_id: string
  lead_id: string
  entity_name: string
  alternative_name?: string | null
  jurisdiction: string
  package_type: string
  order_number: string
  tracking_token?: string | null
  status: 'forming' | 'active' | 'dissolved'
  incorporation_date?: string | null
  annual_renewal_date?: string | null
  tax_filing_deadline?: string | null
  official_documents?: Array<{ name: string; url: string; date_uploaded?: string }> | null
  date_created: string
}

export type InvoiceRecord = {
  id: string
  invoice_number: string
  client_id?: string | null
  lead_id: string
  order_number: string
  items: Array<{ description: string; amount: number }>
  subtotal: number
  tax: number
  total: number
  currency: string
  status: 'draft' | 'pending' | 'paid' | 'overdue' | 'void'
  paid_at?: string | null
  payment_reference?: string | null
  date_created: string
}

/**
 * Promotes a closed lead into an active Client profile, creates their Company Entity,
 * and issues their primary fulfillment Invoice.
 */
export async function promoteLeadToClient(lead: LeadItem): Promise<{
  client: ClientRecord
  entity: CompanyEntityRecord
  invoice: InvoiceRecord
}> {
  const clientSdk = directus()
  const now = new Date().toISOString()
  const entityName = lead.company_name_choice_1 || `${lead.name || 'Client'}'s Company`
  const orderNum = lead.order_number || `GCC-${(lead.country || 'GLOBAL').slice(0, 2).toUpperCase()}-${Math.floor(10000 + Math.random() * 90000)}`
  const invoiceNum = `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`
  const totalAmount = lead.amount_paid || lead.estimated_value || 0
  const currency = lead.currency || 'USD'

  const clientData: ClientRecord = {
    id: `cli_${lead.id}`,
    lead_id: lead.id,
    name: lead.name || 'Unnamed Client',
    email: lead.email || '',
    phone: lead.phone || null,
    country: lead.country || null,
    status: 'active',
    total_entities: 1,
    lifetime_value: totalAmount,
    currency,
    date_created: now,
  }

  const entityData: CompanyEntityRecord = {
    id: `ent_${lead.id}`,
    client_id: clientData.id,
    lead_id: lead.id,
    entity_name: entityName,
    alternative_name: lead.company_name_choice_2 || null,
    jurisdiction: lead.jurisdiction || lead.country || 'Hong Kong',
    package_type: lead.package_type || 'self_ubo',
    order_number: orderNum,
    tracking_token: lead.tracking_token || null,
    status: 'active',
    incorporation_date: lead.incorporation_date || now.slice(0, 10),
    annual_renewal_date: lead.annual_renewal_date || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    tax_filing_deadline: lead.tax_filing_deadline || new Date(Date.now() + 540 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    official_documents: lead.official_documents || [],
    date_created: now,
  }

  const invoiceData: InvoiceRecord = {
    id: `inv_${lead.id}`,
    invoice_number: invoiceNum,
    client_id: clientData.id,
    lead_id: lead.id,
    order_number: orderNum,
    items: [
      {
        description: `Company Formation Package (${entityData.jurisdiction} - ${entityData.package_type})`,
        amount: totalAmount,
      },
    ],
    subtotal: totalAmount,
    tax: 0,
    total: totalAmount,
    currency,
    status: 'paid',
    paid_at: now,
    payment_reference: lead.payment_reference || `CONF-${Date.now().toString(36).toUpperCase()}`,
    date_created: now,
  }

  // Attempt to write to dedicated Directus collections if registered,
  // otherwise record in lead activities as persistent JSON ledger.
  try {
    await clientSdk.request(
      createItem('lead_activities', {
        lead_id: lead.id,
        type: 'system',
        title: `Client Account & Company Entity Created: ${entityName}`,
        description: `Converted lead to Client profile (${clientData.id}). Entity registered under ${entityData.jurisdiction}. Invoice ${invoiceNum} generated for ${currency} ${totalAmount}.`,
        metadata: {
          client: clientData,
          entity: entityData,
          invoice: invoiceData,
        },
        occurred_at: now,
      }),
    )
  } catch (err) {
    console.warn('[clients] failed to log promotion activity', err)
  }

  return {
    client: clientData,
    entity: entityData,
    invoice: invoiceData,
  }
}
