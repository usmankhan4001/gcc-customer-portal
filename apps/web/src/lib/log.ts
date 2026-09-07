/** Project-level structured logger. Every log line carries a timestamp, level, and
 *  module tag so that production logs are grep-friendly and structured enough for
 *  log aggregators. Replaces raw console.error / console.warn scattered across the
 *  codebase. */

function timestamp(): string {
  return new Date().toISOString()
}

function log(level: string, module: string, data: unknown, msg: string) {
  const prefix = `[${timestamp()}] [${level}] [${module}]`
  const payload = data !== undefined ? ` ${JSON.stringify(data)}` : ''
  const line = `${prefix} ${msg}${payload}`
  if (level === 'error') console.error(line)
  else if (level === 'warn') console.warn(line)
  else if (level === 'debug') console.debug(line)
  else console.log(line)
}

export const logger = {
  info(data: unknown, msg: string) { log('info', 'app', data, msg) },
  warn(data: unknown, msg: string) { log('warn', 'app', data, msg) },
  error(data: unknown, msg: string) { log('error', 'app', data, msg) },
  debug(data: unknown, msg: string) { log('debug', 'app', data, msg) },
}

/** Format and log a Directus SDK error with enough context to be actionable.
 *  Directus errors are plain objects, not Error instances, so String(err) gives
 *  "[object Object]" — pull the HTTP status and nested messages out explicitly. */
export function logDirectusError(context: string, error: unknown) {
  const status = (error as { response?: { status?: number } })?.response?.status
  const errors = (error as { errors?: Array<{ message?: string }> })?.errors
  const message = Array.isArray(errors) && errors.length
    ? errors.map((e) => e?.message ?? 'unknown error').join('; ')
    : error instanceof Error
      ? error.message
      : String(error)
  const detail = status ? `${status} ${message}` : message
  log('error', 'directus', undefined, `${context} failed: ${detail}`)
}