import { NextRequest, NextResponse } from 'next/server'
import { requireApiKey, addCorsHeaders } from '@/lib/api-auth'

export const POST = requireApiKey(async (request: NextRequest, context: any, key: any) => {
  try {
    const body = await request.json()
    const { filename, contentType, size, expiresIn = 3600 } = body

    if (!filename?.trim()) {
      const response = NextResponse.json({ error: 'Filename is required' }, { status: 400 })
      return addCorsHeaders(response)
    }

    // TODO: Generate actual pre-signed URL from storage provider
    const presignedData = {
      uploadUrl: `https://storage.gcc.com/upload/${Date.now()}/${filename}?signature=dev-sig`,
      downloadUrl: `https://storage.gcc.com/download/${Date.now()}/${filename}?signature=dev-sig`,
      expiresAt: new Date(Date.now() + expiresIn * 1000).toISOString(),
      contentType,
      maxSize: 50 * 1024 * 1024, // 50MB
    }

    const response = NextResponse.json({ data: presignedData })
    return addCorsHeaders(response)
  } catch (error: any) {
    const response = NextResponse.json({ error: error.message }, { status: 500 })
    return addCorsHeaders(response)
  }
})

export async function OPTIONS() {
  return addCorsHeaders(new NextResponse(null, { status: 204 }))
}
