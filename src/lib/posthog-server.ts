import { PostHog } from 'posthog-node';

let client: PostHog | null = null;

function getClient(): PostHog | null {
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!key) return null;
  if (!client) {
    client = new PostHog(key, {
      host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com',
      flushAt: 1,
      flushInterval: 0,
    });
  }
  return client;
}

/**
 * Server-side event capture for things that only happen in API routes
 * (checkout completed, KYC advanced) — not something any route depends on
 * to function, so this silently no-ops without a configured key.
 */
export function captureServerEvent(distinctId: string, event: string, properties?: Record<string, unknown>) {
  const ph = getClient();
  if (!ph) return;
  ph.capture({ distinctId, event, properties });
}

export function identifyServer(distinctId: string, properties?: Record<string, unknown>) {
  const ph = getClient();
  if (!ph) return;
  ph.identify({ distinctId, properties });
}
