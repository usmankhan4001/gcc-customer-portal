# Feature: Client dashboard

**Slug**: client-dashboard   **Area**: [client-portal](../modules/client-portal.md)   **Status**: partial   **Last verified against code**: 2026-10-30

## What it does
`/dashboard` is the logged-in client's home page. One server component renders nine blocks: promo banners, company health, application progress, renewal deadlines, documents, payments, referral stats, compliance snapshot, notifications and quick-service tiles. All data is read per request for the session user. A user with no non-lead company sees "No Active Company" and fewer blocks.

## Entry points
- UI: `GET /dashboard` -> `src/app/(authenticated)/dashboard/page.tsx` (default export `DashboardPage`, async server component, 525 lines). Wrapped by `src/app/(authenticated)/layout.tsx` (AppShell).
- Middleware gate: `/dashboard` in `PROTECTED_PREFIXES` (`src/middleware.ts:35`).
- No API of its own; children call `/api/tax-rules`, `/api/companies/revenue-estimate`, `/api/companies/good-standing`.

## Files
- `src/app/(authenticated)/dashboard/page.tsx:80-525` - all queries and markup. Constants at :38-49, helpers `healthStatus` :51, `daysUntil` :71.
- `src/components/portal/PipelineStepTracker.tsx` - see [pipeline-tracker](pipeline-tracker.md).
- `src/components/portal/ComplianceSnapshot.tsx` - client component, see [good-standing-snapshot](good-standing-snapshot.md).
- `src/components/portal/PromoBanner.tsx`, `EmptyState.tsx`, `ServiceTile.tsx`, `BannerHeader.tsx` - presentational.
- `src/lib/session.ts:15` - `getServerSession()` (reads `x-user-id/-email/-role` request headers).
- `src/lib/db/schema.ts` - users :33, companies :52, documents :94, orders :175, renewals :211, notifications :250, promo_banners :288, referrals :359.

## Request / response contract
none (server-rendered HTML; no JSON API).

## Step-by-step flow
Queries run sequentially (not `Promise.all`), each guarded by `session ? ... : []`:
1. `getServerSession()` (:81). If null every query is skipped and the page renders with "there" and empty blocks (no redirect).
2. `user`: `users WHERE id = session.userId LIMIT 1` (:83). Only `full_name` used -> `firstName = full_name.split(' ')[0] || 'there'` (:173).
3. `activeCompany`: `companies WHERE user_id = me AND status <> 'lead' ORDER BY created_at DESC LIMIT 1` (:87-94).
4. `allUserCompanies`: all user companies (:96). **Never used afterwards** (dead query).
5. `allDocuments`: `documents WHERE user_id = me ORDER BY created_at DESC LIMIT 5` (:104). Not filtered by company or status.
6. `allOrders`: `orders WHERE user_id = me ORDER BY created_at DESC LIMIT 5` (:113).
7. `allRenewals`: only if `activeCompany`: `renewals WHERE company_id = activeCompany.id ORDER BY due_date DESC` (:122) - no limit; UI slices 5 of the *latest* due dates (:267).
8. `allNotifications`: `notifications WHERE user_id = me ORDER BY created_at DESC LIMIT 5` (:130).
9. `referralCount` / `paidReferralCount`: two full `SELECT *` on `referrals WHERE referrer_user_id = me` (and `status='paid'`), `.length` (:139-155).
10. `activeBanners`: `promo_banners WHERE active AND starts_at <= now AND (ends_at IS NULL OR ends_at >= now) ORDER BY starts_at DESC LIMIT 3` (:157-171). Global, not per user.
11. Derived: `status = healthStatus(activeCompany)`, `documentCount` (unused var), `hasExpiringDocs`, `referralLink`.

## Blocks (what each shows, empty state)
| # | Block | Source | Empty / edge |
|---|-------|--------|--------------|
| 0 | Promo banners (:183) | step 10 | hidden when none |
| 1 | Company Status (:197) | `activeCompany` + `healthStatus` | "No Active Company" + grey "No Company" badge; detail grid and PDF links only if company |
| 2 | Application Progress (:252) | `STATUS_TO_STEP[status] ?? 0` | hidden without company |
| 3 | Upcoming Deadlines (:260) | `allRenewals` | whole block hidden when 0 rows |
| 4 | My Documents (:288) | `allDocuments` | EmptyState "No documents uploaded" + Upload link to `/vault` |
| 5 | Payments & Invoices (:356) | `allOrders` | EmptyState "No payments yet" |
| 6 | Referral Program (:415) | counts + link | counts 0; "Earned" is hard-coded `$0` (:433) |
| 7 | Compliance Snapshot (:458) | props from `activeCompany` | hidden without company |
| 8 | Updates & Alerts (:467) | `allNotifications` | EmptyState "No updates yet"; "View All" -> `/notifications` only if rows |
| 9 | Quick Services (:504) | static 9 `ServiceTile` links | always |

