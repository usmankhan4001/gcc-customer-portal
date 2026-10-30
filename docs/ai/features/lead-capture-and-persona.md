# Feature: Lead capture and persona classification

**Slug**: lead-capture-and-persona   **Area**: [onboarding-and-leads](../modules/onboarding-and-leads.md)   **Status**: complete   **Last verified against code**: 2026-10-30

## What it does
`POST /api/leads/capture` stores an anonymous visitor's free-tool submission (inputs, results, contact) as a row in `leads` and tags it with a persona (`Gulf Relocator` / `Offshore Optimizer`), a revenue band, risk tier, jurisdiction interest and funnel track (`self_serve` or `consultation_led`). Repeat submissions by the same email/WhatsApp inherit earlier signals. Admins read the rows at `/admin/leads`; registration later links a lead to the new user. The classifier lives in `src/lib/persona.ts` and is also used by [onboarding-wizard](onboarding-wizard.md).

## Entry points
- `POST /api/leads/capture` (public, `/api/` is a middleware PUBLIC path).
- Intended callers: the 10 lead-gen tools under `src/app/tools/*`. **Actual callers: none found.** `grep -rn "leads/capture" src` matches only the route file itself; the two tool pages that call an API use `/api/calculator/evaluate` and `/api/quiz/evaluate` (`src/app/tools/tax-calculator/page.tsx:39`, `jurisdiction-quiz/page.tsx:50`). So in this codebase `leads` rows can currently only be created if some external client posts to the route. `/api/pdf/generate` requires an existing `lead_id` (route.ts:29) so it depends on rows that nothing in the repo creates.
- Library: `classifyPersona` also called by `src/app/api/onboarding/complete/route.ts:158`.

## Files
- `src/app/api/leads/capture/route.ts:17-90` - handler.
- `src/lib/persona.ts:1-97` - types, thresholds, `bandFromAnnualProfit`, `industryRiskTier`, `trackTypeFromSignals`, `funnelTrackFromSignals`, `classifyPersona`.
- `src/lib/db/schema.ts:304-340` - `leads` table.
- `src/lib/posthog-server.ts` - `identifyServer`, `captureServerEvent` (no-ops without `NEXT_PUBLIC_POSTHOG_KEY`).
- `src/app/api/admin/leads/route.ts:13` (reads newest 200), `src/app/admin/leads/page.tsx` (viewer), `src/app/api/pdf/generate/route.ts:29-42` (sets `pdf_r2_key`), `onboarding/complete/route.ts:135-167` (sets `converted_user_id`).
- Test: `src/lib/persona.test.ts`.

## Request / response contract
**POST /api/leads/capture** JSON body:
- `source_tool` string, required (truthy). NOT validated against the enum; cast `as any` (route:62).
- `email` string, `whatsapp_number` string: at least one required.
- `tool_input` object, `tool_result` object: not validated; stored as jsonb (undefined -> null).
- `signals` optional `PersonaSignals`: `{revenueBand, industryRiskTier, primaryInterestJurisdiction, trackType, wantsRelocation}`; not validated, caller-controlled.
Responses:
- 400 `{error:'source_tool and at least one of email/whatsapp_number are required'}` (:22-27).
- 200 `{lead: <full leads row>}` (:85) including `tool_input`, `tool_result`, `persona_tag`, `funnel_track`.
- 500 `{error:'Internal server error'}` on any throw (malformed JSON included). No cookies read or set.

## Step-by-step flow
1. Parse and destructure body (:19-20); reject if no `source_tool` or neither contact field (:22).
2. Build match conditions `leads.email = email` and/or `leads.whatsapp_number = whatsapp_number` (exact, case-sensitive, un-normalized) (:32-34); select newest matching row `ORDER BY created_at DESC LIMIT 1` (:36-43).
3. `classifyPersona(signals ?? {}, existing ? {persona_tag, estimated_revenue_band, industry_risk_tier, primary_interest_jurisdiction} : undefined)` (:45-55). Existing `track_type` is not passed (the table has no such column).
4. Always `INSERT` a new `leads` row (never update): `email = email ?? existing.email ?? null`, `whatsapp_number` likewise, plus tool data and the classification fields (:57-71). Dedup therefore only means "inherit signals and missing contact", not "one row per person".
5. PostHog `identifyServer(row.id, {...})` and `captureServerEvent(row.id, 'lead_captured', {source_tool, persona_tag, primary_interest_jurisdiction})` (:73-83). Note the distinct id is the LEAD id, whereas onboarding uses the USER id, so the lead and the later user are different PostHog people.
6. Return the row.

