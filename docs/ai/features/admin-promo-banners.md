# Feature: Admin promo banners

**Slug**: admin-promo-banners   **Area**: [admin-operations](../modules/admin-operations.md)   **Status**: working (create + toggle only)   **Last verified against code**: 2026-10-30

## What it does
Admins write short promo messages (title, body, optional link) that appear as dismissible banners at the top of every logged-in client's dashboard. Banners can be created and switched active/inactive; they cannot be edited, deleted or scheduled from the UI. Dismissal is per browser (localStorage), not per user.

## Entry points
- Admin UI: the "Promo banners" section at the bottom of `/admin/pricing` (`src/app/admin/pricing/page.tsx`), not a standalone page and not in the sidebar.
- API: `GET/POST /api/admin/promo-banners`, `PATCH /api/admin/promo-banners/[id]`.
- Client render: `src/app/(authenticated)/dashboard/page.tsx:157-171` queries, `src/components/portal/PromoBanner.tsx` renders (dashboard page.tsx:186 uses it).

## Files
- `src/app/api/admin/promo-banners/route.ts:7-15` GET, `:17-34` POST.
- `src/app/api/admin/promo-banners/[id]/route.ts:7-25` PATCH.
- `src/app/admin/pricing/page.tsx:34-36` state, `:38-47` loads, `:49-67` create, `:69-79` toggle, `:199-224` form, `:229-244` list.
- `src/lib/db/schema.ts:288-298` table; `:420` `PromoBanner` type.
- `src/components/portal/PromoBanner.tsx:14-65` banner UI.
- `src/app/dev/style-guide/page.tsx:262` demo only.

## Request / response contract
All handlers call `requireAdmin()` first; failure -> `401 {"error":"Unauthorized"}`.
- `GET /api/admin/promo-banners` -> `200 {banners:[full rows]}` newest `created_at` first, no limit.
- `POST` body JSON `{title (req), body (req), link_url?}`. Missing title/body -> `400 {"error":"title and body are required"}`. Success `200 {banner}` (note: 200, not 201). `link_url` empty -> NULL; no URL validation. `created_by = admin.userId`. `request.json()` throws on invalid JSON -> unhandled 500 (no try/catch).
- `PATCH /api/admin/promo-banners/[id]` body `{active}` -> sets `active = !!active` (any missing/falsy value deactivates). `404 {"error":"Not found"}` if no row; `200 {banner}`. A non-UUID `id` -> Postgres error -> unhandled 500. Note `await params` runs BEFORE `requireAdmin()` (`[id]/route.ts:8-9`), harmless but inconsistent.
- No DELETE, no PUT, no `starts_at`/`ends_at` input.

## Step-by-step flow
1. `/admin/pricing` mounts, fetches banners (`pricing/page.tsx:44`).
2. Admin fills title (required), link (optional), body (required); submit button disabled until title+body (`:220`). POST; on `data.banner` prepends to list and clears the form. Failures are silent.
3. List row shows title, body and a pill button "Active"/"Inactive"; click calls PATCH with `!banner.active` and replaces the row from the response (`:69-79`).
4. Dashboard server component (`dashboard/page.tsx:157-171`), only when `session` exists: `WHERE active = true AND starts_at <= now AND (ends_at IS NULL OR ends_at >= now) ORDER BY starts_at DESC LIMIT 3`.
5. Each banner is a `PromoBanner` client component: starts hidden, reads `localStorage.dismissed_promo_banners` (array of ids); X button appends the id. If `link_url` set, whole card is a `next/link` `Link`.

## Data
`promo_banners` (`schema.ts:288-298`): `id` uuid pk, `title` text not null, `body` text not null, `link_url` text null, `active` bool default true, `starts_at` timestamp default now, `ends_at` timestamp null, `created_by` uuid -> users, `created_at` default now. Only active/created_by/title/body/link_url are written by the API; `starts_at` is always now and `ends_at` is always NULL (never settable), so banners never expire except by manual toggle.

## Business rules and constants
- Max 3 banners shown (`dashboard/page.tsx:170`); shown to every authenticated user regardless of role/company/jurisdiction (no targeting).
- Dismiss key `dismissed_promo_banners` (`PromoBanner.tsx:19`).
- New banners are active immediately (default true).

## Auth, permissions, security
- Admin API: `requireAdmin()` in all three handlers (admin or super_admin). Page: `/admin/pricing` behind middleware admin gate.
- Render is React-escaped text, so title/body are not an XSS vector. `link_url` is passed to `next/link` unvalidated: a `javascript:` URL is a risk to evaluate (Next may block, unverified); also an external URL is accepted.
- Banners are not a notification: no push/WhatsApp/email, no `notifications` row.

## Failure modes and edge cases
- Banner list/create/toggle errors are silent in the UI.
- Dismissal is lost on a new browser/device or cleared storage; localStorage failure shows the banner again (`PromoBanner.tsx:22`).
- More than 3 active: oldest by `starts_at` silently hidden.
- Dashboard is the only render site (unverified for other pages: grep shows only dashboard + dev style-guide).

## Tests
None. Worth writing:
1. POST without title -> 400; with title+body -> 200 and row `active=true`, `ends_at` null, `created_by` = caller.
2. All three methods without admin cookie -> 401.
3. PATCH `{active:false}` hides it from the dashboard query; unknown uuid -> 404.
4. Dashboard query returns max 3, excludes inactive and `ends_at < now` rows (seed directly).
5. `PromoBanner` hides after dismiss and stays hidden after remount.

## Known bugs and gaps
- No edit, delete, scheduling or targeting UI/API; `ends_at` unreachable (`route.ts:23-31`).
- No try/catch and no id/URL validation (`route.ts:23`, `[id]/route.ts:14`).
- Buried inside the pricing page, no sidebar entry (`layout.tsx`).
- Toggle of a missing `active` key deactivates (`[id]/route.ts:17`).
- POST returns 200 instead of 201.

## Change guide
- Add `starts_at`/`ends_at` to POST body and form; keep dashboard filter unchanged. Add `DELETE` handler with `requireAdmin()` first. If adding link validation, restrict to `/` relative paths or https.
- Moving the UI to its own page: add a route under `src/app/admin/` and a sidebar entry in `layout.tsx`.
- No migration needed for the above (columns exist).

## Related features
[client-dashboard](client-dashboard.md), [admin-pricing-configurator](admin-pricing-configurator.md), [admin-bootstrap-and-guard](admin-bootstrap-and-guard.md), [in-app-notifications](in-app-notifications.md)
