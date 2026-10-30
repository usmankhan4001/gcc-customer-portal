// Edge-safe (used by middleware): no Node imports. Read lazily so `next build` works without the secret.
const DEV_FALLBACK = 'gccstartup-dev-secret'; // never used in production

export function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (secret) return new TextEncoder().encode(secret);
  if (process.env.NODE_ENV === 'production') throw new Error('JWT_SECRET must be set in production');
  return new TextEncoder().encode(DEV_FALLBACK);
}
