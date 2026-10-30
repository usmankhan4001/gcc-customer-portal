# AGENTS.md — AI Coding Assistant & Developer Guidelines

> **Target Audience**: Autonomous coding agents (Claude, Gemini, Antigravity, Cursor, Codex) and human developers contributing to the **GCCStartup Webapp & Client Portal**.

---

## 1. Project Overview & Business Domain

**GCCStartup** is an international corporate formation and concierge platform providing company incorporation, bank account opening, residency visas, nominee director services, and tax accounting across 6 primary jurisdictions:
1. 🇦🇪 **United Arab Emirates (UAE)** — Freezone & Mainland
2. 🇭🇰 **Hong Kong (HK)** — 100% remote digital formations
3. 🇸🇬 **Singapore** — Tier-1 Asian financial gateway
4. 🇧🇭 **Bahrain** — 0% corporate tax GCC hub
5. 🇮🇪 **Ireland** — 12.5% EU trading vehicle
6. 🇻🇬 **BVI & Cayman** — Asset protection, holding structures & nominee directorships

The platform operates on a **hybrid conversion model**:
* **Self-Serve Funnel**: 10 interactive lead-gen micro-tools + 5-step guided onboarding wizard + Stripe checkout.
* **Consultation-Led Sales**: WhatsApp-guided enterprise onboarding for complex offshore/nominee tiers.
* **Unified Execution Core**: After payment/intake, all deals converge into a shared KYC Document Vault, live 5-stage milestone tracker, and the internal Admin Operations Kanban CRM.

---

## 2. Directory Layout & Repository Organization

```
.
├── src/
│   ├── app/
│   │   ├── (authenticated)/         # Protected client portal route group (requires login)
│   │   │   ├── dashboard/           # Unified client dashboard & pipeline tracker
│   │   │   ├── vault/               # Private document vault with R2 presigned uploads
│   │   │   ├── profile/             # Client settings & profile
│   │   │   ├── notifications/       # In-app notifications feed
│   │   │   ├── services/            # Catalog of post-incorporation addons
│   │   │   └── support/             # Priority concierge support handoff
│   │   ├── admin/                   # Operations & Staff Command Center (requires admin role)
│   │   │   ├── page.tsx             # 4-stage Operations Kanban CRM board (wired to DB)
│   │   │   ├── clients/             # Client & KYC review table
│   │   │   ├── leads/               # Live lead-gen capture stream
│   │   │   ├── pricing/             # Jurisdiction × Tier pricing configurator
│   │   │   └── renewals/            # Annual corporate maintenance & renewal ledger
│   │   ├── api/                     # Backend API Route Handlers
│   │   │   ├── admin/               # Admin endpoints: /pipeline, /pricing, /leads, /kyc
│   │   │   ├── auth/                # Auth endpoints: /send-otp, /verify-otp, /session
│   │   │   ├── checkout/            # Stripe checkout session creator
│   │   │   ├── vault/               # R2 presigned URL generator & shareable link engine
│   │   │   └── webhooks/            # Stripe & WhatsApp incoming webhook receivers
│   │   ├── tools/                   # 10 Interactive lead-gen micro-tools
│   │   ├── onboarding/              # 5-Step client onboarding wizard & persona classification
│   │   ├── auth/                    # Passwordless WhatsApp OTP + password login page
│   │   └── dev/style-guide/         # Design system catalog & brand tokens
│   ├── components/                  # Reusable UI primitives and portal components
│   │   ├── portal/                  # Business components (PipelineTracker, ComplianceSnapshot, etc.)
│   │   └── ui/                      # Base primitives (Button, Dialog, PhoneInput, etc.)
│   ├── lib/                         # Core libraries and utility modules
│   │   ├── db/                      # Drizzle ORM client (`db`) and full schema (`schema.ts`)
│   │   ├── auth.ts                  # JWT signing and verification (`jose`)
│   │   ├── admin-auth.ts            # Admin role enforcement helper (`requireAdmin()`)
│   │   ├── session.ts               # Server session extraction (`getServerSession()`)
│   │   ├── whatsapp.ts              # Meta WhatsApp Graph API v20 direct integration
│   │   ├── stripe.ts                # Stripe SDK client & checkout session helpers
│   │   ├── r2.ts                    # Cloudflare R2 S3 presigned URL engine
│   │   ├── persona.ts               # Persona signal classifier
│   │   └── pdf.tsx                  # Server-side PDF export engine (@react-pdf/renderer)
│   ├── styles/                      # Tailwind CSS v4 stylesheets & design tokens
│   └── middleware.ts                # Edge JWT auth guard & identity header propagator
├── docs/                            # Comprehensive documentation center
│   ├── README.md                    # Documentation index
│   ├── architecture/                # System architecture & topology
│   ├── discovery/                   # PRD, Functional Specs & Concept Papers
│   ├── v1-master-plan/              # 10-phase execution blueprint
│   └── planning-notes/              # Historical planning logs
├── drizzle/                         # Drizzle ORM SQL migration files
├── scripts/                         # Operational & testing scripts
│   ├── test-routes.js               # Comprehensive 32-route health verification suite
│   ├── seed.ts                      # Starter pricing and tax rules database seeder
│   └── generate-icons.js            # PWA & favicon icon generator
└── Dockerfile                       # Multi-stage standalone Alpine container specification
```

