// shortcut: in-memory sliding window, per server instance and reset on restart. Fine for the single
// container today; replace with a DB or Redis counter before running more than one instance.
const hits = new Map<string, number[]>();

/** Records an attempt and returns true if it is within `max` per `windowMs`; false if blocked. */
export function rateLimit(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  if (recent.length >= max) {
    hits.set(key, recent);
    return false;
  }
  recent.push(now);
  hits.set(key, recent);
  if (hits.size > 10_000) for (const [k, v] of hits) if (v.every((t) => now - t >= windowMs)) hits.delete(k);
  return true;
}

// Behind the Traefik/Dokploy proxy the first x-forwarded-for entry is the client.
export function clientIp(request: Request): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown';
}
