# Deploy runbook (Dokploy)

Facts read from Dokploy on 2026-10-30 (read-only). Env var values are not readable through the API, so env checks below are manual.

| | Production | Dev |
| :--- | :--- | :--- |
| Dokploy app | `customer-portal` (`lFsdUY5eGko2AVowRhGe4`) | `customer-portal-dev` (`z71EkcrnmnEBNiX90c6oM`) |
| Source | GitHub `usmankhan4001/gcc-customer-portal`, branch **`main`** | same repo, branch **`dev`** |
| Auto deploy | **yes, on every push to `main`** | yes, on every push to `dev` |
| Domain | `portal.gccstartup.com` (http, port 3005) | `customer-portal-dev.gccstartup.com` |
| Last deployed commit seen | `e0c164a` (2026-08-30) | `249a090` (2026-09-08, redeployed 2026-10-24) |

**Pushing to `main` deploys to production immediately. Never push `main` casually.** Pushing any other branch deploys nothing.

## Known state of the running containers
- Neither container applies migrations. Dev logs: `drizzle-kit: not found / Migration failed (non-fatal)`. Production's older entrypoint does not migrate at all. So the schema in both databases was created some other way, and **migration history may be missing**.
- Both log repeated `Cannot find module pdfkit/js/standard-fonts/Helvetica.cjs` (unhandled rejections) right after start: PDF generation is broken in the deployed image (pre-existing, not part of the security fixes).
- Node 20 in the image (AWS SDK warns it needs 22 after Jan 2027).

## Before the first deploy of this branch (migrations)
The new image runs `scripts/migrate.mjs` at start and **refuses to start if it fails** (`ALLOW_MIGRATION_FAILURE=1` is the temporary override). The code needs migrations 0003 (`processed_webhook_events`) and 0004 (`otp_codes.attempts`).

1. Find out what each database already has. Run this read-only query on the production database (Dokploy database terminal or any SQL client):
   ```sql
   select to_regclass('drizzle.__drizzle_migrations') as history,
          (select count(*) from information_schema.tables where table_schema='public') as tables,
          to_regclass('public.referrals') as has_0002,
          to_regclass('public.processed_webhook_events') as has_0003,
          (select count(*) from information_schema.columns where table_name='otp_codes' and column_name='attempts') as has_0004;
   ```
   - `history` not null and rows present: the new image just works.
   - `history` null, `tables` > 0: baseline needed (next step). `has_0002` tells you whether 0002 (referrals) is already in; 0000 to 0001 are in whenever `tables` > 0.
2. Baseline once, from any machine with network access to that database: `DATABASE_URL=<prod url> node scripts/baseline.mjs <N>` where N is the number of migrations already present (2 if `referrals` is missing, 3 if it exists and `processed_webhook_events` does not, and so on). Then the image applies only the remaining ones. **Take a database backup first.**
3. Tested locally (Docker): fresh database migrates and serves; legacy database with history missing fails with a clear message; the same database after `baseline.mjs 2` applies 0002 to 0004 and starts.

## Environment variables to confirm in Dokploy (names only)
- `JWT_SECRET` must be set (production now throws without it).
- `WHATSAPP_APP_SECRET` must be set, matching the Meta app secret (the inbound webhook now rejects everything without it in production).
- `WHATSAPP_ACCESS_TOKEN` and `WHATSAPP_PHONE_NUMBER_ID` must be real values (not `xxx`), or OTP login stops working (no dev code in production).
- `DATABASE_URL`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `R2_*`, `RESEND_API_KEY` as before.
- `ADMIN_SEED_TOKEN` optional; leave unset to keep `/api/admin/seed-admin` disabled in production.

## Deploy order
1. Back up the production database.
2. Deploy to **dev first** (push the branch as `dev`), baseline the dev database if needed, then test on `customer-portal-dev.gccstartup.com`: OTP login with a real number, onboarding, checkout in Stripe test mode, vault upload.
3. Only then merge to `main` (this deploys production). Watch the container logs for `migrate: all migrations applied` and `Ready`.
4. Rollback: Dokploy keeps previous deployments; redeploy the previous one. Migrations 0003 and 0004 are additive, so the old code keeps working on the new schema.

## After deploying
- If anyone could have used the old onboarding takeover or open `seed-admin`, review recent password changes and the admin users list, and rotate admin passwords.
