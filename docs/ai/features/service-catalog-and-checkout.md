# Feature: Service catalog and checkout

**Slug**: service-catalog-and-checkout   **Area**: [checkout-and-orders](../modules/checkout-and-orders.md)   **Status**: partial   **Last verified against code**: 2026-10-30

## What it does
A logged-in client browses six jurisdictions (/services), opens one (/services/[id]), and runs a 4-step wizard (/checkout/[id]) to name a company, pick a tier and verify WhatsApp. "Pay" calls POST /api/checkout, which inserts a `companies` row (status `lead`) and an `orders` row (`unpaid`), creates a Stripe Checkout session and returns its URL. Payment completion is handled by [stripe-webhook](stripe-webhook.md). Price is always read server-side from `jurisdiction_pricing`.

## Entry points
- UI: `/services` -> `/services/[id]` ("Start Incorporation" link, `services/[id]/page.tsx:73`) -> `/checkout/[id]` (client wizard). `[id]` is the jurisdiction id (uae, hong-kong, bahrain, singapore, ireland, bvi; `src/lib/jurisdictions.ts:20-96`).
- API: `POST /api/checkout`.
- Middleware protects `/services` and `/checkout` prefixes (`src/middleware.ts` PROTECTED_PREFIXES); `/api/` is public so the handler does its own auth.

## Files
- `src/app/(authenticated)/services/page.tsx` - maps static `JURISDICTIONS`, links to `/services/${j.id}`.
- `src/app/(authenticated)/services/[id]/page.tsx` - detail; link to checkout (line 73).
- `src/app/checkout/[id]/page.tsx` - wizard; OTP calls `/api/auth/send-otp` (51-83) and `/api/auth/verify-otp` (85-111); `handleCheckout` 113-136.
- `src/app/api/checkout/route.ts:16-103` - the endpoint.
- `src/lib/stripe.ts:14-53` - `createCheckoutSession` (lines 55-81 `constructWebhookEvent`, `getPaymentStatus` are unused).
- `src/lib/jurisdictions.ts` - static display data and "starting from" strings (not prices used for billing).
- `src/lib/db/schema.ts:52-88` companies, `:175-196` orders, `:198-209` jurisdiction_pricing.
- `src/lib/posthog-server.ts` - `captureServerEvent` (`checkout_started`).

## Request / response contract
`POST /api/checkout` (cookie `gcc_session`, JWT; no CSRF token).
- Body JSON: `tier` (required; must be key of TIER_MAP: `basic` | `standard`), `companyName` (required, non-empty, no length/charset validation), `jurisdiction` (required, any string).
- 200: `{ "url": "<stripe checkout url>" }`.
- 401 `{error:'Not authenticated'}` (no/invalid cookie). 400 `{error:'Missing or invalid tier, companyName, or jurisdiction'}`. 400 `{error:'No price configured for <j> / <tier>. An admin needs to set it at /admin/pricing.'}`. 404 `{error:'User not found'}`. 500 `{error: error.message ?? 'Internal server error'}` (raw message leaked).
- Malformed JSON body throws inside try -> 500 (not 400).
- Client never sends an amount.

## Step-by-step flow
1. Wizard step 1: only `nameOption1` is required (Continue disabled while empty, page.tsx:427-429). Options 2 and 3 are collected but never sent.
2. Step 3: Continue disabled until `otpVerified` (UI gate only; server does not check it, and the verified phone is never sent).
3. Step 4: `handleCheckout` POSTs `{tier, companyName: nameOption1, jurisdiction: params.id}`; on `data.url` sets `window.location.href`, else `alert(data.error)`.
4. route.ts:18-24 verify cookie via `verifyToken`.
5. route.ts:28 `TIER_MAP[tier]` (basic->tier_1_self, standard->tier_2_nominee, 11-14). `tier_3_shelf` is not purchasable.
6. route.ts:33-37 SELECT `jurisdiction_pricing` WHERE jurisdiction AND tier LIMIT 1 (no ORDER BY; duplicates would pick arbitrary row).
7. route.ts:46 SELECT user by `session.userId`.
8. route.ts:51-60 INSERT `companies` {user_id, company_name, jurisdiction, tier, status:'lead'}. Drizzle enum is TS-only; an invalid jurisdiction is rejected earlier by the missing-price 400.
9. route.ts:62-72 INSERT `orders` {user_id, company_id, order_type:'new_formation', amount_total: price_usd, currency:'usd', payment_status:'unpaid'}.
10. route.ts:74 origin = request `Origin` header, else `NEXT_PUBLIC_APP_URL`, else `http://localhost:3005`.
11. route.ts:76-85 `createCheckoutSession` (stripe.ts:25-47): mode `payment`, `payment_method_types:['card']`, one line item `price_data` {currency, product_data.name `GCC Startup — <companyName>`, unit_amount = cents}, quantity 1, `customer_email` = user.email or '' , `metadata {order_id, company_id}` (snake_case; must match webhook).
12. route.ts:87-90 UPDATE orders SET stripe_session_id.
13. route.ts:92 PostHog `checkout_started` {jurisdiction, tier, amount_usd}; return `{url}`.