## Persona rules (`src/lib/persona.ts`)
- `bandFromAnnualProfit(p)`: `<50000 under_50k`; `<150000 50k_150k`; `<500000 150k_500k`; else `over_500k`; null/NaN -> undefined (:10-16).
- `industryRiskTier(industry)`: substring match, lowercase. High: `crypto, forex, gambling, trading`; low: `e-commerce, ecommerce, consulting, technology, tech, saas`; otherwise medium; empty -> undefined (:7-8,18-24). `'tech'` matches any industry string containing it (e.g. "fintech"), checked after the high-risk list. The capture route never calls this; callers must pre-compute `industryRiskTier` in `signals`.
- `trackTypeFromSignals`: `wantsRelocation` -> `gulf`; band `150k_500k` or `over_500k` -> `gulf`; else `remote` (:26-33).
- `funnelTrackFromSignals`: `trackType==='gulf'` -> `consultation_led`; band `over_500k` -> `consultation_led`; else `self_serve` (:35-42).
- `classifyPersona` (:68-97): each field = new signal else existing value; `trackType = signals.trackType ?? existing.track_type ?? derived`; `persona_tag` = join(', ') of `Gulf Relocator` | `Offshore Optimizer`, optional `high-risk industry` (only when risk is `high`), optional `interested in <jurisdiction>`. Example: `Gulf Relocator, high-risk industry, interested in uae`.
- Jurisdiction enum: `uae, hong-kong, singapore, bahrain, ireland, bvi`.

## Data
`leads`: `id uuid pk`, `email text`, `whatsapp_number text`, `source_tool text enum` (`tax_calculator, banking_odds, nda_generator, jurisdiction_quiz, vat_scorer, ubo_privacy, compliance_calendar, visa_estimator, name_checker, qfzp_eligibility`; TS-level only, no DB check constraint, so any string is stored), `tool_input jsonb`, `tool_result jsonb`, `pdf_r2_key text`, `estimated_revenue_band`, `industry_risk_tier`, `primary_interest_jurisdiction`, `persona_tag text`, `funnel_track`, `converted_user_id uuid -> users.id`, `created_at`. No unique/index on email or phone. NOT stored: `track_type` (recomputed each time), `wantsRelocation`, IP, consent, UTM.

## Auth, permissions, security
Fully public, no auth, no captcha, no rate limit. Reading leads requires admin (`requireAdmin`, `api/admin/leads`). Not a protected zone.

## Failure modes and edge cases
- Caller supplies only `whatsapp_number` that matches an old lead: the new row copies the old `email` and the 200 response returns it, so the endpoint discloses the email for a phone number (and vice versa). PII leak to any anonymous caller.
- Email case/whitespace differences create unlinked rows; onboarding lowercases (`onboarding/complete:39`) so mixed-case leads are never linked by `eq(leads.email, user.email)`.
- Because `track_type` is not stored and `wantsRelocation` is not persisted, a second capture without relocation can flip a lead from `gulf` to `remote` unless the band keeps it gulf; `funnel_track` follows.
- Arbitrary `signals`/`source_tool` can be injected; spam and bogus personas are possible. `tool_input/result` have no size limit.
- Invalid JSON -> 500 (not 400).
- PostHog throwing would 500 after the row is inserted (sync calls, no try).

