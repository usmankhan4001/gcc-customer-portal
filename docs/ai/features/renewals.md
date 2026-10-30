# Feature: Renewals

**Slug**: renewals   **Area**: [client-portal](../modules/client-portal.md)   **Status**: stub   **Last verified against code**: 2026-10-30

## What it does
Intended: track yearly company license renewals, remind clients and invoice them. Actual: a `renewals` table exists; the client dashboard reads it and lists deadlines; `/admin/renewals` is a **hard-coded mock page**; an email helper exists but is never called. No code creates, updates or reminds on renewals.

## Entry points
- Client: "Upcoming Deadlines" block in `src/app/(authenticated)/dashboard/page.tsx:259-285`.
- Admin: `GET /admin/renewals` -> `src/app/admin/renewals/page.tsx` (linked from `src/app/admin/layout.tsx:42`).
- Email helper: `sendRenewalReminder` in `src/lib/email.ts:194` (no callers).

## Files
- `src/lib/db/schema.ts:211-222` - `renewals` table; relation at :388; type `Renewal` :416.
- `dashboard/page.tsx:122-128` (query), :267-283 (render), :71-78 (`daysUntil`).
- `src/app/admin/renewals/page.tsx:1-104` - static mock.
- `src/lib/email.ts:194-244` - reminder email template.
- `drizzle/0000_wealthy_ezekiel.sql` etc. - table created by migrations (see [database-and-migrations](database-and-migrations.md)).

## Request / response contract
none. No API route touches `renewals` (grep: only dashboard, admin page text, schema, email).

## Step-by-step flow
Client dashboard: 1. `activeCompany` (newest non-lead). 2. `SELECT * FROM renewals WHERE company_id = activeCompany.id ORDER BY due_date DESC` (no limit). 3. If rows: take first 5 (the 5 **latest** due dates) and render year, date, countdown chip. Block is absent when there are no rows (which is always, in practice).
Admin: renders `mockRenewals` array (4 fake companies, :4-9), static stat cards "12", "3", "$45,000" (:32,:42,:52), a "Send Bulk Reminders" button and per-row "Generate Invoice & Notify" button, none with handlers.

## Data
`renewals`: `id uuid`, `company_id` FK companies (not null), `renewal_year int` (not null), `due_date timestamp` (not null), `status` text enum `upcoming|invoiced|paid|overdue|renewed` default `upcoming`, `order_id` FK orders (nullable), `created_at`. No `amount`, no `reminder_sent_at`, no unique `(company_id, renewal_year)`. Related columns used elsewhere: `companies.license_expiry_date`, `companies.incorporation_date`, `companies.status` includes `renewal_due`, `orders` (`order_type`, `payment_status`, `amount_total`). `users.email_alerts_enabled`, `whatsapp_alerts_enabled` exist for channel opt-in.

## Business rules and constants
- Countdown colours (`dashboard :71-78`): <0 red "N days overdue"; <=7 red; <=30 amber; >30 green. Status override labels: `renewed` -> "Completed", `paid` -> "Paid" (:278).
- Dashboard health badge uses `license_expiry_date` (not `renewals`): <0 days "Renewal Overdue", <30 "Renewal Due Soon" (:62-63). So two independent sources of truth for "renewal due".
- Email subject: `Renewal Reminder — ${entityName} expires in ${daysLeft} days` (email.ts:204); link `${NEXT_PUBLIC_APP_URL}/renewals` - a route that does not exist.
- No 60/30/15-day constants exist anywhere in code (unverified beyond grep of "60", "30", "15" renewal contexts: none).

## Auth, permissions, security
Client block scoped via the user's active company (header-based session, see [client-dashboard](client-dashboard.md)). `/admin/*` pages are gated by middleware role check (`src/middleware.ts:78-100`) - admin or super_admin. No mutation endpoints exist, so nothing to protect yet.

## Failure modes and edge cases
- A user whose newest non-lead company has no renewals sees nothing; older companies' renewals are never shown.
- `ORDER BY due_date DESC` + `slice(0,5)` shows the furthest-future deadlines first and can hide the nearest one when >5 rows exist.
- Admin page always shows fake data; an operator may believe reminders were sent.

## Tests
None. Worth writing (for a future engine):
1. Company with `license_expiry_date` = today+60d and no reminder logged -> engine creates one `renewals` row (year N, `due_date`, `upcoming`) exactly once (idempotent on re-run).
2. Run on T-60, T-30, T-15 -> exactly one notification/email/WhatsApp per threshold per renewal.
3. Row `paid`/`renewed` -> no reminder.
4. `email_alerts_enabled=false` -> no email, in-app notification still created.
5. Dashboard: 7 renewals -> 5 nearest upcoming shown.

## Known bugs and gaps
- No code inserts into `renewals` (confirmed by grep across `src`; module doc "creation path unverified" -> none exists).
- `/admin/renewals` is mock data with dead buttons (`admin/renewals/page.tsx:4-9,19,91`).
- `sendRenewalReminder` has zero callers (grep) and links to nonexistent `/renewals`.
- No cron/scheduler in repo for renewals (cron infrastructure: see [deploy-and-ci](deploy-and-ci.md); unverified here).
- `renewal_due` status is never set automatically; only an admin can PATCH it.
- Dashboard sort order (above).

## Data needed for a 60/30/15-day engine
1. Source date: `companies.license_expiry_date` (nullable; set by nobody in code today - admin has no field to set it, only `trade_license_number` appears in pipeline GET). Must add an admin input or set at activation.
2. Renewal row per company-year: create `renewals(company_id, renewal_year, due_date=license_expiry_date, status='upcoming')`, add unique `(company_id, renewal_year)`.
3. Reminder ledger: new columns/table (`reminder_60_sent_at`, `_30_`, `_15_` or `renewal_reminders(renewal_id, days_before, channel, sent_at)`) for idempotency.
4. Price: `jurisdiction_pricing` (schema :~200) / `orders.amount_total` to create an invoice order and set `renewals.order_id`, status `invoiced`; Stripe flow in [stripe-webhook](stripe-webhook.md) should mark `paid`/`renewed`.
5. Recipient/channels: `users.email`, `whatsapp_number`, alert flags; senders [transactional-email](transactional-email.md), [whatsapp-outbound](whatsapp-outbound.md), [in-app-notifications](in-app-notifications.md), [web-push](web-push.md).
6. A scheduler hitting a protected route daily (none exists today).

## Change guide
Build engine as a server module + secured cron route; reuse `sendRenewalReminder` after fixing its link; replace admin mock with a real query (`renewals JOIN companies JOIN users`) and wire buttons to POST routes using `requireAdmin()`. Update dashboard to order ascending by `due_date` filtered to non-renewed. Update this doc and module doc.

## Related features
[client-dashboard](client-dashboard.md), [admin-clients](admin-clients.md), [transactional-email](transactional-email.md), [whatsapp-outbound](whatsapp-outbound.md), [in-app-notifications](in-app-notifications.md), [stripe-webhook](stripe-webhook.md), [service-catalog-and-checkout](service-catalog-and-checkout.md)
