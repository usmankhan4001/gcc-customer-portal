# Feature: Admin leads list

**Slug**: admin-leads   **Area**: [admin-operations](../modules/admin-operations.md)   **Status**: working (read-only)   **Last verified against code**: 2026-10-30

## What it does
`/admin/leads` shows the newest 200 contacts captured by the lead-gen tools (tax calculator, quiz, etc.) in a read-only table. Admins see who the lead is, which tool captured them, persona, interest jurisdiction, funnel track and capture time. There is no way to filter, search, edit, assign, convert or contact a lead from this page.

## Entry points
- UI: `src/app/admin/leads/page.tsx` (`AdminLeadsPage`), linked from the sidebar ("Leads", `layout.tsx:53-58`).
- API: `GET /api/admin/leads` (`src/app/api/admin/leads/route.ts`).

## Files
- `src/app/admin/leads/page.tsx:6-18` row type; `:20-31` source labels; `:37-42` fetch; `:62-67` column headers; `:85-132` rows.
- `src/app/api/admin/leads/route.ts:7-15` handler.
- `src/lib/db/schema.ts:304-340` `leads` table. Writers: `src/app/api/leads/capture/route.ts`, `src/app/api/pdf/generate/route.ts`, `src/app/api/onboarding/complete/route.ts` (see [lead-capture-and-persona](lead-capture-and-persona.md)).
- `tests/fde.test.ts:18` references the route (smoke/path list only).

## Request / response contract
- `GET /api/admin/leads` no params. `requireAdmin()` called (route.ts:8). No cookie / non-admin -> `401 {"error":"Unauthorized"}`. Success `200 {leads:[...]}` where each item is `select *` from `leads`: id, email, whatsapp_number, source_tool, tool_input (jsonb), tool_result (jsonb), pdf_r2_key, estimated_revenue_band, industry_risk_tier, primary_interest_jurisdiction, persona_tag, funnel_track, converted_user_id, created_at. Ordered `created_at` desc, `limit(200)`.
- No try/catch: a DB error becomes an unhandled 500 (Next default).
- No pagination, offset, or query params.

## Step-by-step flow
1. Page mounts, `fetch('/api/admin/leads')` then `.json()` (`page.tsx:38-41`); `data.leads ?? []`. On 401 the body has no `leads`, so the table shows "No leads captured yet." (error is invisible).
2. Handler: `requireAdmin()` -> `db.select().from(leads).orderBy(desc(created_at)).limit(200)`.
3. Table columns (6): Contact (email, WhatsApp, green "Converted to client" chip when `converted_user_id` set), Source Tool (label map, falls back to raw value), Persona (`persona_tag` or em dash), Interest (`primary_interest_jurisdiction` with `-` replaced by space, capitalized), Track (`consultation_led` -> amber "Consultation", else blue "Self-serve"; null -> dash), Captured (`toLocaleString()`).
4. Header shows `{rows.length} lead(s)` (counts loaded rows, max 200, not total).

## Data
- Read: `leads` only. Source tool enum (10): tax_calculator, banking_odds, nda_generator, jurisdiction_quiz, vat_scorer, ubo_privacy, compliance_calendar, visa_estimator, name_checker, qfzp_eligibility (`schema.ts:308-321`). Revenue band enum: under_50k, 50k_150k, 150k_500k, over_500k. Risk tier: low, medium, high. Funnel track: self_serve, consultation_led.
- Fetched but NOT displayed: `estimated_revenue_band`, `industry_risk_tier`, `tool_input`, `tool_result`, `pdf_r2_key`, `id`. `converted_user_id` only as a chip.
- No join to `users`, `companies` or orders.

## Business rules and constants
- Limit 200 (`route.ts:13`). Funnel track colors keyed on exact string `consultation_led` (`page.tsx:117`).
- Source label map has all 10 enum values; any new tool added to the schema enum shows its raw slug until `SOURCE_LABELS` is updated.

## Auth, permissions, security
- Page gate: middleware, JWT role `admin` or `super_admin` (`middleware.ts:78-99`). API gate: `requireAdmin()`.
- What a sales user can do today: nothing. Roles `staff`/`operations` are rejected by both gates, so only `admin`/`super_admin` can open the page. Even admins can only read; there is no PATCH/POST/DELETE for leads and no note, status, owner, or export.
- PII: the API returns `tool_input`/`tool_result` JSON (can contain emails, revenue, answers) to the browser although the UI ignores them. Acceptable for admins but larger than necessary.

## Failure modes and edge cases
- 401/500 look like an empty list (page does not check `res.ok`; a non-JSON 500 makes `res.json()` reject with no catch, leaving `loading` false after `finally` and an empty table).
- >200 leads: older ones are unreachable from the UI.
- Duplicate captures of the same person appear as separate rows (no dedupe).
- `primary_interest_jurisdiction` null -> dash.

## Tests
Only a path reference in `tests/fde.test.ts`. Worth writing:
1. GET without cookie -> 401; with client-role JWT -> 401.
2. GET as admin with 250 seeded leads -> exactly 200, first has newest `created_at`.
3. Response items include `source_tool` and `converted_user_id` keys.
4. Page render (component test) with `{leads:[]}` shows "No leads captured yet."; with one lead where `converted_user_id` set shows "Converted to client".
5. `funnel_track:'consultation_led'` renders "Consultation".

## Known bugs and gaps
- No filter/search/sort/export, no pagination (`route.ts:13`, `page.tsx` has no controls).
- Missing sales context columns: revenue band, industry risk, tool result (`page.tsx:62-67`).
- No lead -> pipeline conversion or assignment; `converted_user_id` is set elsewhere (unverified where; `onboarding/complete` is the likely writer).
- Error states invisible (`page.tsx:38-42`).
- No try/catch in handler.

## Change guide
- Add filters server-side via query params + `where(...)`, keep `requireAdmin()` first. Add columns by extending `LeadRow` and the table; avoid returning `tool_input`/`tool_result` unless needed (select explicit columns).
- If adding sales-user access you must change `requireAdmin`, `middleware.ts` and role handling (protected zones, human approval); see [admin-bootstrap-and-guard](admin-bootstrap-and-guard.md).
- New lead source tool: update schema enum, `SOURCE_LABELS`, and capture route.

## Related features
[lead-capture-and-persona](lead-capture-and-persona.md), [admin-clients](admin-clients.md), [admin-kanban-pipeline](admin-kanban-pipeline.md), [admin-bootstrap-and-guard](admin-bootstrap-and-guard.md), [tool-result-pdf-and-email](tool-result-pdf-and-email.md)
