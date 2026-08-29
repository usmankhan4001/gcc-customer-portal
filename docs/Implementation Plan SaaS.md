# Project Emerald: TrustGate — Full Implementation Plan

## 🧑‍🏫 What Is This? (Plain English)

Imagine you are building a **business services app** — like a digital office that helps companies in the UAE start businesses, handle taxes, manage finances, and stay legally compliant. Think of it like a smart assistant in your pocket for business owners.

Now here's the clever part: **you're not building it just for one company — you're building a platform that any UAE business services firm can buy and use as their own app**, with their own logo and branding. It's like how Shopify lets anyone open their own online store, but you are Shopify, and the "stores" are UAE business consultancy firms.

So in simple terms:
- 🏢 **Business owners** (end users) use the app to: register companies, calculate taxes, upload documents, and book consultations.
- 🧑‍💼 **Vendor businesses** (your clients / tenants) pay you a monthly fee to have their own branded version of this app for their own customers.
- 👑 **You** (the platform owner) see everything from a master control panel — all vendors, all revenue, all data — and you never need to rebuild the app for each new client.

---

**TrustGate** is a **multi-tenant, white-label SaaS platform** for UAE business compliance and financial services.
You (the SaaS owner) control the platform. Each **Tenant** (vendor/business) gets a fully branded instance — their own logo, colors, domain, and native app — all powered by the same backend.

---

## Platform Layers

```
┌─────────────────────────────────────────────────────────┐
│              TRUSTGATE SAAS OWNER (YOU)                 │
│         Super Admin Portal — full platform view         │
├─────────────────────────────────────────────────────────┤
│              TENANT LAYER (Vendors/Businesses)          │
│  Tenant A (Branded App)  │  Tenant B  │  Tenant C ...  │
│  Logo/Colors/Domain      │  Own leads │  Own users      │
├─────────────────────────────────────────────────────────┤
│              SHARED INFRASTRUCTURE                      │
│  Supabase PostgreSQL │ Supabase Auth │ Cloudflare R2   │
│  Stripe Billing      │ EAS Builds   │ Cloudflare CDN   │
└─────────────────────────────────────────────────────────┘
```

---

## User Review Required

> [!IMPORTANT]
> **Multi-tenancy model**: Using **row-level multi-tenancy** (`tenant_id` on every table + Supabase RLS policies). This is the recommended Supabase pattern — simple, scalable, and enforced at the DB level. No tenant ever sees another tenant's data.

> [!IMPORTANT]
> **White-label native apps**: Two options — (A) Single app with dynamic theming loaded per tenant at login (fastest), or (B) Separate EAS builds per tenant with custom app icon/name/bundle ID (full native branding). Recommend starting with **Option A** and moving to B for premium-tier tenants.

> [!IMPORTANT]
> **Billing**: Stripe handles subscription plans. You'll need a Stripe account. Plans can be per-tenant (monthly/annual).

> [!IMPORTANT]
> **Credentials needed before going live**: Supabase URL + Anon Key, Stripe Secret Key, Cloudflare R2 credentials, SMTP credentials (for booking confirmation emails).

---

## Tech Stack Summary

| Layer | Technology |
|---|---|
| Mobile + Web | Expo (React Native) — iOS, Android, Web PWA |
| Auth | Supabase Auth (email, Google OAuth) |
| Database | Supabase PostgreSQL (multi-tenant RLS) |
| File Storage | Cloudflare R2 (presigned URLs) |
| Billing | Stripe (subscriptions + webhooks) |
| Admin Panel | Built-in Expo admin section (role-gated) |
| Super Admin | Separate Next.js web portal |
| Native Builds | EAS Build |
| CDN | Cloudflare |

---

## Proposed Changes

### 1. Foundation

#### [NEW] Project Bootstrap
- `npx create-expo-app@latest ./ --template blank`
- Key packages: `expo-router`, `@supabase/supabase-js`, `stripe-react-native`, `react-native-reanimated`, `expo-local-authentication`, `expo-secure-store`, `react-native-calendars`, `expo-document-picker`, `expo-file-system`, `@react-native-async-storage/async-storage`

