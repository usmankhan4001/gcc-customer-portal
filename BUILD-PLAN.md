# GCC Startup Platform — Build Plan

> Unified CRM + CMS + Platform API + Admin
> Customer Portal excluded for now (Phase 2)
> Built in a separate repository, original projects untouched

---

## Repository: `gccstartup-platform`

```
gccstartup-platform/
├── .github/                    # CI/CD workflows
├── docs/
│   ├── BUILD-LOG.md            # Running log of everything done
│   ├── DECISIONS.md            # Architectural decisions (ADR format)
│   ├── SCHEMA.md               # Database schema documentation
│   └── DEPLOYMENT.md           # Deployment guide
├── packages/
│   ├── db/                     # Drizzle schema + migrations
│   │   ├── src/
│   │   │   ├── schema/         # One file per domain
│   │   │   ├── client.ts       # DB connection singleton
│   │   │   └── index.ts        # Barrel exports
│   │   ├── drizzle.config.ts
│   │   └── package.json
│   └── shared/                 # Shared utilities
│       ├── src/
│       │   ├── auth/           # JWT, session, RBAC
│       │   ├── email/          # Provider adapter (SES/Resend)
│       │   ├── whatsapp/       # Meta Cloud API client
│       │   ├── storage/        # R2 client
│       │   ├── queue/          # Outbox pattern
│       │   ├── events/         # Event bus
│       │   └── utils/          # Common helpers
│       └── package.json
├── apps/
│   └── web/                    # Next.js 15 monolith
│       ├── src/
│       │   ├── app/
│       │   │   ├── (public)/   # Website routes
│       │   │   ├── crm/        # CRM routes
│       │   │   ├── cms/        # CMS routes
│       │   │   ├── admin/      # Admin routes
│       │   │   ├── api/        # API routes
│       │   │   └── layout.tsx  # Root layout
│       │   ├── components/
│       │   │   ├── crm/        # CRM components
│       │   │   ├── cms/        # CMS components
│       │   │   ├── admin/      # Admin components
│       │   │   ├── ui/         # Shared UI primitives
│       │   │   └── email/      # Email block designer
│       │   ├── lib/
│       │   │   ├── crm/        # CRM business logic
│       │   │   ├── cms/        # CMS business logic
│       │   │   ├── email/      # Email engine
│       │   │   ├── whatsapp/   # WhatsApp engine
│       │   │   ├── automation/ # Flow builder runtime
│       │   │   └── analytics/  # Analytics engine
│       │   └── styles/
│       │       ├── tokens.css  # Design tokens
│       │       └── components.css
│       ├── public/
│       ├── next.config.mjs
│       ├── package.json
│       └── Dockerfile
├── docker-compose.yml          # Local dev stack
├── pnpm-workspace.yaml
├── package.json                # Root package.json
├── CLAUDE.md                   # AI assistant operating manual
└── .env.example
```

---

## Build Phases

### Phase 1: Foundation (Days 1-3)
**Goal:** Working skeleton with auth, database, and shared infrastructure

#### 1.1 Repository Bootstrap
- [ ] Initialize pnpm monorepo
- [ ] Set up Next.js 15 app with App Router
- [ ] Configure TypeScript, ESLint, Prettier
- [ ] Set up Drizzle ORM + PostgreSQL
- [ ] Create Docker Compose for local dev (postgres + redis + app)
- [ ] Set up CLAUDE.md with project invariants

#### 1.2 Database Schema (from corehub, adapted)
- [ ] Auth schema (users, sessions, accounts, verifications, roles, permissions)
- [ ] Contact schema (contacts, contact_fields, contact_notes)
- [ ] CRM schema (pipelines, pipeline_stages, deals, deal_notes, deal_tasks, activities)
- [ ] CMS schema (pages, posts, media, revisions, redirects, site_settings)
- [ ] Email schema (email_templates, email_campaigns, email_sends, email_suppressions)
- [ ] Messaging schema (conversations, messages, message_templates)
- [ ] Automation schema (flows, flow_steps, flow_enrollments, flow_logs)
- [ ] Support schema (tickets, ticket_messages, canned_responses)
- [ ] Admin schema (audit_log, api_keys, webhooks, integrations)
- [ ] Run initial migration

