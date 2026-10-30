# Feature: Stripe webhook

**Slug**: stripe-webhook   **Area**: [checkout-and-orders](../modules/checkout-and-orders.md)   **Status**: partial   **Last verified against code**: 2026-10-30

## What it does
Stripe calls `POST /api/webhooks/stripe` after payment. The handler verifies the signature and, for `checkout.session.completed` only, marks the order paid, moves the company to `onboarding`, sends a WhatsApp template, writes an in-app notification, sends web push and fires a PostHog event. All other event types are acknowledged and ignored. It is NOT idempotent.

## Entry points
`POST /api/webhooks/stripe` (`src/app/api/webhooks/stripe/route.ts:24`). `/api/` is middleware-public; the only auth is the `Stripe-Signature` header. Configure the endpoint in the Stripe dashboard with `STRIPE_WEBHOOK_SECRET`.

## Files
- `src/app/api/webhooks/stripe/route.ts` - whole handler; builds its own Stripe client (10-18), apiVersion `2026-08-26.dahlia`.
- `src/lib/stripe.ts:55-69` - `constructWebhookEvent` (dead code, not used).
- `src/lib/whatsapp.ts:116-` - `sendWhatsAppMessage` (catches errors, returns `{success:false}`; not seen to throw, tail unread).
- `src/lib/push.ts:70` - `sendPushToUser` (returns silently if VAPID env missing).
- `src/lib/posthog-server.ts` - `captureServerEvent`.
- Schema: orders (`schema.ts:175`), companies (`:52`), users, notifications.

## Request / response contract
- Input: raw body (read as text, line 26) + header `Stripe-Signature`.
- 400 `{error:'Missing Stripe-Signature header'}`; 400 `{error:'Invalid signature'}` (constructEvent threw, incl. empty/undefined `STRIPE_WEBHOOK_SECRET`, stale timestamp > Stripe default 300 s tolerance).
- 200 `{received:true}` for: processed completed event, missing metadata, and every other event type.
- 500 `{error:'Internal server error'}` on any thrown error after verification -> Stripe retries (up to 3 days with backoff).
- No cookies.

## Step-by-step flow (checkout.session.completed)
1. route.ts:26-31 read body, require signature header.
2. :35 `constructEvent(body, signature, STRIPE_WEBHOOK_SECRET!)`.
3. :42 only `event.type === 'checkout.session.completed'` proceeds.
4. :45-51 read `session.metadata.order_id` / `company_id`; if either missing -> console.error, return 200 (payment silently unreconciled).
5. :53-63 `UPDATE orders SET payment_status='paid', stripe_session_id, stripe_payment_intent_id (string or object id), paid_at=now() WHERE id=orderId RETURNING`. No guard on current status, no check `session.payment_status === 'paid'`, no check amount/currency vs `orders.amount_total`.
6. :65-69 `UPDATE companies SET status='onboarding', updated_at=now() WHERE id=companyId RETURNING` (unconditional).
7. :71 if both rows returned: SELECT user by `company.user_id`.
8. :74 `sendWhatsAppMessage(user.whatsapp_number,'order_confirmed','en',[name, company_name])`. Result is ignored.
9. :82-90 INSERT `notifications` {title 'Payment Confirmed', type 'success', category 'payment', link '/dashboard', `whatsapp_status:'sent'` hard-coded regardless of step 8 result}.
10. :92 `sendPushToUser`; :94 PostHog `checkout_completed`.
11. :100-102 else branch: console.error "order or company not found"; still returns 200.

## Data
Writes: `orders` (payment_status, stripe_session_id, stripe_payment_intent_id, paid_at), `companies` (status, updated_at), `notifications` (one row). Not stored: Stripe `event.id`, amount actually paid, receipt URL, customer id. `orders.payment_status` enum has `processing`/`failed`/`refunded` that no code ever sets.

## Business rules and constants
Metadata keys `order_id`, `company_id` (must match `stripe.ts:46`). Company status written: `onboarding`. WhatsApp template `order_confirmed`/`en`. Notification copy fixed (lines 79-80).

