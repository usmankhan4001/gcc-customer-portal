# CLAUDE.md — GCC Startup Platform

> Operating manual for AI assistants working on this repo.
> Read it before touching anything.

---

## What this project is

The **GCC Startup Platform** — a unified CRM, CMS, and API for an international company formation service. Three modules in one Next.js monolith:

- **CRM** — Contacts, deals, pipeline, inbox, campaigns, email, WhatsApp, automation
- **CMS** — Website, blog, pages, Puck editor, lead-gen tools, SEO
- **Platform API** — REST API + webhooks for external integrations
- **Admin** — User management, system health, settings

The **Customer Portal** is a separate codebase that connects via the Platform API.

---

## Tech stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS v4 + CSS tokens |
| UI | shadcn/ui + Radix UI |
| ORM | Drizzle ORM |
| Database | PostgreSQL 16 |
| Auth | JWT (jose) + scrypt |
| Email | Amazon SES (via provider adapter) |
| WhatsApp | Meta WhatsApp Cloud API |
| Storage | Cloudflare R2 (S3-compatible) |
| Queue | Outbox pattern (PostgreSQL) |
| Events | In-process event bus |
| Real-time | SSE (Server-Sent Events) |
| Testing | Vitest |
| Deployment | Docker + Dokploy |

---

## Repository layout

```
CLAUDE.md                   ← you are here
BUILD-PLAN.md               ← the full build plan
BUILD-LOG.md                ← running log of everything done
docs/
  DECISIONS.md              ← architectural decisions (ADR format)
  SCHEMA.md                 ← database schema documentation
  DEPLOYMENT.md             ← deployment guide
  API.md                    ← API reference for external integrations
  AGENTS.md                 ← agent strategy
packages/
  db/                       ← Drizzle schema + migrations
    src/schema/             ← 13 domain files, 20+ tables
    src/client.ts           ← DB connection singleton
  shared/                   ← shared utilities
    src/auth/               ← JWT, passwords, RBAC
    src/email/              ← SES provider
    src/whatsapp/           ← Meta Cloud API client
    src/storage/            ← R2 client
    src/queue/              ← Outbox pattern
    src/events/             ← Event bus
    src/utils/              ← Errors, logging, rate limiting, validation
apps/
  web/                      ← Next.js monolith
    src/
      app/
        (public)/           ← website routes (/, /tools/*)
        crm/                ← CRM routes (contacts, deals, inbox, campaigns, etc.)
        cms/                ← CMS routes (pages, posts, media, SEO)
        admin/              ← admin routes (users, health, settings)
        api/                ← API routes (/api/v2/*, /api/crm/*, /api/chat/*)
      components/
        crm/                ← CRM components (PipelineBoard, LeadDrawer, etc.)
        inbox/              ← Chat components (ChatWindow, VoiceNoteRecorder, etc.)
        campaigns/          ← Campaign components (CampaignWizard, etc.)
        templates/          ← Template components (TemplateBuilder, etc.)
        analytics/          ← Analytics charts (VolumeTrends, Funnel, etc.)
        admin/              ← Admin components (NotificationBell, etc.)
        ui/                 ← Shared UI primitives (25+ components)
        seo/                ← SEO components (JsonLd, Analytics, etc.)
        public-hubs/        ← Public hub components
      lib/
        crm/                ← CRM business logic (scoring, automation, clients)
        email/              ← Email engine (send, flows, render, analytics, suppression)
        whatsapp/           ← WhatsApp engine (client, dispatcher, inbound-router)
        automation/         ← Automation engine (contract, registry, engine)
        webhooks/           ← Webhook system (dispatcher, events)
        notifications/      ← Notification system (store, types)
        ai/                 ← AI copilot (provider, knowledge)
        puck/               ← Puck editor (55+ blocks, email blocks)
        seo/                ← SEO utilities
        programmatic/       ← Programmatic content utilities
      styles/               ← Design tokens (tokens.css, components.css)
      worker/               ← Background job processing
docker-compose.yml          ← Production stack (postgres + redis + app + worker)
Dockerfile                  ← Multi-stage Docker build
vitest.config.ts            ← Test configuration
```

