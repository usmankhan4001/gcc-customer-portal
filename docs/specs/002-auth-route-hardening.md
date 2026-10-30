# Spec: Auth route hardening (F0.2a)

**Status**: shipped
**Requested by**: owner (security findings from module docs, 2026-10-30)
**Roadmap ref**: docs/versions/v2.0-foundation-android.md (F0.2)
**Approval**: owner approved editing these auth routes in chat on 2026-10-30: `api/onboarding/complete`, `api/auth/send-otp`, `api/auth/verify-otp`, `api/admin/seed-admin`.

## Problem
1. `POST /api/onboarding/complete` is unauthenticated and, with no session, finds an existing user by email/phone, overwrites their password and mints a session cookie with that user's role (account takeover, including admins).
2. `POST /api/auth/send-otp` returns the OTP in the response (`devOtp`) whenever WhatsApp delivery fails, even in production.
3. `POST /api/auth/verify-otp` accepts the fixed code `123456` whenever WhatsApp credentials are unset or `xxx`, even in production.
4. `POST /api/admin/seed-admin` is unauthenticated; on a DB with no admin the first caller becomes super_admin and receives the password.

## Scope
- In: the four routes above; a small shared policy helper.
- Out (follow-ups): OTP rate limiting / attempt limits; WhatsApp webhook signature skip when `WHATSAPP_APP_SECRET` is unset; Stripe webhook idempotency; `x-user-*` header forwarding in middleware; phone-number squatting on first signup.

## Acceptance criteria
- [x] AC1: onboarding/complete without a session, when a user with the same email or phone exists, returns 409 and does not update the user or set a cookie.
- [x] AC2: onboarding/complete with a valid session still updates only that session's user; with no match it still creates a new user.
- [x] AC3: In production, send-otp never includes the OTP in its response; if WhatsApp delivery fails it returns an error (502) instead of success.
- [x] AC4: In production, verify-otp rejects `123456` (it is accepted only outside production).
- [x] AC5: seed-admin in production returns 404 unless the request header `x-seed-token` equals env `ADMIN_SEED_TOKEN` (constant-time compare); outside production it behaves as before.

## Touches
- Schema changes: no
- Protected areas: auth routes (approved above)
- New env var: `ADMIN_SEED_TOKEN` (optional; document in `.env.example`)

## Test plan
- Unit: `src/lib/auth-policy.test.ts`; route tests with mocked db/cookies for AC1, AC3, AC4.
- `npm run verify` passes.

## Rollout & risk
- **If production WhatsApp credentials are unset or `xxx`, OTP login will stop working** (no dev bypass, and send-otp returns 502). Password login is unaffected. Confirm credentials are real before deploying.
- Users who retried onboarding with an existing email/phone now get a 409 and must sign in first; check the onboarding UI shows that error.
- Rotate the admin password if there is any doubt the seed endpoint was ever called by someone else.