#### 1.3 Auth System
- [ ] JWT session management (jose library)
- [ ] Password hashing (scrypt)
- [ ] Login / logout / session refresh
- [ ] Role-based access control (super_admin, admin, staff, viewer)
- [ ] Middleware for route protection
- [ ] API key authentication (for Platform API)

#### 1.4 Shared Infrastructure
- [ ] Database client singleton
- [ ] R2 storage client (presigned URLs)
- [ ] Event bus (in-process first, upgradeable to Redis pub/sub)
- [ ] Outbox queue (for email, WhatsApp, background jobs)
- [ ] Email provider adapter (interface + SES implementation)
- [ ] WhatsApp client (Meta Cloud API)
- [ ] Error handling + logging (Pino)
- [ ] Rate limiting (in-memory sliding window)
- [ ] Health check endpoint

---

### Phase 2: CMS Module (Days 4-7)
**Goal:** Content management system with Puck editor, SEO, and lead-gen tools

#### 2.1 Content Types
- [ ] Pages (CRUD + Puck editor)
- [ ] Blog posts (CRUD + Puck editor)
- [ ] Services (CRUD)
- [ ] Jurisdictions/Countries (CRUD)
- [ ] Pricing tiers (CRUD)
- [ ] Comparisons (CRUD)
- [ ] Business models (CRUD)
- [ ] Guides (CRUD)
- [ ] Landing pages (CRUD)

#### 2.2 Content Editor
- [ ] Puck canvas integration
- [ ] Block registry (55+ blocks from gccstartup-cms)
- [ ] Draft / review / publish workflow
- [ ] Scheduled publish / unpublish
- [ ] Revision history (save snapshots)
- [ ] Content calendar view

#### 2.3 Media Library
- [ ] File upload (R2 presigned URLs)
- [ ] Image optimization (resize, WebP conversion)
- [ ] File manager UI (grid + list views)
- [ ] Alt text management
- [ ] Usage tracking (where is this image used?)

#### 2.4 SEO Engine
- [ ] Per-page SEO fields (title, description, OG image, canonical)
- [ ] AEO (Answer Engine Optimization) fields
- [ ] Sitemap generation (dynamic)
- [ ] Robots.txt generation
- [ ] JSON-LD structured data (FAQ, Organization, BreadcrumbList)
- [ ] Redirects manager

#### 2.5 Lead-Gen Tools
- [ ] Tax calculator
- [ ] Jurisdiction fit quiz
- [ ] Banking odds checker
- [ ] NDA generator
- [ ] UBO privacy analyzer
- [ ] VAT scorer
- [ ] Compliance calendar (public)
- [ ] Visa estimator
- [ ] Name checker
- [ ] QFZP eligibility checker
- [ ] Lead capture on all tools
- [ ] PDF generation for tool results

#### 2.6 Public Website
- [ ] Home page
- [ ] Dynamic pages ([slug])
- [ ] Blog listing + post pages
- [ ] Services listing + detail pages
- [ ] Jurisdictions listing + detail pages
- [ ] Pricing page
- [ ] Comparison pages
- [ ] Contact page
- [ ] Sitemap XML
- [ ] Robots.txt

---

### Phase 3: CRM Module (Days 8-14)
**Goal:** Full CRM with pipeline, inbox, campaigns, and automation

#### 3.1 Contacts
- [ ] Contact list (table view with search, filter, sort)
- [ ] Contact Kanban view (by lifecycle stage)
- [ ] Contact profile page (timeline, companies, deals, conversations)
- [ ] Contact create / edit
- [ ] Tags management
- [ ] Segments (saved filters)
- [ ] Import (CSV upload + mapping)
- [ ] Export (CSV)
- [ ] Deduplication + merge

#### 3.2 Leads
- [ ] Lead intake (from website forms, tools, WhatsApp, manual)
- [ ] Lead scoring (automatic based on source + behavior)
- [ ] Lead qualification workflow
- [ ] Lead → Contact conversion
- [ ] Lead source tracking (UTM, referrer, tool)

