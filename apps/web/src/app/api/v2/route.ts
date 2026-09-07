import { NextResponse } from 'next/server'
import { addCorsHeaders } from '@/lib/api-auth'

export async function GET() {
  const response = NextResponse.json({
    name: 'GCC Startup Platform API',
    version: '2.0.0',
    documentation: '/api/v2/docs',
    endpoints: {
      contacts: '/api/v2/contacts',
      companies: '/api/v2/companies',
      deals: '/api/v2/deals',
      leads: '/api/v2/leads',
      conversations: '/api/v2/conversations',
      campaigns: '/api/v2/campaigns',
      templates: '/api/v2/templates',
      flows: '/api/v2/flows',
      documents: '/api/v2/documents',
      analytics: '/api/v2/analytics',
      webhooks: '/api/v2/webhooks',
    },
  })
  return addCorsHeaders(response)
}

export async function OPTIONS() {
  return addCorsHeaders(new NextResponse(null, { status: 204 }))
}
