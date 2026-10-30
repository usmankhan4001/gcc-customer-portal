# Module: Admin Operations
**Last verified against code**: 2026-10-30

## Purpose
Staff command center under `/admin`: a live 4-column Kanban over `companies.status`, a leads list, a pricing editor and a promo-banner manager. Two admin pages (Clients and Renewals) are still static mock UIs. Admin APIs live under `/api/admin/**` and must self-authenticate because middleware treats `/api/` as public.

## Files
- `src/app/admin/layout.tsx` - sidebar/topbar shell (no auth check; sidebar links to `/admin/settings`, which has no page)
- `src/app/admin/page.tsx` - Kanban client page (729 lines): fetches `/api/admin/pipeline`, advance/jump/create
- `src/app/admin/leads/page.tsx` - table over `/api/admin/leads` (live)
- `src/app/admin/pricing/page.tsx` - pricing editor + promo banner manager (live)
- `src/app/admin/clients/page.tsx` - MOCK data (`initialClients`, 5 hardcoded rows), verify/reject only change local state
- `src/app/admin/renewals/page.tsx` - MOCK data (`mockRenewals`, hardcoded counts 12/3), buttons do nothing
- `src/app/api/admin/pipeline/route.ts`, `leads/route.ts`, `pricing/route.ts`, `promo-banners/route.ts`, `promo-banners/[id]/route.ts` - use `requireAdmin()`
- `src/app/api/admin/seed-admin/route.ts` - one-shot bootstrap of first super_admin
- `src/app/api/admin/kyc/review/route.ts` - KYC document review, fully mocked
- `src/lib/admin-auth.ts` - `requireAdmin()` (protected zone)
- `src/middleware.ts` - gates `/admin/*` pages (protected zone)

## Routes and API
| Method | Path | Calls requireAdmin? | Notes |
|---|---|---|---|
| GET | /api/admin/pipeline | YES | all companies + client + assignee + latest order, SLA fields |
| PATCH | /api/admin/pipeline | YES | body `{companyId, status?, assignedTo?}` |
| POST | /api/admin/pipeline | YES | create company (+ placeholder user), sets `assigned_to` = caller |
| GET | /api/admin/leads | YES | newest 200 leads |
| GET | /api/admin/pricing | YES | all `jurisdiction_pricing` rows |
| PATCH | /api/admin/pricing | YES | `{id, price_usd}` cents, sets `updated_by` |
| GET | /api/admin/promo-banners | YES | all banners, newest first |
| POST | /api/admin/promo-banners | YES | `{title, body, link_url?}` |
| PATCH | /api/admin/promo-banners/[id] | YES | `{active}` toggle only |
| POST | /api/admin/seed-admin | NO | unauthenticated, see Security |
| POST | /api/admin/kyc/review | NO (own check) | `Authorization: Bearer <jwt>`, role must equal exactly `admin` (super_admin gets 403); web UI never calls it |
Pages `/admin/**`: middleware (`middleware.ts:78-99`) requires a valid `gcc_session` JWT with role `admin` or `super_admin`, else redirect to `/`. Roles `staff` and `operations` exist in the enum but are denied everywhere.

## Data
- `companies` (read/write): status, assigned_to, incorporation_date, official_kyc_completed, tier, jurisdiction, track_type.
- `users` (read, insert placeholders), `orders` (read only, latest per company via in-memory map), `leads` (read), `jurisdiction_pricing` (read/update), `promo_banners` (CRUD-ish; consumed by `(authenticated)/dashboard/page.tsx:157-170`: `active` AND `starts_at <= now` AND (`ends_at` null OR `>= now`), newest 3).
- `milestones` table is not read or written by any admin code (nor anywhere outside schema).
- `documents` is NOT touched by `kyc/review` (DB calls are commented out).

## External services and env vars
`JWT_SECRET` (via `getJwtSecret`), `DATABASE_URL`, `NODE_ENV` (cookie `secure` flag in seed-admin). `kyc/review` reads `WHATSAPP_PHONE_NUMBER_ID/ACCESS_TOKEN` but the fetch is commented out.

## Key flows
1. Admin opens `/admin` -> GET pipeline -> cards grouped client-side into 4 columns by `status`.
2. Admin clicks Advance -> PATCH `{companyId, status: STAGE_ORDER[status]}` -> `companies.status` and `updated_at` change; UI resets `daysInStage` to 0 optimistically. No notification is sent to the client.
3. Admin uses the jump dropdown (6 options) -> same PATCH.
4. "New order" modal -> POST pipeline -> finds user by lowercased email OR trimmed phone, else inserts placeholder `client` user -> inserts company.
5. Pricing page: dollars x 100 rounded -> PATCH pricing -> `price_usd` cents (read by `/api/checkout`).
6. Banner create/toggle -> row in `promo_banners` -> appears on client dashboard.

