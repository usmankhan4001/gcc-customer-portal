# GCCStartup.com — Client Portal & Webapp
## Functional Specification

**Version:** 1.0
**Date:** 2026-08-29
**Depends on:** Phase1_PRD.md, Phase1_Concept_Paper.md
**Purpose:** Translates PRD requirements into developer-ready specifications with API contracts, UI wireframe descriptions, and edge cases.

---

## Table of Contents
1. [System Overview](#1-system-overview)
2. [API Contracts](#2-api-contracts)
3. [UI Specifications](#3-ui-specifications)
4. [Business Logic](#4-business-logic)
5. [Error Handling](#5-error-handling)
6. [Edge Cases](#6-edge-cases)
7. [Developer Checklist](#7-developer-checklist)

---

## 1. System Overview

### 1.1 Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                    CLIENT BROWSER                        │
│  Next.js (SSR/CSR) ←→ Supabase Client SDK              │
└──────────┬──────────────────────┬───────────────────────┘
           │                      │
           ▼                      ▼
┌──────────────────┐    ┌──────────────────┐
│   Next.js API    │    │    Supabase      │
│    Routes        │    │   (PostgreSQL    │
│  /api/*          │    │    + Auth +      │
│                  │    │    Storage)      │
└──┬───┬───┬───┬───┘    └──────────────────┘
   │   │   │   │
   │   │   │   └──────→ Cal.com (embed)
   │   │   └──────────→ Resend (email)
   │   └──────────────→ 360dialog (WhatsApp)
   └──────────────────→ Stripe (payments)
```

### 1.2 Data Flow Summary

```
Lead Form Submit
  → Create lead record (Supabase)
  → Trigger auto-response (360dialog / Resend)
  → PostHog event: lead_submitted
  
Consultation Book
  → Cal.com webhook fires
  → Create consultation record
  → Send confirmation (WhatsApp + email)
  → PostHog event: consultation_booked

Proposal Send
  → Generate PDF from template
  → Store in Supabase Storage
  → Send via email (Resend)
  → Send WhatsApp notification
  → Create proposal record
  → PostHog event: proposal_sent

Payment
  → Stripe Checkout session created
  → Client completes payment
  → Stripe webhook: payment_intent.succeeded
  → Create payment record
  → Update deal stage to "Payment Received"
  → Send confirmation (WhatsApp + email)
  → PostHog event: payment_received

Document Upload
  → Client uploads to Supabase Storage
  → Create document record (status: uploaded)
  → Notify team (Slack/WhatsApp)
  → PostHog event: document_uploaded
```

---

## 2. API Contracts

### 2.1 Lead Management

#### POST /api/leads
**Purpose:** Create a new lead from form submission
```
Request:
{
  full_name: string (required, min: 2)
  email: string (required, valid email)
  whatsapp_number: string (required, with country code)
  country_of_residence: string (required)
  business_type: enum (required)
    - "ecommerce"
    - "freelance"
    - "consulting"
    - "holding_company"
    - "other"
  jurisdiction_interest: enum (required)
    - "hong_kong"
    - "uae"
    - "singapore"
    - "ireland"
    - "other"
  referral_source: enum (optional)
    - "meta_ads"
    - "google"
    - "linkedin"
    - "referral"
    - "direct"
    - "other"
  utm_source: string (optional, from URL)
  utm_medium: string (optional, from URL)
  utm_campaign: string (optional, from URL)

Response (201):
{
  id: uuid
  status: "new"
  lead_score: int
  created_at: timestamp
}

Side Effects:
  → Trigger auto-response webhook (async)
  → PostHog: lead_submitted event
```

#### GET /api/leads
**Purpose:** List leads (team only)
```
Query Params:
  status: enum (optional filter)
  assigned_to: uuid (optional filter)
  jurisdiction: enum (optional filter)
  page: int (default: 1)
  limit: int (default: 20, max: 100)

Response (200):
{
  data: Lead[]
  total: int
  page: int
  has_more: boolean
}
```

#### PATCH /api/leads/:id
**Purpose:** Update lead (team only)
```
Request:
{
  status: enum (optional)
  assigned_to: uuid (optional)
  lead_score: int (optional)
  notes: string (optional)
}

Response (200): Updated Lead object
```

---

### 2.2 Consultation Booking

#### POST /api/consultations
**Purpose:** Book a new consultation
```
Request:
{
  client_id: uuid (required)
  preferred_date: date (required)
  preferred_time: time (required)
  timezone: string (required, IANA format)
  intake_form_data: jsonb (required)
    {
      business_description: string
      annual_revenue_range: enum
      current_tax_residency: string
      specific_goals: string
      preferred_communication: enum ("whatsapp", "email")
    }
}

Response (201):
{
  id: uuid
  scheduled_at: timestamp
  meeting_link: string (Google Meet/Zoom)
  status: "booked"
}

Side Effects:
  → Create Cal.com event
  → Send confirmation (WhatsApp + email)
  → PostHog: consultation_booked
```

#### POST /api/consultations/:id/complete
**Purpose:** Mark consultation as completed (team only)
```
Request:
{
  notes: string (required)
  recommended_jurisdiction: enum (optional)
  recommended_tier: enum (optional)
  next_action: enum (optional)
    - "send_proposal"
    - "schedule_follow_up"
    - "disqualify"
}

Response (200): Updated Consultation object
```

#### POST /api/consultations/:id/no-show
**Purpose:** Mark consultation as no-show
```
Side Effects:
  → Send no-show message (WhatsApp + email)
  → Offer reschedule link
```

---

### 2.3 Proposals

#### POST /api/proposals
**Purpose:** Generate and send a proposal
```
Request:
{
  client_id: uuid (required)
  jurisdiction: enum (required)
  tier: enum (required)
  add_ons: jsonb (optional)
    [{ name: string, price: decimal }]
  custom_pricing: decimal (optional, overrides tier price)
  notes: string (optional)
  validity_days: int (default: 14)
}

Response (201):
{
  id: uuid
  total_amount: decimal
  pdf_url: string
  status: "sent"
  expires_at: timestamp
}

Side Effects:
  → Generate PDF from template
  → Store PDF in Supabase Storage
  → Send email with PDF attachment (Resend)
  → Send WhatsApp notification
  → Create deal record if not exists
  → PostHog: proposal_sent
```

#### GET /api/proposals/:id
**Purpose:** View proposal (client or team)
```
Response (200):
{
  id: uuid
  client_id: uuid
  jurisdiction: enum
  tier: enum
  add_ons: jsonb
  total_amount: decimal
  currency: string ("USD")
  status: enum
  pdf_url: string
  sent_at: timestamp
  viewed_at: timestamp (nullable)
  accepted_at: timestamp (nullable)
  expires_at: timestamp
  terms: string
}
```

#### POST /api/proposals/:id/accept
**Purpose:** Accept proposal and proceed to payment
```
Response (200):
{
  checkout_url: string (Stripe Checkout)
}

Side Effects:
  → Update proposal status to "accepted"
  → Create Stripe Checkout session
  → PostHog: proposal_accepted
```

#### POST /api/proposals/:id/decline
**Purpose:** Decline proposal
```
Request:
{
  reason: enum (required)
    - "too_expensive"
    - "wrong_jurisdiction"
    - "chose_competitor"
    - "no_longer_interested"
    - "other"
  details: string (optional)
}

Side Effects:
  → Update proposal status to "declined"
  → Update deal stage to "Lost"
  → PostHog: proposal_declined
```

---

### 2.4 Payments

#### POST /api/payments/checkout
**Purpose:** Create Stripe Checkout session
```
Request:
{
  proposal_id: uuid (required)
  client_id: uuid (required)
  amount: decimal (required)
  currency: string (default: "USD")
}

Response (200):
{
  checkout_url: string
  session_id: string
}
```

#### POST /api/webhooks/stripe
**Purpose:** Handle Stripe webhooks
```
Events Handled:
  - payment_intent.succeeded
  - payment_intent.payment_failed
  - charge.refunded

On payment_intent.succeeded:
  → Create payment record
  → Update deal stage to "Payment Received"
  → Create client account (if first payment)
  → Send confirmation (WhatsApp + email)
  → PostHog: payment_received
```

---

### 2.5 Documents

#### POST /api/documents/upload
**Purpose:** Upload a document
```
Request (multipart/form-data):
  client_id: uuid (required)
  category: enum (required)
    - "identity"
    - "proof_of_address"
    - "business"
    - "bank_reference"
    - "additional"
  name: string (required)
  file: File (required, max 10MB)
    Accepted: application/pdf, image/jpeg, image/png, image/heic

Response (201):
{
  id: uuid
  file_url: string
  status: "uploaded"
  uploaded_at: timestamp
}

Side Effects:
  → Store file in Supabase Storage (path: /{client_id}/{category}/{filename})
  → Notify team (new document uploaded)
  → PostHog: document_uploaded
```

#### GET /api/documents
**Purpose:** List documents for a client
```
Query Params:
  client_id: uuid (required)
  category: enum (optional filter)

Response (200):
{
  data: Document[]
  total: int
}
```

#### PATCH /api/documents/:id/review
**Purpose:** Review a document (team only)
```
Request:
{
  status: enum (required)
    - "approved"
    - "rejected"
    - "info_needed"
  review_notes: string (required if rejected/info_needed)
}

Response (200): Updated Document object

Side Effects:
  → Notify client of status change (WhatsApp + email)
  → If all documents approved → update deal stage
```

---

### 2.6 Kanban Board

#### GET /api/deals
**Purpose:** List deals for Kanban board
```
Query Params:
  stage: enum (optional filter)
  assigned_to: uuid (optional filter)
  jurisdiction: enum (optional filter)
  tier: enum (optional filter)

Response (200):
{
  data: Deal[]
  summary: {
    total_pipeline_value: decimal
    by_stage: { stage: count, value: decimal }[]
  }
}
```

#### PATCH /api/deals/:id
**Purpose:** Update deal (stage change, assignment, notes)
```
Request:
{
  stage: enum (optional)
  assigned_to: uuid (optional)
  next_action: string (optional)
  next_action_due: timestamp (optional)
  notes: string (optional)
}

Response (200): Updated Deal object

Side Effects:
  → If stage changed to "lost" → require lost_reason
  → Log activity
```

#### PATCH /api/deals/:id/move
**Purpose:** Move deal to new stage (drag-and-drop)
```
Request:
{
  to_stage: enum (required)
  reason: string (optional, required if moving to "lost")
}

Response (200): Updated Deal object

Side Effects:
  → Validate stage transition (can't skip stages forward)
  → Update days_in_stage counter
  → Log activity
```

---

### 2.7 Analytics

#### GET /api/analytics/funnel
**Purpose:** Get funnel conversion data
```
Query Params:
  date_from: date (optional, default: 30 days ago)
  date_to: date (optional, default: today)
  source: enum (optional filter)

Response (200):
{
  stages: [
    { name: "leads", count: int },
    { name: "contacted", count: int },
    { name: "consultation_booked", count: int },
    { name: "consultation_done", count: int },
    { name: "proposal_sent", count: int },
    { name: "proposal_accepted", count: int },
    { name: "payment_received", count: int },
    { name: "incorporation_complete", count: int }
  ]
  conversion_rates: {
    lead_to_contact: float
    contact_to_consultation: float
    consultation_to_proposal: float
    proposal_to_payment: float
    overall: float
  }
}
```

#### GET /api/analytics/revenue
**Purpose:** Get revenue metrics
```
Query Params:
  period: enum ("weekly", "monthly", "quarterly")
  date_from: date (optional)
  date_to: date (optional)

Response (200):
{
  total_revenue: decimal
  avg_revenue_per_client: decimal
  mrr: decimal (monthly recurring)
  by_jurisdiction: { jurisdiction: count, revenue: decimal }[]
  by_tier: { tier: count, revenue: decimal }[]
  pipeline_value: {
    total: decimal
    by_stage: { stage: value: decimal }[]
  }
}
```

---

## 3. UI Specifications

### 3.1 Pages & Routes

| Route | Auth | Description |
|-------|------|-------------|
| `/` | Public | Marketing homepage (existing) |
| `/pricing` | Public | Jurisdiction pricing cards |
| `/pricing/[jurisdiction]` | Public | Detailed pricing for specific jurisdiction |
| `/consultation` | Public | Book a consultation |
| `/consultation/confirmation` | Public | Booking confirmation |
| `/wizard` | Public | Self-serve qualification wizard |
| `/wizard/results` | Public | Price estimate + CTAs |
| `/login` | Public | Email + Google OAuth login |
| `/signup` | Public | Account creation (post-payment or pre-consultation) |
| `/dashboard` | Client | Client dashboard |
| `/dashboard/documents` | Client | Document upload portal |
| `/dashboard/proposals` | Client | View proposals |
| `/dashboard/invoices` | Client | View invoices |
| `/dashboard/activity` | Client | Activity feed |
| `/team` | Team | Kanban board |
| `/team/leads` | Team | Lead management list |
| `/team/analytics` | Team | Analytics dashboard |
| `/team/proposals` | Team | Proposal management |
| `/team/settings` | Admin | System settings |

### 3.2 Component Specifications

#### Lead Form (`components/LeadForm.tsx`)
```
Fields:
  - Full Name: text input, placeholder "John Smith"
  - Email: email input, placeholder "john@example.com"
  - WhatsApp: tel input with country code dropdown, placeholder "+44 7XXX XXX XXX"
  - Country: searchable dropdown (countries list)
  - Business Type: dropdown (ecommerce, freelance, consulting, holding, other)
  - Jurisdiction Interest: dropdown (HK, UAE, SG, Ireland, other)
  - Referral Source: dropdown (meta, google, linkedin, referral, direct, other)

Validation:
  - Email: regex pattern for valid email
  - WhatsApp: must start with +, min 10 digits
  - All required fields must be non-empty

Submit:
  - Button: "Get Started" (primary, navy)
  - Loading state: spinner + "Submitting..."
  - Success state: checkmark + "Thanks! Check your WhatsApp for next steps."
  - Error state: inline error message with retry option

Layout:
  - Single column, max-width 480px
  - Mobile-first responsive
  - Navy background, white text (matches brand)
```

#### Jurisdiction Cards (`components/JurisdictionCard.tsx`)
```
Props:
  - jurisdiction: enum
  - flag: string (emoji or SVG)
  - name: string
  - tagline: string (1 line)
  - benefits: string[] (3 items)
  - starting_price: decimal
  - timeline: string ("2-3 business days")
  - tier_count: int

Display:
  - Card with flag icon, name, tagline
  - 3 benefit bullet points
  - Starting price (large, bold)
  - Timeline badge
  - "View Details" button → expand or navigate
  - Hover: subtle shadow + lift

Layout:
  - Grid: 1 column mobile, 2 columns tablet, 3 columns desktop
  - Gap: 24px
```

#### Kanban Board (`components/KanbanBoard.tsx`)
```
Stages (columns):
  1. New Lead (blue)
  2. Contacted (cyan)
  3. Consultation Booked (purple)
  4. Consultation Done (indigo)
  5. Proposal Sent (orange)
  6. Proposal Accepted (amber)
  7. Payment Received (green)
  8. Documents Under Review (teal)
  9. Filing in Progress (emerald)
  10. Incorporation Complete (dark green)
  11. Lost (gray, separate area)

Card Content:
  - Client name (bold)
  - Jurisdiction + tier (small text)
  - Revenue potential (right-aligned)
  - Assigned team member avatar
  - Days in stage (badge: green/yellow/red)
  - Next action + due date (if set)

Interactions:
  - Drag-and-drop between stages
  - Click → slide-over panel with full details
  - Quick actions: message, proposal, documents, note

Filters (top bar):
  - By team member
  - By jurisdiction
  - By tier
  - By date range
  - Search by name
```

#### Document Upload (`components/DocumentUpload.tsx`)
```
Layout:
  - Two-panel: left = checklist, right = upload area
  
Checklist (left):
  - Category header (Identity, Proof of Address, etc.)
  - Each document item with:
    - Name
    - Required/Optional badge
    - Status icon (pending/uploaded/approved/rejected)
    - Upload button (if pending)
    - Re-upload button (if rejected)
    - Description (expandable)
    - Accepted formats note

Upload Area (right):
  - Drag-and-drop zone (dashed border, 200px min-height)
  - Or "Browse Files" button
  - Accepted: PDF, JPG, PNG, HEIC
  - Max: 10MB per file
  - Progress bar during upload
  - Preview thumbnail after upload
  - Delete button (if uploaded, not yet approved)

Progress:
  - Overall: "3 of 6 documents uploaded" (progress bar)
  - By category: collapsible sections with individual progress
```

---

## 4. Business Logic

### 4.1 Lead Scoring Algorithm

```
Initial Score = 0

+10 if jurisdiction_interest == "hong_kong" OR "uae" (highest volume)
+5  if jurisdiction_interest == "singapore" OR "ireland"
+5  if business_type == "ecommerce" OR "consulting" (higher revenue potential)
+3  if referral_source == "referral" (higher quality)
+2  if country_of_residence in TargetRegions (EU, NA, GCC)

-5  if whatsapp_number is invalid format

Score Range: 0-25
  0-5:   Low (auto-nurture)
  6-15:  Medium (standard follow-up)
  16-25: High (instant alert to sales team)
```

### 4.2 Stage Transition Rules

```
Valid Forward Transitions:
  new_lead → contacted
  contacted → consultation_booked
  consultation_booked → consultation_done
  consultation_booked → new_lead (no-show, reset)
  consultation_done → proposal_sent
  proposal_sent → proposal_accepted
  proposal_sent → lost (declined or expired)
  proposal_accepted → payment_received
  payment_received → docs_under_review
  docs_under_review → filing_in_progress
  filing_in_progress → incorporation_complete

Any stage → lost (with reason)

Invalid:
  - Skipping stages forward (e.g., new_lead → proposal_sent)
  - Moving backward except: consultation_booked → new_lead (no-show)
```

### 4.3 Proposal Expiration Logic

```
On proposal creation:
  expires_at = now + validity_days (default 14)

Daily cron job:
  SELECT * FROM proposals 
  WHERE status = 'sent' 
  AND expires_at < now()
  
  For each expired proposal:
    → Update status to 'expired'
    → Update deal stage to 'lost'
    → Send "proposal expired" notification
    → Log activity
```

### 4.4 Document Completion Check

```
On each document upload/review:
  required_docs = getRequiredDocs(client.jurisdiction, client.tier)
  uploaded_docs = getDocs(client.id, status: 'approved')
  
  IF required_docs ⊆ uploaded_docs:
    → Update deal stage to 'filing_in_progress'
    → Notify team: "All documents received for {client.name}"
    → Notify client: "All documents approved. We're now filing your incorporation."
```

### 4.5 Auto-Follow-Up Cadence

```
Consultation No-Show:
  +1h: WhatsApp "We missed you. Reschedule here: {link}"
  +24h: Email "Still interested? Book a new time: {link}"
  +72h: WhatsApp final follow-up

Proposal Sent (no response):
  +24h: WhatsApp reminder
  +72h: Email follow-up
  +7 days: Email "final chance" + discount offer (if configured)
  +14 days: Move to Lost

Document Reminder:
  +48h: WhatsApp "Still waiting on {count} document(s)"
  +7 days: Email reminder
  +14 days: WhatsApp final reminder
  +30 days: Pause (client must re-engage)
```

---

## 5. Error Handling

### 5.1 Client-Facing Errors

| Error | Display | Action |
|-------|---------|--------|
| Form validation failed | Inline field errors | User corrects and resubmits |
| WhatsApp send failed | "Message couldn't be sent. We'll try email instead." | Auto-fallback to email |
| Payment failed | "Payment couldn't be processed. Please try again or contact support." | Retry button |
| Upload failed | "File couldn't be uploaded. Please try again." | Retry button |
| Session expired | "Your session expired. Please log in again." | Redirect to /login |

### 5.2 Internal Errors

| Error | Handling | Logging |
|-------|----------|---------|
| Supabase connection fail | Retry 3x with backoff | Sentry alert |
| Stripe webhook fail | Return 500, Stripe retries | Sentry + Stripe dashboard |
| 360dialog API fail | Queue for retry, fallback to email | Sentry + retry queue |
| PDF generation fail | Show error to team, offer manual send | Sentry alert |
| Rate limit exceeded | Return 429, client shows "try again in X seconds" | PostHog event |

---

## 6. Edge Cases

### 6.1 Dual Path Convergence
**Scenario:** Client starts self-serve wizard, abandons, then books consultation.
**Resolution:** Lead record exists. Consultation attaches to existing lead. Wizard progress saved but consultation takes over. Proposal generated from consultation notes, not wizard data.

### 6.2 Multiple Proposals
**Scenario:** Client receives Proposal A, doesn't respond. Team sends Proposal B with different terms.
**Resolution:** Only one "active" proposal at a time. Sending new proposal auto-expires previous. Client dashboard shows latest proposal. History preserved in activity feed.

### 6.3 Partial Document Upload
**Scenario:** Client uploads 4 of 6 required documents, goes silent.
**Resolution:** Auto-reminders at 48h, 7d, 14d. Deal stays in "Documents Under Review" with visual indicator of missing docs. Team can manually nudge.

### 6.4 Concurrent Stage Changes
**Scenario:** Two team members move the same deal to different stages simultaneously.
**Resolution:** Last-write-wins with optimistic locking. Supabase realtime notifies both users of the change. Activity log shows both attempts.

### 6.5 Payment in Non-USD Currency
**Scenario:** Client wants to pay in EUR or GBP.
**Resolution:** Phase 1: USD only. Stripe handles currency conversion. Phase 2: Add multi-currency support based on client's country.

### 6.6 Document Rejection Loop
**Scenario:** Client uploads document, team rejects, client re-uploads same document.
**Resolution:** System allows re-upload. Team can see previous version for comparison. Activity feed tracks all versions.

---

## 7. Developer Checklist

### Pre-Build (Before Any Code)
- [ ] Supabase project created
- [ ] Database schema designed and reviewed
- [ ] 360dialog account + API key obtained
- [ ] Resend account + API key obtained
- [ ] Stripe account + API keys (test + live)
- [ ] Cal.com account configured
- [ ] PostHog project created
- [ ] Vercel project linked to GitHub repo
- [ ] GitHub repo with branch protection + PR reviews

### Phase 1: Foundation
- [ ] Supabase auth configured (email + Google)
- [ ] Database tables created with RLS policies
- [ ] Next.js project scaffolded with Supabase client
- [ ] Environment variables configured (.env.local)
- [ ] Vercel deployment working
- [ ] PostHog initialized

### Phase 2: Lead Capture
- [ ] Lead form component built
- [ ] API route: POST /api/leads
- [ ] Auto-response webhook configured
- [ ] 360dialog integration tested
- [ ] Resend integration tested
- [ ] PostHog funnel events firing

### Phase 3: Wizard
- [ ] Jurisdiction selector built
- [ ] Tier selection with pricing
- [ ] Qualification questions engine
- [ ] Stripe Checkout integration
- [ ] Post-payment flow working

### Phase 4: Consultation
- [ ] Cal.com embed working
- [ ] Intake form built
- [ ] Booking confirmation flow
- [ ] Reminder automation
- [ ] No-show handling

### Phase 5: Proposals
- [ ] PDF template designed
- [ ] PDF generation working
- [ ] Proposal delivery (email + dashboard)
- [ ] Accept/decline flow
- [ ] Follow-up automation

### Phase 6: Documents
- [ ] Document checklist per jurisdiction
- [ ] Upload portal working
- [ ] Review workflow
- [ ] Status notifications
- [ ] Storage encryption verified

### Phase 7: Kanban
- [ ] Board UI with drag-and-drop
- [ ] Stage management working
- [ ] Filters and views
- [ ] Quick actions
- [ ] Realtime updates

### Phase 8: Dashboard
- [ ] Client dashboard built
- [ ] Activity feed working
- [ ] Invoice history
- [ ] Mobile responsive

### Phase 9: Analytics
- [ ] Funnel dashboard
- [ ] Revenue reports
- [ ] Team performance metrics

### Pre-Launch
- [ ] All API routes rate-limited
- [ ] Error handling tested
- [ ] Security audit completed
- [ ] Performance audit (Lighthouse)
- [ ] WCAG 2.1 AA check
- [ ] Mobile testing (iOS + Android)
- [ ] Cross-browser testing (Chrome, Safari, Firefox, Edge)
- [ ] Load testing (100 concurrent users)
- [ ] Backup and recovery tested

---

*This document is the bridge between PRD and code. All API routes, UI components, and business logic should be implemented according to this specification. Update this document as implementation reveals new edge cases or requirements.*
