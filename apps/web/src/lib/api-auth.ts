import { NextRequest, NextResponse } from 'next/server'
import { createHash } from 'crypto'

export type ApiKeyPayload = {
  id: string
  name: string
  permissions: string[]
  rateLimit: number
}

export async function authenticateApiKey(request: NextRequest): Promise<ApiKeyPayload | null> {
  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) return null

  const token = authHeader.slice(7)
  if (!token.startsWith('gcc_')) return null

  const keyHash = createHash('sha256').update(token).digest('hex')

  // TODO: Replace with actual database lookup
  // SELECT id, name, permissions, rate_limit FROM api_keys WHERE key_hash = $1 AND status = 'ACTIVE'
  if (token.startsWith('gcc_')) {
    return {
      id: 'dev-key',
      name: 'Development API Key',
      permissions: ['*'],
      rateLimit: 1000,
    }
  }

  return null
}

export function requireApiKey(handler: Function) {
  return async (request: NextRequest, context?: any) => {
    const key = await authenticateApiKey(request)
    if (!key) {
      return NextResponse.json(
        { error: 'Invalid or missing API key' },
        { status: 401 }
      )
    }
    return handler(request, context, key)
  }
}

export function hasPermission(key: ApiKeyPayload, permission: string): boolean {
  if (key.permissions.includes('*')) return true
  return key.permissions.includes(permission)
}

export function parsePagination(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)))
  return { page, limit, offset: (page - 1) * limit }
}

export function parseFilters(request: NextRequest): Record<string, string> {
  const { searchParams } = new URL(request.url)
  const filters: Record<string, string> = {}
  for (const [key, value] of searchParams.entries()) {
    if (key.startsWith('filter[') && key.endsWith(']')) {
      const filterKey = key.slice(7, -1)
      filters[filterKey] = value
    }
  }
  return filters
}

export function parseSearch(request: NextRequest): string | null {
  const { searchParams } = new URL(request.url)
  return searchParams.get('search') || null
}

export function addCorsHeaders(response: NextResponse): NextResponse {
  response.headers.set('Access-Control-Allow-Origin', '*')
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  response.headers.set('Access-Control-Max-Age', '86400')
  return response
}
