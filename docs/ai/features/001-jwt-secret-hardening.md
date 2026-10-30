# Feature: JWT secret hardening

**Slug**: 001-jwt-secret-hardening   **Spec**: docs/specs/001-jwt-secret-hardening.md   **Last verified against code**: 2026-10-30

## What it does
All session JWT signing and verification gets its key from `getJwtSecret()`. In production a missing/empty `JWT_SECRET` throws instead of falling back to a hardcoded key, so sessions cannot be forged by misconfiguration.

## Where it lives
- lib: `src/lib/jwt-secret.ts` (`getJwtSecret`, edge-safe, lazy)
- Callers: `src/lib/auth.ts` (`generateToken`, `verifyToken`), `src/middleware.ts` (`verifyJwt`), `src/app/api/admin/kyc/review/route.ts`
- Env: `JWT_SECRET` (required in production)

## Behavior and rules
- Production + no secret: throws `JWT_SECRET must be set in production` (loud 500, fails closed).
- Non-production + no secret: uses a dev fallback so local dev and tests run.
- Secret is read at call time, never at import, so `next build` works without it.
- Any new code that signs or verifies a JWT must call `getJwtSecret()`; never read `process.env.JWT_SECRET` directly.

## Tests
`src/lib/jwt-secret.test.ts` (production missing/empty, production set, dev fallback); `src/lib/auth.test.ts` (round trip). Not covered: middleware behavior with a missing secret.

## Protected-zone touchpoints
Auth files (`auth.ts`, `middleware.ts`) and an admin API route.

## Known gaps / extension points
No minimum secret length or rotation support. `api/admin/kyc/review` still uses its own Bearer-token check (admin only) instead of `requireAdmin()`.
