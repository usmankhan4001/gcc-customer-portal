# Feature: Analytics (PostHog)

**Slug**: analytics-posthog   **Area**: [platform-and-infra](../modules/platform-and-infra.md)   **Status**: partial   **Last verified against code**: 2026-10-30

## What it does
PostHog gives the team funnel and drop-off visibility. The browser SDK (`posthog-js`) auto-captures pageviews and page leaves once initialised; the server SDK (`posthog-node`) sends five business events and two `identify` calls from API routes. There is no client-side `identify`, no custom client events, and no consent or opt-out handling, and server events use database UUIDs while the browser uses an anonymous id, so web sessions are never joined to users. Both sides no-op silently when no key is configured.

## Entry points
- Browser: `Providers` -> `PostHogInit` -> `initPostHog()` on every page (`src/components/layout/Providers.tsx`, mounted by `src/app/layout.tsx:45`).
- Server: `captureServerEvent` / `identifyServer` called from five routes (below).

## Files
- `src/lib/posthog-client.ts:1-37` - lazy init, placeholder-key guard (`:15-16`), config (`:19-28`), `export { posthog }`.
- `src/components/layout/PostHogInit.tsx:1-12` - `useEffect(() => initPostHog(), [])`.
- `src/lib/posthog-server.ts:1-33` - singleton `PostHog` client, `captureServerEvent` (`:23`), `identifyServer` (`:29`).
- Callers: `src/app/api/checkout/route.ts:92`, `src/app/api/webhooks/stripe/route.ts:94`, `src/app/api/leads/capture/route.ts:73,79`, `src/app/api/onboarding/complete/route.ts:169,176`, `src/app/api/webhooks/whatsapp/route.ts:135`.
- Test mocks only: `tests/auth-routes.test.ts:16` mocks `@/lib/posthog-server`.

## Request / response contract
none (no endpoint). Outbound HTTP to `NEXT_PUBLIC_POSTHOG_HOST` (default `https://us.i.posthog.com`, `posthog-client.ts:20`, `posthog-server.ts:10`). No reverse proxy or rewrite in `next.config.mjs`, so ad-blockers can drop client traffic (the init `catch` at `:30-34` only handles synchronous init errors).