## Auth, permissions, security
PROTECTED ZONE (AGENTS.md section 5): human approval required; AGENTS.md says webhook must stay idempotent (it is not). Signature verified on raw text body (correct for App Router). Secret read with `!` assertion; unset -> all calls 400. Anyone who knows an `order_id`/`company_id` still cannot forge without the signing secret.

## Duplicate and out-of-order behaviour (exact)
- **Duplicate `checkout.session.completed`** (Stripe retry after a 500/timeout, dashboard "resend", or two endpoints): steps 5-10 all run again. Order UPDATE is a no-op except `paid_at` overwritten with the later time. Company is set to `onboarding` again. A second WhatsApp message, second `notifications` row, second push and second PostHog event are produced.
- **Company regression**: if staff already advanced the company (`official_kyc_pending`, `filing_in_progress`, `bank_opening`, `active`) via the kanban, a late duplicate/retry resets it to `onboarding`, and `milestone`-driven UI follows the status. Real data-corruption risk.
- **Retry amplification**: a 500 after step 6 (e.g. DB error inserting notification at step 9, or a throw in push) makes Stripe retry, so steps 5-8 repeat (second WhatsApp) before it fails again.
- **Event arrives before /api/checkout's own DB write**: `stripe_session_id` is saved by /api/checkout after the Stripe call; the webhook finds the order by metadata `order_id` (not session id), so ordering is safe. The webhook also sets `stripe_session_id`, so a race overwrite is harmless.
- **Out-of-order / other events**: `checkout.session.expired`, `async_payment_succeeded`, `async_payment_failed`, `payment_intent.*`, `charge.refunded`, `charge.dispute.*` all hit line 107 and return 200 with no effect. For delayed methods a `completed` event with `payment_status:'unpaid'` would still mark the order paid (card-only today, so latent). A refund after payment leaves the order `paid` and company `onboarding`.
- **Replayed old event** (attacker with a captured payload + signature): rejected by Stripe's 300 s timestamp tolerance in `constructEvent`.
- **Unknown order/company id** (deleted rows): UPDATEs match 0 rows, logs error, 200.
- Order exists but company update returns nothing: order stays `paid`, no notification, 200.

## Failure modes and edge cases
Notification/push/WhatsApp failures: WhatsApp and push helpers swallow errors (log only); `notifications.whatsapp_status` still says `sent`. Only DB errors reach the 500 path. Partial writes are possible (order paid, company not updated) because there is no transaction.

## Tests
None. Tests to write (mock db, whatsapp, push, stripe): (1) no header -> 400; (2) bad signature -> 400, no DB calls; (3) valid completed event -> order paid, company onboarding, one notification; (4) same event twice -> expect exactly one notification/WhatsApp (currently fails; defines the fix); (5) company `filing_in_progress` + replay -> status unchanged (currently fails); (6) `charge.refunded` -> 200 and no changes; (7) missing metadata -> 200 and error logged.

## Known bugs and gaps
- Not idempotent (route.ts:53-98, no event id, no `WHERE payment_status <> 'paid'`).
- Unconditional company reset to `onboarding` (route.ts:65-69).
- `whatsapp_status:'sent'` hard-coded (route.ts:89).
- No handling of failure/refund/expired events; `failed`/`refunded`/`processing` unreachable.
- Does not verify `session.payment_status === 'paid'` or amount match.
- Duplicate Stripe client creation; `constructWebhookEvent` dead.

## Change guide
Minimal idempotency fix: `UPDATE orders ... WHERE id=? AND payment_status <> 'paid' RETURNING`; if no row returned, skip company update and all side effects and return 200. Only advance company when `status IN ('lead','onboarding')`. Consider unique index on `orders.stripe_session_id` and a processed-events table keyed by `event.id`. Keep returning 2xx for ignorable events. Add `checkout.session.expired` / `charge.refunded` handlers if refund workflow needed. Human approval required (protected zone).

## Related features
[service-catalog-and-checkout](service-catalog-and-checkout.md), [whatsapp-outbound](whatsapp-outbound.md), [in-app-notifications](in-app-notifications.md), [web-push](web-push.md), [admin-kanban-pipeline](admin-kanban-pipeline.md), [analytics-posthog](analytics-posthog.md)
