/**
 * Custom application error with status code and error code.
 */
export class AppError extends Error {
  public readonly code: string
  public readonly statusCode: number
  public readonly details?: unknown

  constructor(code: string, message: string, statusCode: number, details?: unknown) {
    super(message)
    this.name = 'AppError'
    this.code = code
    this.statusCode = statusCode
    this.details = details
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super('UNAUTHORIZED', message, 401)
  }
}

export class NotFoundError extends AppError {
  constructor(resource = 'Resource') {
    super('NOT_FOUND', `${resource} not found`, 404)
  }
}

export class ValidationError extends AppError {
  constructor(message = 'Validation failed', details?: unknown) {
    super('VALIDATION_ERROR', message, 400, details)
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Resource already exists') {
    super('CONFLICT', message, 409)
  }
}

/**
 * Structured error logging.
 * @param error - Error or AppError
 * @param context - Additional context (request ID, user ID, etc.)
 */
export function logError(error: Error, context?: Record<string, unknown>): void {
  const entry = {
    level: 'error',
    timestamp: new Date().toISOString(),
    name: error.name,
    message: error.message,
    stack: error.stack,
    ...(error instanceof AppError ? { code: error.code, statusCode: error.statusCode, details: error.details } : {}),
    ...context,
  }

  console.error(JSON.stringify(entry))
}

/**
 * Convert an error into a NextResponse-compatible JSON body.
 * Import this dynamically in route handlers to avoid bundling Next.js.
 */
export function handleApiError(error: unknown): { status: number; body: Record<string, unknown> } {
  if (error instanceof AppError) {
    return {
      status: error.statusCode,
      body: {
        error: error.code,
        message: error.message,
        ...(error.details ? { details: error.details } : {}),
      },
    }
  }

  if (error instanceof Error) {
    return {
      status: 500,
      body: { error: 'INTERNAL_SERVER_ERROR', message: 'An unexpected error occurred' },
    }
  }

  return {
    status: 500,
    body: { error: 'INTERNAL_SERVER_ERROR', message: 'An unexpected error occurred' },
  }
}