#### [NEW] `constants/theme.js` — Theming Engine
- Default theme tokens (deep navy `#0A0F1E`, emerald `#00C896`)
- `ThemeContext` — loads tenant branding from Supabase at login
- Dynamically swaps colors, fonts, logo for each tenant

---

### 2. Multi-Tenant Database Schema

#### Supabase Tables

| Table | Key Columns |
|---|---|
| `tenants` | id, name, slug, logo_url, primary_color, domain, plan, stripe_customer_id, created_at |
| `tenant_users` | id, tenant_id, user_id, role (`super_admin`/`admin`/`manager`/`user`) |
| `leads` | id, tenant_id, name, email, phone, service_type, emirate, notes, status, assigned_to, created_at |
| `support_tickets` | id, tenant_id, user_id, subject, message, status, attachments[], created_at |
| `documents` | id, tenant_id, user_id, name, r2_key, r2_url, type, created_at |
| `profiles` | id (FK auth.users), tenant_id, full_name, company, role |
| `news_articles` | id, tenant_id, title, body, image_url, published_at |
| `team_members` | id, tenant_id, name, title, bio, photo_url, certifications[] |
| `availability` | id, tenant_id, day_of_week, start_time, end_time, is_active |
| `bookings` | id, tenant_id, user_id, service_type, date, time_slot, status, notes, created_at |
| `subscriptions` | id, tenant_id, stripe_subscription_id, plan, status, current_period_end |
| `audit_logs` | id, tenant_id, user_id, action, table_name, record_id, timestamp |

- **RLS on every table**: `tenant_id = auth.jwt() -> tenant_id` claim
- **Audit logs**: trigger on all DML on `leads`, `documents`, `tickets`

---

### 3. Security Architecture

- **Layer 1 — Auth**: Supabase Auth (email + Google OAuth), session timeout
- **Layer 2 — Biometrics**: `expo-local-authentication` (FaceID/Fingerprint) for Admin section entry
- **Layer 3 — RBAC**: `super_admin` > `admin` > `manager` > `user`, enforced via Supabase RLS
- **Layer 4 — Secure Storage**: JWT in iOS Keychain / Android Keystore via `expo-secure-store`
- **Layer 5 — Network**: TLS 1.3, no secret keys in app bundle
- **Layer 6 — File Security**: R2 private bucket, presigned URLs with 1hr expiry
- **Layer 7 — Audit Trail**: Every sensitive action logged to `audit_logs`

---

### 4. Client Mobile App (Expo) — Screens

**Guest / Onboarding**
- `app/onboarding.jsx` — 4-step UAE compliance walkthrough (animated, skippable)
- `app/auth.jsx` — Login / Register / Google OAuth

**Main App (Client)**
- `app/(tabs)/home.jsx` — Dashboard: news feed, quick-action tiles, welcome banner
- `app/(tabs)/formation.jsx` — Company Formation Hub (Mainland vs Freezone logic form)
- `app/(tabs)/tax.jsx` — Tax Registration Portal (TRN / VAT / Corporate Tax tabs)
- `app/(tabs)/accounting.jsx` — Accounting & Bookkeeping intake
- `app/(tabs)/investment.jsx` — Investment Strategy intake
- `app/tools/calculator.jsx` — Corporate Tax Estimator (9% UAE calculator)
- `app/tools/checklist.jsx` — Document Checklist Generator (dynamic by activity)
- `app/tools/booking.jsx` — **Native booking system**: calendar date-picker (`react-native-calendars`), available time slots fetched from Supabase `availability` table, conflict-checked booking creation, email confirmation via SMTP Edge Function
- `app/trust-center.jsx` — Team profiles + success gallery
- `app/contact.jsx` — Map + support ticket + WhatsApp link

