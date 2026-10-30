# Module: Platform and Infrastructure
**Last verified against code**: 2026-10-30

## Purpose
Database client and schema (Drizzle + Postgres), migrations, the Docker/Dokploy deploy path, CI, helper scripts, PWA assets and analytics (PostHog). It also defines every environment variable the code reads. Almost everything here is an AGENTS.md section 5 protected zone (Dockerfile, entrypoint, workflows, destructive schema changes).

## Files
- `src/lib/db/index.ts` - `postgres` (postgres-js) client + `drizzle(client, { schema })`, exported as `db`
- `src/lib/db/schema.ts` - all 17 tables, 1 pgEnum, relations, inferred types (426 lines)
- `drizzle.config.ts` - schema `./src/lib/db/schema.ts`, out `./drizzle`, dialect postgresql, url from `DATABASE_URL`
- `drizzle/0000_wealthy_ezekiel.sql` (16 tables + `user_role` enum + FKs), `0001_rainy_mandrill.sql` (`users.password_hash`), `0002_careless_cassandra_nova.sql` (`referrals`), `drizzle/meta/*` (journal + snapshots)
- `Dockerfile` - 3-stage node:20-alpine (deps, builder, runner), port 3005, user `nextjs`
- `docker-entrypoint.sh` - sources `.env` if present, runs migrations, `exec node server.js`
- `docker-compose.dev.yml` - local postgres:16-alpine on host port 55432 (user/pass/db `gcc`/`gcc`/`gccstartup`)
- `next.config.mjs` - `reactStrictMode`, `output:'standalone'`, `images.remotePatterns` https `**`
- `.github/workflows/ci.yml` - only workflow
- `scripts/seed.ts`, `test-routes.js`, `generate-icons.js`, `convert.ps1`, `fde/{run,lib,codemap}.mjs`
- `public/manifest.json`, `public/sw.js`, `public/icons/*`, `public/favicon.ico`
- `src/components/layout/{Providers,PostHogInit,ServiceWorkerRegistration}.tsx`, `src/lib/posthog-{client,server}.ts`
- `vitest.config.ts` (alias `@`->src, env `JWT_SECRET`), `tests/fde.test.ts`

## Routes and API
No routes of its own. `src/middleware.ts` matcher is everything except `_next/static`, `_next/image`, `favicon.ico`; public prefixes: `/api/`, `/_next/`, `/icons/`, `/favicon.ico`, `/icon.png`, `/manifest.json`, `/sw.js`, `/robots.txt`, `/sitemap.xml`, `/vault/shared/`. Gated: `/dashboard /services /vault /profile /support /checkout /notifications` (redirect to `/auth?redirect=`) and `/admin*` (role check). `/onboarding` is intentionally public. No `/api/health` route exists.

## Data (17 tables; all `uuid` PKs `defaultRandom`)
- `users` - identity; whatsapp_number unique NOT NULL, email unique nullable, password_hash, role (`user_role` pgEnum: client|staff|operations|admin|super_admin), alert flags.
- `companies` - user_id FK, jurisdiction, tier, track_type, status (9 values), official KYC fields, assigned_to FK users.
- `documents` - vault file metadata (r2_key, category, status, expiry); FKs user, company.
- `document_versions` - version history per document.
- `shareable_links` - tokenised expiring share links (token unique, revoked, access_count).
- `document_access_log` - viewed|downloaded audit rows.
- `milestones` - per-company stage rows (stage_index 1-6); NOT used by any code besides schema.
- `orders` - Stripe orders (amount_total cents, payment_status, stripe ids, line_items jsonb).
- `jurisdiction_pricing` - price_usd cents per jurisdiction x tier; updated_by FK.
- `renewals` - per-company renewal year/due_date/status, order_id FK (no code writes it; unverified).
- `jurisdiction_tax_rules` - tax rate (percent*100), threshold, filing frequency/rule.
- `notifications` - in-app feed + per-channel status columns.
- `push_subscriptions` - Web Push endpoints (endpoint unique).
- `promo_banners` - dashboard banners (active, starts_at, ends_at).
- `leads` - tool captures, persona/funnel fields, converted_user_id FK.
- `otp_codes` - hashed OTPs (sha256), expires_at, consumed.
- `referrals` - referrer_user_id FK, status sent|signed_up|paid, commission cents.
Enums: only `user_role` is a real pg enum. All others are `text(..., { enum })` = TypeScript-only, no DB CHECK (jurisdiction: uae, hong-kong, singapore, bahrain, ireland, bvi; tier: tier_1_self, tier_2_nominee, tier_3_shelf; company status: lead, onboarding, official_kyc_pending, filing_in_progress, bank_opening, active, renewal_due, suspended, archived).
Relations (drizzle `relations`): users->companies/documents/notifications; companies->user/documents/milestones/orders/renewals; documents->company/user/versions; milestones->company; orders->company/user. Others only have FKs. Self-reference `companies.assigned_to -> users.id` (cast `any`).