## Business rules and invariants
- Kanban columns (`admin/page.tsx:203-226`): (1) New Leads & Intake = `lead`,`onboarding`; (2) KYC Review = `official_kyc_pending`; (3) Filing & Bank Opening = `filing_in_progress`,`bank_opening`; (4) Active & Complete = `active`,`renewal_due`,`suspended`,`archived`. Nine DB statuses -> 4 columns.
- `STAGE_ORDER` advance map (page.tsx:66): lead->official_kyc_pending, onboarding->official_kyc_pending, official_kyc_pending->filing_in_progress, filing_in_progress->bank_opening, bank_opening->active, active->active. `renewal_due`/`suspended`/`archived` have no entry (no Advance button; reachable only via DB or API). Jump menu offers 6 statuses labelled 1-6.
- Who sets statuses: Stripe webhook -> `onboarding`; WhatsApp KYC webhook -> `filing_in_progress` (skips the admin step by design); admin UI for the rest; `lead` is the DB default.
- PATCH `status:'active'` also sets `incorporation_date = now` (overwritten on every re-activation) and `official_kyc_completed = true` (`pipeline/route.ts:131-134`).
- SLA (`pipeline/route.ts:68-73`): `daysInStage = floor((now - updated_at)/86400000)`; `>7` red, `>=4` yellow, else green. Uses `updated_at`, so any edit (even reassigning) resets the clock; it is not true time-in-stage.
- Pipeline value badge = sum of latest order `amount_total` (cents) over all companies, including unpaid.
- Pricing PATCH accepts any `number >= 0` (no integer check; a fractional value would fail at the integer column -> 500).

## Security notes
- `/api/admin/seed-admin` (precise): POST, no auth, no secret, no env flag. Checks `users` for any role `admin`/`super_admin`; if one exists returns 409. Otherwise inserts `admin@gccstartup.com` (whatsapp `+000000000000`, role `super_admin`, country UAE) with a random 12-byte base64url password, sets a 7-day `gcc_session` cookie for it, and returns the plaintext email/password in the JSON body. NOT safe in production on a database with no admin: the first anonymous caller becomes super_admin and receives credentials. Once any admin exists it is inert, but it re-opens if admins are ever deleted/demoted. Check-then-insert is not atomic (unique email/phone makes a concurrent second insert fail with 500, so a single winner). Not called by Dockerfile, entrypoint or scripts. Added in commit d44cab0. Recommend: require an env bootstrap token or remove after first use (auth zone: needs human approval).
- `kyc/review` is inconsistent with the AGENTS.md rule: it does not use `requireAdmin`, expects a Bearer header the browser app never sends, excludes `super_admin`, accepts any `document_id` without lookup, and returns `success:true` while persisting nothing (messages "sent" to hardcoded `971500000000`, fake id `wamid.mock.*`). Do not rely on it.
- Error handlers return raw `error.message` to the client (`pipeline/route.ts` 92, 154, 228).
- POST/PATCH pipeline do not validate `jurisdiction`/`tier`/POST `status` against allowed values; enums are TS-only (`text(..., {enum})`, no DB CHECK), so garbage strings can be stored. `companyId`/`assignedTo` are not UUID-validated (invalid UUID -> 500).
- Placeholder users get `whatsapp_number = temp_<Date.now()>` (collision-prone within the same ms; not a real number, so WhatsApp KYC lookup cannot match them). Client phone is only trimmed, not normalized like OTP login (`[^\d+]` stripped), so admin-created users may not match later logins -> duplicate accounts.
- Protected zones touched: `src/lib/admin-auth.ts`, `src/middleware.ts`, auth helpers used by seed-admin.

## Tests
none for admin routes or pages.

## Known gaps and suspicious things
- Clients and Renewals pages are demo mocks; the "Clients & KYC" workflow does not exist in the DB.
- Layout shows a permanent red notification dot and a non-functional global search; `/admin/settings` link 404s.
- Pipeline GET loads every company and every order (no pagination/limit).
- No audit trail: nothing records which admin changed a status (only `jurisdiction_pricing.updated_by` is stored).
- Admin pipeline moves do not create `notifications` or trigger WhatsApp/push, unlike the webhook-driven transitions.
- `daysInStage` resets to 0 in UI after advance but server calculates from `updated_at`, consistent only because PATCH bumps `updated_at`.

## Change guide
- New admin endpoint: copy the `requireAdmin()` + 401 pattern from `pipeline/route.ts`; never rely on middleware for `/api/*`.
- New pipeline status: update the `companies.status` enum in `schema.ts` (+ `npm run db:generate`; additive is safe), `validStatuses` in `pipeline/route.ts`, `STAGE_ORDER`, `STATUS_SELECT_OPTIONS` and the column filters in `admin/page.tsx`, and the status handling in `src/app/(authenticated)/dashboard/page.tsx`.
- Wiring real KYC review: replace the mock with `requireAdmin()`, real `documents` lookup/update (needs new columns for review status; additive), and `sendWhatsAppMessage` from `lib/whatsapp.ts` with approved templates.
- Making roles `staff`/`operations` usable requires changes in `requireAdmin`, `middleware.ts` and `auth-hooks.ts` (human approval).
- Pitfall: the admin pages are client components that swallow fetch errors (`res.ok` false does nothing), so failures look like empty boards.