## Data
Written: `companies` (user_id, company_name, jurisdiction, tier, status 'lead'), `orders` (see step 9; `stripe_session_id` set after). Read: `jurisdiction_pricing`, `users`. Not stored: other name options, verified phone, `orders.line_items` (never written), `track_type`.

## Business rules and constants
- Tier map `basic`->`tier_1_self`, `standard`->`tier_2_nominee` (route.ts:11-14). Wizard default tier is `standard` (page.tsx:30).
- Currency `usd`, card only, quantity 1, order_type `new_formation` hard-coded.
- Redirects: success `${origin}/dashboard?success=true` (dashboard never reads `success`; no banner), cancel `${origin}/checkout/${jurisdiction}`.
- Seeded prices (cents) in `scripts/seed.ts:14-27`: uae/bahrain/hong-kong/ireland 150000 / 350000; singapore 200000 / 400000; bvi 250000 / 450000. Wizard UI shows hard-coded $1,500 / $3,500 regardless (page.tsx ~244-407).
- Stripe API version `2026-08-26.dahlia` (stripe.ts:8).

## Auth, permissions, security
PROTECTED ZONE (AGENTS.md): `src/lib/stripe.ts`, `src/app/api/checkout/**` - human approval before editing. Any authenticated role may call. Origin header is client-controlled and feeds success/cancel URLs. Stripe key from `STRIPE_SECRET_KEY!` (undefined key fails at first call -> 500).

## Failure modes and edge cases
- Stripe call fails (step 11): the `companies` (lead) and `orders` (unpaid, no session id) rows are already committed; no cleanup. Response 500 with Stripe's message.
- DB failure at step 12 after Stripe session created: order has no `stripe_session_id`, but the session is payable and metadata carries `order_id`, so the webhook still reconciles.
- Every click of Pay creates a new company + order (no dedupe); abandoned carts accumulate `lead` companies. Presign picks latest non-lead company, so leads do not receive vault documents.
- Empty user.email -> `customer_email: ''` (Stripe may reject; unverified).
- Double-click of the Pay button: no server idempotency; two orders. UI sets `loading` but the button's disabled state at line 438 is the only guard.

## Tests
None. Worth writing: (1) no cookie -> 401; (2) `tier:'premium'` -> 400; (3) missing price row -> 400 and no company/order inserted; (4) valid basic/uae with seeded price -> order.amount_total === 150000 and Stripe called with unit_amount 150000 and metadata ids (mock `createCheckoutSession`); (5) Stripe throws -> 500 and document that orphan lead rows exist (or assert fixed behaviour); (6) successUrl uses Origin header.

## Known bugs and gaps
- **"Pay Now" link mismatch confirmed**: dashboard links unpaid orders to `/checkout/${o.id}` (`dashboard/page.tsx:401`, order UUID) but `[id]` is a jurisdiction id; wizard posts `jurisdiction: <order uuid>` -> pricing lookup fails -> 400 "No price configured for <uuid> / ...". Retry-payment is broken; also the old Stripe session is not reused (`stripe_session_id` is stored but never used to re-open).
- OTP step is a UI-only gate; server never verifies phone (`route.ts` has no such check).
- 500 leaks `error.message`.
- Orphan `lead` company + `unpaid` order rows when Stripe fails or user abandons.
- Wizard price text hard-coded and can diverge from DB prices.
- `?success=true` ignored by dashboard.

## Change guide
Add a tier: schema enums (schema.ts:59,203), TIER_MAP, wizard radio, seed rows, `npm run db:generate`. Fix Pay Now: link to a new endpoint that recreates/retrieves the Stripe session for the existing order (reuse `getPaymentStatus` or `stripe.checkout.sessions.retrieve`) rather than `/checkout/<order id>`. Keep metadata keys `order_id`/`company_id` identical to the webhook. Protected-zone edits need human approval.

## Related features
[stripe-webhook](stripe-webhook.md), [admin-pricing-configurator](admin-pricing-configurator.md), [whatsapp-otp-login](whatsapp-otp-login.md), [client-dashboard](client-dashboard.md), [pipeline-tracker](pipeline-tracker.md), [analytics-posthog](analytics-posthog.md)
