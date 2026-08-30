# GCCStartup — Client Portal / Webapp

Client-facing sales-execution webapp for GCCStartup.com, an international
company formation service (HK, UAE, Singapore, Ireland & 15+ jurisdictions).
Transforms the marketing site into a hybrid funnel: self-serve wizard +
consultation-led sales, converging at payment, document collection, and a
Kanban-driven incorporation pipeline.

## Stack

- **Frontend / App:** Next.js 15 (App Router), React 19, TypeScript
- **Backend / DB:** Supabase (PostgreSQL, Auth, Storage, Realtime)
- **Payments:** Stripe
- **Messaging:** 360dialog (WhatsApp Business API) + Resend (email)
- **Scheduling:** Cal.com
- **Analytics:** PostHog
- **Hosting:** Vercel

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

Requires environment variables for Supabase, Stripe, 360dialog, Resend, and
Cal.com (see team for `.env`).

## Planning Documents

Product discovery and the full spec live under `Discovery/` and `docs/`:

- `Discovery/Phase1_Concept_Paper.md` — vision, problem, success metrics
- `Discovery/Phase1_PRD.md` — product requirements, data model, delivery plan
- `Discovery/Phase1_Functional_Spec.md` — API contracts, UI specs, logic
- `Discovery/EXECUTIVE_SUMMARY.md` — status & next steps
- `docs/v1-master-plan/` — detailed master plan (10 phases)

## Status

Active build. The UI shell (dashboard, services, checkout, vault, profile,
lead-gen tools, admin platform) exists but wasn't wired to real data or a
working login — an in-progress rebuild plan (data model, auth, real data
wiring, then a full visual reskin) tracks the fix. See recent commits for
current progress; the stack list above is being reconciled with what's
actually in use (Neon Postgres + Drizzle + Cloudflare R2, not Supabase).
