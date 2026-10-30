# Feature: Password login, logout and session endpoint

**Slug**: password-login-logout   **Area**: [auth](../modules/auth.md)   **Status**: working (no rate limit; open redirect)   **Last verified against code**: 2026-10-30

## What it does
Users who set a password during onboarding (or the seeded admin) sign in on the `/auth` "Password" tab with an email or WhatsApp number plus password. The server verifies a scrypt hash and sets the `gcc_session` JWT cookie. `POST /api/auth/logout` clears the cookie; `GET /api/auth/session` returns the identity in the cookie for client code.

## Entry points
- UI: `/auth` password tab -> `src/app/auth/page.tsx` `handlePasswordLogin` (:97-123). Logout button: `src/components/portal/LogoutButton.tsx:14` calls `POST /api/auth/logout`.
- API: `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/session` (all public in middleware via `/api/`).
- Hook: `useSession()` in `src/lib/auth-hooks.ts:11` calls `/api/auth/session` (no caller found in `src`).

## Files
- `src/app/api/auth/login/route.ts:8-85`; `logout/route.ts:3-15`; `session/route.ts:4-24`.
- `src/lib/auth.ts:45-61` - `hashPassword` / `verifyPassword`; `:12-19` `generateToken`.
- `src/app/auth/page.tsx:14-28,97-123,241-288` - state, handler, form.
- `src/lib/auth-hooks.ts` - client `useSession`, `getCookie`, `isAuthenticated`, `isAdmin`.
- `src/components/portal/LogoutButton.tsx` - logout caller.
- Password writers: `src/app/api/onboarding/complete/route.ts:48-51,90`, `src/app/api/admin/seed-admin/route.ts:33-35`.

## Request / response contract
**POST /api/auth/login** body `{ identifier: string, password: string }`
- 400 `{error:'Please provide your email/phone and password.'}` when either is falsy (:12-17).
- 401 `{error:'Invalid credentials. If you have not set a password, you can sign in using WhatsApp OTP or complete registration.'}` when no user matches OR user has no `password_hash` (:35-43).
- 401 `{error:'Incorrect password. Please try again or use WhatsApp OTP.'}` (:47-50).
- 200 `{success:true, user:{id, fullName, email, whatsappNumber, role}}` + cookie `gcc_session` (httpOnly, secure in production, sameSite lax, path `/`, maxAge 604800).
- 500 `{error:'Authentication failed. Please try again.'}` for any throw, including malformed JSON (`request.json()` is inside the try, :10).
Note login errors use `{error}` without `success:false`, unlike the OTP routes.

**POST /api/auth/logout** no body -> 200 `{success:true}`; sets `gcc_session=''` with `maxAge:0`, same flags (:6-12). Always succeeds; no auth required.

**GET /api/auth/session** reads cookie `gcc_session`. No cookie or invalid -> 401 `{user:null}`. Valid -> 200 `{user:{id,email,role}}`. Reads only the JWT; never the DB.

## Step-by-step flow (login)
1. UI: `identifier`/`password` required non-empty; POST JSON (page.tsx:99-110).
2. Route: `cleanIdentifier = String(identifier).trim()`; `cleanPhone` = identifier with all whitespace removed (:19-20).
3. One query `users WHERE email = lower(identifier) OR whatsapp_number = cleanPhone OR whatsapp_number = identifier LIMIT 1` (:23-33). Order is undefined: if an email-form and a phone-form row both match, an arbitrary one wins (only possible if values collide).
4. No user or no `password_hash` -> 401 (message hints OTP).
5. `verifyPassword(password, hash)` (auth.ts:51-61): hash format `"<32-hex salt>:<128-hex key>"`; `scryptSync(password, salt, 64)` default cost (N=16384, r=8, p=1); `timingSafeEqual`; any exception -> `false`.
6. `generateToken({userId,email: user.email ?? '', role: user.role})` -> HS256, `sub=userId`, `iat`, `exp=7d`; payload keys `userId,email,role` (auth.ts:12-19).
7. `cookies().set('gcc_session', token, {...})` (:60-66). Returns user summary.
8. UI: `res.ok && data.success` -> `router.push(redirectTo || '/dashboard')`. `redirectTo = searchParams.get('redirect') || '/dashboard'` (page.tsx:12). Else shows `data.error`.

