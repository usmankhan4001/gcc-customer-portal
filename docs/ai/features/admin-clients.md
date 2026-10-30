# Feature: Admin clients (Clients & KYC page)

**Slug**: admin-clients   **Area**: [admin-operations](../modules/admin-operations.md)   **Status**: stub (static mock UI, no API)   **Last verified against code**: 2026-10-30

## What it does
`/admin/clients` ("Client & KYC Management") looks like a client list with Verify/Reject buttons, but it renders 5 hardcoded fake people and only mutates React state. Nothing is read from or written to the database. The real client data lives in `users` + `companies` and is currently visible only as cards on the Kanban.

## Entry points
- UI: `src/app/admin/clients/page.tsx` (`ClientsPage`), sidebar label "Clients & KYC" (`layout.tsx:35-40`).
- API: none. No `/api/admin/clients` route exists.

## Files
- `src/app/admin/clients/page.tsx:7-13` `initialClients` (mock); `:20-26` handlers; `:28-34` filter; `:98-165` table; `:180-189` fake pagination.
- Adjacent: `src/app/api/admin/kyc/review/route.ts` (also mock, not called by this page).

## Request / response contract
none (no fetch calls in the file). The only I/O is `useState`.

## Step-by-step flow
1. Component initializes `clients` state from `initialClients` (`:16`): ids 1-5 with fake names (Ali Al-Farsi, Sarah Ahmed, Mohammed Bin Rashid, Fatima Al-Zahra, Omar Farooq), `+971` phones, fake companies, statuses Verified/Pending/Rejected.
2. Search box filters name, company, phone substring; select filters `All | Pending | Verified | Rejected` (`:28-34`).
3. Columns: Client Details (name, `ID: #000N`), Contact & Company, KYC Status chip, Actions.
4. Pending rows show Verify and Reject buttons -> `setClients(...)` only (`:20-26`). Non-pending rows show an inert kebab icon. A page refresh restores the mock data.
5. Footer says "Showing 1 to N of N results"; Previous/Next are permanently disabled.

## Data
- Hardcoded: everything shown. IDs are numbers, not UUIDs, so no link to any real row. "KYC Status" does not exist as a column in the DB.
- Real sources available for a Customer 360 (verified in `schema.ts`):
  - Identity: `users` (`id`, `email`, `whatsapp_number` unique, `full_name`, `role`, `country_of_residence`, `avatar_url`, alert flags, timestamps) `schema.ts:33-46`.
  - Companies: `companies.user_id -> users.id` (one user can have several): `company_name`, `jurisdiction`, `tier`, `track_type`, `status` (9-value enum), `official_kyc_completed`, `official_kyc_reference`, `trade_license_number`, `incorporation_date`, `license_expiry_date`, `assigned_to -> users.id`, `annual_revenue_estimate`, `fiscal_year_end` `:52-88`.
  - Payments: `orders.user_id/company_id` (`amount_total` cents, `payment_status` unpaid|processing|paid|failed|refunded, `stripe_*`, `line_items`, `paid_at`) `:175-196`.
  - Documents: `documents.user_id/company_id` (`category`, `status` active|archived|superseded, `expiry_date`, `r2_key`), `document_versions`, `shareable_links`, `document_access_log` `:94-150`.
  - Progress: `milestones.company_id` (`stage_index` 1-6, `status`) `:156-169` (empty today, nothing writes it).
  - Renewals: `renewals.company_id` (`schema.ts:211+`; columns unverified).
  - Comms: `notifications.user_id` with per-channel statuses `:250-277`; `push_subscriptions.user_id`.
  - Marketing: `leads.converted_user_id -> users.id` (or match on email/whatsapp_number), `referrals.referrer_user_id/referred_user_id`.
- Suggested joins: `users LEFT JOIN companies ON companies.user_id = users.id`, then per-company aggregates of `orders`, `documents`, `renewals`; leads via `converted_user_id = users.id OR lower(email) = users.email`.
- Reusable pattern: the pipeline GET (`pipeline/route.ts:18-41`) already joins company + client + assignee and in-memory maps latest order.
- There is no per-document KYC status (`documents.status` is lifecycle, not review state); real "KYC review" state would need new columns (additive migration).

## Business rules and constants
None real. Status vocabulary in this page (Pending/Verified/Rejected) does not match any DB enum; the nearest real signals are `companies.status = official_kyc_pending` and `companies.official_kyc_completed`.

## Auth, permissions, security
Page-only: middleware admin gate (role admin|super_admin). No API means no `requireAdmin` concern now; any future `/api/admin/clients` must call `requireAdmin()` itself. Fake data contains no real PII.

## Failure modes and edge cases
None (static). Risk is operational: an admin may believe a Verify click took effect; it did not.

## Tests
None. Worth writing once real:
1. GET `/api/admin/clients` without admin cookie -> 401.
2. Client with 2 companies returns both, each with latest order and document count.
3. Search by phone with and without `+` finds the same user.
4. Verify/Reject persists and is reflected on reload (needs defined DB columns).

## Known bugs and gaps
- Entire page is mock (`page.tsx:6-13`); Verify/Reject are no-ops against the DB (`:20-26`).
- Nav label promises "Clients & KYC" but KYC review lives nowhere real; `/api/admin/kyc/review` is also mocked and unused by the UI (see [admin-bootstrap-and-guard](admin-bootstrap-and-guard.md)).
- Uses `dark:` classes though admin layout is light only.

## Change guide
- Build Customer 360 as: `GET /api/admin/clients` (list with search/pagination) and `GET /api/admin/clients/[id]` (detail), both `requireAdmin()` first, reusing the join approach above. Replace the mock in `page.tsx`; keep the sidebar link.
- For real verify/reject: decide the persistence model first (`companies.official_kyc_completed` + status move, or new review columns on `documents`). Then wire notifications via [in-app-notifications](in-app-notifications.md) and [whatsapp-outbound](whatsapp-outbound.md). Document in [kyc-review](kyc-review.md).
- Do not change `middleware.ts`/`admin-auth.ts` without approval.

## Related features
[admin-kanban-pipeline](admin-kanban-pipeline.md), [admin-leads](admin-leads.md), [kyc-review](kyc-review.md), [client-dashboard](client-dashboard.md), [renewals](renewals.md), [admin-bootstrap-and-guard](admin-bootstrap-and-guard.md)
