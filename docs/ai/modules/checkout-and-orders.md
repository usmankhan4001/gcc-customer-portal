# Module: Checkout and Orders
**Last verified against code**: 2026-10-30

## Purpose
Lets a logged-in client pick a jurisdiction and package, creates a `companies` + `orders` row, sends them to Stripe Checkout, and marks the order paid when Stripe calls the webhook. Prices come from the `jurisdiction_pricing` table (cents), configurable by admins.

## Files
- src/app/(authenticated)/services/page.tsx - jurisdiction catalog (reads static `JURISDICTIONS`)
- src/app/(authenticated)/services/[id]/page.tsx - jurisdiction detail, "Start Incorporation" link to /checkout/[id]
- src/app/checkout/[id]/page.tsx - 4-step client wizard (name, tier, WhatsApp OTP, summary); `[id]` is the jurisdiction id; POSTs /api/checkout
- src/app/api/checkout/route.ts - creates company+order, then Stripe session; returns `{url}`
- src/app/api/webhooks/stripe/route.ts - verifies signature, handles `checkout.session.completed`
- src/lib/stripe.ts - `createCheckoutSession`, `constructWebhookEvent` (unused by the webhook route), `getPaymentStatus` (unused)
- src/lib/jurisdictions.ts - static display data incl. "starting from" price strings
- src/app/api/admin/pricing/route.ts - admin GET/PATCH of `jurisdiction_pricing`
- scripts/seed.ts - seeds default prices (upsert by jurisdiction+tier)
- Note: CODEMAP lists /services at src/app/services, but the real files are under src/app/(authenticated)/services.

## Routes and API
- GET /services, /services/[id], /checkout/[id] - session required (middleware PROTECTED_PREFIXES, src/middleware.ts:34)
- POST /api/checkout - session cookie `gcc_session` verified in handler (401 if missing)
- POST /api/webhooks/stripe - no session; auth = `Stripe-Signature` header (400 if missing/invalid). `/api/` is a middleware-public path.
- GET/PATCH /api/admin/pricing - `requireAdmin()` (admin or super_admin)

## Data
- `jurisdiction_pricing`: jurisdiction, tier, price_usd (integer cents), updated_by, updated_at. No unique constraint on (jurisdiction, tier) (schema.ts:198-209).
- `orders`: user_id, company_id, order_type, amount_total (cents), currency, stripe_session_id, stripe_payment_intent_id, payment_status (unpaid|processing|paid|failed|refunded), paid_at. `line_items` is never written.
- `companies`: inserted by checkout with status `lead`, tier mapped; webhook sets status `onboarding`.
- `users`: read for email/whatsapp_number; `notifications`: inserted by webhook.

## External services and env vars
- Stripe: STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, apiVersion '2026-08-26.dahlia' (hard-coded in both stripe.ts:8 and the webhook route; the route builds its own Stripe client).
- NEXT_PUBLIC_APP_URL (fallback for redirect origin), WhatsApp (`sendWhatsAppMessage`, template `order_confirmed`), web push (`sendPushToUser`), PostHog server events `checkout_started` / `checkout_completed`.

## Key flows
1. Client opens /services/uae -> "Start Incorporation" -> /checkout/uae (login required).
2. Wizard collects name options (only option 1 is sent), tier `basic`|`standard`, and verifies a WhatsApp OTP via /api/auth/send-otp + verify-otp (UI-only gate; /api/checkout does not check it).
3. "Pay with Stripe" -> POST /api/checkout `{tier, companyName, jurisdiction}` -> TIER_MAP basic->tier_1_self, standard->tier_2_nominee (route.ts:176). Other values -> 400.
4. Server looks up price by (jurisdiction, tier); none -> 400 "An admin needs to set it". Inserts `companies` (status lead) and `orders` (unpaid, usd, amount = price_usd), creates Stripe session (mode payment, card only, metadata `order_id`,`company_id`), stores `stripe_session_id`, returns session URL.
5. Success redirect `${origin}/dashboard?success=true`; cancel redirect `${origin}/checkout/${jurisdiction}`. `origin` is the request `Origin` header first (route.ts:239).
6. Stripe calls the webhook -> order set `paid` (+ payment_intent id, paid_at), company set `onboarding`, WhatsApp message, `notifications` row (category payment), push, PostHog.

