# Module: Onboarding and Leads (registration wizard, lead capture, persona)
**Last verified against code**: 2026-10-30

## Purpose
`/onboarding` is the registration page: it creates or updates a `users` row, sets a session cookie, and links a prior tool-generated lead. `/api/leads/capture` stores tool results as `leads` and classifies a persona/funnel track from signals via `src/lib/persona.ts`.

## Files
- `src/app/onboarding/page.tsx` - client wizard, 3 steps (AGENTS.md says 5; code says `totalSteps = 3`, line 55)
- `src/app/welcome/page.tsx` - static 3-slide carousel (hard-coded copy), links to `/onboarding` and `/auth`; no API calls
- `src/app/api/onboarding/complete/route.ts` - upsert user, mint session, link lead, classify persona
- `src/app/api/leads/capture/route.ts` - insert lead (dedup-enrich by email/phone), PostHog events
- `src/lib/persona.ts` - pure classifier (`bandFromAnnualProfit`, `industryRiskTier`, `trackTypeFromSignals`, `funnelTrackFromSignals`, `classifyPersona`)
- `src/lib/posthog-server.ts` - `identifyServer`, `captureServerEvent`
- `src/lib/db/schema.ts` - `leads` (line 304), `users` (line 33)

## Routes and API
| Method Path | Auth required? | Notes |
|---|---|---|
| GET /onboarding, /welcome | no (middleware leaves them public) | |
| POST /api/onboarding/complete | no | sets `gcc_session` cookie on success |
| POST /api/leads/capture | no | returns the full lead row in `{lead}` |
| GET /api/admin/leads | admin (`requireAdmin`) | consumes the table (outside this module) |

## Data
- `leads`: email, whatsapp_number (both nullable), source_tool (enum of 10), tool_input jsonb, tool_result jsonb, pdf_r2_key, estimated_revenue_band (`under_50k|50k_150k|150k_500k|over_500k`), industry_risk_tier (`low|medium|high`), primary_interest_jurisdiction (6 ids), persona_tag text, funnel_track (`self_serve|consultation_led`), converted_user_id -> users, created_at. `track_type` is NOT a column.
- `users` columns written: email (lowercased), whatsapp_number, full_name, password_hash, country_of_residence, role (`client` on create), updated_at.

## External services and env vars
PostHog server key (via `posthog-server.ts`; var name unverified, see that file). `JWT_SECRET` (cookie signing). No email/WhatsApp sent here.

## Key flows
1. Tool -> lead (intended): tool computes result -> POST `/api/leads/capture` `{source_tool, email|whatsapp_number, tool_input, tool_result, signals}` -> finds latest lead by email OR phone -> `classifyPersona(signals, existing)` -> INSERT new lead row (never UPDATE; every capture is a new row) -> PostHog `lead_captured`.
2. Registration: `/onboarding` step 1 (name, email, country; default "United Arab Emirates"), step 2 (goal, budgetBand default `50k_150k`, timeline, wantsRelocation), step 3 (password >=6, confirm, optional phone) -> POST complete -> user resolved by existing session userId, else by email OR phone -> UPDATE or INSERT (`whatsapp_number = 'temp_<ms>'` if no phone) -> new JWT cookie -> find latest lead by email/phone (skips `temp_`) -> classify -> set `leads.converted_user_id` on that one lead if unset -> PostHog `registration_completed` -> router.push(`redirect` param, default `/dashboard`).
3. OTP users: `/auth` verify-otp returns `isNewUser` (no full_name) -> UI sends them to `/onboarding?redirect=`, which updates their row.

## Business rules and invariants
- Budget bands -> midpoint dollars (`complete/route.ts:10`): 25000, 100000, 300000, 750000 -> `bandFromAnnualProfit` thresholds `<50000`, `<150000`, `<500000`, else over_500k (`persona.ts:12-15`). Round-trips to the same band.
- Industry risk (`persona.ts:7-8`, substring, case-insensitive): high = crypto, forex, gambling, trading; low = e-commerce, ecommerce, consulting, technology, tech, saas; else medium; empty -> undefined. Note "tech" also matches e.g. "fintech"; "trading" wins over low list.
- Track type: `wantsRelocation` -> `gulf`; else revenue band `150k_500k` or `over_500k` -> `gulf`; else `remote` (`persona.ts:26-33`). Explicit `signals.trackType` or `existing.track_type` overrides.
- Funnel track: `gulf` -> `consultation_led`; band `over_500k` -> `consultation_led`; else `self_serve` (`persona.ts:35-42`).
- Persona tag: `"Gulf Relocator"` or `"Offshore Optimizer"`, plus `"high-risk industry"` if risk high, plus `"interested in <jurisdiction>"`, comma-joined.
- Later signals fill/override gaps via `??` (new signal wins over existing).
- Password hashing only when password is a string with length >= 6; server enforces nothing else.

## Security notes
- Not a listed protected file, but it mints sessions: `onboarding/complete` is unauthenticated and, for an email/phone matching an existing user (including an admin), overwrites full_name/email/password_hash/phone and returns a cookie for THAT user with their role. This is an account-takeover path; treat any edit here as security-sensitive and ask a human.
- `/api/leads/capture` is unauthenticated, accepts arbitrary `source_tool` (cast `as any`, DB enum rejects unknown with 500), unbounded JSON, no rate limit, and echoes the full inserted row back. Anyone knowing a lead UUID can later call `/api/pdf/generate` (no auth).
- `signals` come from the client unvalidated, so persona/funnel_track can be forged.

## Tests
`src/lib/persona.test.ts` covers persona.ts only. None for the two route handlers or the wizard.

## Known gaps and suspicious things
- No tool page in `src/app/tools/**` calls `/api/leads/capture` (grep verified), so in the current code `leads` is only ever created by direct API calls; `/api/pdf/generate` requires an existing `lead_id`, so PDF/email delivery has no UI path to a real lead.
- Onboarding classification result (persona_tag, funnel_track) is returned to the client and sent to PostHog but is NOT written to the DB; `goal`, `timeline`, `countryOfResidence` (to the lead) are never persisted except country on `users`.
- Dedup by `existing` passes no `track_type`, so a previous `gulf` track is not carried unless re-derivable from band.
- `leads` rows linked to a user only for the single latest lead; older leads for the same contact stay unlinked.
- Temp phone `temp_<Date.now()>` placeholder lives in a unique notNull column; later OTP login with a real phone creates a second user instead of matching.
- AGENTS.md "5-step wizard" and CODEMAP are out of sync with the 3-step page.

## Change guide
- Add a persona signal: extend `PersonaSignals` + `classifyPersona` in `persona.ts`, add cases in `persona.test.ts`, then pass it from the caller. A new stored value needs a nullable column in `schema.ts` + `npm run db:generate`.
- Add a lead source tool: add the string to the `source_tool` enum in `schema.ts` (additive migration) and to the CaptureRequest caller.
- Persist onboarding persona: add columns/update to `leads` or `users` (additive); keep `classification` as the single source.
- Changing wizard fields: update the page state, the JSON body, and the destructure in `complete/route.ts` together.
- Pitfall: keep `BUDGET_MIDPOINTS` keys identical to the page's `BUDGET_BANDS` values.
