type LogLevel = 'info' | 'warn' | 'error' | 'debug'

interface LogEntry {
  level: LogLevel
  timestamp: string
  message: string
  data?: unknown
}

function log(level: LogLevel, message: string, data?: unknown): void {
  const entry: LogEntry = {
    level,
    timestamp: new Date().toISOString(),
    message,
  }

  if (data !== undefined) {
    entry.data = data
  }

  // eslint-disable-next-line no-console
  console.log(JSON.stringify(entry))
}

export const logger = {
  info: (message: string, data?: unknown) => log('info', message, data),
  warn: (message: string, data?: unknown) => log('warn', message, data),
  error: (message: string, data?: unknown) => log('error', message, data),
  debug: (message: string, data?: unknown) => log('debug', message, data),
}
