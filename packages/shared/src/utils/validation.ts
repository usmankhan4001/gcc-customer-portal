import { z } from 'zod'

/** Email address (basic format check). */
export const emailSchema = z.string().email('Invalid email address')

/** Phone number in E.164 format (e.g. +971501234567). */
export const phoneSchema = z
  .string()
  .regex(/^\+[1-9]\d{1,14}$/, 'Phone must be in E.164 format')

/** UUID v4. */
export const uuidSchema = z.string().uuid('Invalid UUID')

/** Standard pagination query params. */
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sort: z.enum(['asc', 'desc']).default('desc'),
})

export type PaginationInput = z.infer<typeof paginationSchema>

/** Date range filter. */
export const dateRangeSchema = z.object({
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
})

export type DateRangeInput = z.infer<typeof dateRangeSchema>

/**
 * Validate data against a Zod schema.
 * @param schema - Zod schema
 * @param data - Input data
 * @returns Structured result
 */
export function validate<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
): { success: true; data: T } | { success: false; errors: z.ZodIssue[] } {
  const result = schema.safeParse(data)

  if (result.success) {
    return { success: true, data: result.data }
  }

  return { success: false, errors: result.error.issues }
}
