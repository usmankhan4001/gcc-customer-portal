export type EventHandler<T = unknown> = (payload: T) => void | Promise<void>

type ListenerEntry = { handler: EventHandler<unknown>; unwrapped: EventHandler<unknown> }

const listeners = new Map<string, Set<ListenerEntry>>()

/**
 * Subscribe to an event type.
 * @param eventType - Dot-separated event name (e.g. "contact.created")
 * @param handler - Callback invoked when the event fires
 * @returns Unsubscribe function
 */
export function on<T = unknown>(
  eventType: string,
  handler: EventHandler<T>,
): () => void {
  const unwrapped = handler as EventHandler<unknown>
  const entry: ListenerEntry = { handler: handler as EventHandler<unknown>, unwrapped }

  if (!listeners.has(eventType)) {
    listeners.set(eventType, new Set())
  }
  listeners.get(eventType)!.add(entry)

  return () => {
    listeners.get(eventType)?.delete(entry)
  }
}

/**
 * Emit an event to all registered handlers.
 * Async handlers are awaited; errors are caught and logged.
 * @param eventType - Dot-separated event name
 * @param payload - Event data
 */
export async function emit<T = unknown>(eventType: string, payload: T): Promise<void> {
  const handlers = listeners.get(eventType)
  if (!handlers || handlers.size === 0) return

  for (const entry of handlers) {
    try {
      await entry.handler(payload)
    } catch (error) {
      // Avoid importing logger here to keep the event bus lightweight.
      // eslint-disable-next-line no-console
      console.error(`[EventBus] handler error for "${eventType}":`, error)
    }
  }
}

/**
 * Remove a specific handler from an event type.
 * @param eventType - Event name
 * @param handler - The handler to remove
 */
export function off<T = unknown>(eventType: string, handler: EventHandler<T>): void {
  const unwrapped = handler as EventHandler<unknown>
  const handlers = listeners.get(eventType)
  if (!handlers) return

  for (const entry of handlers) {
    if (entry.unwrapped === unwrapped) {
      handlers.delete(entry)
      break
    }
  }
}

/**
 * Remove all listeners (useful for tests).
 */
export function clearAllListeners(): void {
  listeners.clear()
}