#### 3.3 Deals (Pipeline)
- [ ] Pipeline configuration (stages, probabilities)
- [ ] Kanban board (drag & drop)
- [ ] Deal create / edit
- [ ] Deal value, currency, expected close date
- [ ] Win / loss tracking with reasons
- [ ] Revenue forecasting
- [ ] Pipeline analytics

#### 3.4 Conversations (Unified Inbox)
- [ ] Conversation list (all channels)
- [ ] WhatsApp threads
- [ ] Web chat threads
- [ ] Support ticket threads
- [ ] Thread view with message history
- [ ] Reply (text, template)
- [ ] Agent assignment (manual + round-robin)
- [ ] Status management (open, pending, resolved)
- [ ] Priority management
- [ ] SLA tracking (response time, resolution time)
- [ ] AI categorization
- [ ] AI suggested replies

#### 3.5 Email Engine
- [ ] Email template designer (block-based)
- [ ] Template gallery (pre-built templates)
- [ ] Merge tags (firstname, lastname, company, etc.)
- [ ] Preview & test send
- [ ] Campaign create / edit
- [ ] Audience segment selection
- [ ] Schedule & dispatch
- [ ] A/B testing (subject line splits)
- [ ] Outbox queue (durable jobs)
- [ ] Deliverability monitoring
- [ ] Unsubscribe management (HMAC tokens)
- [ ] Suppression list management
- [ ] Bounce / complaint handling

#### 3.6 WhatsApp Engine
- [ ] Meta Cloud API client (from WayApp)
- [ ] Template manager (create, sync from Meta)
- [ ] Campaign create / edit
- [ ] Audience selection
- [ ] Variable mapping
- [ ] Schedule & dispatch
- [ ] Rate limiting (token bucket)
- [ ] Quality rating monitoring
- [ ] Inbound webhook processing
- [ ] 2-way inbox
- [ ] Keyword auto-responders
- [ ] AI copilot (reply suggestions, translation)

#### 3.7 Automation
- [ ] Visual flow builder (canvas, @xyflow/react)
- [ ] Trigger types:
  - lead_created
  - form_submitted
  - tag_added
  - deal_stage_changed
  - date_based
  - event_based
  - manual
- [ ] Action types:
  - send_email
  - send_whatsapp
  - wait (delay)
  - if/else (condition)
  - update_contact
  - update_deal
  - notify_team
  - add_tag
  - remove_tag
  - enroll_in_flow
  - create_task
- [ ] Flow status (draft, active, paused, archived)
- [ ] Enrollment tracking
- [ ] Step-by-step execution logging
- [ ] Flow analytics (conversion, drop-off)

#### 3.8 Tasks & Activities
- [ ] Task board (assign, prioritize, complete)
- [ ] Activity log (calls, meetings, notes)
- [ ] Follow-up reminders
- [ ] Task templates
- [ ] Bulk task operations

#### 3.9 CRM Analytics
- [ ] Pipeline analytics (conversion rates, time-in-stage)
- [ ] Revenue analytics (forecast, actual, by source)
- [ ] Campaign analytics (email + WhatsApp)
- [ ] Agent performance (response time, resolution rate)
- [ ] Lead source analytics
- [ ] Contact growth over time
- [ ] Custom date range filters

---

### Phase 4: Platform API + Admin (Days 15-18)
**Goal:** REST API for external integrations, admin panel for system management

#### 4.1 Platform API (v2)
- [ ] API key authentication
- [ ] Rate limiting per API key
- [ ] Contacts CRUD
- [ ] Companies CRUD
- [ ] Deals CRUD
- [ ] Leads CRUD
- [ ] Conversations (list, read, send)
- [ ] Campaigns (list, create, dispatch)
- [ ] Documents (list, presign upload, presign download)
- [ ] Analytics (pipeline, revenue, campaigns)
- [ ] Webhooks (create, list, delete)
- [ ] OpenAPI/Swagger documentation

#### 4.2 Webhook System
- [ ] Webhook registration (URL + events + secret)
- [ ] Event dispatch (HMAC-SHA256 signed payloads)
- [ ] Delivery tracking (success, failed, retrying)
- [ ] Retry policy (exponential backoff, 3 attempts)
- [ ] Webhook logs

