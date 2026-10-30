# Feature: Onboarding wizard (registration)

**Slug**: onboarding-wizard   **Area**: [onboarding-and-leads](../modules/onboarding-and-leads.md)   **Status**: partial (registration works; goal/timeline dropped; persona not persisted)   **Last verified against code**: 2026-10-30

## What it does
A 3-step form at `/onboarding` creates a new client account with name, email, country, revenue band, relocation intent, password and optional WhatsApp number, then signs the user in and sends them to the `redirect` target (default `/dashboard`). `/welcome` is a separate 3-slide marketing carousel that links into it. The server also classifies the person into a persona/funnel track and links any earlier tool lead to the new user.

## Entry points
- `/onboarding` -> `src/app/onboarding/page.tsx` (`OnboardingWizard`). Linked from `/auth` ("Register & Onboard", `isNewUser` redirect) and `/welcome`.
- `/welcome` -> `src/app/welcome/page.tsx` (static carousel, no API).
- `POST /api/onboarding/complete`.
- Both pages are public (not in `PROTECTED_PREFIXES`; middleware.ts:42-43 comment).

## Files
- `src/app/onboarding/page.tsx:48-427` - wizard state, validation, submit.
- `src/app/welcome/page.tsx:7-135` - slides (`18+ Jurisdictions`, `0%`, `48hr` marketing copy), CTAs to `/onboarding` and `/auth`.
- `src/app/api/onboarding/complete/route.ts:17-193` - account create/update.
- `src/lib/persona.ts` - `classifyPersona`, `bandFromAnnualProfit` (see [lead-capture-and-persona](lead-capture-and-persona.md)).
- `src/lib/auth.ts` - `hashPassword`, `generateToken`, `verifyToken`.
- `src/lib/posthog-server.ts` - `identifyServer`, `captureServerEvent`.
- `src/components/ui/PhoneInputWithCountry.tsx`, `CountrySelect.tsx` - inputs.
- Schema: `users` (schema.ts:33-46), `leads` (:304-340).

## Request / response contract
**POST /api/onboarding/complete** (JSON). Body fields read by the route: `fullName` (required), `email` (required), `countryOfResidence`, `budgetBand`, `wantsRelocation`, `password`, `phone`. The UI also sends `goal` and `timeline`; the route destructures them but never uses them (route:20-30).
- 400 `{error:'Full legal name and email address are required.'}` (:32-37).
- 409 `{error:'An account with these details already exists. Please sign in instead.'}` when no valid session AND a user exists with that email or phone (:66-81).
- 500 `{error:'Could not complete user registration.'}` if user is empty (:115); 500 `{error:'Failed to complete registration.'}` on any throw (also malformed JSON, and unique-constraint errors).
- 200 `{success:true, user:{id,fullName,email,whatsappNumber}, funnel_track, persona_tag}` + cookie `gcc_session` (httpOnly, secure in prod, lax, path `/`, 7d).

## Step-by-step flow
UI:
1. Step 1 (fullName, email, country default `'United Arab Emirates'`): `nextStep` requires non-empty trimmed name and an email containing `@` (page.tsx:77-90).
2. Step 2: goal (6 radio cards, default `company_registration`), budgetBand (default `50k_150k`), timeline (default `asap`), wantsRelocation checkbox.
3. Step 3: password (min 6), confirm, optional phone. Submit button disabled until `password.length >= 6`; `handleFinalSubmit` re-checks length and equality (:97-108).
4. POST; on `res.ok && data.success` -> `router.push(redirectTo || '/dashboard')`; else shows `data.error`.
Server (`route.ts`):
5. Validate name/email (:32). `cleanEmail` trim+lowercase; `cleanPhone` strips all but digits and `+` (:39-40).
6. Read `gcc_session`, `verifyToken` -> `existingSession` (:43-45). If a password >= 6 chars is present, `hashPassword` (scrypt, `salt:key`) (:48-51). Shorter passwords are silently ignored.
7. If session present, load that user by id (:55-62).
8. If no session user: look up `users` by email OR phone; if found -> 409 (the 002 takeover fix) (:66-81).
9. If session user: `UPDATE users SET updated_at, full_name, email, country_of_residence?, password_hash?, whatsapp_number?` where id = session user (:83-98). So an OTP-created user completes their profile here.
10. Else `INSERT users {whatsapp_number: cleanPhone || 'temp_<Date.now()>', email, full_name, country_of_residence: countryOfResidence || 'UAE', password_hash, role:'client'}` (:100-112).
11. Mint JWT and set cookie (:120-132).
12. Lead link: find newest `leads` row matching user email OR (non-`temp_`) phone (:135-150). Build `PersonaSignals`: `revenueBand = bandFromAnnualProfit(BUDGET_MIDPOINTS[budgetBand])`, `wantsRelocation`, `primaryInterestJurisdiction` from lead (:152-156); `classifyPersona(signals, existing lead fields)` (:158-163).
13. If lead found and `converted_user_id` null -> `UPDATE leads SET converted_user_id` (:165-167). No new lead is created and persona is NOT written to any table.
14. PostHog `identifyServer(user.id, {...})`, `captureServerEvent('registration_completed', {funnel_track})` (:169-176); both fire-and-forget helpers.

