# Module: Auth (login, OTP, password, session, logout, roles)
**Last verified against code**: 2026-10-30

## Purpose
Issues and verifies the `gcc_session` JWT cookie via two login paths (WhatsApp OTP, email/phone + password), gates page routes in the edge middleware, and exposes the identity to server components and route handlers. Roles are a Postgres enum carried inside the JWT.

## Files
- `src/middleware.ts` - edge guard: verifies JWT for protected prefixes and `/admin`, sets `x-user-id/-email/-role` headers
- `src/lib/auth.ts` - `generateToken`/`verifyToken` (jose HS256, 7d), `hashToken` (sha256), `hashPassword`/`verifyPassword` (scrypt 64B, 16B hex salt, `salt:key`), `generateMagicToken` (unused by auth routes)
- `src/lib/jwt-secret.ts` - `getJwtSecret()`; throws in production if `JWT_SECRET` unset; dev fallback `gccstartup-dev-secret`
- `src/lib/admin-auth.ts` - `requireAdmin()` for `/api/admin/**` (reads cookie, verifies, role in admin/super_admin)
- `src/lib/session.ts` - `getServerSession()` reads middleware-set headers (valid only on middleware-protected routes)
- `src/lib/auth-hooks.ts` - client: `useSession()` (fetches `/api/auth/session`), `isAuthenticated()`, `isAdmin()` (decodes JWT WITHOUT verifying; UI hint only)
- `src/app/auth/page.tsx` - login UI (OTP tab + password tab); redirect param default `/dashboard`
- `src/app/api/auth/{send-otp,verify-otp,login,logout,session}/route.ts`
- `src/app/api/admin/seed-admin/route.ts` - first-admin bootstrap (adjacent; see Security)

## Routes and API
| Method Path | Auth required? | Notes |
|---|---|---|
| POST /api/auth/send-otp | no | body `{phone}` (len>=5) |
| POST /api/auth/verify-otp | no | body `{phone, otp}`; sets cookie; returns `{success,isNewUser}` |
| POST /api/auth/login | no | body `{identifier,password}`; email or WhatsApp number |
| POST /api/auth/logout | no | clears cookie (maxAge 0) |
| GET /api/auth/session | cookie | `{user:{id,email,role}}` or 401 `{user:null}` |
| POST /api/admin/seed-admin | no (!) | creates super_admin if none exists |
Pages: `/auth` (public). Middleware protected prefixes (`src/middleware.ts:34`): `/dashboard /services /vault /profile /support /checkout /notifications` -> redirect `/auth?redirect=<path>`; `/admin*` -> redirect `/` unless role admin/super_admin. `/onboarding` intentionally public. Public path list (`:5`) includes ALL `/api/`, `/vault/shared/`.

## Data
- `users` (`schema.ts:33`): id uuid, email unique nullable, whatsapp_number notNull unique, full_name, password_hash, role enum default `client`, country_of_residence, created/updated_at.
- `otp_codes` (`schema.ts:346`): id, whatsapp_number, otp_hash (sha256 hex), expires_at, consumed bool default false, created_at.
- Roles `user_role` enum: `client, staff, operations, admin, super_admin`. Only admin/super_admin have any special handling in code; staff/operations are not referenced in auth code.
- JWT payload: `{userId,email,role,sub=userId,iat,exp}`; role is NOT re-read from DB per request.

## External services and env vars
`JWT_SECRET` (required in prod), `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID` (treated as unconfigured when empty or literal `xxx`), `NODE_ENV`. WhatsApp sending in `src/lib/whatsapp.ts` (`sendWhatsAppOtp` template, fallback `sendTextMessage`).

## Key flows
1. OTP login: `/auth` -> POST send-otp -> random 6-digit `randomInt(100000,999999)`, store sha256 in `otp_codes` (TTL 10 min, `send-otp:8`), send via WhatsApp (template, then text fallback). -> POST verify-otp -> newest unconsumed unexpired row for the normalized number (`[^\d+]` stripped) compared by hash -> mark consumed -> find user by `whatsapp_number` or INSERT `{role:'client'}` -> set cookie -> `isNewUser = !full_name` -> UI routes to `/onboarding?redirect=` else redirect target.
2. Password login: POST login -> lookup by lowercased email OR phone (spaces stripped / raw) -> `verifyPassword` -> cookie, returns user + role. Users without `password_hash` get 401.
3. Page access: middleware verifies cookie -> sets identity headers -> server components call `getServerSession()`.
4. API admin access: handler calls `requireAdmin()` (middleware does not cover `/api/`).
5. Logout: POST logout only clears the cookie; the JWT stays valid until expiry (no server-side revocation list).

