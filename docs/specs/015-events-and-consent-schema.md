# Spec: Events and User Consent Schema (F0.6)

**Status**: approved
**Requested by**: owner
**Roadmap ref**: docs/versions/v2.1-engage-retain-core.md (F0.6)
**Protected files approved**: none
**Schema change**: yes
**Depends on**: 014 (shipped)
**Touches (for parallel planning)**: src/lib/db/schema.ts, src/lib/consent.ts, src/lib/events.ts, src/lib/consent.test.ts, src/lib/events.test.ts, drizzle/
**Approval**: Approved by owner in session.

## Problem
Lead capture records consent inside JSON blobs, but GDPR/UAE PDPL compliance and post-onboarding marketing requires a formal, queryable audit trail of user consents and lifecycle events (who consented, to what exact copy, when, and from what IP/device).

## Scope
- In:
  - Additive Drizzle schema tables in `src/lib/db/schema.ts`: `events` (general event log) and `user_consents` (consent audit log).
  - Pure helper functions in `src/lib/consent.ts` and `src/lib/events.ts` for recording and querying consents and system events.
  - Sibling unit test suites with 100% invariant coverage.
  - Drizzle migration generation via `npm run db:generate`.
- Out:
  - Third-party marketing CRM syncing (covered in future integrations).

## Acceptance criteria
- [x] AC1: `user_consents` and `events` tables defined in `src/lib/db/schema.ts` with correct FK references and timestamps.
- [x] AC2: `recordConsent` helper records valid consent audit entries with lead/user linkage, consent type, and copy text.
- [x] AC3: `logSystemEvent` helper inserts structured events with JSON payloads and timestamps.
- [x] AC4: Sibling tests `consent.test.ts` and `events.test.ts` pass with 100% assertions.
- [x] AC5: `npm run verify` passes with clean build and typecheck.
