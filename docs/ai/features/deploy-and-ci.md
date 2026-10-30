# Feature: Deploy (Docker/Dokploy) and CI

**Slug**: deploy-and-ci   **Area**: [platform-and-infra](../modules/platform-and-infra.md)   **Status**: partial   **Last verified against code**: 2026-10-30

## What it does
The app is built into a 3-stage `node:20-alpine` Docker image using Next.js `output: 'standalone'`, and deployed (assumed) by Dokploy, which injects runtime env vars and four build args. GitHub Actions runs one job, `npm run verify` (typecheck, vitest, `next build`), on PRs and pushes to main/master. There is no deploy job, no image build in CI, and no health check. Everything here is an AGENTS.md section 5 protected zone (`Dockerfile`, `docker-entrypoint.sh`, `.github/workflows/**`).

## Entry points
- `docker build` (Dokploy or local), container `CMD ["sh","docker-entrypoint.sh"]` (`Dockerfile:66`).
- `.github/workflows/ci.yml` on `pull_request` and `push` to `main`/`master` (`ci.yml:3-6`).
- Local DB: `docker compose -f docker-compose.dev.yml up -d`.

## Files
- `Dockerfile:1-66` - stages `deps` (4-7), `builder` (10-35), `runner` (38-66).
- `docker-entrypoint.sh:1-20`, `.dockerignore`, `next.config.mjs:1-15`, `.github/workflows/ci.yml:1-22`, `docker-compose.dev.yml:1-17`, `.env.example`, `.npmrc` (`legacy-peer-deps=true`), `package.json` scripts.

## Request / response contract
none. Port 3005 (`Dockerfile:62-63`, `package.json` dev/start `--port 3005`). No `/api/health` route exists, no Docker `HEALTHCHECK`.

## Step-by-step flow
1. `deps`: copy `package.json`, `package-lock.json*`, `.npmrc*`; `npm ci` (includes devDependencies, needed for build).
2. `builder`: copy `node_modules` and the whole repo; declare ARG+ENV for `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_POSTHOG_KEY`, `NEXT_PUBLIC_POSTHOG_HOST`, `NEXT_PUBLIC_VAPID_PUBLIC_KEY` (`:18-25`; Next inlines `NEXT_PUBLIC_*` at build, so these must be Dokploy BUILD args, not just runtime env); `ENV DATABASE_URL="postgresql://build:build@localhost:5432/build"` (`:30`, dummy); `RUN --mount=type=cache,target=/app/.next/cache npm run build` (`:35`, BuildKit required). Note: `JWT_SECRET` is not set at build; `jwt-secret.ts` throws only when `NODE_ENV=production` AND called, and `next build` runs with production NODE_ENV, so routes must not call `getJwtSecret()` at module scope (CI passes `JWT_SECRET` anyway).
3. `runner`: `NODE_ENV=production`, user `nextjs` (uid 1001); copy `public`, `.next/standalone`, `.next/static`, `drizzle/`, `drizzle.config.ts`, `docker-entrypoint.sh`; `PORT=3005`, `HOSTNAME=0.0.0.0`.
4. Entrypoint (`set -e`): source `/app/.env` or `./.env` if present (`:4-13`; `.dockerignore` excludes `.env*` so normally absent); run `./node_modules/.bin/drizzle-kit migrate 2>&1 || echo "Migration failed (non-fatal, server will still start)"` (`:17`); `exec node server.js` (`:20`).
5. CI (`ci.yml`): checkout v4, setup-node v4 with Node 22 + npm cache, `npm ci`, `npm run verify` = `npm run typecheck && npm test && npm run build` (`package.json` scripts). Job env: `DATABASE_URL=postgres://ci:ci@localhost:5432/ci`, `JWT_SECRET=ci-secret-not-for-production`.
6. Dokploy (assumed, not in repo): Dockerfile build from git, domain/Traefik to port 3005, internal Postgres reachable as host `postgres` (`.env.example` DATABASE_URL), env vars below. How a deploy is triggered (webhook or Dokploy git integration) is unverified.

