# GCCStartup — Client Portal / Webapp

Client-facing sales-execution webapp for GCCStartup.com, an international
company formation service (HK, UAE, Singapore, Ireland & 15+ jurisdictions).
Transforms the marketing site into a hybrid funnel: self-serve wizard +
consultation-led sales, converging at payment, document collection, and a
Kanban-driven incorporation pipeline.

## Stack

- **Frontend / App:** Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS v4
- **Backend / DB:** Postgres (self-hosted on Dokploy) + Drizzle ORM, via the standard postgres-js driver
- **File storage:** Cloudflare R2 (S3-compatible), presigned uploads/downloads
- **Payments:** Stripe Checkout + webhooks
- **Messaging:** WhatsApp Business Cloud API (Meta Graph API, direct) + Resend (email) + Web Push
- **Analytics:** PostHog (event/person analytics — never the source of truth for real-time app behavior)
- **Hosting:** Vercel

Scheduling (Cal.com) is not in the current build — the consultation-led
funnel routes to a WhatsApp handoff instead of a booking calendar; see
`docs/v1-master-plan/` for the deferred scope.

## Repository Layout

```
.
├── src/                      # Next.js app source (webapp UI + API routes)
│   ├── app/
│   ├── components/
│   ├── lib/
│   └── styles/
├── Discovery/                # Discovery questionnaires & planning docs
│   ├── Phase1_Concept_Paper.md
│   ├── Phase1_PRD.md
│   ├── Phase1_Functional_Spec.md
│   └── EXECUTIVE_SUMMARY.md
├── docs/                     # Master plan & blueprints
│   ├── v1-master-plan/
│   └── GCCSTARTUP_MASTER_NON_TECHNICAL_BLUEPRINT.md
└── package.json
```

`_archived/TrustGate/` holds a prior companion React Native/Expo app, parked
in favor of a single responsive web app (see "Status" below).

## Getting Started (webapp)

```bash
npm install
npm run dev -- --port 3005
```

Requires environment variables for Neon (`DATABASE_URL`), Stripe, Cloudflare
R2, the WhatsApp Business Cloud API, Resend, Web Push (VAPID), and PostHog —
copy `.env.example` to `.env.local` (gitignored) and fill in real values.

## Planning Documents

Product discovery and the full spec live under `Discovery/` and `docs/`:

- `Discovery/Phase1_Concept_Paper.md` — vision, problem, success metrics
- `Discovery/Phase1_PRD.md` — product requirements, data model, delivery plan
- `Discovery/Phase1_Functional_Spec.md` — API contracts, UI specs, logic
- `Discovery/EXECUTIVE_SUMMARY.md` — status & next steps
- `docs/v1-master-plan/` — detailed master plan (10 phases)

## Status

Active build. Auth (WhatsApp OTP), checkout/payments, the vault (expiry
tracking, versioning, shareable links, access audit trail), the client
dashboard/profile, in-app notifications + Web Push, PostHog analytics, and
all ten lead-gen tools (with PDF export on four of them) are wired to real
data. The client-facing screens are mid-reskin onto the design system at
`/dev/style-guide` (dev-only route). The admin platform
(`src/app/admin/*`) beyond the pricing/leads pages stays out of v1 scope —
see `docs/v1-master-plan/` for what's deferred. See recent commits for
current progress.
