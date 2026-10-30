# Feature: Admin bootstrap and guard

**Slug**: admin-bootstrap-and-guard   **Area**: [admin-operations](../modules/admin-operations.md)   **Status**: working with inconsistencies   **Last verified against code**: 2026-10-30

## What it does
Defines who may use `/admin` pages and `/api/admin/**` endpoints, and how the very first super admin is created. Pages are gated by `src/middleware.ts`; APIs gate themselves with `requireAdmin()` because middleware treats `/api/` as public. `POST /api/admin/seed-admin` creates the first `super_admin` when no admin exists (in production only with a secret header).

## Entry points
- `src/middleware.ts:46-103` (page gate), `src/lib/admin-auth.ts:10-20` (`requireAdmin`), `src/app/admin/layout.tsx` (shell), `POST /api/admin/seed-admin`.

## Files
- `src/middleware.ts` (protected zone): `/api/` public (`:6`), `/admin` gate `:78-99`.
- `src/lib/admin-auth.ts` (protected zone): cookie `gcc_session` -> `verifyToken` -> role check.
- `src/lib/auth.ts:12-35` token create/verify (HS256, 7d, `sub`=userId, payload also has `userId`,`email`,`role`).
- `src/lib/auth-policy.ts:9-16` `seedAllowed`.
- `src/app/api/admin/seed-admin/route.ts:10-82`.
- `src/app/admin/layout.tsx:14-110`: static sidebar + header, NO auth code, no `use client`.
- `src/lib/db/schema.ts:21-27` `roleEnum` (`user_role`): client, staff, operations, admin, super_admin.
- `tests/auth-routes.test.ts:60-69`, `src/lib/auth-policy.test.ts`.

## Request / response contract: seed-admin
`POST /api/admin/seed-admin`, no body read. Header `x-seed-token`.
- Production (`NODE_ENV==='production'`): token missing, `ADMIN_SEED_TOKEN` unset, or mismatch (constant-time, length-checked) -> `404 {"error":"Not found"}`.
- Non-production: always allowed (no token needed).
- Any `admin`/`super_admin` exists -> `409 {success:false, error:"An admin user already exists. This endpoint only works for initial setup."}`.
- Else inserts user `admin@gccstartup.com`, whatsapp `+000000000000`, name "GCC Startup Admin", role `super_admin`, country UAE, `password_hash = hashPassword(randomBytes(12).toString('base64url'))`. Sets `gcc_session` cookie (httpOnly, secure in prod, lax, path /, 7 days). Returns `200 {success:true, message, credentials:{email, password (plaintext), role}, note}`.
- Insert error (e.g. email/phone unique clash when a non-admin already owns that email/phone) -> `500 {"error":"Failed to create admin account."}`.

## Step-by-step flow (guard)
1. Page request `/admin*` -> middleware: no cookie -> redirect `/` ; invalid JWT -> redirect `/` and delete cookie; role not admin/super_admin -> redirect `/`; else continue with `x-user-*` response headers (`:95-99`).
2. API request `/api/admin/*` -> middleware returns `next()` immediately (public path). Handler must call `requireAdmin()`: no cookie, invalid token, or role other than admin/super_admin -> `null` -> handler returns 401.
3. Admin layout renders for anyone who reached it; it does no second check, so the middleware is the only page gate.

## Data
`users.role` pgEnum `user_role` (`schema.ts:21`). Roles `staff` and `operations` exist but are accepted by neither gate, so they cannot access anything admin. Role is trusted from the JWT (not re-read from DB); demoting an admin takes effect only when their 7-day token expires. No logout/revocation list.

## Business rules and constants
- Admin = role `admin` or `super_admin`; they are treated identically by pages and `requireAdmin`.
- Token lifetime 7d (`auth.ts:16`); seed cookie maxAge 604800 s.
- Seed password: 12 random bytes base64url (16 chars).

## Every /api/admin/** route
| Method + path | requireAdmin()? | Roles accepted | Notes |
|---|---|---|---|
| GET /api/admin/pipeline | yes (`route.ts:9`) | admin, super_admin | |
| PATCH /api/admin/pipeline | yes (`:97`) | admin, super_admin | |
| POST /api/admin/pipeline | yes (`:159`) | admin, super_admin | assigned_to = caller |
| GET /api/admin/leads | yes | admin, super_admin | |
| GET /api/admin/pricing | yes | admin, super_admin | |
| PATCH /api/admin/pricing | yes | admin, super_admin | |
| GET /api/admin/promo-banners | yes | admin, super_admin | |
| POST /api/admin/promo-banners | yes | admin, super_admin | |
| PATCH /api/admin/promo-banners/[id] | yes (after `await params`) | admin, super_admin | |
| POST /api/admin/seed-admin | NO (by design; uses `seedAllowed`) | anyone in dev; token holder in prod; inert once an admin exists | |
| POST /api/admin/kyc/review | NO, own `verifyAdminAuth` (`kyc/review/route.ts:33-48`) | role exactly `admin` only (super_admin gets 403) | needs `Authorization: Bearer <jwt>` header, not the cookie |

