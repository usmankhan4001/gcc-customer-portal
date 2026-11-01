# Feature: Admin Kanban pipeline

**Slug**: admin-kanban-pipeline   **Area**: [admin-operations](../modules/admin-operations.md)   **Status**: working (no notifications, no audit trail)   **Last verified against code**: 2026-11-02

## What it does
`/admin` is a live 4-column Kanban of every `companies` row, grouped by `companies.status`. Staff (role `admin`/`super_admin`) can search/filter cards, advance a card one step, jump it to any of 6 stages, and create a new company order (with a client user created on the fly). It is the only UI that moves non-webhook stages (KYC review, bank opening, active).

## Entry points
- UI: `src/app/admin/page.tsx` (`AdminDashboard`, `CaseCard`), wrapped by `src/app/admin/layout.tsx`. Restyled in the CMS admin style, see [018-admin-pipeline-restyle](018-admin-pipeline-restyle.md); on phones one stage at a time (chips), board at >=900px.
- Pure logic: `src/lib/admin-ui/pipeline.ts` (`groupByStage`, `filterItems`, `nextStage`, `STAGE_ORDER`, `STATUS_SELECT_OPTIONS`, `slaBadge`, `formatAmount`, `totalPipelineValue`, `isTempPhone`), tested in `pipeline.test.ts`.
- API: `GET/PATCH/POST /api/admin/pipeline` (`src/app/api/admin/pipeline/route.ts`).

## Files
- `src/app/admin/page.tsx`: `:21-46` card type; `:68-85` `fetchPipeline` (sets `loadError`); `:91-119` `handleUpdateStatus`; `:121-154` `handleCreateOrder`; `:156-161` filter, group and pipeline value (memoised, via `pipeline.ts`); `:194-237` toolbar (search, Clear search, jurisdiction select, stage chips); `:243-246` load-error state; `:393-478` `CaseCard` (Advance `:445-454`, jump select `:455-473`).
- `src/lib/admin-ui/pipeline.ts`: `JURISDICTION_CONFIG`/`TIER_LABELS` labels, `STAGE_ORDER`, `STATUS_SELECT_OPTIONS`, `STAGE_COLUMNS`, plus the helper functions listed above.
- `src/app/admin/pipeline.module.css`: board/column/card layout.
- `src/app/api/admin/pipeline/route.ts:8-94` GET, `:96-156` PATCH, `:158-230` POST.
- `src/lib/admin-auth.ts:10-20` requireAdmin. `src/middleware.ts:78-99` page gate.
- `src/lib/db/schema.ts:52-88` companies, `:33-46` users, `:175-196` orders.

## Request / response contract
All three handlers call `requireAdmin()` first (route.ts:9, 97, 159); no/invalid cookie or non-admin role -> `401 {"error":"Unauthorized"}`.
- **GET** (no input) -> `200 {companies:[{id, company_name, jurisdiction, tier, track_type, status, official_kyc_completed, trade_license_number, created_at, updated_at, client_id, client_name, client_email, client_phone, assigned_id, assigned_name, assigned_avatar, daysInStage, slaStatus:'green'|'yellow'|'red', order:{amount_total,currency,payment_status}|null}]}` ordered by `updated_at` desc. 500 `{error: error.message}` on DB failure (leaks raw message).
- **PATCH** body `{companyId (required), status?, assignedTo?}`. 400 `companyId is required`; 400 `Invalid status: X` (must be one of the 9 enum values, route.ts:114-124); `assignedTo` falsy -> sets NULL, otherwise stored as given (UI never sends it). 404 `Company not found`; 200 `{success:true, company:<full row>}`; 500 `{error:error.message}` (e.g. invalid UUID or FK violation on assignedTo).
- **POST** body `{companyName, jurisdiction (both required), tier='tier_1_self', clientName?, clientEmail?, clientPhone?, status='lead'}`. 400 `companyName and jurisdiction are required`. 200 `{success:true, company}`. `jurisdiction`, `tier`, `status` are NOT validated on POST (route.ts:176) so any string is inserted (TS-only enum, no DB CHECK). 500 on DB error.
- Cookies: reads `gcc_session` only.