## Business rules and invariants
- Cookie `gcc_session`: httpOnly, sameSite lax, path `/`, secure only in production, maxAge 7d; JWT exp 7d (`auth.ts:16`).
- OTP: 6 digits, TTL 10 min (`send-otp:8`), single use, only the newest candidate row is checked (`verify-otp:55`).
- `getJwtSecret()` is called outside try/catch on purpose so a missing prod secret fails loudly (`auth.ts:24`, `middleware.ts:23`).
- Phone normalization differs: OTP routes + onboarding strip to `[+\d]`; login compares raw identifier too.

## Security notes
- PROTECTED ZONE (AGENTS.md section 5): `auth.ts`, `admin-auth.ts`, `session.ts`, `middleware.ts` need explicit human OK. (`jwt-secret.ts` is not listed but auth-critical; treat the same.)
- No rate limiting or attempt counter on send-otp, verify-otp, or login (6-digit code, 10 min window).
- `verify-otp:75-79`: hard-coded OTP `123456` is accepted whenever WhatsApp creds are unset OR `NODE_ENV !== 'production'`. In production with WhatsApp creds missing, `123456` logs in as any phone number (including an admin's).
- `send-otp:86-91`: the response includes `devOtp` (plain code) whenever the WhatsApp send fails or creds are missing, even in production; UI auto-fills it (`auth/page.tsx:48`).
- `verify-otp:106-114`: on any DB error a fake user id `00000000-0000-0000-0000-000000000001` with role client is signed into a valid token.
- `verify-otp` logs expected and received OTP hashes (`:52`).
- `POST /api/admin/seed-admin` is unauthenticated; while no admin exists anyone can call it and receives the generated super_admin password and a session cookie.
- `/api/onboarding/complete` can set a password and mint a session for an existing user matched by email/phone with no proof of ownership (see onboarding-and-leads.md).
- `verifyToken` returns `payload.email/role` unvalidated as strings; `jwtVerify` is called without an `algorithms` allow-list.

## Tests
`src/lib/auth.test.ts` (JWT round-trip/tamper, scrypt hash/verify, magic tokens), `src/lib/jwt-secret.test.ts` (prod throw, dev fallback). None for middleware, `requireAdmin`, or any route handler.

## Known gaps and suspicious things
- AGENTS.md says "Passwordless WhatsApp OTP + password login"; both exist. `generateMagicToken` has no caller in auth routes (unverified elsewhere).
- Middleware guards `/admin` with redirect `/`, while `/api/admin/**` relies solely on each handler calling `requireAdmin()`; a new admin route that forgets it is open.
- `staff`/`operations` roles exist in the enum but no code path grants them access.
- `isAdmin()` in `auth-hooks.ts` trusts an unverified JWT body (cosmetic only; never use for authorization).
- Users created via OTP have `email=''` in the JWT and no `full_name` until onboarding.

## Change guide
- Add a protected page prefix: edit `PROTECTED_PREFIXES` in `src/middleware.ts` (human approval needed).
- Add an admin API route: first lines must be `requireAdmin()` + 401 (AGENTS.md section 3.4).
- Change token lifetime: both `auth.ts` `setExpirationTime` and each route's cookie `maxAge` (4 places: login, verify-otp, onboarding/complete, seed-admin).
- Adding a role: edit `roleEnum` in `schema.ts`, run `npm run db:generate` (enum additions are an ALTER TYPE), update the two admin role checks (`middleware.ts:91`, `admin-auth.ts:17`).
- Pitfall: `middleware.ts` runs on the edge; `jwt-secret.ts` must stay free of Node imports.
- Pitfall: `getServerSession()` returns null outside middleware-protected paths; use `verifyToken` + cookie there.