Logout flow: UI POST -> response clears cookie. Nothing server-side is revoked; a copied JWT stays valid until `exp`.

## Data
- Reads `users`: `id, email, whatsapp_number, full_name, password_hash, role`. Writes nothing.
- `password_hash` text, nullable. Never returned by the API.
- Not stored: failed attempts, last login, sessions, token revocation list.

## Business rules and constants
- scrypt keylen 64, salt 16 random bytes hex (auth.ts:46-48). JWT lifetime `'7d'`; cookie maxAge `60*60*24*7`.
- Password minimum length 6 enforced only in the onboarding UI and silently in `onboarding/complete` (>= 6 else ignored); login has no length rule.
- Redirect after login defaults to `/dashboard`. Middleware sets `?redirect=<pathname>` (path only, query string dropped) when bouncing from protected routes (`middleware.ts:57-59`).

## Auth, permissions, security
- Public. Role is trusted from the DB at login and then from the JWT for 7 days. No lockout, no rate limit, no CAPTCHA.
- User enumeration: message 1 (unknown user OR no password) vs message 2 (user exists with password) differ (:38 vs :49).
- Open redirect: `redirect` is any string; `router.push('https://evil.example')` / `//evil.example` would navigate off-site (page.tsx:114). Unverified in a browser, but no validation exists.
- Cookie `httpOnly` means `isAdmin()`/`isAuthenticated()` in `auth-hooks.ts:45-59` can never see it (`document.cookie`); they always return false. No callers found.
- Auth is an AGENTS.md protected zone.

## Failure modes and edge cases
- Phone login only matches whitespace-stripped form; a stored number `+971501234567` does not match `+971-50-123-4567` (OTP route strips `-`, login does not).
- Email stored lowercase by onboarding; seed admin `admin@gccstartup.com`; a user whose email was stored with capitals (other write paths) cannot log in by email.
- Users created by OTP have no password -> always 401 on this route.
- DB error -> 500 generic; logged `[api/auth/login] Error`.
- `password` non-string -> `scryptSync` throws inside `verifyPassword` -> false -> 401.

## Tests
Existing: `src/lib/auth.test.ts` (JWT round trip, tamper, password verify/salt/malformed hash). No route test for login/logout/session.
Worth writing:
1. login with correct email (any case) and password -> 200, `set-cookie` contains `gcc_session`, body has no `password_hash`.
2. login with wrong password -> 401 'Incorrect password...'.
3. login for user with `password_hash=null` -> 401 'Invalid credentials...'.
4. login with `{}` -> 400; with invalid JSON -> currently 500 (decide if 400).
5. session GET with valid cookie -> 200 `{user:{id,email,role}}`; with tampered cookie -> 401.
6. logout -> `set-cookie` has `Max-Age=0`.

## Known bugs and gaps
- No brute-force protection (login/route.ts has no counter).
- Differing 401 messages leak whether an account has a password (:38,:49).
- Invalid JSON gives 500 rather than 400 (:10 inside try).
- Phone normalization mismatch with OTP routes (login:19-20 vs send-otp:11-13).
- Logout does not revoke the token; `/api/auth/session` ignores DB so a demoted/deleted user keeps role until expiry.
- Redirect param unvalidated (auth/page.tsx:12,85,114).
- `auth-hooks.ts` `isAdmin`/`isAuthenticated` are dead and non-functional with an httpOnly cookie; the `payload.role` decode there is client-readable only if the cookie were not httpOnly.

## Change guide
- To add rate limiting or lockout, add columns on `users` or a table, update `schema.ts` and a migration (see [database-and-migrations](database-and-migrations.md)).
- To validate redirects, add a helper (allow only strings starting with `/` and not `//`) used in `auth/page.tsx` and `onboarding/page.tsx`.
- Keep cookie options identical across `login`, `verify-otp`, `onboarding/complete`, `logout`.
- If you change the hash format, `verifyPassword` must keep accepting `salt:key` for existing users.

## Related features
[whatsapp-otp-login](whatsapp-otp-login.md), [session-and-route-guard](session-and-route-guard.md), [onboarding-wizard](onboarding-wizard.md), [admin-bootstrap-and-guard](admin-bootstrap-and-guard.md)