## Step-by-step flow
1. Page mounts -> `fetchPipeline()` GET (`page.tsx:68`). A non-ok response or network error sets `loadError` and the board is replaced by a `cl-empty is-error` alert ("Could not load the pipeline..."); the refresh button retries and clears it. While loading with no items, "Loading pipeline…" shows.
2. GET (`route.ts:18-41`): `companies` LEFT JOIN `users` as client (`companies.user_id`) and as staff (`companies.assigned_to`); second query loads ALL `orders` desc by created_at, first per company wins in a Map (`:55-60`) -> latest order, any payment_status.
3. SLA (`:62-73`): `daysInStage = floor((now - updated_at)/86400000)`; `>7` red, `>=4` yellow, else green. Based on `updated_at`, so any update (reassign, status) resets it.
4. Client filters (`filterItems` in `pipeline.ts`, called at `page.tsx:156`): jurisdiction select + text search over company_name, client_name, client_email, client_phone (case-insensitive substring on the trimmed query; phone is case-sensitive `includes`). A "Clear search" button (`:205-209`) shows while the query is non-empty.
5. Columns (`groupByStage` / `STAGE_COLUMNS`, one source for chip and column counts): 1 "New Leads & Intake" = lead, onboarding; 2 "KYC Review" = official_kyc_pending; 3 "Filing & Bank Opening" = filing_in_progress, bank_opening; 4 "Active & Complete" = active, renewal_due, suspended, archived. On phones the chips pick the single visible column.
6. Advance button (shown if `nextStage(status)` is non-null, i.e. `STAGE_ORDER[status]` exists and differs; `CaseCard`, `page.tsx:445`): PATCH `{companyId, status: next}`. Map (`STAGE_ORDER` in `pipeline.ts`): lead->official_kyc_pending, onboarding->official_kyc_pending, official_kyc_pending->filing_in_progress, filing_in_progress->bank_opening, bank_opening->active, active->active (hidden). `renewal_due`/`suspended`/`archived` have no entry: no Advance button. Note lead/onboarding skip straight to KYC.
7. Stage jump: a labelled `select` on each card (`aria-label="Move <company> to stage"`, `page.tsx:455`), options from `STATUS_SELECT_OPTIONS`: lead, onboarding, official_kyc_pending, filing_in_progress, bank_opening, active. Choosing the current stage does nothing. A status outside the six (renewal_due/suspended/archived) is shown as a disabled option, so the UI cannot jump TO those (API accepts them).
8. PATCH handler (`route.ts:110-145`): `UPDATE companies SET updated_at=now(), status=?, [incorporation_date=now(), official_kyc_completed=true if status==='active'], [assigned_to=?]` WHERE id. On success UI optimistically sets status, `daysInStage=0`, `slaStatus='green'` (`page.tsx:99-113`); on non-ok nothing happens (no error shown).
9. Create modal (`handleCreateOrder`, `:121-154`): requires non-empty company name; POST; on ok closes modal, clears name/client fields (jurisdiction/tier/status kept), re-fetches.
10. POST (`route.ts:180-223`): if email or phone given, look up `users` by lowercased trimmed email OR trimmed phone (`or(...)`, first hit); if none, insert `users{email|null, whatsapp_number: phone.trim() or temp_<Date.now()>, full_name: clientName || "<company> Representative", role:'client'}`. With neither email nor phone, always inserts a temp user. Then insert `companies{user_id, company_name, jurisdiction, tier, status, assigned_to: admin.userId}`.

## Data
- Writes: `companies` (status, updated_at, assigned_to, incorporation_date, official_kyc_completed, plus all POST columns), `users` (placeholder client rows).
- Reads: `companies`, `users` x2 (aliases `client_users`, `staff_users`), `orders` (company_id, amount_total cents, currency, payment_status, created_at).
- Stage enum (`schema.ts:63-75`, TS-only text enum): lead (default), onboarding, official_kyc_pending, filing_in_progress, bank_opening, active, renewal_due, suspended, archived.
- NOT written: `milestones` (never touched by admin code), `notifications`, `documents`. No audit log of who moved a card.