## Data
No tables. Dev DB: postgres:16-alpine, host port 55432, user/pass/db `gcc`/`gcc`/`gccstartup`, volume `gcc-dev-db` (`docker-compose.dev.yml`).

## Business rules and constants: every `process.env` read (src, scripts, config)
| Var | Read at |
|---|---|
| DATABASE_URL | `src/lib/db/index.ts:7`; `drizzle.config.ts:8`; `Dockerfile:30` (dummy); `ci.yml:13` |
| JWT_SECRET | `src/lib/jwt-secret.ts:5` (prod throw `:7`); `vitest.config.ts:9`; `ci.yml:14` |
| NODE_ENV | `src/lib/auth-policy.ts:3`; `api/auth/login/route.ts:62`; `logout/route.ts:8`; `verify-otp/route.ts:118`; `onboarding/complete/route.ts:128`; `admin/seed-admin/route.ts:59`; `app/dev/style-guide/page.tsx:98`; `lib/posthog-client.ts:24` |
| ADMIN_SEED_TOKEN | `src/lib/auth-policy.ts:11` (absent from AGENTS.md table) |
| NEXT_PUBLIC_APP_URL | `app/(authenticated)/dashboard/page.tsx:177`; `lib/email.ts:50,104,174,227`; `api/vault/share/route.ts:39`; `api/checkout/route.ts:74` |
| STRIPE_SECRET_KEY | `lib/stripe.ts:7`; `api/webhooks/stripe/route.ts:13` |
| STRIPE_WEBHOOK_SECRET | `lib/stripe.ts:63`; `api/webhooks/stripe/route.ts:21` |
| R2_ENDPOINT, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME | `lib/r2.ts:11,13,14,18`; `api/vault/presign/route.ts:20,22,23,27` (duplicate S3 client). `R2_ACCOUNT_ID` is documented but never read |
| WHATSAPP_ACCESS_TOKEN, WHATSAPP_PHONE_NUMBER_ID | `lib/whatsapp.ts:6-7`; `api/auth/send-otp/route.ts:50-53`; `api/admin/kyc/review/route.ts:59-60` |
| WHATSAPP_APP_SECRET | `api/webhooks/whatsapp/route.ts:149`; `lib/whatsapp.ts:246` |
| WHATSAPP_VERIFY_TOKEN | `api/webhooks/whatsapp/route.ts:212` |
| RESEND_API_KEY | `lib/email.ts:10` |
| NEXT_PUBLIC_VAPID_PUBLIC_KEY | `lib/push.ts:9,71`; `components/portal/PushNotificationToggle.tsx:29` |
| VAPID_PRIVATE_KEY / VAPID_SUBJECT | `lib/push.ts:10,71` / `:11` |
| NEXT_PUBLIC_POSTHOG_KEY / _HOST | `lib/posthog-client.ts:15,20`; `lib/posthog-server.ts:6,10` |
| PORT | `scripts/test-routes.js:3` (default 3005); Dockerfile ENV; read by Next's standalone `server.js` |
| CLAUDE_BIN, FDE_BUDGET_USD, FDE_MODEL | `scripts/fde/run.mjs:15,16,52` |
Also set by Docker: `HOSTNAME=0.0.0.0`, `NEXT_TELEMETRY_DISABLED=1`. `.env.local` is gitignored and denied to agents.

## Auth, permissions, security
- Image runs as non-root `nextjs`. Secrets come from Dokploy env at runtime; only the four `NEXT_PUBLIC_*` values are baked into the client bundle (public by nature).
- `next.config.mjs`: `images.remotePatterns` allows ANY https host (`hostname:'**'`); no `headers()` (no CSP, HSTS, X-Frame-Options, no cache headers for `/sw.js`); `poweredByHeader` left default.
- Entrypoint sources an `.env` file if present, executing it as shell (injection surface only if someone mounts one).
- `.dockerignore` keeps `.env.example` but not `docs/`, `ui-example/` (large images) in the builder context.

