# Feature: Database client, schema and migrations

**Slug**: database-and-migrations   **Area**: [platform-and-infra](../modules/platform-and-infra.md)   **Status**: partial   **Last verified against code**: 2026-10-30

## What it does
Postgres via `postgres` (postgres-js) and Drizzle ORM. One exported `db` handle, one schema file (17 tables, 1 real enum), and three generated SQL migrations. Migrations are meant to run automatically in the Docker entrypoint, but that step probably never succeeds in the standalone image (see Failure modes). All other features read and write through this module.

## Entry points
- Import `db` from `@/lib/db` (`src/lib/db/index.ts`), tables from `@/lib/db/schema`.
- Schema change: `npm run db:generate` (drizzle-kit generate). Apply: `npm run db:migrate` (drizzle-kit migrate; DENIED to agents in `.claude/settings.json`). Seed: `npm run db:seed` (`tsx scripts/seed.ts`).
- Container start: `docker-entrypoint.sh:17`.

## Files
- `src/lib/db/index.ts:1-8` - client + `drizzle(client,{schema})`.
- `src/lib/db/schema.ts:1-426` - tables 33-371, relations 377-404, inferred types 410-426.
- `drizzle.config.ts:1-11` - `schema ./src/lib/db/schema.ts`, `out ./drizzle`, `dialect postgresql`, `dbCredentials.url = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/postgres'`.
- `drizzle/0000_wealthy_ezekiel.sql` (enum + 16 tables + 22 FKs), `0001_rainy_mandrill.sql` (`ALTER TABLE users ADD COLUMN password_hash text`), `0002_careless_cassandra_nova.sql` (`referrals` + 2 FKs), `drizzle/meta/_journal.json` (3 entries, idx 0-2, version 7), `meta/000N_snapshot.json`.
- `scripts/seed.ts` (122 lines), `docker-compose.dev.yml` (local PG), `docker-entrypoint.sh`, `Dockerfile:53-54` (copies `drizzle/` and `drizzle.config.ts`).

## Request / response contract
none (library). `db` exposes the drizzle query builder (`db.select/insert/update/delete`, `schema` passed so `db.query.*` is available but the codebase uses the builder).

## Step-by-step flow
1. Client creation (`index.ts:7`): `postgres(process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/postgres')`, no options (library defaults: pool of 10, prepared statements on; unverified). Evaluated at import time; the module-level fallback means a missing `DATABASE_URL` silently targets localhost instead of crashing (the code comment claims it crashes).
2. Dev: no global singleton, so each hot reload may open another pool (typical Next.js dev leak; unverified).
3. Generate: edit `schema.ts` -> `npm run db:generate` -> new `drizzle/NNNN_<adjective_name>.sql` + snapshot + journal entry -> commit all.
4. Migrate: `drizzle-kit migrate` applies unapplied journal entries inside the `drizzle.__drizzle_migrations` bookkeeping table (drizzle default). Local: `docker compose -f docker-compose.dev.yml up -d`, `DATABASE_URL=postgresql://gcc:gcc@localhost:55432/gccstartup`, `npm run db:migrate && npm run db:seed`.
5. Seed (`scripts/seed.ts`): `import 'dotenv/config'` loads `.env`, NOT `.env.local`, so a URL only in `.env.local` is not seen (set it in the shell or `.env`). Upserts 12 placeholder `jurisdiction_pricing` rows and 4 tax rules; creates no admin.

