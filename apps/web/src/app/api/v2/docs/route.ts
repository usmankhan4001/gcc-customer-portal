import { NextResponse } from 'next/server'
import { addCorsHeaders } from '@/lib/api-auth'

export async function GET() {
  const spec = {
    openapi: '3.1.0',
    info: {
      title: 'GCC Startup Platform API',
      version: '2.0.0',
      description: 'REST API for the GCC Startup Platform - CRM, Campaigns, Conversations, and Analytics',
      contact: {
        name: 'GCC Startup Platform Support',
        email: 'api@gccstartup.com',
      },
    },
    servers: [
      { url: 'https://platform.gccstartup.com', description: 'Production' },
      { url: 'http://localhost:3000', description: 'Development' },
    ],
    security: [{ BearerAuth: [] }],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'API Key',
          description: 'API key prefixed with gcc_',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            error: { type: 'string' },
          },
        },
        PaginationMeta: {
          type: 'object',
          properties: {
            page: { type: 'integer' },
            limit: { type: 'integer' },
            total: { type: 'integer' },
            totalPages: { type: 'integer' },
          },
        },
        Contact: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            firstName: { type: 'string' },
            lastName: { type: 'string' },
            email: { type: 'string', format: 'email' },
            phone: { type: 'string' },
            companyId: { type: 'string' },
            status: { type: 'string', enum: ['active', 'inactive', 'archived'] },
            customAttributes: { type: 'object' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        Company: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            industry: { type: 'string' },
            size: { type: 'string' },
            website: { type: 'string', format: 'uri' },
            email: { type: 'string', format: 'email' },
            phone: { type: 'string' },
            address: { type: 'string' },
            status: { type: 'string', enum: ['active', 'inactive'] },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        Deal: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            title: { type: 'string' },
            value: { type: 'number' },
            currency: { type: 'string' },
            stage: { type: 'string' },
            contactId: { type: 'string' },
            companyId: { type: 'string' },
            assignedTo: { type: 'string' },
            expectedCloseDate: { type: 'string', format: 'date' },
            status: { type: 'string', enum: ['open', 'won', 'lost'] },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        Lead: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            firstName: { type: 'string' },
            lastName: { type: 'string' },
            email: { type: 'string', format: 'email' },
            phone: { type: 'string' },
            source: { type: 'string' },
            stage: { type: 'string' },
            score: { type: 'integer' },
            assignedTo: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        Conversation: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            contactId: { type: 'string' },
            channel: { type: 'string', enum: ['whatsapp', 'email', 'sms'] },
            status: { type: 'string', enum: ['active', 'closed', 'archived'] },
            lastMessageAt: { type: 'string', format: 'date-time' },
            assignedTo: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        Message: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            conversationId: { type: 'string' },
            direction: { type: 'string', enum: ['inbound', 'outbound'] },
            content: { type: 'string' },
            channel: { type: 'string' },
            mediaUrl: { type: 'string', format: 'uri' },
            status: { type: 'string', enum: ['sent', 'delivered', 'read', 'failed'] },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        Campaign: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            type: { type: 'string', enum: ['whatsapp', 'email', 'sms'] },
            status: { type: 'string', enum: ['draft', 'scheduled', 'active', 'paused', 'completed'] },
            audience: { type: 'object' },
            templateId: { type: 'string' },
            scheduledAt: { type: 'string', format: 'date-time' },
            sent: { type: 'integer' },
            delivered: { type: 'integer' },
            read: { type: 'integer' },
            replied: { type: 'integer' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        Template: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            type: { type: 'string', enum: ['whatsapp', 'email', 'sms'] },
            category: { type: 'string', enum: ['marketing', 'transactional', 'utility'] },
            language: { type: 'string' },
            content: { type: 'string' },
            variables: { type: 'array', items: { type: 'string' } },
            status: { type: 'string', enum: ['draft', 'pending', 'approved', 'rejected'] },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        Flow: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            status: { type: 'string', enum: ['draft', 'active', 'paused', 'archived'] },
            trigger: { type: 'object' },
            nodes: { type: 'array' },
            nodeCount: { type: 'integer' },
            executionCount: { type: 'integer' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        Document: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            type: { type: 'string' },
            size: { type: 'integer' },
            mimeType: { type: 'string' },
            uploadedBy: { type: 'string' },
            contactId: { type: 'string' },
            dealId: { type: 'string' },
            url: { type: 'string', format: 'uri' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
      },
    },
    paths: {
      '/api/v2': {
        get: {
          summary: 'API root',
          description: 'Returns API version and available endpoints',
          tags: ['System'],
          responses: {
            '200': { description: 'API information' },
          },
        },
      },
      '/api/v2/contacts': {
        get: {
          summary: 'List contacts',
          description: 'Retrieve a paginated list of contacts with optional search and filtering',
          tags: ['Contacts'],
          parameters: [
            { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
            { name: 'limit', in: 'query', schema: { type: 'integer', default: 20, maximum: 100 } },
            { name: 'search', in: 'query', schema: { type: 'string' } },
            { name: 'filter[status]', in: 'query', schema: { type: 'string', enum: ['active', 'inactive', 'archived'] } },
          ],
          responses: {
            '200': {
              description: 'Paginated contacts',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      data: { type: 'array', items: { $ref: '#/components/schemas/Contact' } },
                      meta: { $ref: '#/components/schemas/PaginationMeta' },
                    },
                  },
                },
              },
            },
            '401': { description: 'Invalid or missing API key' },
          },
        },
        post: {
          summary: 'Create a contact',
          tags: ['Contacts'],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    firstName: { type: 'string' },
                    lastName: { type: 'string' },
                    email: { type: 'string', format: 'email' },
                    phone: { type: 'string' },
                    companyId: { type: 'string' },
                    status: { type: 'string', enum: ['active', 'inactive', 'archived'] },
                    customAttributes: { type: 'object' },
                  },
                },
              },
            },
          },
          responses: {
            '201': { description: 'Contact created' },
            '400': { description: 'Validation error' },
            '401': { description: 'Invalid or missing API key' },
          },
        },
      },
      '/api/v2/contacts/{id}': {
        get: {
          summary: 'Get a contact',
          tags: ['Contacts'],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            '200': { description: 'Contact details' },
            '404': { description: 'Contact not found' },
          },
        },
        patch: {
          summary: 'Update a contact',
          tags: ['Contacts'],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            '200': { description: 'Contact updated' },
            '404': { description: 'Contact not found' },
          },
        },
        delete: {
          summary: 'Delete a contact',
          tags: ['Contacts'],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            '200': { description: 'Contact deleted' },
            '404': { description: 'Contact not found' },
          },
        },
      },
      '/api/v2/companies': {
        get: {
          summary: 'List companies',
          tags: ['Companies'],
          parameters: [
            { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
            { name: 'limit', in: 'query', schema: { type: 'integer', default: 20, maximum: 100 } },
            { name: 'search', in: 'query', schema: { type: 'string' } },
          ],
          responses: {
            '200': { description: 'Paginated companies' },
          },
        },
        post: {
          summary: 'Create a company',
          tags: ['Companies'],
          responses: {
            '201': { description: 'Company created' },
          },
        },
      },
      '/api/v2/companies/{id}': {
        get: { summary: 'Get a company', tags: ['Companies'], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Company details' }, '404': { description: 'Company not found' } } },
        patch: { summary: 'Update a company', tags: ['Companies'], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Company updated' } } },
        delete: { summary: 'Delete a company', tags: ['Companies'], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Company deleted' } } },
      },
      '/api/v2/deals': {
        get: { summary: 'List deals', tags: ['Deals'], parameters: [{ name: 'page', in: 'query', schema: { type: 'integer', default: 1 } }, { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } }], responses: { '200': { description: 'Paginated deals' } } },
        post: { summary: 'Create a deal', tags: ['Deals'], responses: { '201': { description: 'Deal created' } } },
      },
      '/api/v2/deals/{id}': {
        get: { summary: 'Get a deal', tags: ['Deals'], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Deal details' } } },
        patch: { summary: 'Update a deal', tags: ['Deals'], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Deal updated' } } },
        delete: { summary: 'Delete a deal', tags: ['Deals'], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Deal deleted' } } },
      },
      '/api/v2/leads': {
        get: { summary: 'List leads', tags: ['Leads'], parameters: [{ name: 'page', in: 'query', schema: { type: 'integer', default: 1 } }], responses: { '200': { description: 'Paginated leads' } } },
        post: { summary: 'Create a lead', tags: ['Leads'], responses: { '201': { description: 'Lead created' } } },
      },
      '/api/v2/leads/{id}': {
        get: { summary: 'Get a lead', tags: ['Leads'], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Lead details' } } },
        patch: { summary: 'Update a lead', tags: ['Leads'], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Lead updated' } } },
        delete: { summary: 'Delete a lead', tags: ['Leads'], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Lead deleted' } } },
      },
      '/api/v2/conversations': {
        get: { summary: 'List conversations', tags: ['Conversations'], responses: { '200': { description: 'Paginated conversations' } } },
        post: { summary: 'Create a conversation', tags: ['Conversations'], responses: { '201': { description: 'Conversation created' } } },
      },
      '/api/v2/conversations/{id}': {
        get: { summary: 'Get a conversation', tags: ['Conversations'], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Conversation details' } } },
        patch: { summary: 'Update a conversation', tags: ['Conversations'], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Conversation updated' } } },
        delete: { summary: 'Delete a conversation', tags: ['Conversations'], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Conversation deleted' } } },
      },
      '/api/v2/conversations/{id}/messages': {
        get: { summary: 'List messages', tags: ['Messages'], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Paginated messages' } } },
        post: { summary: 'Send a message', tags: ['Messages'], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '201': { description: 'Message sent' } } },
      },
      '/api/v2/campaigns': {
        get: { summary: 'List campaigns', tags: ['Campaigns'], responses: { '200': { description: 'Paginated campaigns' } } },
        post: { summary: 'Create a campaign', tags: ['Campaigns'], responses: { '201': { description: 'Campaign created' } } },
      },
      '/api/v2/campaigns/{id}': {
        get: { summary: 'Get a campaign', tags: ['Campaigns'], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Campaign details' } } },
        patch: { summary: 'Update a campaign', tags: ['Campaigns'], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Campaign updated' } } },
        delete: { summary: 'Delete a campaign', tags: ['Campaigns'], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Campaign deleted' } } },
      },
      '/api/v2/campaigns/{id}/dispatch': {
        post: { summary: 'Dispatch a campaign', tags: ['Campaigns'], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '202': { description: 'Campaign dispatching' } } },
      },
      '/api/v2/templates': {
        get: { summary: 'List templates', tags: ['Templates'], responses: { '200': { description: 'Paginated templates' } } },
        post: { summary: 'Create a template', tags: ['Templates'], responses: { '201': { description: 'Template created' } } },
      },
      '/api/v2/templates/{id}': {
        get: { summary: 'Get a template', tags: ['Templates'], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Template details' } } },
        patch: { summary: 'Update a template', tags: ['Templates'], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Template updated' } } },
        delete: { summary: 'Delete a template', tags: ['Templates'], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Template deleted' } } },
      },
      '/api/v2/flows': {
        get: { summary: 'List flows', tags: ['Flows'], responses: { '200': { description: 'Paginated flows' } } },
        post: { summary: 'Create a flow', tags: ['Flows'], responses: { '201': { description: 'Flow created' } } },
      },
      '/api/v2/flows/{id}': {
        get: { summary: 'Get a flow', tags: ['Flows'], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Flow details' } } },
        patch: { summary: 'Update a flow', tags: ['Flows'], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Flow updated' } } },
        delete: { summary: 'Delete a flow', tags: ['Flows'], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Flow deleted' } } },
      },
      '/api/v2/documents': {
        get: { summary: 'List documents', tags: ['Documents'], responses: { '200': { description: 'Paginated documents' } } },
        post: { summary: 'Register a document', tags: ['Documents'], responses: { '201': { description: 'Document registered' } } },
      },
      '/api/v2/documents/{id}': {
        get: { summary: 'Get a document', tags: ['Documents'], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Document details' } } },
        delete: { summary: 'Delete a document', tags: ['Documents'], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Document deleted' } } },
      },
      '/api/v2/documents/presign': {
        post: { summary: 'Generate pre-signed upload URL', tags: ['Documents'], responses: { '200': { description: 'Pre-signed URL' } } },
      },
      '/api/v2/analytics': {
        get: { summary: 'Get analytics overview', tags: ['Analytics'], responses: { '200': { description: 'Analytics overview' } } },
      },
      '/api/v2/analytics/pipeline': {
        get: { summary: 'Get pipeline analytics', tags: ['Analytics'], responses: { '200': { description: 'Pipeline analytics' } } },
      },
      '/api/v2/analytics/revenue': {
        get: { summary: 'Get revenue analytics', tags: ['Analytics'], responses: { '200': { description: 'Revenue analytics' } } },
      },
      '/api/v2/analytics/campaigns': {
        get: { summary: 'Get campaign analytics', tags: ['Analytics'], responses: { '200': { description: 'Campaign analytics' } } },
      },
    },
    tags: [
      { name: 'System', description: 'API information and health' },
      { name: 'Contacts', description: 'Contact management' },
      { name: 'Companies', description: 'Company management' },
      { name: 'Deals', description: 'Deal pipeline management' },
      { name: 'Leads', description: 'Lead management' },
      { name: 'Conversations', description: 'Conversation management' },
      { name: 'Messages', description: 'Message management' },
      { name: 'Campaigns', description: 'Campaign management' },
      { name: 'Templates', description: 'Template management' },
      { name: 'Flows', description: 'Automation flow management' },
      { name: 'Documents', description: 'Document management' },
      { name: 'Analytics', description: 'Analytics and reporting' },
    ],
  }

  const response = NextResponse.json(spec)
  return addCorsHeaders(response)
}

export async function OPTIONS() {
  return addCorsHeaders(new NextResponse(null, { status: 204 }))
}