## Failure modes and edge cases
- Migration step likely never runs and any failure is swallowed (see [database-and-migrations](database-and-migrations.md)); the server starts on a stale schema and queries then fail at runtime.
- Missing NEXT_PUBLIC build args produce a bundle with empty PostHog/VAPID/APP_URL values; fixing requires rebuild, not a runtime env change.
- Missing `DATABASE_URL` at runtime falls back to localhost (`db/index.ts:7`) and the app boots but every query fails.
- Missing `JWT_SECRET` in production throws on first token use (fail-loud), and middleware calls it for every protected request (`middleware.ts` `verifyJwt` comment).
- Node mismatch: CI Node 22 vs image Node 20 (`resend` declares `devEngines >=22.12`, `engines >=20`); a runtime-only regression on 20 would not be caught by CI.
- CI `next build` has no real env, so env-dependent module-level code (e.g. `lib/r2.ts:18` reads `R2_BUCKET_NAME!` at import) is only exercised by build, not tested.
- No lint step (`npm run lint` unused in `verify`), no `docker build` check, no migration-drift check, no dependency audit, no concurrency/cancel setting.

## Tests
CI itself is the test. Worth adding:
1. CI step: `docker build .` (with dummy build args) to catch Dockerfile breakage.
2. CI step: `npx drizzle-kit generate` then `git diff --exit-code drizzle/` to catch schema drift.
3. Container smoke: start image with a bad `DATABASE_URL`, assert `GET /` returns 200 and logs show the migration failure (documents current behavior); later assert non-zero exit.
4. Image check: `ls node_modules/.bin/drizzle-kit` inside the runner image (expected to fail today, which proves the migration gap).
5. Add `GET /api/health` (no auth, no DB) plus Docker `HEALTHCHECK` and Dokploy health path.
6. Matrix CI on Node 20 and 22.

## Known bugs and gaps
- `docker-entrypoint.sh:17` swallows migration failure; `Dockerfile:56-57` comment says `npx` auto-installs but the script calls `./node_modules/.bin`.
- Standalone build lacks `drizzle-kit` (unverified); no healthcheck; no security headers; wide image host allowlist.
- AGENTS.md env table omits `R2_ENDPOINT`, `R2_BUCKET_NAME`, `ADMIN_SEED_TOKEN`, VAPID, `WHATSAPP_APP_SECRET`, `WHATSAPP_VERIFY_TOKEN`; lists unused `R2_ACCOUNT_ID`.
- `NEXT_PUBLIC_*` additions silently do nothing in prod unless the Dockerfile gets a new ARG/ENV pair.

## Change guide
- New env var: read it lazily inside a function; add to `.env.example`; if `NEXT_PUBLIC_*`, add `ARG`+`ENV` in the builder stage and a Dokploy build arg. Update the table above and AGENTS.md.
- Any edit to `Dockerfile`, `docker-entrypoint.sh`, `.github/workflows/**` needs human approval (also in FDE `PROTECTED`, `scripts/fde/lib.mjs:4-13`). Test `docker build` and a container start locally.
- To make migrations real: ship a tiny `scripts/migrate.mjs` using `drizzle-orm/postgres-js/migrator`, copy it and `postgres`/`drizzle-orm` into the runner (they are already traced), and make the entrypoint exit non-zero on failure; or add `outputFileTracingIncludes` for `drizzle-kit`.
- Android/FCM readiness: the web deploy stays unchanged. Add env `FIREBASE_SERVICE_ACCOUNT_JSON` (server secret, runtime), a CORS allowlist for `capacitor://localhost` and `https://localhost` origins in `next.config.mjs` `headers()` or middleware if the app bundles assets, and `CAPACITOR_SERVER_URL` handling in the mobile project. Keep Capacitor build/signing in a separate workflow (new file, human approval) with secrets for the Play keystore; Next API routes mean `next export` is not possible, so the app is either a remote-URL shell or a static client calling this backend with bearer tokens.

## Related features
[database-and-migrations](database-and-migrations.md), [testing-and-fde-pipeline](testing-and-fde-pipeline.md), [pwa-and-service-worker](pwa-and-service-worker.md), [analytics-posthog](analytics-posthog.md), [admin-bootstrap-and-guard](admin-bootstrap-and-guard.md), [vault-upload](vault-upload.md)
