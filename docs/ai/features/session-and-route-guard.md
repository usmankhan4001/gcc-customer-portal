# Feature: Session and route guard

**Slug**: session-and-route-guard   **Area**: [auth](../modules/auth.md)   **Status**: partial (works on self-hosted Next, relies on an undocumented header path; forgeable on /api)   **Last verified against code**: 2026-10-30

## What it does
Every signed-in user carries a `gcc_session` cookie holding an HS256 JWT. `src/middleware.ts` redirects unauthenticated visitors away from the client portal and non-admins away from `/admin`, and tries to hand the verified identity to server components via `x-user-*` headers. `/api/**` is NOT guarded by middleware, so each API route re-checks the cookie itself (or uses `requireAdmin()`).

## Entry points
`src/middleware.ts` runs on every request matching `config.matcher`. Server components call `getServerSession()`; admin API routes call `requireAdmin()`; client code calls `useSession()` (`GET /api/auth/session`).

## Files
- `src/middleware.ts:5-109` - public paths, protected prefixes, admin gate, header set, matcher.
- `src/lib/jwt-secret.ts:1-9` - `getJwtSecret()` (edge-safe, lazy).
- `src/lib/auth.ts:6-35` - `TokenPayload`, `generateToken`, `verifyToken`.
- `src/lib/session.ts:15-25` - `getServerSession()` reads `headers()`.
- `src/lib/admin-auth.ts:10-20` - `requireAdmin()` reads cookie, verifies, role check.
- `src/lib/auth-hooks.ts:11-59` - client `useSession`, dead `isAuthenticated`/`isAdmin`.
- `src/lib/auth-policy.ts` - dev/seed policy (see [admin-bootstrap-and-guard](admin-bootstrap-and-guard.md)).
- `src/lib/db/schema.ts:21-27` - `roleEnum` `user_role`: `client, staff, operations, admin, super_admin`.

## Request / response contract
No endpoint of its own. Middleware behavior:
- Public (return `NextResponse.next()` untouched): path startsWith any of `/api/ /_next/ /icons/ /favicon.ico /icon.png /manifest.json /sw.js /robots.txt /sitemap.xml /vault/shared/` (middleware:5-20).
- Protected prefixes (startsWith): `/dashboard /services /vault /profile /support /checkout /notifications` (:34-43). No cookie -> 307 redirect to `/auth?redirect=<pathname>`; invalid/expired token -> same redirect and `gcc_session` cookie deleted (:56-69). Valid -> `NextResponse.next()` with response headers `x-user-id` (`payload.sub`), `x-user-email`, `x-user-role` (:71-75).
- `/admin` prefix: no cookie -> redirect `/`; bad token -> redirect `/` + cookie deleted; role not `admin`/`super_admin` -> redirect `/`; else `next()` + the same three headers (:78-99). Note `staff` and `operations` roles are NOT admin.
- Everything else (`/`, `/auth`, `/onboarding`, `/welcome`, tools, `/pricing` etc.) passes through with no check (:102).
- Matcher: `'/((?!_next/static|_next/image|favicon.ico).*)'` (:106-108).
- JWT claims: `userId, email, role` plus `sub=userId`, `iat`, `exp` (7d). `verifyJwt` reads `sub`; `verifyToken` returns `{userId: sub, email, role}`.

## Step-by-step flow
1. Request arrives; matcher includes it (all but static assets).
2. `isPublicPath` short-circuit (:49).
3. Read cookie `gcc_session` (:53). For protected/admin prefix, `verifyJwt` calls `getJwtSecret()` OUTSIDE try, so a missing production `JWT_SECRET` throws -> 500, not a redirect (:23, :62). Signature/exp failure -> `null`.
4. Redirect or set headers per above.
5. Server component `getServerSession()` (`headers()`, session.ts:16) returns `{userId,email,role}` iff `x-user-id` is present; `role` defaults `'client'`.
6. API routes: `requireAdmin()` or inline `cookies().get('gcc_session')` + `verifyToken()`.

## Data
Reads cookie only. DB is never consulted for session validity or role; `role` is frozen in the JWT for up to 7 days. No session table, no revocation.