## Data
Read-only. Tables: users, companies, documents, orders, renewals, notifications, referrals, promo_banners. Nothing written. Fields used: companies `company_name, jurisdiction, tier, status, incorporation_date, license_expiry_date, annual_revenue_estimate, fiscal_year_end`; orders `order_type, amount_total (cents), payment_status, created_at`; renewals `renewal_year, due_date, status`; notifications `type, title, message, is_read`.

## Business rules and constants
- `STAGE_LABELS` = Onboarding, Official KYC, Government Filing, Bank Setup, Active (:38). `STATUS_TO_STEP` (:40-49): onboarding 0, official_kyc_pending 1, filing_in_progress 2, bank_opening 3, active/renewal_due/suspended/archived 4.
- Health badge (:51-69), first match wins: no company "No Company"; license expiry `ceil(days)` < 0 "Renewal Overdue" (red); < 30 "Renewal Due Soon" (amber); status active "Active"; renewal_due "Renewal Due"; suspended "Suspended"; else "In Progress". Expiry check precedes status, so a suspended company with a far-future expiry shows "Suspended" but one with a past expiry shows "Renewal Overdue".
- Deadline colour `daysUntil` (:71): <0 "N days overdue" red; <=7 red "N day(s) left"; <=30 amber; else green. Row label: status `renewed` -> "Renewed"/"Completed"; `paid` -> "Paid"; else countdown (:273-278). Past-due rows with status `paid`/`renewed` keep red/overdue border colour.
- Expiring docs warning: `expiry_date` within next 30 days and in the future, over the 5 latest docs only (:176).
- Payments: amount `amount_total/100` printed with `$` regardless of `orders.currency` (:383). Status chips: paid, processing, failed, refunded, else "Unpaid". "Pay Now" shown only for `unpaid`, links `/checkout/<orderId>` (:401).
- Notification dot colour by `type`: action_required red, success green, warning amber, else info (:486-490).
- Referral link: `${NEXT_PUBLIC_APP_URL || 'https://portal.gccstartup.com'}/?ref=${userId.slice(0,8)}` (:177).
- Jurisdiction display `replace('-', ' ')` (first hyphen only) with CSS capitalize.

## Auth, permissions, security
Scoping: documents, orders, notifications, referrals filter by `session.userId`; renewals by the user's own active company id. Promo banners are global. Identity comes only from `getServerSession()` (middleware headers). **Dependency risk**: middleware sets `x-user-*` with `response.headers.set` on `NextResponse.next()` (`src/middleware.ts:71-74`), i.e. response headers; whether `headers()` in the page sees them is unverified at runtime (see module doc). PROTECTED ZONE: `src/middleware.ts`, `src/lib/session.ts` (AGENTS.md section 5).

## Failure modes and edge cases
- No session header: page renders empty shell, no redirect, no error.
- Any DB error: unhandled -> `src/app/error.tsx`. No try/catch.
- Multiple companies: only the newest non-lead one is shown; others are invisible on the dashboard.
- User with only a `lead` company: "No Active Company", no tracker, no PDF links.

## Tests
None. Worth writing:
1. Seed user + company `bank_opening` -> tracker `currentStep` 3, badge "In Progress".
2. Company `active`, `license_expiry_date` = now+10d -> badge "Renewal Due Soon".
3. Renewals rows for another company must not appear (scoping).
4. 6 documents -> only 5 listed.
5. Order `payment_status='unpaid'` -> "Pay Now" visible; `paid` -> hidden.
6. No session -> page renders without throwing.

## Known bugs and gaps
- Copy button has `onClick={() => navigator.clipboard...}` inside a server component (:446-449): event handlers cannot be serialized in a Server Component; likely a render/runtime error or inert button (unverified at runtime).
- Both PDF links are identical (:239, :243) - "Company Summary PDF" is the good-standing letter.
- "Pay Now" -> `/checkout/<orderId>` but checkout route expects a jurisdiction id (module doc claim; not re-verified here).
- Dead/wasteful: `allUserCompanies` (:96), `documentCount` (:175), full-row referral selects (:139-155), ~9 sequential queries.
- Referral "Earned" hard-coded `$0`; `?ref=` value is never read anywhere (see [referrals](referrals.md)).
- Currency symbol always `$` (:383).
- `daysUntil` renders "-0" edge: diff 0 -> "0 days left" red (cosmetic).

## Change guide
Add a block: query after :155, guard with `session ?`, add JSX before Quick Services. Keep user scoping. Changing stage labels: see [pipeline-tracker](pipeline-tracker.md). Make queries parallel with `Promise.all`. Do not edit middleware/session without approval.

## Related features
[pipeline-tracker](pipeline-tracker.md), [good-standing-snapshot](good-standing-snapshot.md), [renewals](renewals.md), [referrals](referrals.md), [vault-upload](vault-upload.md), [in-app-notifications](in-app-notifications.md), [admin-promo-banners](admin-promo-banners.md), [service-catalog-and-checkout](service-catalog-and-checkout.md), [session-and-route-guard](session-and-route-guard.md)
