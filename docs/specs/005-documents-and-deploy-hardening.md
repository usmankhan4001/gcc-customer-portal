# Spec: Documents and deploy hardening (F0.7c)

**Status**: draft
**Requested by**: owner (security findings, docs/ai/MODULES.md open issues)
**Roadmap ref**: docs/versions/v2.0-foundation-android.md (F0.7)
**Approval**: NOT YET GIVEN. Touches protected zones: vault routes, `docker-entrypoint.sh`, KYC admin route. Owner must approve before building.

## Problem (reported by feature-doc agents; each to be confirmed in code at build time)
1. Vault upload (`api/vault/presign/route.ts:86-119`) supersedes the old document and inserts the new row before the file reaches R2; a failed PUT leaves the old document hidden and the new row pointing at a missing object. There is no file-type allow-list.
2. Share links store the token raw (`shareable_links.token`), have no revoke endpoint and no password option.
3. `docker-entrypoint.sh:17` runs `drizzle-kit migrate` and continues on failure (`|| echo ...`), so a failed migration produces a running app on an outdated schema. (Confirmed in code.)
4. `/api/admin/kyc/review` authenticates with a Bearer header and `role === 'admin'` (rejects `super_admin`), does not use `requireAdmin()`, and is a stub that returns success without saving.

## Scope
- In: items 1 to 4.
- Out: building the real KYC review workflow (v2.1, F1.7); malware scanning; changing the 7-day link TTL.

## Acceptance criteria
- [ ] AC1: Upload is two-phase: presign creates a `pending` document row without superseding anything; a confirm call (after the client PUT succeeds, verified with an R2 HEAD) activates it and supersedes the previous version in one transaction. Abandoned pending rows are ignored by listings.
- [ ] AC2: Presign rejects content types outside an allow-list (PDF, JPEG, PNG, WebP, HEIC) and sizes above the existing limit with 400.
- [ ] AC3: Share tokens are stored as a SHA-256 hash; the raw token is returned once at creation. Existing links keep working or are invalidated with a documented migration choice.
- [ ] AC4: Owner can revoke a share link (`DELETE`/`POST` revoke endpoint, owner-only); a revoked or expired link returns 404 on the shared page and the access log records the attempt.
- [ ] AC5: Optional password on a share link, stored hashed, checked before any presigned URL is issued.
- [ ] AC6: A failed migration makes the container exit non-zero (deploy fails visibly) instead of starting the server.
- [ ] AC7: `/api/admin/kyc/review` uses `requireAdmin()` (admin and super_admin), cookie-based; its behavior is otherwise unchanged and the stub status stays documented.

## Touches
- Schema: `documents.status` gains `pending` (TS-only text enum; confirm no DB check constraint), `shareable_links.token_hash`, `revoked_at`, `password_hash` (additive; migration backfills hashes if keeping old links).
- Files: `src/app/api/vault/**`, `src/app/vault/shared/[token]/page.tsx`, `src/lib/r2.ts` (HEAD helper), `docker-entrypoint.sh`, `src/app/api/admin/kyc/review/route.ts`, vault UI upload code.
- Protected areas: vault, deploy files (approval needed).

## Test plan
Route tests with mocked db and r2 for AC1 to AC5 and AC7; a shell-level check for AC6 (script exits non-zero when the migrate command fails, using a stub `drizzle-kit`). Each fails on current code. `npm run verify` passes.

## Rollout and risk
- AC6 makes a bad migration block deploys. That is the intent, but test the migration path in a staging deploy first; the current silent fallback may be hiding an existing migration failure in production. Check the production container logs before deploying.
- Changing the upload flow changes the client contract; the Android app will use the same flow, so do this before F0.5.
