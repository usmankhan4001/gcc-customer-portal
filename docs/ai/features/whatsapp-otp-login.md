# Feature: WhatsApp OTP login

**Slug**: whatsapp-otp-login   **Area**: [auth](../modules/auth.md)   **Status**: working (no rate limit; see bugs)   **Last verified against code**: 2026-10-30

## What it does
A visitor enters a WhatsApp number on `/auth` (OTP tab, default). The server stores a SHA-256 hash of a 6-digit code, sends the code over WhatsApp, and the visitor types it back. A correct code signs the visitor in, creating a bare `client` user on first use, and sets the `gcc_session` cookie. Brand-new users (no `full_name`) are sent to `/onboarding`, returning users to the `redirect` target or `/dashboard`. Used by clients; admins also use it unless they have a password.

## Entry points
- UI: `/auth` -> `src/app/auth/page.tsx` (`AuthPageInner`, OTP tab, `step` 1 = phone, 2 = code).
- API: `POST /api/auth/send-otp`, `POST /api/auth/verify-otp` (both public: `/api/` is in middleware PUBLIC_PATHS).

## Files
- `src/app/auth/page.tsx:30-95` - `handleSendOtp`, `handleVerifyOtp`; `:180-239` OTP forms.
- `src/app/api/auth/send-otp/route.ts:15-103` - generate, store, dispatch.
- `src/app/api/auth/verify-otp/route.ts:13-132` - verify, consume, find/create user, set cookie.
- `src/lib/auth.ts:12-19,37-39` - `generateToken` (HS256, 7d), `hashToken` (sha256 hex).
- `src/lib/auth-policy.ts:6` - `devOtpAllowed()` = `NODE_ENV !== 'production'`.
- `src/lib/whatsapp.ts` - `sendWhatsAppOtp`, `sendTextMessage` (see [whatsapp-outbound](whatsapp-outbound.md)).
- `src/lib/db/schema.ts:346-353` (`otp_codes`), `:33-46` (`users`).
- `src/components/ui/PhoneInputWithCountry.tsx` - emits full number with dial code (default UAE +971).

## Request / response contract
**POST /api/auth/send-otp** body `{ phone: string }` (JSON).
- 400 `{success:false,error:'Invalid JSON request body'}` (route:21); 400 `'Valid phone number is required'` if not a string or `trim().length < 5` (:26-28).
- 500 `'Failed to store verification code. Please try again.'` if the `otp_codes` insert fails (:43-46).
- 502 `'Could not send the verification code. Please try again.'` if WhatsApp did not send AND `NODE_ENV==='production'` (:87-92).
- 200 `{success:true, message:'OTP sent via WhatsApp' | 'Verification code generated (Demo mode active)', devOtp: <code>|undefined}`; `devOtp` only when not production (:94-98).
- 500 `'Internal server error'` on any other throw.

**POST /api/auth/verify-otp** body `{ phone: string, otp: string }`.
- 400 `'Invalid JSON request body'`; 400 `'Phone and OTP are required'` (not both strings, :24); 400 `'Invalid or expired OTP'` (:75).
- 200 `{success:true, isNewUser: !user.full_name}`; sets cookie `gcc_session` (httpOnly, `secure` only in production, sameSite `lax`, path `/`, maxAge 604800) (:116-122).
- 500 `'Internal server error'`.

## Step-by-step flow
1. UI `handleSendOtp` (page.tsx:30): blocks if `phoneNumber.length < 7`; POSTs `{phone}`.
2. `send-otp` `normalizePhone` strips everything except digits and `+` (route:11-13). `randomInt(100000, 999999)` makes the code (:31); expiry = now + 10 min (:32).
3. Inserts `otp_codes {whatsapp_number, otp_hash: sha256(otp), expires_at}` (:36-40). Previous unconsumed codes for that number are NOT invalidated.
4. `isWhatsAppConfigured` = both `WHATSAPP_ACCESS_TOKEN` and `WHATSAPP_PHONE_NUMBER_ID` set and not `'xxx'` (:49-53). If configured: `sendWhatsAppOtp` (template); on `!success` falls back to `sendTextMessage` (:61-77). If not configured: `console.log` prints the OTP in plain text (:83).
5. Production and not sent -> 502. Otherwise 200 (dev returns `devOtp`; UI auto-fills it and shows "Demo Mode Active", page.tsx:48-51).
6. UI moves to step 2; input strips non-digits, `maxLength=6`; submit disabled unless 6 digits.
7. `verify-otp` normalizes phone, `trim()`s otp, hashes it (:28-30). Selects up to 5 rows for the number with `consumed=false AND expires_at > now`, newest first (:37-48). Only `candidates[0]` (newest) is compared (:56-57); older valid codes are ignored. It logs expected and received hashes (:50-53).
8. DB lookup error is swallowed (logged); then if `!isValid && devOtpAllowed() && cleanOtp==='123456'` -> valid (:70-72). Not valid -> 400.
9. If matched, `UPDATE otp_codes SET consumed=true WHERE id` (:79-85); failure only warns, so a failed update leaves the code reusable.
10. User: `SELECT users WHERE whatsapp_number = normalized` (:89); if none, `INSERT {whatsapp_number, role:'client'}` (:93-96). On any DB error a fallback user `id 00000000-0000-0000-0000-000000000001`, role client, is used (:101-106) - the cookie is still issued.
11. `generateToken({userId,email: user.email ?? '', role})` and `cookies().set('gcc_session', ...)`. Response `isNewUser`.
12. UI: `isNewUser` -> `router.push('/onboarding?redirect=<enc>')`, else `router.push(redirectTo)` (page.tsx:82-86). `redirectTo = ?redirect || '/dashboard'`.