## Data
All PKs `uuid default random`; all timestamps `timestamp` WITHOUT time zone `default now() NOT NULL` unless noted. All 24 FKs are `ON DELETE no action ON UPDATE no action`. The ONLY indexes are PKs and 4 UNIQUE constraints (`users.email`, `users.whatsapp_number`, `push_subscriptions.endpoint`, `shareable_links.token`). No secondary indexes. Only enum: pg `user_role` = client|staff|operations|admin|super_admin. All other "enums" are `text(..., {enum})` (TypeScript only, no CHECK).
- `users`: email text unique null; whatsapp_number text NOT NULL unique; full_name; password_hash; role user_role default client; country_of_residence; avatar_url; whatsapp_alerts_enabled bool default true; email_alerts_enabled bool default true; created_at; updated_at.
- `companies`: user_id FK users NOT NULL; company_name NOT NULL; jurisdiction enum(uae,hong-kong,singapore,bahrain,ireland,bvi) NOT NULL; tier enum(tier_1_self,tier_2_nominee,tier_3_shelf) NOT NULL; track_type enum(remote,gulf) null; status enum(lead,onboarding,official_kyc_pending,filing_in_progress,bank_opening,active,renewal_due,suspended,archived) default lead; official_kyc_completed bool default false; official_kyc_reference; trade_license_number; incorporation_date; license_expiry_date; assigned_to FK users (self-ref, cast `any`); annual_revenue_estimate int; fiscal_year_end text "MM-DD"; created_at; updated_at.
- `documents`: user_id FK NOT NULL; company_id FK null; file_name NOT NULL; r2_key NOT NULL; category enum(trade_license,moa_aoa,share_certificate,tax_certificate,nominee_poa,bank_document,other) default other; mime_type; file_size_bytes int; status enum(active,archived,superseded) default active; expiry_date; uploaded_by FK; created_at.
- `document_versions`: document_id FK NOT NULL; version_number int NOT NULL; r2_key; file_name; uploaded_by FK; created_at.
- `shareable_links`: document_id FK NOT NULL; token text NOT NULL unique; expires_at NOT NULL; created_by FK NOT NULL; access_count int default 0; revoked bool default false; created_at.
- `document_access_log`: document_id FK NOT NULL; accessed_by FK null; action enum(viewed,downloaded) NOT NULL; accessed_at default now.
- `milestones`: company_id FK NOT NULL; stage_index int NOT NULL (1-6); stage_name NOT NULL; status enum(pending,in_progress,completed) default pending; description; official_portal_url; completed_at; completed_by FK; created_at. No code writes it.
- `orders`: user_id FK, company_id FK NOT NULL; order_type enum(new_formation,renewal,tax_filing,other) default new_formation; amount_total int NOT NULL (cents); currency text default 'usd'; stripe_session_id; stripe_payment_intent_id; payment_status enum(unpaid,processing,paid,failed,refunded) default unpaid; line_items jsonb; paid_at; created_at.
- `jurisdiction_pricing`: jurisdiction enum, tier enum (both NOT NULL); price_usd int NOT NULL (cents); updated_by FK; updated_at. No unique on (jurisdiction,tier); seed upserts by app logic.
- `renewals`: company_id FK NOT NULL; renewal_year int NOT NULL; due_date NOT NULL; status enum(upcoming,invoiced,paid,overdue,renewed) default upcoming; order_id FK null; created_at.
- `jurisdiction_tax_rules`: jurisdiction enum; tax_type enum(corporate,vat,other); rate_percent int NOT NULL (percent x 100); threshold_amount int null; currency default 'usd'; filing_frequency enum(annual,quarterly,monthly); filing_deadline_rule text NOT NULL; notes; updated_at.
- `notifications`: see [in-app-notifications](in-app-notifications.md). `push_subscriptions`: see [web-push](web-push.md).
- `promo_banners`: title, body NOT NULL; link_url; active bool default true; starts_at default now NOT NULL; ends_at null; created_by FK; created_at.
- `leads`: email; whatsapp_number (not unique); source_tool enum(tax_calculator,banking_odds,nda_generator,jurisdiction_quiz,vat_scorer,ubo_privacy,compliance_calendar,visa_estimator,name_checker,qfzp_eligibility) NOT NULL; tool_input jsonb; tool_result jsonb; pdf_r2_key; estimated_revenue_band enum(under_50k,50k_150k,150k_500k,over_500k); industry_risk_tier enum(low,medium,high); primary_interest_jurisdiction enum; persona_tag; funnel_track enum(self_serve,consultation_led); converted_user_id FK; created_at.
- `otp_codes`: whatsapp_number NOT NULL; otp_hash (sha256) NOT NULL; expires_at NOT NULL; consumed bool default false; created_at. Never purged.
- `referrals`: referrer_user_id FK NOT NULL; referred_email; referred_name; status enum(sent,signed_up,paid) default sent; commission_amount int (cents); referred_user_id FK; note; created_at.
- Drizzle `relations()` exist only for users, companies, documents, milestones, orders (`schema.ts:377-404`).
Not stored anywhere: an `events` table, consent records, device tokens, audit log of admin actions, soft-delete flags.

## Business rules and constants
- Money integer cents: `orders.amount_total`, `jurisdiction_pricing.price_usd`, `referrals.commission_amount`. Tax `rate_percent` = percent x 100 (comment at `schema.ts:235`).
- Placeholder phone values `temp_<Date.now()>` are written into `users.whatsapp_number` by `onboarding/complete/route.ts:104` and `admin/pipeline/route.ts:194,205` (data-quality hazard for OTP/WhatsApp matching).
- Migration file names are drizzle random words; order is the journal idx, not the name.

