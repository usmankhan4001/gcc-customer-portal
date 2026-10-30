# Spec: Webhook hardening (F0.7b)

**Status**: shipped
**Requested by**: owner (security findings, docs/ai/MODULES.md open issues)
**Roadmap ref**: docs/versions/v2.0-foundation-android.md (F0.2, F0.7)
**Approval**: owner approved building this spec in chat on 2026-10-30 (Stripe and WhatsApp webhook handlers).

## Problem (all confirmed in code)
1. `/api/webhooks/stripe` (`route.ts:42-105`) updates the order and resets `companies.status` to `onboarding` unconditionally on every `checkout.session.completed`, then sends WhatsApp, notification and push. A retry or duplicate re-sends everything and can move a case backwards after staff advanced it. Other event types (expired, failed, refunded) are ignored.
2. `/api/webhooks/whatsapp` skips signature verification when `WHATSAPP_APP_SECRET` is unset (`route.ts:151`), so anyone can POST a forged message and advance a company's KYC stage.
3. The KYC reference regex `KYC[- ]?([A-Z0-9]{6,12})` (`route.ts:73`) matches ordinary words ("KYC verification" captures `verification`) and stores them as `official_kyc_reference`.
4. Sender lookup normalizes the incoming number but users are stored with a leading `+`; Meta's `from` is digits only, so matching likely fails (confirm with stored data).
5. No dedupe on WhatsApp `message.id`; Meta retries re-run the handler.

## Scope
- In: items 1 to 5; a shared dedupe table used by both webhooks.
- Out: persisting WhatsApp delivery/read status; refund workflow beyond marking the order.

## Acceptance criteria
- [x] AC1: A second delivery of the same Stripe `event.id` returns 200 and causes no further writes, WhatsApp, notification or push.
- [x] AC2: A `checkout.session.completed` for an already-paid order does not change `companies.status` and sends nothing.
- [x] AC3: Company status moves to `onboarding` only from a pre-payment status (exact status values taken from `schema.ts` while building); a case already past `onboarding` is never moved back.
- [x] AC4: `checkout.session.expired` and `checkout.session.async_payment_failed` (session events carry the order metadata; `payment_intent.payment_failed` does not) mark the order accordingly (using existing `payment_status` values) and notify nothing.
- [x] AC5: In production the WhatsApp POST returns 401 when `WHATSAPP_APP_SECRET` is unset or the signature is missing/invalid; outside production the existing dev behavior may stay but logs a warning.
- [x] AC6: A WhatsApp `message.id` already processed is ignored (200, no side effects).
- [x] AC7: The KYC pattern requires the literal `KYC`, an optional separator, and a reference of 6 to 12 characters that contains at least one digit; "KYC verification" and "kyc completed" do not match; "KYC-AB12CD34" and "KYC 123456" do.
- [x] AC8: Sender matching works for users stored with or without a leading `+`.

## Touches
- Schema: new table `processed_webhook_events (id text primary key, source text not null, received_at timestamptz not null default now())` (additive migration). Insert-first with conflict-do-nothing is the dedupe mechanism for both webhooks.
- Files: `src/app/api/webhooks/stripe/route.ts`, `src/app/api/webhooks/whatsapp/route.ts`, `src/lib/db/schema.ts`, shared helper for dedupe.
- Protected areas: both webhooks (approval needed).

## Test plan
Route tests with a mocked db and mocked Stripe `constructEvent` / HMAC for AC1 to AC8, plus a pure unit test table for the KYC regex (8 or more cases). Each fails on the current code. `npm run verify` passes.

## Rollout and risk
- **Production must have `WHATSAPP_APP_SECRET` set before deploy**, or inbound KYC advancement stops (fails closed). Confirm it matches the Meta app secret.
- Dedupe rows grow forever; add a retention note (delete rows older than 30 days) as a follow-up.
- Stripe retries are not reordered; the dedupe is per event id, the status guard covers out-of-order delivery.