## Tests
Existing: `src/lib/persona.test.ts` (band thresholds, risk tiers, track routing, merge of existing signals). No route test.
Worth writing:
1. capture with `{source_tool:'tax_calculator', email:'a@b.com', tool_input:{}, tool_result:{}, signals:{revenueBand:'over_500k'}}` -> 200, `funnel_track:'consultation_led'`, `persona_tag:'Gulf Relocator'`.
2. No contact -> 400; no `source_tool` -> 400.
3. Second capture with same email and `signals:{}` -> new row (insert count 2) with `estimated_revenue_band` inherited.
4. Capture with only `whatsapp_number` of an existing lead -> response `email` equals the old email (documents the leak; flip once fixed).
5. `classifyPersona({industryRiskTier:'high', primaryInterestJurisdiction:'uae', wantsRelocation:true})` -> tag `Gulf Relocator, high-risk industry, interested in uae`.
6. Onboarding with an existing lead for the email sets `converted_user_id` once and not again.

## Known bugs and gaps
- No code calls the endpoint (evidence above) - the lead funnel for all 10 tools is not wired, so `/admin/leads`, PDF generation by `lead_id` and the persona link at registration have no data. Highest-impact functional gap.
- PII disclosure via inherited contact fields (route:60-61, 85).
- Public, unauthenticated, unvalidated writes (route:19-71).
- `source_tool` enum not enforced at runtime (route:62).
- Comment says "dedup" but each call inserts a new row (route:29-31 vs :57-71).
- PostHog distinct id mismatch between lead id and user id (route:73-83 vs onboarding:169-176).
- `industryRiskTier()` and `bandFromAnnualProfit()` are never invoked by this route; relies on callers.

## Change guide
- To wire tools, POST from each tool result step with `source_tool` matching the enum, `signals` built via `bandFromAnnualProfit`/`industryRiskTier`, and store the returned `lead.id` for `/api/pdf/generate`.
- Adding a tool: extend the enum in `schema.ts:308-320`, add a migration if you enforce it in SQL, update `SOURCE_LABELS` in `admin/leads/page.tsx`.
- Adding a persona field: add column + migration, update `PersonaClassification`, capture insert, and the existing-lead mapping at route:47-53.
- Keep `persona.test.ts` updated when thresholds change; onboarding depends on the same numbers.

## Related features
[onboarding-wizard](onboarding-wizard.md), [admin-leads](admin-leads.md), [tool-result-pdf-and-email](tool-result-pdf-and-email.md), [analytics-posthog](analytics-posthog.md), [tool-tax-calculator](tool-tax-calculator.md), [tool-jurisdiction-quiz](tool-jurisdiction-quiz.md)

## Update (specs 003 and 004, 2026-10-30)
Changed after this doc was written, see docs/specs/003-session-login-public-endpoints.md: `getServerSession()` now verifies the `gcc_session` cookie (no `x-user-*` header trust); `verify-otp` kills a code after 5 wrong attempts (`otp_codes.attempts`) and consumes it atomically; `send-otp` is limited to 3 per number per 15 min and 10 per IP per hour; `login` to 5 attempts per identifier+IP per 15 min (in-memory limiter, `src/lib/rate-limit.ts`); OTPs and hashes are no longer logged; post-login/onboarding `redirect` goes through `safeRedirectPath`; `push/unsubscribe` needs a session and is scoped to the user; `leads/capture` returns only `{ lead: { id } }`; `pdf/generate` is admin-only, escapes the email title and no longer 500s on an email failure. Tests: `tests/auth-hardening.test.ts`, `tests/email-escape.test.ts`. Statements above that contradict this are superseded.

## Update (spec 014, 2026-10-30)
Wired all 10 tools to lead capture:
- Strict Zod validation on `POST /api/leads/capture` with bounded `tool_input` and `tool_result` (<= 50KB), validated `source_tool` enum, and valid contact info.
- Added `ContactCaptureGate` client component (auth-aware: 1-click for authenticated users, non-blocking guest card with mandatory consent checkbox).
- Exact consent copy: "I agree to receive my detailed report and consultation updates via WhatsApp and Email" stored in `tool_input.consent` and `tool_input.consent_text`.
- Links `converted_user_id` when caller is authenticated.
- All 10 micro-tools wired and reset results when inputs change.
- Tests: `src/lib/tools/lead-capture.test.ts` (23 tests) and `tests/lead-capture-route.test.ts` (11 tests).
