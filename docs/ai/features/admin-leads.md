# Feature: Admin leads list

**Slug**: admin-leads   **Area**: [admin-operations](../modules/admin-operations.md)   **Status**: working (read-only)   **Last verified against code**: 2026-11-02

## What it does
`/admin/leads` shows the newest 200 contacts captured by the lead-gen tools (tax calculator, quiz, etc.) in a read-only table. Admins see who the lead is, which tool captured them, persona, interest jurisdiction, funnel track and capture time. There is no way to filter, search, edit, assign, convert or contact a lead from this page.

## Entry points
- UI: `src/app/admin/leads/page.tsx` (`AdminLeadsPage`, CMS admin style since spec 020, see [020-admin-leads-restyle](020-admin-leads-restyle.md)), linked from the sidebar ("Leads", `layout.tsx:53-58`).
- API: `GET /api/admin/leads` (`src/app/api/admin/leads/route.ts`).

## Files
- `src/app/admin/leads/page.tsx` row type (`LeadRow`), fetch with `loading`/`error` state, column headers, rows.
- `src/lib/admin-ui/leads.ts` `SOURCE_LABELS` and pure helpers (`sourceBadge`, `personaBadge`, `trackBadge`, `formatInterest`, `formatCaptured`, `leadCountLabel`); tests in `leads.test.ts`.
- `src/app/api/admin/leads/route.ts:7-15` handler.
- `src/lib/db/schema.ts:304-340` `leads` table. Writers: `src/app/api/leads/capture/route.ts`, `src/app/api/pdf/generate/route.ts`, `src/app/api/onboarding/complete/route.ts` (see [lead-capture-and-persona](lead-capture-and-persona.md)).
- `tests/fde.test.ts:18` references the route (smoke/path list only).

## Request / response contract
- `GET /api/admin/leads` no params. `requireAdmin()` called (route.ts:8). No cookie / non-admin -> `401 {"error":"Unauthorized"}`. Success `200 {leads:[...]}` where each item is `select *` from `leads`: id, email, whatsapp_number, source_tool, tool_input (jsonb), tool_result (jsonb), pdf_r2_key, estimated_revenue_band, industry_risk_tier, primary_interest_jurisdiction, persona_tag, funnel_track, converted_user_id, created_at. Ordered `created_at` desc, `limit(200)`.
- No try/catch: a DB error becomes an unhandled 500 (Next default).
- No pagination, offset, or query params.

## Step-by-step flow
1. Page mounts, `fetch('/api/admin/leads')`; a non-ok response throws, otherwise `.json()` and `data.leads ?? []`. Any failure (401, 500, network, non-JSON body) sets `error` and shows a `cl-empty is-error` alert "Could not load leads. Check your connection and try again."; `loading` clears in `finally`.
2. Handler: `requireAdmin()` -> `db.select().from(leads).orderBy(desc(created_at)).limit(200)`.
3. Table columns (6): Contact (email, WhatsApp, `badge-success` "Converted to client" when `converted_user_id` set), Source Tool (`badge-info`, label map, falls back to raw value), Persona (`badge` with `persona_tag`, or em dash), Interest (`primary_interest_jurisdiction` with `-` replaced by space and each word capitalized by `formatInterest`; hidden on phones), Track (`consultation_led` -> `badge-accent` "Consultation", else `badge-info` "Self-serve"; null -> dash; hidden on phones), Captured (`toLocaleString()`).
4. `PageHeader` subtitle ends with `leadCountLabel(rows.length)` ("1 lead", "200 leads"; counts loaded rows, max 200, not total; omitted while loading or on error). An empty list shows `cl-empty` "No leads have been captured yet."

## Data
- Read: `leads` only. Source tool enum (10): tax_calculator, banking_odds, nda_generator, jurisdiction_quiz, vat_scorer, ubo_privacy, compliance_calendar, visa_estimator, name_checker, qfzp_eligibility (`schema.ts:308-321`). Revenue band enum: under_50k, 50k_150k, 150k_500k, over_500k. Risk tier: low, medium, high. Funnel track: self_serve, consultation_led.
- Fetched but NOT displayed: `estimated_revenue_band`, `industry_risk_tier`, `tool_input`, `tool_result`, `pdf_r2_key`, `id`. `converted_user_id` only as a chip.
- No join to `users`, `companies` or orders.

## Business rules and constants
- Limit 200 (`route.ts:13`). Funnel track badge keyed on exact string `consultation_led` (`trackBadge` in `src/lib/admin-ui/leads.ts`).
- Source label map has all 10 enum values; any new tool added to the schema enum shows its raw slug until `SOURCE_LABELS` in `src/lib/admin-ui/leads.ts` is updated.

## Auth, permissions, security
- Page gate: middleware, JWT role `admin` or `super_admin` (`middleware.ts:78-99`). API gate: `requireAdmin()`.
- What a sales user can do today: nothing. Roles `staff`/`operations` are rejected by both gates, so only `admin`/`super_admin` can open the page. Even admins can only read; there is no PATCH/POST/DELETE for leads and no note, status, owner, or export.
- PII: the API returns `tool_input`/`tool_result` JSON (can contain emails, revenue, answers) to the browser although the UI ignores them. Acceptable for admins but larger than necessary.

## Failure modes and edge cases
- 401/500/network errors show the error alert instead of an empty list (the page checks `res.ok` and catches rejections).
- >200 leads: older ones are unreachable from the UI.
- Duplicate captures of the same person appear as separate rows (no dedupe).
- `primary_interest_jurisdiction` null -> dash.

## Tests
`src/lib/admin-ui/leads.test.ts` covers the helpers and page-source assertions; `tests/fde.test.ts` only references the route path. Still worth writing:
1. GET without cookie -> 401; with client-role JWT -> 401.
2. GET as admin with 250 seeded leads -> exactly 200, first has newest `created_at`.
3. Response items include `source_tool` and `converted_user_id` keys.
4. Page render (component test) with `{leads:[]}` shows "No leads have been captured yet."; with one lead where `converted_user_id` set shows "Converted to client".
5. `funnel_track:'consultation_led'` renders "Consultation".

## Known bugs and gaps
- No filter/search/sort/export, no pagination (`route.ts:13`, the page has no controls).
- Missing sales context columns: revenue band, industry risk, tool result.
- No lead -> pipeline conversion or assignment; `converted_user_id` is set elsewhere (unverified where; `onboarding/complete` is the likely writer).
- No try/catch in handler.

## Change guide
- Add filters server-side via query params + `where(...)`, keep `requireAdmin()` first. Add columns by extending `LeadRow` and the table; avoid returning `tool_input`/`tool_result` unless needed (select explicit columns).
- If adding sales-user access you must change `requireAdmin`, `middleware.ts` and role handling (protected zones, human approval); see [admin-bootstrap-and-guard](admin-bootstrap-and-guard.md).
- New lead source tool: update schema enum, `SOURCE_LABELS` (`src/lib/admin-ui/leads.ts`), and capture route.

## Related features
[lead-capture-and-persona](lead-capture-and-persona.md), [admin-clients](admin-clients.md), [admin-kanban-pipeline](admin-kanban-pipeline.md), [admin-bootstrap-and-guard](admin-bootstrap-and-guard.md), [tool-result-pdf-and-email](tool-result-pdf-and-email.md)
