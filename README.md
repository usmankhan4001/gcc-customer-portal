# GCCStartup — Client Portal & Operations Platform

[![Next.js](https://img.shields.io/badge/Next.js-15.2-black?style=flat&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-blue?style=flat&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-v4-38B2AC?style=flat&logo=tailwind-css)](https://tailwindcss.com/)
[![Drizzle ORM](https://img.shields.io/badge/Drizzle-ORM-C5F74F?style=flat)](https://orm.drizzle.team/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?style=flat&logo=postgresql)](https://www.postgresql.org/)
[![Dokploy](https://img.shields.io/badge/Deployment-Dokploy-0052CC?style=flat)](https://dokploy.com/)

**GCCStartup** is an international corporate formation and concierge platform providing company incorporation, bank account opening, residency visas, nominee director services, and tax accounting across the **UAE, Hong Kong, Singapore, Bahrain, Ireland, and BVI**.

This repository powers the hybrid sales-execution web application: a self-serve funnel (10 interactive lead-gen micro-tools + onboarding wizard + Stripe checkout) combined with a consultation-led sales engine, converging into a secure KYC Document Vault, live milestone tracking, and an internal Admin Operations Kanban CRM.

---

## ⚡ Quickstart

### Prerequisites
- Node.js 20+ (recommended: v24 LTS)
- npm 10+
- PostgreSQL database instance

### Installation & Local Dev
```bash
# 1. Clone & install dependencies
git clone https://github.com/usmankhan4001/gcc-customer-portal.git
cd gcc-customer-portal
npm install

# 2. Configure environment
cp .env.example .env.local

# 3. Seed starter pricing & tax rules (optional)
npm run db:seed

# 4. Start local development server (runs on port 3005)
npm run dev
```

Visit [http://localhost:3005](http://localhost:3005) to view the portal.

### Verification Suite
```bash
# Verify production build compilation across all routes
npm run build

# Run the 32-route automated endpoint health check
npm run test:routes
```

---

## 📂 Repository Architecture

```
.
├── src/                          # Next.js 15 App Router source
│   ├── app/
│   │   ├── (authenticated)/      # Client portal routes (Dashboard, Vault, Profile, Notifications)
│   │   ├── admin/                # Operations Command Center (Kanban CRM, Leads, Pricing, KYC)
│   │   ├── api/                  # Backend API Route Handlers
│   │   ├── tools/                # 10 Interactive lead-gen micro-tools
│   │   ├── onboarding/           # 5-Step client onboarding wizard
│   │   ├── auth/                 # Passwordless WhatsApp OTP login & registration
│   │   └── dev/style-guide/      # Design system catalog & brand tokens
│   ├── components/               # Reusable UI primitives & portal components
│   ├── lib/                      # Core backend libraries (Drizzle DB, R2, Stripe, WhatsApp, PDF)
│   ├── styles/                   # Tailwind CSS v4 styling & globals
│   └── middleware.ts             # Session verification & role authorization guard
├── docs/                         # Comprehensive documentation center
│   ├── README.md                 # Documentation Master Index
│   ├── architecture/             # System Architecture & Technical Specifications
│   ├── discovery/                # PRD, Functional Specs, Concept Papers & Questionnaires
│   ├── v1-master-plan/           # 10-Phase detailed implementation roadmap
│   └── planning-notes/           # Historical planning logs
├── drizzle/                      # Drizzle ORM SQL migration files
├── scripts/                      # Utility scripts (route testing, DB seeding, icon generator)
├── AGENTS.md                     # Universal AI Agent & Developer Guidelines
└── Dockerfile                    # Multi-stage standalone Alpine production image
```

---

## 🛠️ Stack & Infrastructure

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend** | Next.js 15 (App Router), React 19, TypeScript | High-performance, SEO-optimized, responsive web application |
| **Styling** | Tailwind CSS v4, Navy `#14204A`, Gold `#C5A572` | Sophisticated private banking visual aesthetic |
| **Database** | PostgreSQL + Drizzle ORM | Type-safe persistence layer with automatic migration execution |
| **Storage** | Cloudflare R2 (S3-compatible) | Private KYC vault with 1-hour temporary presigned URLs |
| **Authentication** | Passwordless WhatsApp OTP (`jose` JWT) | Meta Graph API authentication template (`gcc_otp_code`) |
| **Payments** | Stripe Checkout & Webhooks | 1-time company formation checkout & recurring fee collection |
| **Messaging** | Meta WhatsApp Cloud API v20 + Resend | Real-time milestone updates, status alerts & transactional receipts |
| **Analytics** | PostHog (Client + Server SDK) | Persona attribution, conversion tracking & onboarding funnels |
| **Deployment** | Docker Standalone on Dokploy PaaS | Automated migrations on startup with zero-downtime rolling deploys |

---

## 🧰 The 10 Interactive Lead-Gen Tools

The portal includes 10 standalone customer conversion tools under [`/tools`](file:///D:/GCC%20Startup/Customer%20Portal/src/app/tools):

1. **Tax Arbitrage Calculator** ([`/tools/tax-calculator`](file:///D:/GCC%20Startup/Customer%20Portal/src/app/tools/tax-calculator)) — Global corporate & personal income tax savings modeler.
2. **Banking Odds Calculator** ([`/tools/banking-odds`](file:///D:/GCC%20Startup/Customer%20Portal/src/app/tools/banking-odds)) — Predicts approval likelihood for UAE/HK corporate accounts.
3. **Jurisdiction Fit Quiz** ([`/tools/jurisdiction-quiz`](file:///D:/GCC%20Startup/Customer%20Portal/src/app/tools/jurisdiction-quiz)) — Multi-branch recommendation engine.
4. **Company Name Checker** ([`/tools/name-checker`](file:///D:/GCC%20Startup/Customer%20Portal/src/app/tools/name-checker)) — Validates commercial registry naming conventions.
5. **Mutual NDA Generator** ([`/tools/generate-nda`](file:///D:/GCC%20Startup/Customer%20Portal/src/app/tools/generate-nda)) — Bilateral NDA generator with instant PDF download.
6. **Corporate Invoice Generator** ([`/tools/invoice-generator`](file:///D:/GCC%20Startup/Customer%20Portal/src/app/tools/invoice-generator)) — Multi-currency compliant invoice builder.
7. **QFZP 0% Tax Evaluator** ([`/tools/qfzp-eligibility`](file:///D:/GCC%20Startup/Customer%20Portal/src/app/tools/qfzp-eligibility)) — UAE Qualifying Free Zone Person tax test.
8. **UBO Privacy Scorer** ([`/tools/ubo-privacy`](file:///D:/GCC%20Startup/Customer%20Portal/src/app/tools/ubo-privacy)) — Beneficial ownership public registry privacy assessor.
9. **VAT Assessment Scorer** ([`/tools/vat-scorer`](file:///D:/GCC%20Startup/Customer%20Portal/src/app/tools/vat-scorer)) — Evaluates mandatory vs. voluntary VAT thresholds.
10. **Residence Visa Estimator** ([`/tools/visa-estimator`](file:///D:/GCC%20Startup/Customer%20Portal/src/app/tools/visa-estimator)) — Calculates investor visa quotas and timeline.

---

## 🤖 AI Agent Guidelines

If you are an autonomous coding assistant (Claude, Gemini, Cursor, Codex, Antigravity), read [**`AGENTS.md`**](./AGENTS.md) first. It provides:
- Architectural rules of engagement
- Database migration standards
- Component patterns (Server Components vs. Client Components)
- Environment variable dictionary
- Complete route catalog

---

## 🚢 Dokploy & Docker Deployment

The application compiles to a minimal standalone Alpine Linux container:

```bash
# Build Docker image locally
docker build -t gccstartup-app .

# Run container with environment configuration
docker run -p 3005:3005 --env-file .env.local gccstartup-app
```

On Dokploy:
1. Connect the GitHub repository and select the `portal-ui-overhaul` branch.
2. Select **Docker** build type (utilizes `Dockerfile`).
3. Set environment variables in Dokploy dashboard.
4. Deploy — migrations run automatically on container boot via [`docker-entrypoint.sh`](file:///D:/GCC%20Startup/Customer%20Portal/docker-entrypoint.sh).

---

## 📄 License & Confidentiality

Proprietary & Confidential. Copyright © 2026 GCCStartup. All rights reserved.
