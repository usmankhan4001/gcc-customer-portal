# GCCStartup.com — V1.0 Technical Architecture & API Contracts
## Modern Web Architecture, External Integrations & Endpoint Definitions

---

### 1. Unified Tech Stack Overview

| Layer | Technology | Role / Justification |
|---|---|---|
| **Frontend & SSR** | Next.js 15 (React 19, App Router) | Fast rendering, SEO optimization for micro-tools, server actions. |
| **Styling & Design System** | Vanilla CSS Tokens + Rich Glassmorphism | Custom, lightweight, ultra-premium UI (Navy `#0A0F1E`, Emerald `#00C896`, Gold `#D4AF37`). |
| **Backend & ORM** | Next.js API Routes + Directus / Node Postgres | Real-time database operations, serverless edge handling. |
| **Primary Database** | PostgreSQL 16 (on Dokploy) | High-performance ACID relational storage for multi-entity compliance. |
| **File & Document Storage**| Cloudflare R2 (S3-Compatible) | Zero-egress cost, presigned 1-hour secure URLs, AES-256 encryption. |
| **Payment Gateway** | Stripe Elements & Checkout | Global multi-currency card processing + webhooks. |
| **WhatsApp Engine** | Official Meta WhatsApp Cloud API | Direct Graph API v20.0 integration via verified Meta Business Manager. |
| **Transactional Email** | Resend / Sender API | High-deliverability HTML email receipts and PDF delivery. |
| **Deployment / Host** | Dokploy PaaS (Self-Hosted on VPS) | Automated Git-based deployments on branch `V4.0`. |

---

### 2. Core REST & Server Action API Contracts

---

#### 1. `POST /api/calculator/evaluate`
**Purpose**: Computes instant tax arbitrage comparison without requiring authentication.
* **Request**:
  ```json
  {
    "country_residence": "NL",
    "annual_profit_eur": 250000,
    "business_model": "ecommerce_fba",
    "target_jurisdiction": "hong_kong"
  }
  ```
* **Response (200 OK)**:
  ```json
  {
    "home_tax_rate": 0.495,
    "home_tax_amount_eur": 123750,
    "optimized_tax_rate": 0.0,
    "optimized_tax_amount_eur": 0,
    "net_annual_savings_eur": 123750,
    "recommended_tier": "tier_2_nominee",
    "recommended_package_usd": 3000
  }
  ```

---

#### 2. `POST /api/vault/presign`
**Purpose**: Generates an authorized S3/R2 presigned PUT upload URL for KYC documents.
* **Headers**: `Authorization: Bearer <JWT_SESSION_TOKEN>`
* **Request**:
  ```json
  {
    "company_id": "8f3b29c1-7d1a-4a2e-b6b1-0e4a7c81a2e9",
    "category": "passport",
    "file_name": "alex_passport_color.pdf",
    "file_size": 2481024,
    "mime_type": "application/pdf"
  }
  ```
* **Response (200 OK)**:
  ```json
  {
    "document_id": "c1a92e4a-9b1e-4c2a-8f1d-2b4a7c81e9b2",
    "upload_url": "https://r2.gccstartup.com/vault/alex_passport_color.pdf?X-Amz-Signature=...",
    "r2_key": "vault/2026/08/alex_passport_color.pdf",
    "expires_in_seconds": 900
  }
  ```

---

#### 3. `POST /api/admin/kyc/review`
**Purpose**: Compliance officer approves or rejects an uploaded document.
* **Headers**: `Authorization: Bearer <STAFF_JWT_TOKEN>`
* **Request**:
  ```json
  {
    "document_id": "c1a92e4a-9b1e-4c2a-8f1d-2b4a7c81e9b2",
    "status": "action_needed",
    "rejection_reason": "Utility bill is older than 90 days. Please upload statement dated after May 2026.",
    "notify_whatsapp": true
  }
  ```
* **Response (200 OK)**:
  ```json
  {
    "success": true,
    "document_status": "action_needed",
    "whatsapp_dispatched": true,
    "whatsapp_message_id": "wamid.HBgLM..."
  }
  ```

---

#### 4. `POST /api/webhooks/stripe`
**Purpose**: Listens to Stripe payment events to provision orders and trigger Meta WhatsApp welcome flows.
* **Event**: `checkout.session.completed` / `payment_intent.succeeded`
* **Execution Logic**:
  1. Verifies Stripe Webhook HMAC Signature.
  2. Updates `orders` table to `paid`.
  3. Transitions `companies` table status from `lead` ➔ `onboarding`.
  4. Generates passwordless Magic Login Token.
  5. Dispatches **Template 2 (`payment_received_onboarding`)** via Meta WhatsApp API.
