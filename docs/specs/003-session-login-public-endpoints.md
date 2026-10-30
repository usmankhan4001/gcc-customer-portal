# Spec: Session, login and public endpoint hardening (F0.7a)

**Status**: shipped
**Requested by**: owner (security findings, docs/ai/MODULES.md open issues)
**Roadmap ref**: docs/versions/v2.0-foundation-android.md (F0.7)
**Approval**: owner approved building this spec in chat on 2026-10-30 (session, auth routes, public endpoints).

## Problem
1. `getServerSession()` trusts `x-user-*` request headers. Portal pages are safe only because Next copies middleware response headers onto the request; `/api/` is a public middleware path, so `/api/companies/good-standing` accepts a client-supplied `x-user-id` (verified in code: `good-standing/route.tsx:92`, `middleware.ts` public paths).
2. OTP login (`verify-otp`) and password login (`login`) have no attempt limit; a 6-digit code can be brute-forced within its 10-minute window. `send-otp` has no rate limit (WhatsApp cost and abuse).
3. `verify-otp` logs expected and received OTP hashes; `send-otp` logs the plaintext OTP when WhatsApp is unconfigured, in production too. OTP consumption is not atomic (two parallel verifies can both succeed).
4. The `redirect` query parameter after login is not validated (open redirect). Exact location to be confirmed while building.
5. `POST /api/push/unsubscribe` has no auth and deletes by endpoint only.
6. `POST /api/leads/capture` returns the full lead row (including a stored email) to anyone who sends a matching phone number.
7. `POST /api/pdf/generate` has no auth; anyone with a lead UUID can generate PDFs, overwrite `leads.pdf_r2_key` and trigger emails; `title` is unescaped in email HTML. Nothing in the UI calls it today.

## Scope
- In: items 1 to 7 above.
- Out: phone-number squatting at first signup (solved properly by OTP-verified signup in F1.1); lead-capture wiring and validation schema (F1.1); distributed rate limiting (see shortcut below).

## Acceptance criteria
- [x] AC1: `getServerSession()` derives identity from the verified `gcc_session` cookie (not from `x-user-*` headers); a request with a forged `x-user-id` and no/other cookie gets no session. All current callers keep working.
- [x] AC2: `verify-otp` invalidates a code after 5 wrong attempts for that number (new `attempts` column on `otp_codes`, additive migration) and returns 429 afterwards until a new code is requested.
- [x] AC3: `send-otp` allows at most 3 sends per number per 15 minutes and 10 per IP per hour (429 otherwise).
- [x] AC4: `login` allows at most 5 attempts per identifier+IP per 15 minutes (429), without revealing whether the account exists. (Counts all attempts, not only failures, for simplicity.)
- [x] AC5: OTP consumption is atomic: of two concurrent correct verifies, exactly one succeeds.
- [x] AC6: No OTP or OTP hash appears in logs in any environment.
- [x] AC7: Post-login redirect accepts only same-origin relative paths starting with a single `/` (no `//`, no scheme); anything else falls back to `/dashboard`.
- [x] AC8: `push/unsubscribe` requires a session and deletes only that user's subscription.
- [x] AC9: `leads/capture` response contains only `{ id }` plus fields the caller supplied; never previously stored data of another visitor.
- [x] AC10: `pdf/generate` requires an admin session until a real user flow exists; email HTML escapes `title` and `subtitle`; a failed email no longer turns a successful PDF write into a 500.

## Touches
- Schema: `otp_codes.attempts integer not null default 0` (additive; `npm run db:generate`).
- Routes: auth/send-otp, auth/verify-otp, auth/login, push/unsubscribe, leads/capture, pdf/generate, companies/good-standing (consumer), auth page (redirect).
- Libs: `src/lib/session.ts`, new `src/lib/rate-limit.ts`, `src/lib/auth-policy.ts`.
- Protected areas: session, auth routes (approval needed).

## Shortcut (stated limit)
Rate limiting for send-otp and login uses an in-memory limiter. It resets on restart and is per-instance; fine for the current single container, replace with a DB or Redis counter before running more than one instance.

## Test plan
Route tests (mocked db) for AC2 to AC10 as in `tests/auth-routes.test.ts`; session test for AC1 (forged header ignored); concurrency test for AC5 using a mocked conditional update that returns 0 rows on the second call. Each test must fail on the current code. `npm run verify` passes.

## Rollout and risk
- `getServerSession()` becoming async-cookie based must not break server components (it already is async). Check all 8 callers listed in `docs/ai/features/session-and-route-guard.md`.
- Rate limits can lock out legitimate users behind shared NAT; limits are deliberately generous. Document the reset behavior.
- Admin-only `pdf/generate` is a behavior change with no current UI impact.