## Auth, permissions, security
AGENTS.md section 5: destructive schema changes (drop/rename) need human approval; additive changes fine. `docker-entrypoint.sh` and `Dockerfile` are protected. Connection string is a secret (`DATABASE_URL`). No row-level security; every route enforces ownership in SQL itself.

## Failure modes and edge cases
- Entrypoint runs `./node_modules/.bin/drizzle-kit migrate 2>&1 || echo "Migration failed (non-fatal, server will still start)"` (`docker-entrypoint.sh:17`) under `set -e`; the `||` swallows every failure, so the server boots against an unmigrated database. `drizzle-kit` is a devDependency and Next `output:'standalone'` ships only traced runtime modules without `.bin`, so the binary is very likely absent in the runner image (`Dockerfile:50-57` comment claims `npx` auto-installs it, but the entrypoint does not call `npx`). Verify with `docker run --rm <image> ls node_modules/.bin`. Unverified.
- `drizzle.config.ts` fallback URL is localhost, so a run without `DATABASE_URL` migrates the wrong DB (or fails).
- Build-time `DATABASE_URL` is a dummy (`Dockerfile:30`); no route connects during `next build`, but any top-level query would fail the build.
- `drizzle-kit generate` needs the committed snapshots; never hand-edit `drizzle/meta`.
- Journal/snapshot drift or two branches generating the same `NNNN` produce conflicts; regenerate on the later branch.
- Unique violations on `whatsapp_number`/`email` surface as unhandled 500s in routes that insert without handling.
- Timestamps are `timestamp without time zone`; zone interpretation when reading with non-Node tools is unverified.

## Tests
None for the DB layer (route tests mock `@/lib/db`, see `tests/auth-routes.test.ts:11-14`). Worth writing:
1. Schema/migration drift check: run `drizzle-kit generate --name=check` in CI against a clean tree and assert no new SQL file (needs no DB).
2. Apply all 3 migrations on an ephemeral PG (service container) and assert the 17 tables and `user_role` enum exist.
3. Unit: env test in the style of `src/lib/jwt-secret.test.ts` for `db/index.ts` - with `DATABASE_URL` unset in production, expect a throw (after fixing the silent fallback).
4. Seed idempotency: run `scripts/seed.ts` twice, row count unchanged (12 pricing, 4 tax rules).
5. Entrypoint test: build image, run with a bad URL, assert the container logs the failure and (decide) either exits non-zero or starts.

## Known bugs and gaps
- Misleading comment and silent localhost fallback: `src/lib/db/index.ts:5-7`.
- Migration step likely inert and failure-swallowing: `docker-entrypoint.sh:17`.
- No secondary indexes (e.g. `notifications(user_id,is_read)`, `otp_codes(whatsapp_number)`, `companies(user_id,status)`, `documents(user_id)`).
- No cascade/soft-delete semantics; `milestones` and `renewals` tables unused by code.
- `dotenv/config` in seed ignores `.env.local`.

## Change guide
- Add column/table: edit only `schema.ts`, run `npm run db:generate`, read the SQL, commit SQL + `meta/*`. Keep additive (nullable or defaulted columns). Update `docs/ai/CODEMAP.md` via `npm run docs:ai`.
- Do not rename in place; add new + backfill + later drop with human approval.
- Prefer `.onConflictDoUpdate` over select-then-insert (see push subscribe race).
- Fix the pipeline before relying on it: call `node node_modules/drizzle-kit/bin.cjs migrate` after copying drizzle-kit into the runner, or run a one-shot `drizzle-orm/postgres-js/migrator` script (`migrate(db,{migrationsFolder:'./drizzle'})`) bundled into the image, and make failure exit non-zero (protected files: human OK).
- Android/FCM readiness: needs additive tables/columns only: `devices` or extra columns on `push_subscriptions` (platform, fcm_token, app_version, last_seen_at), `consents` (user_id, type, granted_at, revoked_at, source), `events` (id, user_id, name, props jsonb, created_at, index on (user_id, created_at)), and `api_tokens`/refresh tokens for bearer auth. Add indexes with them.

## Related features
[deploy-and-ci](deploy-and-ci.md), [testing-and-fde-pipeline](testing-and-fde-pipeline.md), [in-app-notifications](in-app-notifications.md), [web-push](web-push.md), [reference-data-tax-rules-countries](reference-data-tax-rules-countries.md), [admin-pricing-configurator](admin-pricing-configurator.md), [whatsapp-otp-login](whatsapp-otp-login.md)