Pages: all `/admin/**` (page, leads, clients, renewals, pricing) gated only by middleware. `/admin/settings` is linked in the sidebar (`layout.tsx:60`) but no page exists (404).

## Inconsistencies flagged
1. kyc/review does not use `requireAdmin`, uses Bearer header the app never sends (browser uses cookie), and rejects `super_admin` (`:43`). It is also entirely mocked (DB and WhatsApp calls commented out, returns `success:true` and fake `wamid.mock.*`, hardcoded phone `971500000000`, `:171-192`). Violates the AGENTS.md rule that admin APIs use `requireAdmin`.
2. seed-admin is open (no token) in any non-production NODE_ENV, including a staging deploy that forgets `NODE_ENV=production`.
3. In production seed-admin is protected by `ADMIN_SEED_TOKEN`; it returns the plaintext password in JSON and also sets a logged-in cookie. The 409 guard is check-then-insert (not atomic); the unique `email`/`whatsapp_number` makes a concurrent second insert fail with 500. If someone already owns email `admin@gccstartup.com` or phone `+000000000000` as a non-admin, seeding fails with 500 forever.
4. `staff`/`operations` roles are defined but unusable; no route distinguishes admin from super_admin, so super_admin has no extra power.
5. Middleware sets `x-user-*` headers on the response, not the request, so server components likely cannot read them (see 002 doc; unverified here).
6. Handler error shapes differ: pipeline returns 500 with raw `error.message`; leads/pricing/promo have no try/catch.
7. `[id]/route.ts` awaits params before auth (harmless).
8. Layout has a permanent red notification dot, inert global search and avatar button (`layout.tsx:72-100`).

## Failure modes and edge cases
- Missing `JWT_SECRET` in production: `getJwtSecret()` throws (loud) in middleware and `verifyToken`.
- Expired/invalid cookie on API -> 401 JSON; on page -> redirect `/` (not `/auth`, unlike client pages).
- Admin logged in as client elsewhere is fine; the same cookie serves both.

## Tests
`tests/auth-routes.test.ts:60-69` covers only seed-admin production 404 without token. `src/lib/auth-policy.test.ts` covers `seedAllowed`. Worth writing:
1. seed-admin prod with correct `x-seed-token` and empty users -> 200, sets cookie, returns credentials.
2. seed-admin with an existing admin -> 409 (both with and without token in dev).
3. `requireAdmin` returns null for `client`, `staff`, `operations`; payload for `admin` and `super_admin`.
4. Contract test enumerating `src/app/api/admin/**/route.ts` and asserting each (except seed-admin) calls `requireAdmin` (kyc/review currently fails; decide fix).
5. Middleware: `/admin` with client JWT -> redirect `/`; with admin JWT -> next.
6. kyc/review with super_admin token -> currently 403 (document or fix).

## Known bugs and gaps
- kyc/review mismatch and mock (see Inconsistencies 1).
- Dev-open seeding (`auth-policy.ts:10`).
- No revocation: demoted admin keeps access up to 7 days (role from JWT).
- No audit trail of admin actions anywhere.
- `/admin/settings` 404 (`layout.tsx:60`).

## Change guide
- New admin API: copy `requireAdmin()` + 401 from `pipeline/route.ts`; never rely on middleware.
- To support `staff`/`operations`: change `admin-auth.ts` AND `middleware.ts:91` together, plus decide per-route permissions (protected zones, human approval).
- To fix kyc/review: swap to `requireAdmin()`, implement real DB update (needs review columns on `documents`), real phone lookup, then update [kyc-review](kyc-review.md).
- Do not weaken `seedAllowed`; always keep token requirement in production and update `docs/ai/features/002-auth-route-hardening.md` if behavior changes.

## Related features
[session-and-route-guard](session-and-route-guard.md), [password-login-logout](password-login-logout.md), [whatsapp-otp-login](whatsapp-otp-login.md), [admin-kanban-pipeline](admin-kanban-pipeline.md), [admin-leads](admin-leads.md), [admin-clients](admin-clients.md), [admin-promo-banners](admin-promo-banners.md), [admin-pricing-configurator](admin-pricing-configurator.md), [kyc-review](kyc-review.md)