---

## 3. Golden Rules of Engagement for AI Agents

### 1. Database & Schema Changes
* **Single Source of Truth**: All schema modifications **must** be made in [`src/lib/db/schema.ts`](file:///D:/GCC%20Startup/Customer%20Portal/src/lib/db/schema.ts). Never edit raw migration files directly.
* **Migration Workflow**: After editing `schema.ts`, generate migrations using:
  ```bash
  npm run db:generate
  ```
* **Production Safety**: Migrations run automatically on container boot via [`docker-entrypoint.sh`](file:///D:/GCC%20Startup/Customer%20Portal/docker-entrypoint.sh). Do not add destructive manual migrations without backward compatibility.

### 2. Next.js 15 & React 19 Architecture
* **Server Components First**: Keep page components as React Server Components (RSC) unless interactive client state (`useState`, `useEffect`, event listeners) is strictly required.
* **Client Components**: Mark with `'use client';` at the top of the file.
* **Dynamic Server Rendering**: If a Server Component reads database queries or cookies directly, ensure it is either inside a protected route or explicitly declares `export const dynamic = 'force-dynamic';` so `next build` does not attempt to prerender it statically without a database connection.
* **Standalone Build Constraints**: `next.config.mjs` has `output: 'standalone'` enabled. Never add dependencies that require native C++ runtime compilation unless included in `deps` stage of `Dockerfile`.

### 3. Icon Libraries & Design Tokens
* **Icons**: The codebase utilizes two curated icon sets:
  * **Phosphor Icons**: For client portal UI elements (`@phosphor-icons/react/dist/ssr` for server components, `@phosphor-icons/react` for client components).
  * **Lucide React**: For admin operations, tables, and system tools (`lucide-react`).
* **Design Tokens & Brand Colors**:
  * **Navy (Primary)**: `#14204A` (Tailwind class: `bg-primary`, `text-primary`)
  * **Gold / CTA (Accent)**: `#C5A572` (Tailwind class: `bg-cta`, `text-cta`)
  * **Backgrounds**: Slate-50 / Slate-100 neutral surfaces for elevated clarity.
  * Preview all tokens at `/dev/style-guide`.

### 4. Security & Access Control
* **Admin API Protection**: Route handlers under `src/app/api/admin/**` **must** call:
  ```ts
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  ```
* **Client Document Security**: Documents stored in Cloudflare R2 are strictly private. Never expose raw R2 URLs. Always generate 1-hour presigned download tokens via `src/lib/r2.ts`.

---

### 5. Human-approval zones (agents: stop and ask before editing)
Changes to these need an explicit human OK in the spec or PR description:
* **Auth & sessions**: `src/lib/auth.ts`, `src/lib/admin-auth.ts`, `src/lib/session.ts`, `src/middleware.ts`.
* **Money**: `src/lib/stripe.ts`, `src/app/api/checkout/**`, Stripe webhook handlers (must stay idempotent).
* **Document access**: `src/lib/r2.ts`, `src/app/api/vault/**` (documents stay private; presigned URLs only).
* **Schema**: any destructive migration (drop/rename column or table). Additive, backward-compatible changes are fine.
* **Deploy**: `Dockerfile`, `docker-entrypoint.sh`, `.github/workflows/**`.
* Never read or commit `.env.local`; add new variables to `.env.example`.

### 6. Spec-driven workflow
1. Non-trivial features start as a spec copied from `docs/specs/_TEMPLATE.md` (acceptance criteria required).
2. Implement on a branch, one spec per PR. Add or update tests that prove each acceptance criterion.
3. Pure logic goes in `src/lib/**` with a sibling `*.test.ts` (vitest).
4. `npm run verify` must pass; CI runs the same command on every PR.
5. Automated path: `/new-spec` (spec-writer) -> human sets `**Status**: approved` -> `/build <spec>` runs `npm run fde -- <spec>` (implementer -> verify self-heal -> AI-docs check -> protected-file check -> reviewer -> local commit, never pushes). Details in `docs/ai/README.md`.
6. Every feature ships with `docs/ai/features/<slug>.md` (from `_TEMPLATE.md`). `docs/ai/CODEMAP.md` and `docs/ai/FEATURES.md` are generated by `npm run docs:ai` (part of `verify`), git-ignored: never edit or commit them. Do not edit `docs/ai/MODULES.md` in a feature run.

### 7. Multi-agent rules
- One spec per branch, one branch per git worktree (`npm run fde` creates `.fde/worktrees/<spec>` and shares `node_modules`). Never run two agents in the same checkout.
- Parallel runs are allowed only when the specs' `**Touches**` lists do not overlap and at most one has `**Schema change**: yes` (the pipeline enforces a schema lock; migrations are numbered by drizzle-kit and would collide).
- Protected files change only when the spec lists them under `**Protected files approved**` with an `**Approval**` line from the owner.
- Merge order: `git merge --no-ff feature/<spec>` into `main` one at a time, rerun `npm run verify` after each merge, resolve conflicts by regenerating generated files.
- Nothing is pushed by agents.

---

## 4. Verification & Testing Commands

Always run these commands before submitting changes:

```bash
# 0. One command: typecheck + unit tests + build (same as CI)
npm run verify

# 1. Typecheck and build verification (all routes must pass cleanly)
npm run build

# 2. Run the full route health verification suite (verifies 32 public, portal & admin routes)
npm run test:routes

# 3. Database migrations (when schema changes)
npm run db:generate
```

---

## 5. Environment Variables Reference

A complete `.env.example` is maintained in the root directory. Key runtime variables:

| Variable | Required In | Purpose |
| :--- | :---: | :--- |
| `DATABASE_URL` | Production & Dev | PostgreSQL connection string (`postgres://...`) |
| `JWT_SECRET` | Production & Dev | Secret key for signing/verifying `gcc_session` JWTs |
| `NEXT_PUBLIC_APP_URL` | Production & Dev | Public base URL (`https://gccstartup.com` or `http://localhost:3005`) |
| `STRIPE_SECRET_KEY` | Production | Stripe API secret key for formations checkout |
| `STRIPE_WEBHOOK_SECRET` | Production | Secret verifying incoming Stripe webhooks |
| `WHATSAPP_ACCESS_TOKEN` | Production | Meta WhatsApp Cloud API permanent bearer token |
| `WHATSAPP_PHONE_NUMBER_ID` | Production | Meta WhatsApp business phone number ID |
| `R2_ACCOUNT_ID` | Production | Cloudflare Account ID for private R2 storage |
| `R2_ACCESS_KEY_ID` | Production | S3-compatible Access Key ID |
| `R2_SECRET_ACCESS_KEY` | Production | S3-compatible Secret Access Key |
| `RESEND_API_KEY` | Production | Resend API key for transactional email receipts |
| `NEXT_PUBLIC_POSTHOG_KEY` | Production | PostHog client-side analytics key |
