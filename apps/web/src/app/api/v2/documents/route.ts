import { NextRequest, NextResponse } from 'next/server'
import { requireApiKey, parsePagination, parseSearch, parseFilters, addCorsHeaders } from '@/lib/api-auth'

const stubDocuments = [
  { id: '1', name: 'Pitch Deck.pdf', type: 'pdf', size: 2048000, mimeType: 'application/pdf', uploadedBy: 'user-1', contactId: '1', dealId: '1', url: 'https://storage.gcc.com/docs/1/pitch-deck.pdf', createdAt: new Date().toISOString() },
  { id: '2', name: 'Contract.docx', type: 'docx', size: 512000, mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', uploadedBy: 'user-2', contactId: '2', dealId: '2', url: 'https://storage.gcc.com/docs/2/contract.docx', createdAt: new Date().toISOString() },
]

export const GET = requireApiKey(async (request: NextRequest, context: any, key: any) => {
  try {
    const { page, limit, offset } = parsePagination(request)
    const search = parseSearch(request)
    const filters = parseFilters(request)

    let documents = [...stubDocuments]

    if (search) {
      const q = search.toLowerCase()
      documents = documents.filter(d => d.name.toLowerCase().includes(q))
    }

    for (const [filterKey, filterValue] of Object.entries(filters)) {
      documents = documents.filter(d => (d as any)[filterKey] === filterValue)
    }

    const total = documents.length
    const paginated = documents.slice(offset, offset + limit)

    const response = NextResponse.json({
      data: paginated,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    })
    return addCorsHeaders(response)
  } catch (error: any) {
    const response = NextResponse.json({ error: error.message }, { status: 500 })
    return addCorsHeaders(response)
  }
})

export const POST = requireApiKey(async (request: NextRequest, context: any, key: any) => {
  try {
    const body = await request.json()
    const { name, type, size, mimeType, contactId, dealId, customAttributes = {} } = body

    if (!name?.trim()) {
      const response = NextResponse.json({ error: 'Document name is required' }, { status: 400 })
      return addCorsHeaders(response)
    }

    const document = {
      id: 'doc-' + Date.now(),
      name,
      type,
      size,
      mimeType,
      uploadedBy: key.id,
      contactId,
      dealId,
      url: `https://storage.gcc.com/docs/${Date.now()}/${name}`,
      customAttributes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    const response = NextResponse.json({ data: document }, { status: 201 })
    return addCorsHeaders(response)
  } catch (error: any) {
    const response = NextResponse.json({ error: error.message }, { status: 500 })
    return addCorsHeaders(response)
  }
})

export async function OPTIONS() {
  return addCorsHeaders(new NextResponse(null, { status: 204 }))
}
