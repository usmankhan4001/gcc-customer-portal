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
├── TrustGate/                # Companion app (React Native / Expo)
└── package.json
```

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

Planning complete. Awaiting resolution of 6 blocking items (budget, dev
resourcing, launch date, company registration/licensing, email provider,
analytics access) before Phase 0 build begins.