## Business rules and invariants
- Amounts are integer cents everywhere; Stripe `unit_amount` = `price_usd` unchanged.
- Server is the source of truth for price (client never sends an amount). Wizard UI shows hard-coded $1,500 / $3,500 (page.tsx:244,270,403,407) which can differ from DB prices (seed: singapore 200000/400000, bvi 250000/450000 - scripts/seed.ts:24-29).
- tier_3_shelf exists in the enum but is not purchasable (TIER_MAP).
- Currency fixed `usd`. Only card payments.
- Valid `jurisdiction` is NOT validated against the enum; an unknown id simply fails the pricing lookup (400) before any insert.

## Security notes
- PROTECTED ZONE (AGENTS.md 5): src/lib/stripe.ts, src/app/api/checkout/**, Stripe webhook - human approval required; webhook "must stay idempotent" (it currently is not, see below).
- Webhook signature is verified on the raw body (route.ts:294-303) - good. `STRIPE_WEBHOOK_SECRET!` non-null assertion; an unset secret makes every call 400.
- Checkout does not check that the webhook amount/currency matches the order, and does not check `session.payment_status === 'paid'`.
- Redirect URLs are built from the client-controlled `Origin` header (open-redirect-ish after payment; low risk since Stripe only redirects there).

## Webhook idempotency (exact behaviour)
- NOT idempotent. There is no stored `event.id`, no unique constraint on `orders.stripe_session_id`, and no check of the current `payment_status` before updating.
- A duplicate `checkout.session.completed` (Stripe retries, or manual resend) re-runs everything: order `UPDATE` again (paid_at overwritten with the new time), company `UPDATE status='onboarding'` again, a second WhatsApp message, a second `notifications` row, a second push, a second PostHog `checkout_completed`.
- Worse: the company status reset means a retry arriving after staff advanced the case (e.g. `filing_in_progress`) pushes the company back to `onboarding`.
- Handler returns 500 on any thrown error (e.g. WhatsApp send failing), which makes Stripe retry and so triggers the duplicate side effects above. Whether `sendWhatsAppMessage` throws is unverified.
- Only `checkout.session.completed` is handled. Other events return 200 `{received:true}` and are ignored: no `async_payment_*`, `checkout.session.expired`, `payment_intent.payment_failed`, `charge.refunded`. So `failed`, `refunded`, `processing` statuses are never set by code.
- Missing metadata -> logs and returns 200 (event silently dropped).
- `notifications.whatsapp_status` is hard-coded `'sent'` regardless of actual send result (route.ts:357).

## Tests
none (only src/lib/auth.test.ts, jwt-secret.test.ts, persona.test.ts exist). scripts/test-routes.js only checks route health, not checkout/webhook behaviour.

## Known gaps and suspicious things
- Every POST /api/checkout inserts a NEW `companies` row and NEW `orders` row (no dedupe); abandoned checkouts leave `lead` companies and `unpaid` orders. Dashboard "Pay Now" for unpaid orders links to `/checkout/${order.id}` (dashboard/page.tsx:401) but that route expects a jurisdiction id, so it is broken (shows an unknown-jurisdiction checkout and fails pricing lookup with 400).
- Checkout never uses the other 2 name options or the OTP-verified phone.
- `/api/checkout` returns `error.message` to the client on 500 (info leak).
- `constructWebhookEvent` / `getPaymentStatus` in stripe.ts are dead code; webhook duplicates the Stripe client.
- Admin pricing PATCH accepts non-integer prices (only `typeof number` and >= 0); Stripe needs an integer.
- `/admin/pricing` UI exists (CODEMAP) - not read for this doc.

## Change guide
- Change prices: edit rows via /admin/pricing or scripts/seed.ts; never trust UI strings. Update wizard text in checkout/[id]/page.tsx and jurisdictions.ts together.
- Add a tier: schema enum (schema.ts:59,203) + TIER_MAP in route.ts + wizard radio + seed rows + `npm run db:generate`.
- Make webhook idempotent (needs human approval): add `stripe_event_id`/unique `stripe_session_id`, or guard the UPDATE with `WHERE payment_status <> 'paid'` and skip side effects when 0 rows return; do not downgrade company status.
- Pitfall: metadata keys must stay snake_case (`order_id`, `company_id`) in both stripe.ts:46 and the webhook.