## Data
- `otp_codes(id uuid pk, whatsapp_number text not null, otp_hash text not null, expires_at timestamp not null, consumed bool default false, created_at default now)`. No index, no FK, no unique. Rows are never deleted (no cleanup job found).
- `users`: reads by `whatsapp_number` (unique, not null); inserts `{whatsapp_number, role:'client'}`; all other columns default/null. `email` unique nullable.
- Plaintext OTP is never stored; it is only in the WhatsApp message, the dev response, and the unconfigured-WhatsApp server log.

## Business rules and constants
- OTP: 6 digits, range 100000-999998 (`randomInt` upper bound exclusive) (send-otp:31). TTL `OTP_TTL_MINUTES = 10` (:9).
- Session: JWT HS256, `7d` (auth.ts:16); cookie maxAge 604800 (verify-otp:121).
- Dev-only code `123456` (verify-otp:70). Dev-only: `devOtp` in response.
- Phone format stored = digits plus optional `+` only; `+971 50...` and `971 50...` are different keys.

## Auth, permissions, security
- Public endpoints. Fixed in 002: prod never returns OTP, `123456` blocked in prod (`tests/auth-routes.test.ts`). Token secret from `getJwtSecret()` (see [session-and-route-guard](session-and-route-guard.md)).
- Missing: attempt limit, per-number/IP send throttle, lockout. A 6-digit code can be brute-forced inside its 10-minute window.
- WhatsApp possession is not proven for new numbers beyond the code; first signup for a number creates the account bound to it.
- `role` in token always comes from DB (or `client` in fallback).

## Failure modes and edge cases
- DB down on verify: OTP check fails (swallowed) -> 400 in production; in dev `123456` then falls into the fallback user (shared fake id) and a session for a non-existent user.
- Two quick sends: two valid rows; only the newest verifies. The earlier code the user may have received fails with "Invalid or expired OTP".
- WhatsApp error -> prod 502 though the OTP row is already stored.
- Concurrent verifies of the same code both pass before `consumed` is set (no transaction, no atomic update) -> double sign-in possible.
- Number with different spacing/format than the one stored in `users` (e.g. onboarding saved `+971501234567`, OTP entered as `971501234567`) creates a second user.

## Tests
Existing: `tests/auth-routes.test.ts` (send-otp prod never returns OTP and errors; verify-otp prod rejects `123456`), `src/lib/auth-policy.test.ts`, `src/lib/auth.test.ts` (JWT round trip). Not covered: real DB, happy path.
Worth writing:
1. verify-otp: DB row for `+971501234567` with `sha256('654321')`, post `{phone:'+971 50 123 4567', otp:'654321'}` -> 200, `isNewUser:true`, `set-cookie gcc_session`, row `consumed=true`.
2. Same code twice -> second call 400.
3. Expired row (`expires_at` in the past) -> 400.
4. Two rows (older valid, newer valid), submit older code -> 400 (documents candidates[0] behavior).
5. send-otp with `phone:'abc'` -> 400; with 4 chars -> 400.
6. send-otp non-production, WhatsApp unconfigured -> 200 with `devOtp` matching a stored hash.

## Known bugs and gaps
- No brute-force/rate limiting (send-otp and verify-otp; no counters anywhere). High impact: account takeover of any phone-based user, including admins who have a phone.
- Plain OTP logged to server log when WhatsApp unconfigured (send-otp:83); hashes of expected and received codes are logged on every verify (verify-otp:50-53) - a logged hash of a 6-digit code is trivially reversible.
- Consume is non-atomic (verify-otp:79-85) and failure is ignored.
- Fallback fake user (verify-otp:99-107) issues a session on a DB error instead of failing.
- Only newest code checked (verify-otp:56) - stale code UX failure.
- `normalizePhone` is duplicated in both routes; `login` uses a different phone normalization (see [password-login-logout](password-login-logout.md)).
- Open redirect: `redirect` query is passed to `router.push` unvalidated (page.tsx:85).

## Change guide
- Add rate limiting in `send-otp` before the insert, and a failed-attempts counter column on `otp_codes` checked in `verify-otp`; make consume `UPDATE ... WHERE id=? AND consumed=false RETURNING` and require a row.
- Any change to cookie options must be mirrored in `login`, `onboarding/complete`, `logout` (four copies).
- Auth routes are an AGENTS.md protected zone: needs an approved spec.
- If you change the stored phone format, update `login` lookup and `onboarding/complete` too.

## Related features
[password-login-logout](password-login-logout.md), [session-and-route-guard](session-and-route-guard.md), [onboarding-wizard](onboarding-wizard.md), [whatsapp-outbound](whatsapp-outbound.md), [database-and-migrations](database-and-migrations.md)

## Update (specs 003 and 004, 2026-10-30)
Changed after this doc was written, see docs/specs/003-session-login-public-endpoints.md: `getServerSession()` now verifies the `gcc_session` cookie (no `x-user-*` header trust); `verify-otp` kills a code after 5 wrong attempts (`otp_codes.attempts`) and consumes it atomically; `send-otp` is limited to 3 per number per 15 min and 10 per IP per hour; `login` to 5 attempts per identifier+IP per 15 min (in-memory limiter, `src/lib/rate-limit.ts`); OTPs and hashes are no longer logged; post-login/onboarding `redirect` goes through `safeRedirectPath`; `push/unsubscribe` needs a session and is scoped to the user; `leads/capture` returns only `{ lead: { id } }`; `pdf/generate` is admin-only, escapes the email title and no longer 500s on an email failure. Tests: `tests/auth-hardening.test.ts`, `tests/email-escape.test.ts`. Statements above that contradict this are superseded.