## Business rules and constants
- Algorithm HS256, lifetime `7d`; dev fallback secret `gccstartup-dev-secret` used only when `NODE_ENV !== 'production'` (jwt-secret.ts:2,7-8). Production with empty `JWT_SECRET` throws `JWT_SECRET must be set in production`.
- Admin = `role in {admin, super_admin}` in both middleware (:91) and `requireAdmin` (admin-auth.ts:17).

## Auth, permissions, security
AGENTS.md protected zone (middleware, auth libs). The core question: do `x-user-*` headers reach server components?

**Conclusion: they DO reach them on the self-hosted server this repo deploys (Docker, `output: 'standalone'`, Next 15.5.24), but by an incidental code path, not the documented API.**
Evidence (node_modules/next 15.5.24):
- Documented mechanism: `NextResponse.next({ request: { headers } })`. `handleMiddlewareField` (`dist/server/web/spec-extension/response.js:24-41`) writes `x-middleware-request-<k>` plus `x-middleware-override-headers`; `resolve-routes.js:378-404` then applies those to `req.headers`. This repo never passes `request.headers` (middleware.ts:71,95 call `NextResponse.next()` with no args), so that branch is skipped.
- Incidental mechanism: after that, `resolve-routes.js:409-429` loops ALL remaining middleware response headers and, if the value is truthy, does `resHeaders[key] = value; req.headers[key] = value;`. So `response.headers.set('x-user-id', ...)` is copied onto the incoming request headers that `headers()` later reads. `dist/server/lib/router-server.js:288,616` is the caller used by `next start` and the standalone server.
- Side effect: the same headers are also copied to the HTTP response, so the browser sees `x-user-id/x-user-email/x-user-role` on `/dashboard` etc.
- Not proven at runtime in this session; nothing in `node_modules` guarantees this on Vercel/other adapters (edge adapter `adapter.js:366-375` only handles override headers). The old note in `client-portal.md` ("may read client-supplied headers") is right for non-middleware paths, see below.

**Exploitable gap**: `getServerSession()` is also called from `src/app/api/companies/good-standing/route.tsx:92`, and `/api/` is a PUBLIC path, so middleware never sets or overwrites the headers there. A client can send `x-user-id: <victim uuid>` and the route trusts it (company ownership check at :102 then passes). Same for any future API route using `getServerSession()`. For protected pages middleware overwrites a forged header (set value is non-empty since `sub` always exists), so pages are not forgeable that way.

Proof tests (run against `next build && next start`):
1. `curl -i http://localhost:3005/dashboard -H "Cookie: gcc_session=<valid>" -H "x-user-id: attacker"` and render a temp page that prints `getServerSession()`: expect `userId` = cookie's `sub`, not `attacker`; response also contains `x-user-id`.
2. `curl http://localhost:3005/api/companies/good-standing -H "x-user-id: <existing user uuid>"` (no cookie): if it returns a PDF or 404 "No company found" instead of 401, the forgery works.
3. Temporarily change middleware to `NextResponse.next({ request: { headers: newHeaders } })` and rerun test 1 to confirm both paths.
Recommended fix: in middleware use `NextResponse.next({request:{headers}})`, and make `getServerSession()` verify the cookie itself (or call `verifyToken(cookies())`) so it works for `/api` and is not header-trusting.

Other gaps: no CSRF tokens (relies on `sameSite=lax`); `/admin` pages rely only on middleware (admin layout does no check); protected-prefix matching is plain `startsWith` (`/servicesX` matches too, `/vault/shared/` is the only carve-out); `/api/admin/kyc/review` uses its own Bearer check, not `requireAdmin()` (see 001 doc).

## Failure modes and edge cases
- Production missing `JWT_SECRET`: every protected/admin request and every `verifyToken` throws -> 500 (fail closed).
- Cookie present but expired on a protected route: redirect to `/auth?redirect=...` and cookie deleted.
- Redirect keeps only `pathname`; query and hash are lost.
- Logged-in user visiting `/auth` is not redirected.
- Role change in DB takes effect only after the user's token expires or they re-login.
- `isAdmin()`/`isAuthenticated()` (auth-hooks.ts:45-59) always false: cookie is httpOnly.