---

## Invariants

1. **No Tailwind utility overrides.** Design tokens in `tokens.css` are the source of truth for existing components.
2. **Never drop a table, column, or row without a migration.** Schema changes are additive.
3. **Nothing throws on failure without logging.** Every error path logs and degrades gracefully.
4. **Every external integration is optional.** Unset env vars = no-op, never crash.
5. **Secrets in .env only.** Never in code, never in docs, never in commits.
6. **Consent is explicit.** `emailConsent !== 'granted'` must never produce marketing sends.
7. **Events are the integration point.** Modules communicate through events, not direct calls.
8. **The portal is separate.** It connects via Platform API, not shared code.
9. **API keys start with `gcc_`.** Easy to identify and rotate.
10. **Webhooks are signed with HMAC-SHA256.** External services verify signatures.

---

## Commands

```bash
pnpm dev              # Start dev server
pnpm build            # Production build
pnpm test             # Run tests
pnpm typecheck        # Type check
pnpm db:generate      # Generate Drizzle migration
pnpm db:migrate       # Run migrations
pnpm db:studio        # Open Drizzle Studio
```

---

## Module boundaries

### CRM (`/crm/*`)
Owns: contacts, deals, conversations, campaigns, email, WhatsApp, automation, tasks
Reads: CMS content (for lead magnets), Portal orders (via API)

### CMS (`/cms/*`)
Owns: pages, posts, media, SEO, redirects, lead-gen tools, content settings
Reads: CRM contacts (for personalization)

### Admin (`/admin/*`)
Owns: users, roles, system health, integrations, audit log, settings
Reads: Everything (cross-cutting concern)

### Platform API (`/api/v2/*`)
Owns: API keys, rate limiting, webhook delivery
Reads: Everything (exposes everything via REST)

---

## Code style

- No semicolons. Single quotes. 2-space indent.
- Named exports; `export function`, not `export default`, outside Next.js route files.
- Types live next to what they describe.
- `'use client'` only where interactivity requires it.
- Block comments above non-obvious logic, explaining *why*.
- Match the file you are editing.

---

## Before you finish any change

1. `pnpm test` — must be green.
2. `pnpm typecheck` — must be green.
3. If you touched schema — run `pnpm db:generate` and commit the migration.
4. If you touched a component — verify it renders correctly.
5. Update `docs/BUILD-LOG.md` with what you did.

---

## API Authentication

All `/api/v2/*` routes require a Bearer token:
```
Authorization: Bearer gcc_your_api_key_here
```

Keys are SHA-256 hashed and stored in the `api_keys` table. Each key has:
- Scoped permissions (contacts:read, deals:write, etc.)
- Rate limit (requests per minute)
- Expiration date

---

## Webhook Events

External services can subscribe to 24 events:
- CRM: contact.created, contact.updated, deal.won, deal.lost, lead.captured
- Conversations: message.received, conversation.assigned
- Campaigns: campaign.dispatched, campaign.completed
- Email: email.sent, email.opened, email.clicked, email.bounced
- Support: ticket.created, ticket.resolved
- Orders: order.paid, order.payment_failed
- System: user.created, user.role_changed

Payloads are signed with HMAC-SHA256. Verify with the webhook secret.

---

## Current status

**Phase 1-4 complete.** Phase 5 (polish) in progress.

The platform has:
- 343+ source files
- 20+ database tables
- 55+ Puck blocks
- 10 lead-gen tools
- 24 webhook events
- 32 API endpoints
- 10 admin pages

**Next steps:**
1. Replace TODO stubs with real Drizzle queries
2. Connect API routes to database
3. Wire up the worker to process outbox jobs
4. Deploy to Dokploy
5. Migrate data from gccstartup-cms
