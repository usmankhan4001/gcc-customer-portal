# Module: Client Portal
**Last verified against code**: 2026-10-30

## Purpose
The logged-in client area: dashboard (company health, pipeline progress, documents, orders, renewals, compliance snapshot, notifications, referrals), profile, support, and notifications. Data is shown for the current user only.

## Files
- src/app/(authenticated)/layout.tsx - wraps pages in `AppShell`
- src/app/(authenticated)/dashboard/page.tsx - main dashboard (server component, ~520 lines)
- src/app/(authenticated)/profile/page.tsx - user card, push toggle, logout (other menu rows are inert buttons)
- src/app/(authenticated)/support/page.tsx - static mailto/tel/WhatsApp links (support@gccstartup.com, +97337728231)
- src/app/(authenticated)/notifications/page.tsx - last 50 notifications
- src/components/portal/AppShell.tsx - shell; reads session + unread notification count
- src/components/portal/PipelineStepTracker.tsx - presentational 5-step tracker (`steps`, `currentStep`)
- src/components/portal/ComplianceSnapshot.tsx - client component; fetches /api/tax-rules, PATCHes revenue estimate
- src/components/portal/NotificationList.tsx, PromoBanner.tsx, PushNotificationToggle.tsx, LogoutButton.tsx, BannerHeader.tsx
- src/app/api/companies/revenue-estimate/route.ts, src/app/api/companies/good-standing/route.tsx
- src/app/api/notifications/[id]/read/route.ts, src/app/api/notifications/read-all/route.ts
- src/lib/session.ts - `getServerSession()` (reads x-user-* headers)

## Routes and API
- GET /dashboard, /profile, /support, /notifications - middleware requires valid `gcc_session` JWT (src/middleware.ts:34-44)
- PATCH /api/companies/revenue-estimate - session cookie checked in handler
- GET /api/companies/good-standing?companyId= - uses `getServerSession()` (headers), returns PDF (and uploads copy to R2 under pdfs/good-standing/<userId>/)
- PATCH /api/notifications/[id]/read, PATCH /api/notifications/read-all - session cookie checked in handler
- GET /api/tax-rules - consumed by ComplianceSnapshot; auth not verified in this pass (unverified)

## Data
- `companies`: company_name, jurisdiction, tier, status, license_expiry_date, incorporation_date, trade_license_number, annual_revenue_estimate, fiscal_year_end ("MM-DD"). Status enum: lead, onboarding, official_kyc_pending, filing_in_progress, bank_opening, active, renewal_due, suspended, archived.
- `milestones`: defined (stage_index 1-6, status pending|in_progress|completed) but NOT read or written anywhere in src (only mentioned in a style-guide string). The tracker is driven by `companies.status`.
- `renewals`: company_id, renewal_year, due_date, status (upcoming|invoiced|paid|overdue|renewed), order_id - read on dashboard for the active company only; also used by admin renewals page and src/lib/email.ts.
- Also read: `users`, `documents` (latest 5), `orders` (latest 5), `notifications`, `referrals`, `promo_banners` (active, started, not ended, max 3), `jurisdiction_tax_rules`.

