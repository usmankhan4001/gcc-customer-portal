# Feature: Admin pricing page restyle (CMS admin style)

**Slug**: 022-admin-pricing-restyle   **Spec**: docs/specs/022-admin-pricing-restyle.md   **Last verified against code**: 2026-11-02

## What it does (3 sentences max)
`/admin/pricing` now uses the CMS admin classes and `PageHeader` instead of ad-hoc Tailwind, so the price table collapses to cards at 375px. Behavior is unchanged: inline price edits PATCH `/api/admin/pricing`, and the announcement form and active toggles use `/api/admin/promo-banners`. Price parsing and label helpers are pure functions in `src/lib/admin-ui/pricing.ts`.

## Where it lives
- Pages / routes: `src/app/admin/pricing/page.tsx` (client component)
- API routes (methods, auth required): unchanged. `GET/PATCH /api/admin/pricing`, `GET/POST /api/admin/promo-banners`, `PATCH /api/admin/promo-banners/[id]` (all `requireAdmin()`)
- Components: `src/components/admin/PageHeader.tsx`
- lib modules: `src/lib/admin-ui/pricing.ts` (`parsePriceToCents`, `formatCents`, `tierLabel`, `jurisdictionLabel`, `bannerBadgeTone`, `bannerStatusLabel`)
- DB tables / columns: none changed
- Env vars / external services: none

## Behavior and rules
- Prices are integer cents; the input is dollars. `parsePriceToCents` rejects empty, non-numeric, non-finite and negative input (the Save click is then a no-op, as before).
- States: loading `admin-state`, fetch failure `cl-empty is-error` (new; pricing load only), empty `cl-empty`.
- Save buttons and price inputs carry per-row `aria-label`s; the banner toggle is a `badge` button (green when active).
- Deep behavior of the configurator: [admin-pricing-configurator](admin-pricing-configurator.md). Banners: [admin-promo-banners](admin-promo-banners.md).

## Data flow
1. Mount: fetch pricing and banners. 2. Edit price -> draft per row. 3. Save -> `parsePriceToCents` -> PATCH -> row replaced, draft cleared. 4. Create banner -> POST; toggle -> PATCH `{active}`.

## Tests
`src/lib/admin-ui/pricing.test.ts`: table-driven tests for the helpers plus a source assertion for the page skeleton, no hard-coded colours/legacy utilities, and the CMS state classes. Not covered: rendering and the network calls (checked visually by the owner at 375px and 1280px).

## Protected-zone touchpoints
None.

## Known gaps / extension points
Save and banner request failures are still silent (unchanged). The banner list fetch has no error state.
