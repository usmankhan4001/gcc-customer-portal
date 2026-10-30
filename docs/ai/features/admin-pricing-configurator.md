# Feature: Admin pricing configurator

**Slug**: admin-pricing-configurator   **Area**: [checkout-and-orders](../modules/checkout-and-orders.md)   **Status**: working (edit-only; cannot create rows)   **Last verified against code**: 2026-10-30

## What it does
Admins open `/admin/pricing` to see every `jurisdiction_pricing` row (jurisdiction x tier) and edit the USD price; changes apply immediately to the next checkout because `/api/checkout` reads the table live. The same page also hosts the promo-banner manager (see [admin-promo-banners](admin-promo-banners.md)). Rows can only be created by the seed script or SQL; there is no add/delete UI or API.

## Entry points
- UI: `/admin/pricing` (client component, `src/app/admin/pricing/page.tsx`).
- API: `GET /api/admin/pricing`, `PATCH /api/admin/pricing` (`src/app/api/admin/pricing/route.ts`).
- Seed: `npx tsx scripts/seed.ts` (`npm run db:seed` per UI hint).

## Files
- `src/app/admin/pricing/page.tsx:28-186` - pricing table; `handleSave` 81-106; TIER_LABELS 22-26. Lines 188-249 banner UI (not part of this feature).
- `src/app/api/admin/pricing/route.ts:7-39` - GET/PATCH.
- `src/lib/admin-auth.ts` - `requireAdmin()` (cookie JWT, role admin or super_admin).
- `src/middleware.ts` - `/admin*` prefix: redirects to `/` if no/invalid session or role not admin/super_admin. `/api/` is public to middleware, so the API guards itself.
- `src/lib/db/schema.ts:198-209` - `jurisdiction_pricing`.
- `scripts/seed.ts:14-27, ~85-95` - default prices; upsert (SELECT then UPDATE or INSERT by jurisdiction+tier).
- Consumer: `src/app/api/checkout/route.ts:33-37`.

## Request / response contract
- `GET /api/admin/pricing` -> 200 `{pricing: [{id, jurisdiction, tier, price_usd, updated_by, updated_at}]}` ordered by jurisdiction. 401 `{error:'Unauthorized'}` if not admin (also for non-admin authenticated users; no 403).
- `PATCH /api/admin/pricing` body `{id: string, price_usd: number (cents)}`. Validation: `id` truthy, `typeof price_usd === 'number'`, `>= 0`. 400 `{error:'id and a non-negative price_usd (cents) are required'}`. 404 `{error:'Not found'}` for unknown id. 200 `{pricing: <updated row>}`. Non-integer or NaN/Infinity-as-JSON values: JSON cannot carry NaN; fractions like 1500.5 pass validation and the integer column insert will error -> unhandled 500 (no try/catch in handler). `price_usd: 0` is accepted (free checkout would hit Stripe with unit_amount 0; Stripe card payments reject < 50 cents: unverified).
- No POST/DELETE.

## Step-by-step flow
1. Page mounts, `fetch('/api/admin/pricing')` (page.tsx:39) and fills table; empty state tells admin to run `npm run db:seed`.
2. Admin edits a dollar value (input step 0.01); draft stored per row id; displayed value = draft or `(price_usd/100).toFixed(2)` (149).
3. Save: `Math.round(parseFloat(draft) * 100)`; skips if NaN or < 0 (page.tsx:84-85) then PATCHes `{id, price_usd}`.
4. Route (route.ts:17-38): `requireAdmin()`; validate; `UPDATE jurisdiction_pricing SET price_usd, updated_by = admin.userId, updated_at = now() WHERE id` RETURNING.
5. UI replaces row from response and clears the draft. A failed response (no `pricing` key) silently leaves the draft with no error shown.
6. Price flow to checkout: `/api/checkout` selects by (jurisdiction, mapped tier) at request time and copies `price_usd` into `orders.amount_total` and Stripe `unit_amount`. Existing unpaid orders keep the old amount (snapshot at order creation).

## Data
`jurisdiction_pricing(id uuid pk, jurisdiction text enum[uae,hong-kong,singapore,bahrain,ireland,bvi] not null, tier text enum[tier_1_self,tier_2_nominee,tier_3_shelf] not null, price_usd integer not null (cents), updated_by uuid fk users, updated_at timestamp default now)`. Enums are TS-only (text columns). No unique constraint on (jurisdiction, tier) and no currency column; no price history/audit besides last `updated_by`.

## Business rules and constants
- Amounts in integer cents; UI converts dollars x100.
- Seed defaults (cents): uae/bahrain/hong-kong/ireland 150000 / 350000; singapore 200000 / 400000; bvi 250000 / 450000 (seed.ts:14-27). Header comment says only Hong Kong numbers are confirmed; the rest are placeholders.
- Only `tier_1_self` and `tier_2_nominee` are purchasable; `tier_3_shelf` rows would display in the table with label "Shelf Company" but checkout cannot sell them.
- Labels: tier_1_self "Self UBO (Basic)", tier_2_nominee "Nominee UBO".

## Auth, permissions, security
`requireAdmin()` on both verbs (good; matches AGENTS.md admin pattern). Not in a listed protected zone, but changes money amounts: treat with care. No audit log, no confirmation, no upper bound: a typo (e.g. 100x) goes live instantly. The signed JWT role claim is trusted without a DB lookup, so a demoted admin keeps access until their 7-day token expires.

## Failure modes and edge cases
- Unseeded DB: table empty, checkout returns 400 "No price configured". Seeding is manual, not part of migrations (see [database-and-migrations](database-and-migrations.md)).
- Duplicate (jurisdiction, tier) rows (seed uses select-then-write so concurrent runs could duplicate): admin sees both; checkout uses `LIMIT 1` without ORDER BY -> unpredictable winner.
- PATCH 500 on non-integer; UI only sends rounded ints so UI is safe.
- Marketing "starting from" strings in `src/lib/jurisdictions.ts` and wizard prices ($1,500/$3,500) are static and do not follow edits.

## Tests
None. Write: (1) non-admin PATCH -> 401; (2) `price_usd:-1` -> 400; (3) unknown id -> 404; (4) valid PATCH updates `updated_by`; (5) after PATCH, `/api/checkout` creates order with new `amount_total` (integration); (6) `price_usd:1500.5` should be 400 (currently 500 - defines fix).

## Known bugs and gaps
- Accepts non-integers (route.ts:24) -> 500; add `Number.isInteger`.
- No create/delete; no unique constraint; checkout `LIMIT 1` ambiguity.
- UI swallows save errors (page.tsx:94-102).
- Static UI price copy not tied to the table.
- No minimum price guard vs Stripe minimums.

## Change guide
Add a row type: extend schema enums, seed, labels. To add create/delete: new POST/DELETE handlers using `requireAdmin()`, plus a unique index on (jurisdiction, tier) via `npm run db:generate`. Keep cents everywhere. If you make the wizard show live prices, expose a public read-only endpoint rather than the admin one.

## Related features
[service-catalog-and-checkout](service-catalog-and-checkout.md), [admin-promo-banners](admin-promo-banners.md), [admin-bootstrap-and-guard](admin-bootstrap-and-guard.md), [database-and-migrations](database-and-migrations.md)