## Data
- `users`: writes `full_name, email (unique), whatsapp_number (unique, not null), country_of_residence, password_hash, role='client', updated_at`.
- `leads`: reads, and writes `converted_user_id` only.
- NOT stored: `goal`, `timeline`, persona tag/track, relocation flag, revenue band (only returned in the response and sent to PostHog). `users` has no columns for them.

## Business rules and constants
- `BUDGET_MIDPOINTS`: `under_50k 25000`, `50k_150k 100000`, `150k_500k 300000`, `over_500k 750000` (route:10-15). Mapped back through `bandFromAnnualProfit` thresholds 50000/150000/500000 so each midpoint round-trips to its own band.
- Persona rules: relocation or band `150k_500k`/`over_500k` -> track `gulf` -> `consultation_led`; otherwise `remote`/`self_serve`; `over_500k` is always `consultation_led`.
- Password min 6 (UI and route). Country default string differs: UI `'United Arab Emirates'`, server fallback `'UAE'`.
- Option lists (page.tsx:25-46): goals `company_registration, tax_optimization, banking_access, bookkeeping, privacy, exploring`; timelines `asap, 1_3_months, 3_6_months, exploring`.

## Auth, permissions, security
- Public. New account: anyone can create one, no email/phone verification. An existing user can be modified only via their own valid session (002 fix, tested in `tests/auth-routes.test.ts`). AGENTS.md protected zone: auth routes.
- A new account can claim an unverified phone number. Later, the real owner doing OTP login for that number matches the attacker-created `users` row (verify-otp:89) and is signed into an account whose password the attacker set. Evidence: onboarding:100-112 + verify-otp:89.
- Logged-in users who submit different email/phone are updated without re-verification.

## Failure modes and edge cases
- Session user changes `email`/`phone` to one owned by another account -> unique violation -> 500 'Failed to complete registration.' (the 409 pre-check only runs when there is no session user).
- New user without phone gets `temp_<ms>`: same-millisecond collisions fail on unique; these users can never use OTP login.
- No password supplied (server accepts) -> account with no password; UI always sends one.
- Session token valid but its user was deleted -> `user` null -> falls through to the dedupe check, may insert new user.
- Lead lookup/update and PostHog errors after the cookie is set fall into the catch -> 500 even though the user and cookie were created (the client then sees an error, but is logged in). The lead `UPDATE` at :166 is not wrapped.
- `redirect` param is unvalidated (page.tsx:51,131).

## Tests
Existing: `tests/auth-routes.test.ts` covers only the 409 takeover refusal (mocked db). `src/lib/persona.test.ts` covers persona functions. Not covered: positive paths.
Worth writing:
1. No session, empty db, body `{fullName,email,password:'secret1',phone:'+971 50 123 4567'}` -> 200, insert called with `whatsapp_number:'+971501234567'`, email lowercased, `set` cookie called once.
2. Same body with db returning an existing user and no session -> 409, no update/insert.
3. Valid session user (OTP user) + body -> `update` called with `full_name`, not `insert`.
4. `budgetBand:'over_500k'` -> response `funnel_track:'consultation_led'`; `under_50k` + `wantsRelocation:false` -> `self_serve`, `persona_tag:'Offshore Optimizer'`.
5. password `'abc'` -> account created with no `password_hash` (documents current behavior).
6. A matching lead with null `converted_user_id` gets updated to the new user id.

## Known bugs and gaps
- `goal` and `timeline` collected but discarded (route:20-30 destructure, no use) - sales context lost.
- Persona result never persisted; only the lead's `converted_user_id` link is written.
- Unverified phone claiming (above) and no email verification.
- 500 after cookie set if lead link or later step throws (route:165-167).
- Server accepts passwords under 6 chars silently.
- No rate limiting; account creation spam possible.
- Short-password and mismatch checks only client-side.

## Change guide
- To store goal/timeline, add columns to `users` (or a profile table), a migration, and persist in both insert and update branches.
- To persist persona, write `persona_tag/funnel_track` into the matched lead or create a lead with a new `source_tool` enum value (enum is closed, schema.ts:308-320).
- Keep 409 behavior for unauthenticated existing users; do not reintroduce lookup-then-update.
- Update `docs/ai/features/002-auth-route-hardening.md` if changing auth semantics.

## Related features
[lead-capture-and-persona](lead-capture-and-persona.md), [whatsapp-otp-login](whatsapp-otp-login.md), [password-login-logout](password-login-logout.md), [session-and-route-guard](session-and-route-guard.md), [analytics-posthog](analytics-posthog.md)
