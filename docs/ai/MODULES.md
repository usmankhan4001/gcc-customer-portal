# Module Index

One doc per area of the codebase, written from the real code (2026-10-30). Load only the modules your task touches, after `AGENTS.md` and `docs/ai/CODEMAP.md`. Per-feature docs live in `FEATURES.md`; planned work in `docs/versions/INDEX.md`.

## Modules

| Module | Doc | Owns (routes / tables / libs) | Protected zone? |
| :--- | :--- | :--- | :--- |
| Auth | [auth.md](modules/auth.md) | `/auth`, `/api/auth/**`, `middleware.ts`, `lib/{auth,jwt-secret,auth-policy,admin-auth,session}`; `users`, `otp_codes` | **Yes** |
| Onboarding and leads | [onboarding-and-leads.md](modules/onboarding-and-leads.md) | `/onboarding`, `/welcome`, `/api/onboarding/**`, `/api/leads/**`, `lib/persona`; `leads` | Partly (creates sessions) |
| Lead-gen tools | [lead-gen-tools.md](modules/lead-gen-tools.md) | `/tools/**`, `/api/{calculator,quiz,tax-rules,countries,pdf}`, `lib/{jurisdictions,countries,pdf}`; `jurisdiction_tax_rules` | No |
| Checkout and orders | [checkout-and-orders.md](modules/checkout-and-orders.md) | `/services/**`, `/checkout/**`, `/api/checkout`, `/api/webhooks/stripe`, `lib/stripe`; `orders`, `jurisdiction_pricing` | **Yes** (money) |
| Vault and documents | [vault-and-documents.md](modules/vault-and-documents.md) | `/vault/**`, `/api/vault/**`, `/api/admin/kyc/review`, `lib/r2`; `documents`, `document_versions`, `shareable_links`, `document_access_log` | **Yes** |
| Client portal | [client-portal.md](modules/client-portal.md) | dashboard, profile, support, notifications pages, `components/portal`, `/api/companies/**`; `companies`, `milestones`, `renewals`, `referrals` | No (reads session) |
| Messaging and notifications | [messaging-and-notifications.md](modules/messaging-and-notifications.md) | `lib/{whatsapp,email,push}`, `/api/webhooks/whatsapp`, `/api/push/**`, `/api/notifications/**`; `notifications`, `push_subscriptions` | **Yes** (webhooks) |
| Admin operations | [admin-operations.md](modules/admin-operations.md) | `/admin/**`, `/api/admin/**`; `promo_banners` | Partly (`seed-admin`, `kyc`) |
| Platform and infra | [platform-and-infra.md](modules/platform-and-infra.md) | `lib/db`, `drizzle/`, Dockerfile, entrypoint, CI, scripts, PWA assets, env vars | **Yes** (deploy) |

## Which modules to load for a task

| Task | Load |
| :--- | :--- |
| Login, sessions, mobile token auth (F0.3) | auth, platform-and-infra |
| Push to Android / FCM (F0.4) | messaging-and-notifications, auth, platform-and-infra |
| Compliance calendar, renewals (F1.2, F3.1) | client-portal, messaging-and-notifications, checkout-and-orders |
| Document locker (F1.7, F2.5) | vault-and-documents, client-portal, messaging-and-notifications |
| Lead scoring, follow-up (F1.3, F1.5) | onboarding-and-leads, lead-gen-tools, messaging-and-notifications, admin-operations |
| Tool fixes, new tools (F1.4, F2.x) | lead-gen-tools, onboarding-and-leads |
| Checkout, pricing, payments | checkout-and-orders, admin-operations |
| Admin screens, Customer 360 (F3.3) | admin-operations, client-portal |
| Schema, deploy, env | platform-and-infra |

## Open issues register
Status as of 2026-10-30. "Checked" means I confirmed it in the code myself; "reported" means a module-doc agent found it and I have not confirmed it.

**Fixed (local branch, not yet deployed)**
- JWT secret hardcoded fallbacks: spec 001.
- Onboarding account takeover, OTP in send-otp response, fixed OTP `123456`, open `seed-admin`: spec 002.

**Open, checked**
- WhatsApp webhook skips the signature check when `WHATSAPP_APP_SECRET` is unset; no dedupe on `message.id`.
- Stripe webhook has no event-id or status guard, so a duplicate event repeats side effects.
- `/api/leads/capture` has no caller in the UI, so tools create no leads.
- `ServiceWorkerRegistration` is defined but never mounted, so web push and the service worker are inactive.
- `milestones` table is never read or written; the tracker runs off `companies.status`.
- `/api/admin/kyc/review` is a stub (update and send commented out), uses a Bearer check, rejects `super_admin`.
- No OTP attempt limit or rate limiting; send-otp logs the OTP when WhatsApp is unconfigured.

**Open, reported (verify before acting)**
- `x-user-*` headers set on the middleware response may not reach server components, so portal pages may see no user, or trust a client-sent header.
- Tax calculator and quiz pages disagree with their APIs (field names, unsupported jurisdictions).
- Dashboard "Pay Now" links to `/checkout/<orderId>` but that page expects a jurisdiction id.
- Share links have no password and no revoke endpoint; presign supersedes the old document before upload.
- `docker-entrypoint.sh` swallows migration failures.
- `/api/push/unsubscribe` has no auth; Admin Clients and Renewals pages are mock data.

## Doc drift to fix when touching these areas
`AGENTS.md` says the onboarding wizard has 5 steps (code: 3), the tools index lists 10 tools (invoice-generator is missing from the grid), and the README route list differs from `docs/ai/CODEMAP.md`.

## Maintenance
When you change a module, update its doc in the same change and its "Last verified" date. `CODEMAP.md` is generated (`npm run docs:ai`); module docs are not.
