# TrustGate — Singular App Plan
*One business. One app. Fully owned.*

---

## 🧑‍🏫 What Is This? (Plain English)

A **dedicated mobile app** built exclusively for your business. Your logo, your brand, your leads — all in one place. Your team manages everything from a built-in admin dashboard. Think of it as a premium digital front-door for your UAE compliance and financial services business.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Mobile + Web | Expo (React Native) — iOS, Android, Web PWA |
| Auth | Supabase Auth (email + Google OAuth) |
| Database | Supabase PostgreSQL |
| File Storage | Cloudflare R2 |
| Biometrics | `expo-local-authentication` |
| Native Builds | EAS Build (App Store + Play Store) |

---

## Security

- Supabase Auth + JWT stored in iOS Keychain / Android Keystore (`expo-secure-store`)
- Role-based access: `admin`, `manager`, `user`
- Supabase Row Level Security on all tables
- FaceID / Fingerprint gate on Admin section
- R2 private bucket — presigned URLs with 1hr expiry
- Audit log on all lead / document changes

---

## Database Tables

| Table | Key Columns |
|---|---|
| `leads` | id, name, email, phone, service_type, emirate, notes, status, created_at |
| `support_tickets` | id, user_id, subject, message, status, created_at |
| `documents` | id, user_id, name, r2_key, r2_url, type, created_at |
| `profiles` | id (FK auth.users), full_name, company, role |
| `news_articles` | id, title, body, image_url, published_at |
| `team_members` | id, name, title, bio, photo_url, certifications[] |
| `audit_logs` | id, user_id, action, table_name, record_id, timestamp |

---

## App Screens

### Client-Facing
| Screen | Description |
|---|---|
| Onboarding | 4-step UAE compliance walkthrough (skippable) |
| Auth | Login / Register / Google OAuth |
| Home | News feed, quick-action service tiles, welcome banner |
| Company Formation | Mainland vs Freezone logic form → lead captured |
| Tax Registration | TRN / VAT / Corporate Tax tabbed intake |
| Accounting | Monthly bookkeeping request form |
| Investment | Portfolio management intake |
| Tax Calculator | 9% UAE corporate tax estimator (real-time) |
| Document Checklist | Dynamic checklist by business type, PDF export |
| Booking | Calendly embed for discovery calls |
| Trust Center | Team profiles, certifications, success gallery |
| Contact | Google Map, WhatsApp, support ticket form |

### Admin Section *(biometric-gated)*
| Screen | Description |
|---|---|
| Dashboard | Lead stats charts, ticket summary, activity feed |
| Leads | Table: filter, search, assign, export CSV |
| Tickets | View and respond to support tickets |
| Content | Edit news, team members (live in app instantly) |
| Documents | Browse all uploaded client documents (R2 links) |
| Settings | App config: Calendly URL, WhatsApp number, SMTP |

---

## File Handling (Cloudflare R2)

- Users upload docs (Trade License, Emirates ID, MoA) from the app
- App → Supabase Edge Function (get presigned URL) → R2 (direct upload)
- File URL saved to `documents` table
- Admin browses and downloads from Dashboard

---

## Environment Config

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
EXPO_PUBLIC_CALENDLY_URL=https://calendly.com/your-link
EXPO_PUBLIC_R2_PUBLIC_DOMAIN=https://files.yourdomain.com
```

---

## Build & Deploy

- `npx expo start --web` → local dev / PWA
- `eas build --platform ios` → App Store build
- `eas build --platform android` → Play Store build
- Web export: `npx expo export --platform web` → deploy to Vercel / Netlify as PWA

---

## Verification Plan

1. Submit Company Formation form → check `leads` table in Supabase
2. Upload document → confirm in R2 bucket, URL in `documents` table
3. Corporate Tax Calculator: AED 1,000,000 profit → AED 56,250 tax (9% × AED 625,000 above threshold)
4. Admin login + FaceID → dashboard loads, leads visible
5. Audit log → confirm lead insert recorded