## Business rules and constants
- SLA thresholds 4 and 7 days (`route.ts:69-73`).
- Pipeline value badge = sum of latest `orders.amount_total` / 100 across ALL companies incl. unpaid/failed (`totalPipelineValue`, `page.tsx:161`, shown only if >0).
- Jurisdiction labels (`JURISDICTION_CONFIG` in `pipeline.ts`): uae, hong-kong, singapore, bahrain, ireland, bvi. Tier labels (`TIER_LABELS`): tier_1_self "Self UBO", tier_2_nominee, tier_3_shelf.
- Cards: temp phones (`temp_` prefix) are hidden (`isTempPhone`, used in `CaseCard`); "KYC Verified" badge from `official_kyc_completed`.
- Other writers of status: Stripe webhook -> onboarding; WhatsApp KYC webhook -> filing_in_progress (see [stripe-webhook](stripe-webhook.md), [whatsapp-inbound-webhook](whatsapp-inbound-webhook.md)).

## Auth, permissions, security
Page: middleware admin gate (cookie JWT role admin|super_admin, else redirect `/`). API: `requireAdmin()` in every handler (middleware skips `/api/`). `staff`/`operations` roles are rejected everywhere. Protected zones: `admin-auth.ts`, `middleware.ts`. See [admin-bootstrap-and-guard](admin-bootstrap-and-guard.md).

## Failure modes and edge cases
- A failed GET shows the error state (not an empty board). PATCH and POST failures are still swallowed: the click does nothing.
- Invalid UUID `companyId`/`assignedTo` -> Postgres error -> 500 with raw message.
- Moving to `active` re-stamps `incorporation_date` every time (overwrites).
- Moving backward (jump) from `active` leaves `official_kyc_completed=true` and incorporation_date set.
- Create with garbage jurisdiction stores it; card shows `JURISDICTION.toUpperCase()` with a globe flag (`jurisdictionInfo` fallback).
- Admin-created user phone is only trimmed, not normalized like OTP login, so the client later logging in may create a duplicate user.
- GET loads all companies and all orders; no pagination.
- No optimistic-lock: two admins moving the same card = last write wins.

## Tests
UI logic: `src/lib/admin-ui/pipeline.test.ts` (grouping/counts, filtering, stage and badge mapping, formatting). No API route tests (only `tests/fde.test.ts` lists leads route). Worth writing for the API:
1. GET without cookie -> 401; with `client` JWT -> 401; with `admin` JWT -> 200 and `companies` array.
2. PATCH `{companyId}` only -> 200 and only `updated_at` changed.
3. PATCH `{companyId, status:'bogus'}` -> 400; `{status:'active'}` -> `official_kyc_completed=true`, `incorporation_date` set.
4. PATCH unknown UUID -> 404; non-UUID -> currently 500 (assert, then fix to 400).
5. POST with existing email (different case) reuses the user (no new users row); with no contact info creates a `temp_` user.
6. SLA: company `updated_at` 5 days ago -> `yellow`, 8 days -> `red`.

## Known bugs and gaps
- No client notification (`notifications`/WhatsApp/push) on admin stage moves, unlike webhook-driven moves (no import of notify libs in route.ts).
- POST does not validate `jurisdiction`/`tier`/`status` (`route.ts:176`).
- `daysInStage` is time since last update, not time in stage (`route.ts:65`).
- `milestones` (which drives the client PipelineStepTracker) are never advanced by this feature: unverified whether the client UI derives progress from `companies.status` instead; check [pipeline-tracker](pipeline-tracker.md).
- `error.message` returned to clients (`:92, :154, :228`).
- Silent UI failures on PATCH and POST (`handleUpdateStatus`, `handleCreateOrder`; only `console.error`).
- Race: `temp_${Date.now()}` can collide within one ms.

## Change guide
- New status: update `schema.ts` enum, `validStatuses` (route.ts:114), `STAGE_ORDER`, `STATUS_SELECT_OPTIONS` and `STAGE_COLUMNS` (all in `src/lib/admin-ui/pipeline.ts`), client dashboard handling. Enum is a text column so no ALTER TYPE; still run `npm run db:generate` for the TS change only if drizzle emits something.
- To notify clients on move: add a call after the UPDATE in PATCH using the helpers in [in-app-notifications](in-app-notifications.md) / [whatsapp-outbound](whatsapp-outbound.md); do not block the response on failure.
- Keep `requireAdmin()` first in every new handler.

## Related features
[admin-leads](admin-leads.md), [admin-clients](admin-clients.md), [admin-bootstrap-and-guard](admin-bootstrap-and-guard.md), [pipeline-tracker](pipeline-tracker.md), [stripe-webhook](stripe-webhook.md), [kyc-review](kyc-review.md), [client-dashboard](client-dashboard.md)
