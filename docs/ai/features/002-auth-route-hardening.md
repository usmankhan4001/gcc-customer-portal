# Feature: Auth route hardening

**Slug**: 002-auth-route-hardening   **Spec**: docs/specs/002-auth-route-hardening.md   **Last verified against code**: 2026-10-30

## What it does
Closes four unauthenticated or dev-only paths in production: account takeover via onboarding, OTP leaked in the send-otp response, the fixed `123456` OTP, and open admin seeding.

## Where it lives
- lib: `src/lib/auth-policy.ts` (`devOtpAllowed`, `seedAllowed`)
- Routes: `src/app/api/onboarding/complete/route.ts`, `src/app/api/auth/send-otp/route.ts`, `src/app/api/auth/verify-otp/route.ts`, `src/app/api/admin/seed-admin/route.ts`
- Env: `NODE_ENV`, `ADMIN_SEED_TOKEN` (optional)

## Behavior and rules
- onboarding/complete: an existing user (matched by email or phone) can only be updated through their own valid `gcc_session`. Otherwise the route returns 409 "sign in instead". New emails/phones still create a user and set a session.
- send-otp: in production the OTP is never in the response; a failed WhatsApp send returns 502. Outside production the `devOtp` field and demo mode still work.
- verify-otp: `123456` is accepted only outside production.
- seed-admin: in production, 404 unless header `x-seed-token` matches `ADMIN_SEED_TOKEN` (constant-time). Still refuses with 409 once any admin exists.
- Never reintroduce a lookup-then-update by email/phone for unauthenticated callers.

## Tests
`src/lib/auth-policy.test.ts`; `tests/auth-routes.test.ts` (mocked db/cookies; takeover test fails on the old code with 200). Not covered: the positive onboarding path (new user, session user) and the real database.

## Protected-zone touchpoints
Auth routes (approved in the spec).

## Known gaps / extension points
No OTP attempt limit or rate limit; send-otp still logs the OTP to the server log when WhatsApp is unconfigured; WhatsApp webhook signature check is skipped when `WHATSAPP_APP_SECRET` is unset; first signup can claim someone else's unverified phone number; Stripe webhook not idempotent; `x-user-*` middleware headers likely not forwarded to server components (see docs/ai/modules/auth.md and client-portal.md).