## Dependents (what breaks if this changes)
- Pages via middleware prefix: `/dashboard`, `/services`, `/services/[id]`, `/vault`, `/profile`, `/support`, `/notifications` (under `src/app/(authenticated)`), `/checkout/[id]`; admin pages `/admin`, `/admin/clients`, `/admin/leads`, `/admin/pricing`, `/admin/renewals`.
- `getServerSession()` users: `(authenticated)/dashboard/page.tsx:81`, `vault/page.tsx:23`, `notifications/page.tsx:9`, `profile/page.tsx:17`, `components/portal/AppShell.tsx:15`, `api/companies/good-standing/route.tsx:92`.
- `requireAdmin()` users: `api/admin/leads`, `api/admin/pipeline` (3 handlers), `api/admin/pricing` (2), `api/admin/promo-banners` and `[id]`.
- Direct `gcc_session` cookie readers in API: `api/checkout`, `api/companies/revenue-estimate`, `api/notifications/read-all`, `api/notifications/[id]/read`, `api/push/subscribe`, `api/vault/presign`, `api/vault/share`, `api/vault/[id]/download`, `api/auth/session`, `api/onboarding/complete`.
- Cookie writers: `api/auth/login`, `verify-otp`, `onboarding/complete`, `logout`, `admin/seed-admin`.

## Tests
Existing: `src/lib/jwt-secret.test.ts`, `src/lib/auth.test.ts`, `tests/auth-routes.test.ts`. None for middleware or `getServerSession`/`requireAdmin`.
Worth writing:
1. middleware: no cookie on `/dashboard` -> 307 to `/auth?redirect=%2Fdashboard`.
2. middleware: token with role `client` on `/admin` -> redirect `/`; role `admin` -> next with `x-user-role: admin`.
3. middleware: tampered token -> redirect and `Set-Cookie gcc_session=; Max-Age=0`.
4. middleware: `/vault/shared/abc` with no cookie -> passes.
5. `requireAdmin()` with role `staff` -> `null`.
6. Integration (header forgery, see Proof tests) so the gap is covered.

## Known bugs and gaps
- Forgeable `x-user-id` on `/api/companies/good-standing` (route.tsx:92 + middleware.ts:5-7,49).
- Header forwarding relies on undocumented `resolve-routes.js:409-429` behavior; breaks if deployed on another adapter or Next changes it.
- No revocation, no role refresh, no CSRF token.
- `staff`/`operations` roles exist in the enum but nothing authorizes them anywhere.

## Change guide
- Do not read `process.env.JWT_SECRET` directly; always `getJwtSecret()`.
- New protected page: add prefix to `PROTECTED_PREFIXES` and call `getServerSession()` only after fixing the header trust issue, or verify the cookie directly.
- New admin API: call `requireAdmin()` first (middleware does not cover `/api`).
- Update `docs/ai/modules/auth.md` and `client-portal.md` when resolving the header question.

## Related features
[whatsapp-otp-login](whatsapp-otp-login.md), [password-login-logout](password-login-logout.md), [admin-bootstrap-and-guard](admin-bootstrap-and-guard.md), [client-dashboard](client-dashboard.md), [good-standing-snapshot](good-standing-snapshot.md), [vault-upload](vault-upload.md), [service-catalog-and-checkout](service-catalog-and-checkout.md)

## Update (specs 003 and 004, 2026-10-30)
Changed after this doc was written, see docs/specs/003-session-login-public-endpoints.md: `getServerSession()` now verifies the `gcc_session` cookie (no `x-user-*` header trust); `verify-otp` kills a code after 5 wrong attempts (`otp_codes.attempts`) and consumes it atomically; `send-otp` is limited to 3 per number per 15 min and 10 per IP per hour; `login` to 5 attempts per identifier+IP per 15 min (in-memory limiter, `src/lib/rate-limit.ts`); OTPs and hashes are no longer logged; post-login/onboarding `redirect` goes through `safeRedirectPath`; `push/unsubscribe` needs a session and is scoped to the user; `leads/capture` returns only `{ lead: { id } }`; `pdf/generate` is admin-only, escapes the email title and no longer 500s on an email failure. Tests: `tests/auth-hardening.test.ts`, `tests/email-escape.test.ts`. Statements above that contradict this are superseded.