## External services and env vars
- NEXT_PUBLIC_APP_URL (referral link; fallback https://portal.gccstartup.com), NEXT_PUBLIC_VAPID_PUBLIC_KEY / VAPID_* (push toggle, via src/lib/push.ts), R2 vars (good-standing PDF upload). JWT_SECRET for middleware.

## Key flows
1. Client logs in (/auth) -> cookie `gcc_session` -> opens /dashboard -> middleware verifies JWT, sets x-user-* headers -> page calls `getServerSession()` and queries by `session.userId`.
2. Active company = most recent company with `status != 'lead'` (dashboard/page.tsx:90). Pipeline step = `STATUS_TO_STEP[status]` (onboarding 0, official_kyc_pending 1, filing_in_progress 2, bank_opening 3, active/renewal_due/suspended/archived 4); labels: Onboarding, Official KYC, Government Filing, Bank Setup, Active.
3. Client edits revenue in ComplianceSnapshot -> PATCH revenue-estimate -> updates latest non-lead company (annual_revenue_estimate, optional fiscal_year_end).
4. Client marks notification read -> PATCH `[id]/read` -> `is_read=true` WHERE id AND user_id = session.
5. "Good Standing Letter" / "Company Summary PDF" links (both same URL) -> PDF generated with @react-pdf/renderer, saved to R2, returned as attachment.

## Business rules and invariants
- Health badge (dashboard:51-70): license expiry < 0 days -> "Renewal Overdue"; < 30 days -> "Renewal Due Soon"; else status active -> "Active", renewal_due -> "Renewal Due", suspended -> "Suspended", otherwise "In Progress".
- Renewal countdown colours: <0 overdue, <=7 red, <=30 amber, else green (dashboard:76-83).
- Expiring documents flag: expiry within next 30 days (dashboard:127).
- Referral link: `/?ref=<first 8 chars of userId>`.
- revenue-estimate: must be a number >= 0; ComplianceSnapshot stores `rate_percent` as percent*100 (900 = 9.00%).
- Jurisdiction display strings come from the enum id (`hong-kong` -> "hong kong").

## Security notes
- PROTECTED ZONE (AGENTS.md 5): src/lib/session.ts and src/middleware.ts - human approval before edits.
- Scoping model: every query filters by `session.userId` (companies, documents, orders, notifications, referrals). `renewals` is filtered by the active company id (derived from the user), not user_id.
- SUSPICIOUS (unverified at runtime): middleware sets x-user-id/email/role with `response.headers.set` on `NextResponse.next()` (middleware.ts:71-74), which sets RESPONSE headers; Next only forwards request headers when passed via `NextResponse.next({ request: { headers } })`. If so, `getServerSession()` reads headers the client sent, not ones middleware verified: pages could render empty (null session) or, worse, trust a client-supplied `x-user-id`. Needs a real test before changing anything.
- Same risk for /api/companies/good-standing: `/api/` is a PUBLIC path in middleware (no headers set), yet the route relies on `getServerSession()`; it either always 401s or trusts a spoofable header. It also takes `companyId` and returns 403 only after loading any company by id (ownership check exists: `company.user_id !== session.userId`).
- Notification routes and revenue-estimate verify the JWT cookie directly (safe pattern).

## Tests
none for this module (src/lib/auth.test.ts covers token helpers only). scripts/test-routes.js hits /dashboard etc. for health.

## Known gaps and suspicious things
- `milestones` table is dead data: no code creates milestones, so there is no milestone tracker beyond the status-based `PipelineStepTracker`. Admin changes `companies.status` via /api/admin/pipeline and the client sees it.
- Dashboard "Pay Now" links to `/checkout/<orderId>` but checkout expects a jurisdiction id (broken).
- Profile "Personal Information" and "Security" buttons have no handlers; support page has no ticket system.
- Dashboard runs ~8 sequential queries and loads all referral rows just to count them.
- `allDocuments` (limit 5) is used for `documentCount`, so the displayed count caps at 5 (verify in UI, minor).
- Good-standing PDF is written to R2 on every download, never cleaned up.
- Admin renewals page exists but no code writes `renewals` rows (creation path unverified).

## Change guide
- Add a pipeline stage: update `companies.status` enum (schema.ts:63), `STAGE_LABELS` + `STATUS_TO_STEP` in dashboard/page.tsx, admin kanban (src/app/admin/page.tsx NEXT_STATUS map ~line 67), and generate a migration.
- Use real milestones: write rows from admin pipeline PATCH, then read `milestones` ordered by `stage_index` in the dashboard and feed `PipelineStepTracker`.
- New client page: place under src/app/(authenticated)/, add prefix to PROTECTED_PREFIXES in src/middleware.ts (protected zone), always filter by `session.userId`, add `export const dynamic = 'force-dynamic'` if it queries the DB at build.
- New client API: do NOT rely on `getServerSession()`; verify the `gcc_session` cookie with `verifyToken` as the notification routes do.