## External services and env vars (every `process.env.*` read in code)
| Var | Where used |
|---|---|
| DATABASE_URL | `lib/db/index.ts:7`, `drizzle.config.ts`; Dockerfile sets a dummy at build |
| JWT_SECRET | `lib/jwt-secret.ts` (throws in production if unset; dev fallback `gccstartup-dev-secret`) |
| NODE_ENV | cookie `secure` flags (login, logout, verify-otp, seed-admin, onboarding), OTP dev fallbacks, posthog debug, style-guide |
| NEXT_PUBLIC_APP_URL | checkout, vault/share, email links, dashboard referral link (default `https://portal.gccstartup.com`) |
| STRIPE_SECRET_KEY / STRIPE_WEBHOOK_SECRET | `lib/stripe.ts`, `webhooks/stripe/route.ts` (api version `2026-08-26.dahlia`) |
| R2_ENDPOINT, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME | `lib/r2.ts`, `api/vault/presign` |
| WHATSAPP_ACCESS_TOKEN, WHATSAPP_PHONE_NUMBER_ID | `lib/whatsapp.ts`, send-otp, verify-otp, admin/kyc/review |
| WHATSAPP_APP_SECRET, WHATSAPP_VERIFY_TOKEN | `webhooks/whatsapp/route.ts`, `lib/whatsapp.ts` |
| RESEND_API_KEY | `lib/email.ts` |
| NEXT_PUBLIC_VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT | `lib/push.ts`, `PushNotificationToggle.tsx` |
| NEXT_PUBLIC_POSTHOG_KEY, NEXT_PUBLIC_POSTHOG_HOST | `lib/posthog-client.ts`, `lib/posthog-server.ts` |
| PORT | `scripts/test-routes.js` (default 3005) |
| CLAUDE_BIN, FDE_BUDGET_USD, FDE_MODEL | `scripts/fde/run.mjs` only |
`R2_ACCOUNT_ID` is in AGENTS.md and `.env.example` but never read; `R2_ENDPOINT` and `R2_BUCKET_NAME` are read but absent from the AGENTS.md table. `NEXT_PUBLIC_*` values are inlined at build: Dockerfile accepts ARGs only for APP_URL, POSTHOG_KEY, POSTHOG_HOST, VAPID_PUBLIC_KEY.

## Key flows
1. Schema change: edit `schema.ts` -> `npm run db:generate` -> commit new `drizzle/NNNN_*.sql` + meta -> deploy.
2. Deploy: Dokploy builds Dockerfile (`npm ci`, `npm run build` with BuildKit cache) -> container start runs `docker-entrypoint.sh` -> `drizzle-kit migrate` -> `node server.js` on 3005.
3. PR: GitHub Actions `verify` job = `npm ci` + `npm run verify` (typecheck, `vitest run`, `next build`).
4. Local dev: `docker compose -f docker-compose.dev.yml up -d`, set `DATABASE_URL=postgresql://gcc:gcc@localhost:55432/gccstartup`, `npm run db:migrate && npm run db:seed`.
5. Analytics: `Providers` mounts `PostHogInit` -> `initPostHog` (no-op if key empty/`xxx`/`phc_xxx`; `capture_pageview` and `capture_pageleave` true, default host `https://us.i.posthog.com`). Server events via `captureServerEvent` (`flushAt:1`).

## Business rules and invariants
- Money is integer cents: `orders.amount_total`, `jurisdiction_pricing.price_usd`, `referrals.commission_amount`.
- Tax `rate_percent` stores percent x 100 (e.g. 900 = 9%); `threshold_amount` in minor units (schema.ts:235 comment).
- Session cookie `gcc_session`, JWT HS256, 7d (`lib/auth.ts:16`).
- Seed (`scripts/seed.ts`): upserts 12 pricing rows (uae/bahrain/hong-kong/ireland tier1 150000, tier2 350000; singapore 200000/400000; bvi 250000/450000; no tier_3_shelf) and 4 tax rules, all marked PLACEHOLDER; it does not create an admin.
- CI uses Node 22; the Docker image uses Node 20. CI env: `DATABASE_URL=postgres://ci:ci@localhost:5432/ci`, `JWT_SECRET=ci-secret-not-for-production`.
- Telemetry events seen: `checkout_started`, `checkout_completed`, `lead_captured`, `registration_completed`, `kyc_advanced`.

