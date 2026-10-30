# Feature: Events and User Consent Schema

**Slug**: events-and-consent   **Spec**: docs/specs/015-events-and-consent-schema.md   **Last verified against code**: 2026-10-30

## What it does (3 sentences max)
Provides an immutable, queryable audit trail for user and lead consents in accordance with GDPR and UAE PDPL compliance requirements. Tracks lifecycle, authentication, lead, and system events with structured JSON payloads and IP/user-agent metadata. Exposes pure validation helpers and database query wrappers for recording and verifying active consents and querying event logs.

## Where it lives
- Pages / routes: Internal infrastructure (usable by API routes, webhooks, lead capture, and onboarding)
- API routes (methods, auth required): Ready for ingestion by `/api/leads/capture`, auth routes, and admin audit tools
- Components: None (data and service layer)
- lib modules: `src/lib/consent.ts`, `src/lib/events.ts`
- DB tables / columns:
  - `events`: `id` (uuid), `event_type` (text), `user_id` (uuid fk), `lead_id` (uuid fk), `payload` (jsonb), `ip_address` (text), `user_agent` (text), `created_at` (timestamp)
  - `user_consents`: `id` (uuid), `user_id` (uuid fk), `lead_id` (uuid fk), `consent_type` (text), `consent_text` (text), `granted` (boolean), `ip_address` (text), `user_agent` (text), `created_at` (timestamp)
- Env vars / external services: `DATABASE_URL` (PostgreSQL)

## Behavior and rules
- Consents must be linked to at least one identity: either `user_id` or `lead_id`.
- `hasActiveConsent` evaluates the latest consent record chronologically; if the latest record has `granted: false`, consent is treated as revoked.
- Event payloads are bounded by a maximum size of 50 KB to prevent database bloat or Denial-of-Service attacks.
- Tables include btree indexes on `(event_type, user_id, lead_id, created_at)` and `(user_id, lead_id, consent_type, created_at)`.

## Data flow
1. Caller (e.g. lead capture or settings page) invokes `recordConsent` or `logSystemEvent` with camelCase or snake_case inputs.
2. Input is validated via Zod schemas (`recordConsentInputSchema` / `logEventInputSchema`).
3. Validated record is inserted into `user_consents` or `events` table and the inserted row is returned.
4. Callers can query status via `hasActiveConsent` or `queryEvents` with pagination and date filters.

## Tests
- `src/lib/consent.test.ts`: 18 tests covering Zod validation, UUID requirements, empty inputs, camelCase/snake_case mapping, DB insertion, query filters, active/revocation state checks, and audit line formatting.
- `src/lib/events.test.ts`: 15 tests covering payload size limits, system vs. user events, DB insertion, pagination, date filtering, in-memory filtering, and string formatting.
- Not covered: Direct third-party CRM push sync (planned for future integrations).

## Protected-zone touchpoints
None. No protected files touched.

## Known gaps / extension points
- Direct wiring into lead-capture and onboarding completion routes can now consume `recordConsent` and `logSystemEvent`.
- Admin UI audit viewer route for operations staff to inspect consent revocations and user event trails.
