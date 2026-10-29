# GCCStartup Webapp — System Architecture & Technical Specifications

This document defines the high-level system architecture, service topology, data flow, and security model for the **GCCStartup Client Portal & Operations Platform**.

---

## 1. System Topology

```
                                    ┌────────────────────────┐
                                    │     End Clients        │
                                    │  (Browser / PWA / Web) │
                                    └───────────┬────────────┘
                                                │ HTTPS
                                                ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                               DOKPLOY CLOUD / DOCKER PAAS                              │
│                                                                                        │
│   ┌────────────────────────────────────────────────────────────────────────────────┐   │
│   │                         Next.js 15 Standalone Webapp                           │   │
│   │                                                                                │   │
│   │   ├── Public Funnel & 10 Lead-Gen Micro-Tools (/tools/*)                       │   │
│   │   ├── Guided Onboarding Wizard (/onboarding)                                   │   │
│   │   ├── Client Authenticated Dashboard & Vault (/dashboard, /vault)             │   │
│   │   ├── Admin Operations Kanban Command Center (/admin)                          │   │
│   │   └── Edge / Node.js API Route Handlers (/api/*)                               │   │
│   └───────────────────────┬───────────────────────────────┬────────────────────────┘   │
│                           │                               │                            │
│                           ▼ (Drizzle ORM)                 │                            │
│   ┌───────────────────────────────────────────┐           │                            │
│   │         PostgreSQL Database               │           │                            │
│   │   - Users & Sessions                      │           │                            │
│   │   - Companies & Formations                │           │                            │
│   │   - Document Metadata & Audit Logs        │           │                            │
│   │   - Milestones & KYC Pipeline             │           │                            │
│   │   - Orders, Pricing, Renewals, Referrals  │           │                            │
│   └───────────────────────────────────────────┘           │                            │
└───────────────────────────────────────────────────────────┼────────────────────────────┘
                                                            │
                     ┌──────────────────────────────────────┴──────────────────────┐
                     │                                                             │
                     ▼                                                             ▼
     ┌───────────────────────────────┐                             ┌───────────────────────────────┐
     │       Cloudflare R2           │                             │        Stripe Checkout        │
     │  - S3-compatible private vault│                             │  - 1-time formation checkout  │
     │  - 1-hour presigned PUT / GET │                             │  - Webhook idempotent receiver│
     │  - Corporate licenses & kits  │                             └───────────────────────────────┘
     └───────────────────────────────┘
                     │                                                             │
                     ▼                                                             ▼
     ┌───────────────────────────────┐                             ┌───────────────────────────────┐
     │  Meta WhatsApp Cloud API v20  │                             │     PostHog Analytics         │
     │  - Direct Graph API           │                             │  - Conversion funnel tracking │
     │  - Live OTP authentication    │                             │  - Persona attribution        │
     │  - Milestone HSM notifications│                             └───────────────────────────────┘
     └───────────────────────────────┘
```

---

## 2. Core Subsystems

### A. Authentication & Session Management
- **Flow**: Passwordless WhatsApp OTP (`src/lib/whatsapp.ts`, template `gcc_otp_code`) with fallback password authentication.
- **Session Cookie**: `gcc_session` HTTP-only, SameSite=Lax cookie containing an encrypted JWT signed with `JWT_SECRET`.
- **Middleware**: [`src/middleware.ts`](file:///D:/GCC%20Startup/Customer%20Portal/src/middleware.ts) inspects session cookies and extracts headers (`x-user-id`, `x-user-email`, `x-user-role`).
  - Gated client routes: `/dashboard`, `/vault`, `/profile`, `/services`, `/notifications`, `/checkout`.
  - Gated admin routes: `/admin/*` requires `role === 'admin' || role === 'super_admin'`.
- **API Guard**: Every admin API route calls `requireAdmin()` from `src/lib/admin-auth.ts`.

### B. Database & Data Model (Drizzle ORM)
- Defined in [`src/lib/db/schema.ts`](file:///D:/GCC%20Startup/Customer%20Portal/src/lib/db/schema.ts).
- Migrations stored in [`drizzle/`](file:///D:/GCC%20Startup/Customer%20Portal/drizzle/).
- Primary Tables:
  1. `users`: Clients, staff, operations, admin, super_admin.
  2. `companies`: Corporate entities across UAE, Hong Kong, Singapore, Bahrain, Ireland, BVI.
  3. `documents` & `document_versions`: R2 file pointers, MIME types, expirations, categories.
  4. `shareable_links`: Token-based expirable public share links for KYC and banking.
  5. `milestones`: 5-6 stage operational timeline for each company.
  6. `orders` & `jurisdiction_pricing`: Stripe integration, order status, amounts.
  7. `renewals`: Automated 60/30/15-day annual maintenance and license renewal ledger.
  8. `jurisdiction_tax_rules`: Authority tax rates, filing frequencies, deadlines.
  9. `notifications` & `push_subscriptions`: In-app feed and Web Push (VAPID).
  10. `leads`: Lead-gen micro-tool inputs and persona classifications.
  11. `referrals`: Affiliate and commission tracking.

### C. Storage & Private Document Vault
- **Engine**: Cloudflare R2 via AWS S3 SDK (`@aws-sdk/client-s3`).
- **Security**: Files are **never public**. Uploads and downloads use temporary presigned URLs (`@aws-sdk/s3-request-presigner`) expiring in 3,600 seconds (1 hour).
- **Public Share Links**: Generated with high-entropy cryptographic tokens ([`src/app/vault/shared/[token]/page.tsx`](file:///D:/GCC%20Startup/Customer%20Portal/src/app/vault/shared/[token]/page.tsx)) with access counting and expiry timestamps.

### D. Lead-Gen & Funnel Engine (10 Tools)
- 10 interactive calculators and evaluators located under `src/app/tools/`:
  - `tax-calculator`: Global tax arbitrage & corporate tax comparison.
  - `banking-odds`: Fintech vs. Tier-1 UAE/HK corporate account likelihood scorer.
  - `jurisdiction-quiz`: Multi-question logic finding the ideal business base.
  - `name-checker`: Commercial registry naming rules and similarity validator.
  - `generate-nda`: Bilateral non-disclosure generator with PDF export.
  - `invoice-generator`: Multi-currency compliant corporate invoice builder.
  - `qfzp-eligibility`: Qualifying Free Zone Person 0% corporate tax evaluator.
  - `ubo-privacy`: Ultimate Beneficial Ownership register visibility checker.
  - `vat-scorer`: Mandatory vs. voluntary VAT threshold assessor.
  - `visa-estimator`: Residence visa and investor quota calculator.
- **Lead Capture Gate**: Seamless email/WhatsApp capture feeding the `leads` table and classifying persona signals (`src/lib/persona.ts`).

---

## 3. Deployment & Runtime

- **Base Image**: `node:20-alpine` (multi-stage Docker build: deps -> builder -> runner).
- **Standalone Output**: Next.js compiled with `output: 'standalone'` into `.next/standalone`.
- **Automated Migrations**: [`docker-entrypoint.sh`](file:///D:/GCC%20Startup/Customer%20Portal/docker-entrypoint.sh) executes `./node_modules/.bin/drizzle-kit migrate` upon container startup before launching `node server.js`.
- **Port**: Listens on port `3005` (exposed in Dockerfile).