## Step-by-step flow
1. Client init: `initPostHog()` returns if already `initialized`, no `window`, or `NEXT_PUBLIC_POSTHOG_KEY` is falsy/`'phc_xxx'`/`'xxx'`/whitespace. Else `posthog.init(key, {api_host, capture_pageview:true, capture_pageleave:true, loaded: ph => dev ? ph.debug(false) : undefined})`. Library defaults apply for everything else (autocapture of clicks/form interactions, and session replay if enabled in the PostHog project; both unverified for this project's settings).
2. Server client: `getClient()` returns null if `NEXT_PUBLIC_POSTHOG_KEY` is falsy; otherwise builds one `PostHog(key, {host, flushAt:1, flushInterval:0})` (each event flushed immediately, no batching). Note it does NOT apply the client's `phc_xxx`/`xxx` guard, so the `.env.example` placeholder `phc_xxx` makes the server send to PostHog with an invalid key.
3. `captureServerEvent(distinctId, event, properties)` -> `ph.capture({distinctId,event,properties})`; fire-and-forget, never awaited, never wrapped in try/catch; no `shutdown()` is called.
4. `identifyServer(distinctId, properties)` -> `ph.identify({distinctId,properties})`.

## Data
No DB. Events captured (all server-side, `distinct_id` = DB uuid):
| Event | distinct_id | Properties | Where |
|---|---|---|---|
| `checkout_started` | user.id | jurisdiction, tier, amount_usd (cents/100) | `checkout/route.ts:92` after Stripe session created |
| `checkout_completed` | user.id | company_id, jurisdiction, amount_usd | `webhooks/stripe/route.ts:94`, only when order, company and user all found |
| `lead_captured` | lead.id | source_tool, persona_tag, primary_interest_jurisdiction | `leads/capture/route.ts:79` |
| `registration_completed` | user.id | funnel_track | `onboarding/complete/route.ts:176` |
| `kyc_advanced` | user.id | company_id | `webhooks/whatsapp/route.ts:135` |
Identify calls: lead (`leads/capture:73`) with `email, whatsapp_number, persona_tag, funnel_track`; user (`onboarding/complete:169`) with `email, whatsapp_number, country_of_residence, persona_tag, funnel_track`.
Client auto-events: `$pageview`, `$pageleave` (plus autocapture, unverified). NOT tracked: login/logout, OTP, tool usage events, vault actions, payment failure, share links, onboarding step progress.

## Business rules and constants
- Env: `NEXT_PUBLIC_POSTHOG_KEY` (`posthog-client.ts:15`, `posthog-server.ts:6`; build ARG at `Dockerfile:19`), `NEXT_PUBLIC_POSTHOG_HOST` (`posthog-client.ts:20`, `posthog-server.ts:10`; ARG `Dockerfile:20`). Client values are baked at build time, so a key change needs a rebuild.
- Server flush settings `flushAt:1, flushInterval:0` (`posthog-server.ts:11-12`).

## Auth, permissions, security
- PII: `identify` sends the user's email and WhatsApp number to PostHog (US cloud by default) with no consent step; the privacy posture for the GCC/UAE/EU audience is a decision for a human (flag, not a code defect).
- Public key only; no secret. Not a protected zone, but the emitting routes (checkout, Stripe and WhatsApp webhooks) are.

## Failure modes and edge cases
- Any missing key => silent no-op (by design, `posthog-server.ts:19-22` comment).
- Identity split: browser uses PostHog's anonymous id; server uses `lead.id` then `user.id`. `leads.converted_user_id` links them in the DB only; there is no `alias`/client `identify`, so funnels that cross the anonymous -> registered boundary break and the same human appears as 2-3 persons.
- Stripe webhook is not idempotent, so `checkout_completed` fires again on every redelivery.
- Serverless-style fire-and-forget is acceptable in the long-lived Node container; on process exit, in-flight events may be lost (`shutdown` never called).
- Ad-blockers silently drop client events; Safari ITP and no proxy reduce coverage.
- `capture_pageview:true` records full URLs including query strings (e.g. `/auth?redirect=...`, share-token paths `/vault/shared/<token>` could be recorded as pageview URLs, which is sensitive: unverified how PostHog masks them, default does not).

## Tests
None for analytics. Worth writing (vitest, mock `posthog-node`/`posthog-js`):
1. `captureServerEvent` with `NEXT_PUBLIC_POSTHOG_KEY` unset -> `PostHog` constructor never called, no throw.
2. With key set -> exactly one client instance across two calls; `capture` receives `{distinctId,event,properties}`.
3. `initPostHog` with key `phc_xxx`, `xxx`, `''` -> `posthog.init` not called; with a real-looking key -> called once, second call no-op.
4. Route test: onboarding complete -> `identifyServer` then `captureServerEvent('registration_completed')` (extend `tests/auth-routes.test.ts` mock assertions).
5. Stripe webhook redelivered twice -> `checkout_completed` once (fails today).
6. Share-token page path is stripped/hashed from `$current_url` (after adding `sanitize_properties`).

## Known bugs and gaps
- Server-side key guard inconsistent with client guard (`posthog-server.ts:6-7` vs `posthog-client.ts:16`).
- No consent/opt-out, no client `identify`, no alias; events cannot be joined across the anonymous -> lead -> user journey.
- Only 5 server events; no events for the funnel's earlier steps (tool completion, onboarding steps) or failures.
- PII in `identify`; sensitive URLs in pageviews.
- Idempotency: duplicate `checkout_completed` and `kyc_advanced` possible.

## Change guide
- New event: call `captureServerEvent(user.id, '<snake_case_event>', {…})` AFTER the DB write succeeds; keep properties small and non-PII. Add the row to the table above. Client events: import `posthog` from `@/lib/posthog-client` inside a client component and guard with `posthog.__loaded`-style checks (unverified API); never block UI on it.
- To unify identities: call `posthog.identify(user.id)` on login/verify-otp success (client) and `posthog.alias(leadId, userId)` when `converted_user_id` is set; update this doc.
- Add consent: gate `initPostHog` on a stored consent flag and call `posthog.opt_out_capturing()` on revoke; add a `consents` row (see [database-and-migrations](database-and-migrations.md)). Server events must check the same flag (pass it from the session or user row).
- Keep init lazy and key-guarded; reuse one guard function for both client and server.
- Android/FCM readiness: a Capacitor app can reuse `posthog-js` in the WebView; set a `platform: 'android'` super property and the same `user.id` identify so web and app match. For fully native screens use the PostHog Android SDK with the same key/host. Create the `events` table decision first: if the team wants first-party events, mirror these five events there so analytics is not the only record. Add the new build ARGs only if keys differ per platform.

## Related features
[service-catalog-and-checkout](service-catalog-and-checkout.md), [stripe-webhook](stripe-webhook.md), [whatsapp-inbound-webhook](whatsapp-inbound-webhook.md), [lead-capture-and-persona](lead-capture-and-persona.md), [onboarding-wizard](onboarding-wizard.md), [deploy-and-ci](deploy-and-ci.md)
