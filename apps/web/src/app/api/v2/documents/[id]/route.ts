import { NextRequest, NextResponse } from 'next/server'
import { requireApiKey, addCorsHeaders } from '@/lib/api-auth'

const stubDocuments = [
  { id: '1', name: 'Pitch Deck.pdf', type: 'pdf', size: 2048000, mimeType: 'application/pdf', uploadedBy: 'user-1', contactId: '1', dealId: '1', url: 'https://storage.gcc.com/docs/1/pitch-deck.pdf', createdAt: new Date().toISOString() },
  { id: '2', name: 'Contract.docx', type: 'docx', size: 512000, mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', uploadedBy: 'user-2', contactId: '2', dealId: '2', url: 'https://storage.gcc.com/docs/2/contract.docx', createdAt: new Date().toISOString() },
]

type RouteContext = { params: Promise<{ id: string }> }

export const GET = requireApiKey(async (request: NextRequest, context: RouteContext, key: any) => {
  try {
    const { id } = await context.params
    const document = stubDocuments.find(d => d.id === id)

    if (!document) {
      const response = NextResponse.json({ error: 'Document not found' }, { status: 404 })
      return addCorsHeaders(response)
    }

    const response = NextResponse.json({ data: document })
    return addCorsHeaders(response)
  } catch (error: any) {
    const response = NextResponse.json({ error: error.message }, { status: 500 })
    return addCorsHeaders(response)
  }
})

export const DELETE = requireApiKey(async (request: NextRequest, context: RouteContext, key: any) => {
  try {
    const { id } = await context.params
    const document = stubDocuments.find(d => d.id === id)

    if (!document) {
      const response = NextResponse.json({ error: 'Document not found' }, { status: 404 })
      return addCorsHeaders(response)
    }

    // TODO: Delete from storage and database
    const response = NextResponse.json({ data: { deleted: true, id } })
    return addCorsHeaders(response)
  } catch (error: any) {
    const response = NextResponse.json({ error: error.message }, { status: 500 })
    return addCorsHeaders(response)
  }
})

export async function OPTIONS() {
  return addCorsHeaders(new NextResponse(null, { status: 204 }))
}
