import { NextResponse } from 'next/server'

type DirectusFailure = {
  status?: number
  response?: { status?: number }
  errors?: Array<{ extensions?: { code?: string; status?: number } }>
}

export function apiError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status })
}

export function directusError(error: unknown, fallback: string) {
  const failure = error as DirectusFailure
  const code = failure.errors?.[0]?.extensions?.code
  const status = failure.response?.status ?? failure.status ?? failure.errors?.[0]?.extensions?.status

  if (status === 401 || code === 'INVALID_TOKEN') return apiError('Unauthorized', 401)
  if (status === 403 || code === 'FORBIDDEN') {
    return apiError('Forbidden: your Directus role does not allow this CRM action', 403)
  }
  if (status === 404 || code === 'RECORD_NOT_FOUND') return apiError('CRM record not found', 404)

  console.error(`[admin/crm] ${fallback}`, error)
  return apiError(fallback, 500)
}

export async function readJsonObject(req: Request) {
  try {
    const value: unknown = await req.json()
    if (!value || typeof value !== 'object' || Array.isArray(value)) return null
    return value as Record<string, unknown>
  } catch {
    return null
  }
}

export function hasOnlyFields(body: Record<string, unknown>, allowed: readonly string[]) {
  return Object.keys(body).every((field) => allowed.includes(field))
}

export function validId(value: string) {
  return value.length > 0 && value.length <= 128 && /^[A-Za-z0-9_-]+$/.test(value)
}

export function validDate(value: unknown, nullable = true): value is string | null {
  if (value === null) return nullable
  return typeof value === 'string' && value.length <= 40 && !Number.isNaN(Date.parse(value))
}

export function cleanText(value: unknown, maxLength: number, nullable = true): string | null | undefined {
  if (value === null && nullable) return null
  if (typeof value !== 'string') return undefined
  const text = value.trim()
  if (!text || text.length > maxLength) return undefined
  return text
}

export function nullableText(value: unknown, maxLength: number): string | null | undefined {
  if (value === null || value === '') return null
  return cleanText(value, maxLength)
}
