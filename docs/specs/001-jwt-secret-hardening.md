# Spec: JWT secret hardening (F0.1)

**Status**: shipped
**Requested by**: owner (v2.0 roadmap, F0.1)
**Roadmap ref**: docs/versions/v2.0-foundation-android.md
**Approval**: owner approved editing protected auth files in chat on 2026-10-30 (`src/lib/auth.ts`, `src/middleware.ts`, `src/lib/env.ts`, `src/app/api/admin/kyc/review/route.ts`).

## Problem
Session JWTs are signed with `process.env.JWT_SECRET || 'gccstartup-dev-secret'` in `auth.ts` and `middleware.ts`. If the variable is ever missing in production, anyone can forge an admin session. `env.ts` (unused) carries a second hardcoded default, and `api/admin/kyc/review/route.ts` reads `JWT_SECRET!` directly.

## Scope
- In: one shared `getJwtSecret()`; all JWT signing/verification uses it; production without `JWT_SECRET` fails loudly; remove the dead `env.ts`.
- Out: rotating the production secret, secret length policy, changing the kyc/review route's own Bearer auth design (noted as follow-up).

## Acceptance criteria
- [x] AC1: In production, a missing or empty `JWT_SECRET` makes `getJwtSecret()` throw.
- [x] AC2: In production with `JWT_SECRET` set, it returns that secret's bytes.
- [x] AC3: Outside production, a missing secret uses a documented dev fallback so local dev and tests work.
- [x] AC4: The secret is read lazily at call time, so `next build` does not fail when `JWT_SECRET` is absent at build time.
- [x] AC5: No hardcoded secret remains in `auth.ts`, `middleware.ts` or the kyc review route; `env.ts` is removed.

## Touches
- Schema changes: no
- Routes / API: `api/admin/kyc/review` (secret source only)
- Protected areas: auth.ts, middleware.ts (approved above)

## Test plan
- Unit (vitest): `src/lib/jwt-secret.test.ts` for AC1 to AC3; existing `auth.test.ts` keeps passing.
- Build: `npm run verify` with `JWT_SECRET` unset proves AC4.

## Rollout & risk
**Deploying this to production without `JWT_SECRET` set in the host environment will break login and protected pages (fails closed).** Confirm the variable is set in Dokploy before deploying.

## Follow-ups
`api/admin/kyc/review` verifies a Bearer token and only accepts role `admin`, unlike `requireAdmin()` (cookie, admin + super_admin). Align it with AGENTS.md in a separate spec.