**Tenant Admin Section** (role-gated + biometric)
- `app/admin/dashboard.jsx` — Lead stats charts, ticket summary, activity feed
- `app/admin/leads.jsx` — Lead table: filter, search, assign, export
- `app/admin/tickets.jsx` — Support ticket manager
- `app/admin/content.jsx` — Edit news, team, services (stored in Supabase)
- `app/admin/documents.jsx` — Browse uploaded documents (R2 links)
- `app/admin/settings.jsx` — Tenant branding: logo, colors, SMTP config, working hours / availability slots

---

### 5. Super Admin Portal (Next.js Web App)

Separate web app at `admin.trustgate.app` (or your domain).

**Pages**
- `/dashboard` — Platform-wide KPIs: total tenants, MRR, active users, leads volume
- `/tenants` — Full tenant directory: create, suspend, delete, impersonate
- `/tenant/[id]` — Drill into any tenant: leads, users, documents, audit log
- `/billing` — Stripe subscription overview per tenant, plan upgrades
- `/feature-flags` — Toggle features on/off per tenant or plan
- `/audit-log` — Platform-wide audit log viewer
- `/settings` — Platform config: default branding, SMTP, R2 config

**Security**: Separate Supabase `super_admin` role, IP allowlist option, 2FA enforced

---

### 6. Tenant Onboarding & White-Label Engine

- **Signup flow**: Tenant visits `trustgate.app/signup` → picks plan → Stripe checkout → Supabase tenant row created → branding setup wizard
- **Branding wizard**: Upload logo, pick primary color, set SMTP, set domain, configure working hours
- **Custom domain**: Cloudflare Workers route `theirbrand.com` → PWA for that tenant
- **Dynamic theming**: App loads `tenant_id` from auth JWT → fetches branding from `tenants` table → applies at runtime
- **White-label native builds** (Premium tier): EAS Build with per-tenant `app.json` (name, bundle ID, icon)

---

### 7. Billing (Stripe)

- **Plans**: Starter / Growth / Enterprise (monthly + annual)
- Stripe Checkout → webhook → update `subscriptions` table
- Feature flags locked by plan (e.g., white-label native builds = Enterprise only)
- Dunning: Stripe handles failed payment retries + emails

---

### 8. File Handling (Cloudflare R2)

- `services/r2.js` — presigned URL generator via Supabase Edge Function
- Upload flow: App → Edge Function (gets presigned URL) → R2 (direct upload)
- File metadata saved to `documents` table with `tenant_id`
- Admin can preview/download from Dashboard

---

### 9. Shared Services & Components

- `services/supabase.js` — init + typed DB helpers
- `services/stripe.js` — subscription management
- `context/AuthContext.jsx` — session + role + tenant
- `context/ThemeContext.jsx` — branded theme per tenant
- `components/GlassCard.jsx`, `BottomNav.jsx`, `LeadForm.jsx`, `StepWizard.jsx`, `BiometricGate.jsx`

---

### 10. Environment Config

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
EXPO_PUBLIC_R2_PUBLIC_DOMAIN=https://files.trustgate.app
# Server-side (Edge Functions only)
STRIPE_SECRET_KEY=sk_live_...
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET_NAME=trustgate-docs
SMTP_HOST=mail.yourdomain.com
SMTP_PORT=465
SMTP_USER=noreply@yourdomain.com
SMTP_PASS=...
```

---

## Verification Plan

### Dev Server
1. `npx expo start --web` → confirm web PWA loads
2. Sign up as new tenant → branding loads dynamically
3. Submit lead form → confirm row in Supabase `leads` with correct `tenant_id`
4. Upload document → confirm file in R2 bucket, URL saved in `documents`
5. Super Admin portal → confirm tenant appears, lead visible

### Manual (by you)
1. Create 2 test tenants with different branding → confirm complete isolation
2. Stripe test checkout → confirm subscription row created
3. Biometric lock → Admin section should not open without FaceID/fingerprint
4. Audit log → confirm every lead insert/update is recorded