#### 4.3 Admin Panel
- [ ] Dashboard (system overview)
- [ ] User management (CRUD, roles, permissions)
- [ ] Audit log viewer
- [ ] System health (database, storage, email, WhatsApp status)
- [ ] Integration settings (Stripe, WhatsApp, Email, R2)
- [ ] Feature flags
- [ ] API key management
- [ ] Webhook management
- [ ] Backup status

#### 4.4 Notifications (Internal)
- [ ] System alerts (service health, backup status)
- [ ] Operational alerts (overdue deadlines, SLA breaches)
- [ ] Marketing alerts (campaign completed, bounce rate high)
- [ ] Delivery: email, webhook, in-app

---

### Phase 5: Polish + Deploy (Days 19-21)
**Goal:** Production-ready deployment with documentation

#### 5.1 Testing
- [ ] Unit tests (Vitest) for business logic
- [ ] API integration tests
- [ ] Auth flow tests
- [ ] CRM pipeline tests
- [ ] Email delivery tests

#### 5.2 Documentation
- [ ] CLAUDE.md (AI assistant operating manual)
- [ ] API documentation (OpenAPI)
- [ ] Schema documentation
- [ ] Deployment guide
- [ ] User guide (CRM, CMS, Admin)

#### 5.3 Deployment
- [ ] Dockerfile (multi-stage build)
- [ ] Docker Compose (production stack)
- [ ] Database migration strategy
- [ ] Backup strategy
- [ ] Monitoring setup
- [ ] Domain + SSL configuration

#### 5.4 Data Migration (from gccstartup-cms)
- [ ] Migration script: Directus collections → Drizzle tables
- [ ] Migration script: WayApp contacts → unified contacts
- [ ] Migration script: Customer Portal users → unified users
- [ ] Validation script (verify migration completeness)
- [ ] Rollback plan

---

## Tech Stack Summary

| Layer | Technology | Why |
|---|---|---|
| Framework | Next.js 15 (App Router) | Server components, App Router, ecosystem |
| Language | TypeScript | Type safety across the stack |
| Styling | Tailwind CSS v4 + CSS tokens | Design system consistency |
| UI | shadcn/ui + Radix UI | Accessible, customizable components |
| ORM | Drizzle ORM | Type-safe, fast, close to SQL |
| Database | PostgreSQL 16 | Full-text search, JSONB, reliability |
| Auth | JWT (jose) + scrypt | Stateless, secure, no session store |
| Email | Amazon SES | Cost-effective, scalable, reliable |
| WhatsApp | Meta WhatsApp Cloud API | Official, reliable, two-way |
| Storage | Cloudflare R2 | S3-compatible, no egress fees |
| Queue | Outbox pattern (PostgreSQL) | Durable, no extra infrastructure |
| Events | In-process bus (upgradeable to Redis) | Simple start, scalable later |
| Real-time | SSE (Server-Sent Events) | Simple, reliable, proxy-friendly |
| Search | PostgreSQL full-text search | No extra infrastructure |
| Analytics | PostHog (self-hosted or cloud) | Product analytics |
| Payments | Stripe | Industry standard |
| Testing | Vitest | Fast, ESM-native |
| Deployment | Docker + Dokploy | Already in use |
| Package Manager | pnpm workspaces | Monorepo support |

---

## Invariants (from CLAUDE.md, carried over)

1. **No Tailwind utility overrides.** Design tokens in `tokens.css` are the source of truth.
2. **Never drop a table, column, or row without a migration.** Schema changes are additive.
3. **Nothing throws on failure without logging.** Every error path logs and degrades gracefully.
4. **Every external integration is optional.** Unset env vars = no-op, never crash.
5. **Secrets in .env only.** Never in code, never in docs, never in commits.
6. **Consent is explicit.** `emailConsent !== 'granted'` must never produce marketing sends.
7. **Events are the integration point.** Modules communicate through events, not direct calls.
8. **The portal is separate.** It connects via Platform API, not shared code.

---

## Build Log

See `docs/BUILD-LOG.md` for the running log of everything done.

---

## Decisions Log

See `docs/DECISIONS.md` for architectural decisions (ADR format).