## Security notes
- Protected zones here: `Dockerfile`, `docker-entrypoint.sh`, `.github/workflows/**`, destructive schema edits.
- `db/index.ts` comment says it crashes without `DATABASE_URL`, but the code silently falls back to `postgres:postgres@localhost:5432/postgres`; a misconfigured production would try localhost instead of failing loudly.
- `next.config.mjs` allows `next/image` from any https host (`**`) and sets no security headers (CSP, HSTS, etc.).
- `sw.js` caches every successful navigation response, including authenticated pages (dashboard, vault), in `gccstartup-dynamic-v1` and never clears it on logout; offline fallback could show a previous user's HTML on a shared browser. Currently moot because the SW is never registered.
- Entrypoint sources `/app/.env` if present (the `.dockerignore` excludes `.env*`, so normally unused).

## Tests
`src/lib/auth.test.ts`, `src/lib/jwt-secret.test.ts`, `src/lib/persona.test.ts`, `tests/fde.test.ts` (vitest, node env). No tests for db, routes, middleware, webhooks or sw. `scripts/test-routes.js` is a manual HTTP smoke test of 32 routes against a running server (not in CI).

## Known gaps and suspicious things
- Migration step may silently never run: entrypoint calls `./node_modules/.bin/drizzle-kit migrate`, but the runner image only has the traced `standalone` node_modules and the Dockerfile comment claims `npx` auto-installs it. Whether `.bin/drizzle-kit` exists in the image is unverified. Any failure is swallowed (`|| echo "Migration failed (non-fatal...)"`), so the server starts against an unmigrated DB.
- Service worker never registered: `ServiceWorkerRegistration.tsx` is not imported anywhere, so offline/PWA caching and Web Push are inactive despite `manifest.json` + `sw.js`. Install prompt may still work from the manifest alone (unverified).
- `sw.js` oddities: `CACHE_NAME` unused; non-navigation same-origin GETs (including Next RSC fetches) are cache-first with no versioning, which can serve stale data (unverified in a browser).
- `scripts/generate-icons.js` writes relative to `__dirname` (the `scripts/` folder), so it creates `scripts/public/icons` and `scripts/src/app/*` instead of `public/` and `src/app/`; it is broken as located.
- `scripts/convert.ps1` is unrelated to the app (Word COM conversion with hardcoded local paths).
- Theme colour mismatch: `layout.tsx` viewport `#0A2540`, `manifest.json` `#14204A`. Manifest marks every icon `"any maskable"` and `icon-192.svg` is unused. `src/app/favicon.ico` (written by the icon script) is not tracked; `src/app/icon.png` is.
- `milestones` and `renewals` tables are effectively unused; `users.*_alerts_enabled`, `notifications.email_status/push_status` never read/written.
- No pooling options on postgres-js (defaults); no healthcheck in Dockerfile; no lint step in CI; AGENTS.md says CI runs `verify`, which matches.
- Journal has 3 migrations; the AGENTS.md "17 tables" count matches schema.

## Change guide
- Add a column/table: edit `schema.ts` only, run `npm run db:generate`, review the SQL, keep it additive (drop/rename = human approval). Update `docs:ai` codemap with `npm run docs:ai`.
- Add an env var: read it lazily inside functions (module-level reads run during `next build`), add to `.env.example`, and if `NEXT_PUBLIC_*` add a Dockerfile `ARG`+`ENV` pair and pass it as a Dokploy build arg.
- Edge middleware cannot import Node modules (see `jwt-secret.ts` header); keep `getJwtSecret` Node-free.
- Changing the deploy: test `docker build` locally; remember the standalone output excludes devDependencies and `.bin` links.
- To activate PWA/push: mount `ServiceWorkerRegistration` in `Providers.tsx`, bump cache names in `sw.js` when changing caching, and exclude authenticated routes from the navigation cache.
- Pitfall: `output:'standalone'` means no native build deps beyond the `deps` stage; `sharp` is a devDependency used only by the icon script.
