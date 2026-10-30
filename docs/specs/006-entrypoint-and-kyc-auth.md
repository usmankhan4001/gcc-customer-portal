# Spec: Fail-fast migrations and KYC review auth (split from 005)

**Status**: shipped
**Requested by**: owner (F0.7c)
**Roadmap ref**: docs/versions/v2.0-foundation-android.md (F0.7)
**Protected files approved**: docker-entrypoint.sh, src/app/api/admin/kyc/review/route.ts
**Schema change**: no
**Depends on**: none
**Touches (for parallel planning)**: docker-entrypoint.sh, src/app/api/admin/kyc/review/
**Approval**: owner said "do all and make it ready" in chat on 2026-10-30 after the plan listing spec 005 and its entrypoint fix.

## Problem
1. `docker-entrypoint.sh` ignored a failed `drizzle-kit migrate` (`|| echo`), so a deploy could run new code on an old schema (specs 003/004 add two migrations).
2. `/api/admin/kyc/review` authenticated with a Bearer header and `role === 'admin'` (rejecting `super_admin`) instead of `requireAdmin()` as AGENTS.md requires.

## Acceptance criteria
- [x] AC1: A failed migration makes the container exit 1 with a FATAL message; the server does not start.
- [x] AC2: A successful migration starts the server.
- [x] AC3: `ALLOW_MIGRATION_FAILURE=1` restores the old start-anyway behavior with a WARNING (escape hatch for a database bootstrapped without migration history).
- [x] AC4: kyc/review returns 401 for anonymous and non-admin sessions and works for `admin` and `super_admin` cookie sessions.

## Test plan
`tests/entrypoint-and-kyc.test.ts` (entrypoint tests run `sh` with `MIGRATE_CMD`/`START_CMD` overrides and are skipped where `sh` is missing).

## Rollout and risk
**If production's database was created without drizzle migration history (for example with `drizzle-kit push`), `drizzle-kit migrate` fails and the container will refuse to start after this change.** Read the current production container logs for "Migration failed" before deploying. If present, either baseline the migration history or set `ALLOW_MIGRATION_FAILURE=1` for the first deploy. The kyc/review route is still a stub (see docs/ai/features/kyc-review.md).
