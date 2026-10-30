import { timingSafeEqual } from 'crypto';

const isProd = () => process.env.NODE_ENV === 'production';

// Dev conveniences (OTP in response, fixed 123456 code) must never exist in production.
export const devOtpAllowed = () => !isProd();

// One-time admin bootstrap: open in dev, requires a matching ADMIN_SEED_TOKEN header in production.
export function seedAllowed(provided: string | null): boolean {
  if (!isProd()) return true;
  const expected = process.env.ADMIN_SEED_TOKEN;
  if (!expected || !provided) return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}
