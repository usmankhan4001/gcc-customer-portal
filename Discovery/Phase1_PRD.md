# GCCStartup.com — Client Portal & Webapp
## Product Requirements Document (PRD)

**Version:** 1.0
**Date:** 2026-08-29
**Status:** Draft — awaiting blocking item resolution
**References:** Phase1_Concept_Paper.md, GCCStartup_Discovery_Questionnaire_Completed.pdf

---

## Table of Contents
1. [Product Overview](#1-product-overview)
2. [User Roles & Permissions](#2-user-roles--permissions)
3. [Functional Requirements](#3-functional-requirements)
4. [Non-Functional Requirements](#4-non-functional-requirements)
5. [Technical Architecture](#5-technical-architecture)
6. [Data Model](#6-data-model)
7. [Integration Requirements](#7-integration-requirements)
8. [Phased Delivery Plan](#8-phased-delivery-plan)
9. [Risks & Open Items](#9-risks--open-items)
10. [Appendix: Jurisdiction × Tier Matrix](#10-appendix)

---

## 1. Product Overview

### 1.1 Purpose
Replace the current manual, WhatsApp/email-driven sales process with a webapp that:
- Captures leads and responds instantly
- Qualifies prospects through a guided wizard or consultation booking
- Generates and sends proposals automatically
- Collects payment via Stripe
- Gathers KYC/documents through a portal
- Tracks every deal from lead to incorporation via Kanban
- Provides clients a dashboard showing their deal status

### 1.2 Scope
- **In scope:** Lead capture, qualification wizard, consultation booking, proposal generation, payment (Stripe), document upload, Kanban board, client dashboard, WhatsApp integration, analytics
- **Out of scope (Phase 1):** Banking integrations, nominee management portal, internal accounting, multi-currency pricing, mobile app, white-label portal for PRO firms

### 1.3 Success Criteria
| Criterion | Target |
|-----------|--------|
| Lead → First Contact | < 5 minutes |
| Lead → Paying Client | 8-15% conversion |
| Time to proposal | < 24 hours (automated) |
| Document upload rate (within 48h) | 90%+ |
| System uptime | 99.5%+ |

---

## 2. User Roles & Permissions

### 2.1 Roles

| Role | Description | Access Level |
|------|-------------|--------------|
| **Guest** | Anonymous website visitor | View pricing pages, book consultation, submit lead form |
| **Prospect** | Signed up but not yet paid | Full wizard, proposal view, consultation booking, document preview |
| **Client** | Paid + account created | Dashboard, document upload, deal tracking, messaging, invoicing |
| **Team Member** | GCCStartup partner/staff | Kanban, all client data, proposal editing, pricing config, analytics |
| **Admin** | Abdullah (owner) | All of above + billing, user management, system config |

### 2.2 Permission Matrix

| Action | Guest | Prospect | Client | Team | Admin |
|--------|-------|----------|--------|------|-------|
| View pricing | ✓ | ✓ | ✓ | ✓ | ✓ |
| Submit lead form | ✓ | — | — | — | — |
| Book consultation | ✓ | ✓ | ✓ | ✓ | ✓ |
| Complete wizard | — | ✓ | — | — | — |
| View proposal | — | ✓ | ✓ | ✓ | ✓ |
| Accept + pay | — | ✓ | — | — | — |
| Upload documents | — | — | ✓ | ✓ | ✓ |
| View dashboard | — | — | ✓ | ✓ | ✓ |
| Kanban board | — | — | — | ✓ | ✓ |
| Edit proposals | — | — | — | ✓ | ✓ |
| System config | — | — | — | — | ✓ |

---

## 3. Functional Requirements

### 3.1 Lead Capture & Auto-Response

**FR-1.1: Lead Form**
- Fields: Full name, email, WhatsApp number, country of residence, business type (dropdown), jurisdiction interest (dropdown), how did you hear about us (dropdown)
- Validation: Email format, WhatsApp format with country code
- On submit: Create lead record, trigger auto-response

**FR-1.2: Instant Auto-Response**
- WhatsApp message via 360dialog: "Hi [Name], thanks for reaching out to GCCStartup. [2-line personalized message based on jurisdiction interest]. Would you like to book a free consultation? [Cal.com link]"
- Email fallback (if WhatsApp fails): Same content via Resend
- **SLA:** Must fire within 60 seconds of form submission

**FR-1.3: Lead Scoring (Internal)**
- Auto-assign lead score based on: jurisdiction interest (Tier 1/2/3), business type fit, budget signal
- Low-score leads → auto-nurture sequence
- High-score leads → instant WhatsApp alert to sales team

### 3.2 Self-Serve Wizard (Path A)

**FR-2.1: Jurisdiction Selector**
- Visual cards for each jurisdiction with flag, key benefits, timeline, starting price
- Click → expand to show tier options

**FR-2.2: Tier Selection**
- Within each jurisdiction: Tier 1 / Tier 2 / Tier 3 with feature comparison
- Dynamic pricing display based on jurisdiction × tier

**FR-2.3: Qualification Questions**
- 3-5 questions based on jurisdiction (e.g., for HK: "Will you need a physical office?" for UAE: "Free zone or mainland?")
- Answers affect final price estimate
- Disqualifying answers → redirect to consultation with explanation

**FR-2.4: Price Estimate & CTA**
- Show estimated total (fixed price or "from $X")
- Two CTAs: "Book a Free Consultation" (→ Path B) or "Get Started Now" (→ checkout)

**FR-2.5: Checkout (Stripe)**
- Stripe Checkout session with pre-filled jurisdiction × tier × add-ons
- Payment methods: Credit/debit card, bank transfer (for high-value)
- On success: Create client account, move to Document Upload stage

### 3.3 Consultation Booking (Path B)

**FR-3.1: Calendar Integration**
- Cal.com embed (or Calendly) showing available slots
- Auto-sync with team's Google Calendar
- Buffer time between meetings (configurable, default 15 min)

**FR-3.2: Intake Form**
- Shown after booking confirmation
- Fields: Business details, revenue range, current tax residency, specific goals, preferred communication channel, referral source
- Auto-attaches to the lead/client record

**FR-3.3: Consultation Confirmation**
- WhatsApp + email confirmation with: date/time, meeting link (Google Meet/Zoom), what to prepare
- Reminder: 24h before, 1h before

**FR-3.4: Consultation No-Show**
- Auto-follow-up at +1h: "We missed you. Would you like to reschedule?"
- Reschedule link → rebooking flow

### 3.4 Proposal System

**FR-4.1: Proposal Generation**
- Auto-generated from template based on: jurisdiction, tier, add-ons, custom pricing
- Branded PDF (navy/gold, itemized service table)
- Includes: scope of work, timeline, pricing breakdown, terms, acceptance button

**FR-4.2: Proposal Delivery**
- Sent via email (Resend) with PDF attachment
- Also visible in client dashboard (if account exists)
- WhatsApp notification with link to proposal

**FR-4.3: Proposal Tracking**
- Track: sent, viewed (pixel/webhook), time spent viewing
- Auto-alert to sales team if viewed but not accepted within 48h

**FR-4.4: Proposal Acceptance**
- "Accept & Pay" button → Stripe checkout (same as FR-2.5)
- "Request Changes" button → opens WhatsApp conversation with pre-filled context
- "Decline" button → capture reason (dropdown + optional text), move to Lost

**FR-4.5: Follow-Up Cadence**
- Day 0: Proposal sent
- Day 1: WhatsApp reminder
- Day 3: Email follow-up
- Day 7: Final follow-up + "last chance" offer
- Day 14: Move to Lost (if no response)

### 3.5 Document Collection

**FR-5.1: Document Checklist**
- Dynamic per jurisdiction × tier (Farooq to provide matrix)
- Categories: Identity (passport, national ID), Proof of Address, Business Documents, Bank References, Additional (per jurisdiction)
- Each item: name, description, accepted formats, required/optional, example

**FR-5.2: Upload Portal**
- Drag-and-drop or file picker
- Max file size: 10MB per file, 50MB total
- Formats: PDF, JPG, PNG, HEIC
- Auto-convert HEIC to JPG
- Progress bar showing completion percentage

**FR-5.3: Document Review**
- Team member reviews each upload: Approved / Rejected (with reason) / Additional Info Needed
- Client notified of status changes via WhatsApp + email
- Rejected documents → client prompted to re-upload

**FR-5.4: Document Storage**
- Encrypted at rest (AES-256)
- Stored in Supabase Storage (or S3)
- Access log: who uploaded, who viewed, when
- Retention policy: active clients = indefinite; closed-lost = 90 days then purge

### 3.6 Client Dashboard

**FR-6.1: Deal Progress Tracker**
- Visual pipeline showing: Lead → Consultation → Proposal → Payment → Documents → Filing → Incorporation → Complete
- Current stage highlighted
- Estimated time at each stage
- "What's next" prompt

**FR-6.2: Document Status**
- List of required documents with upload status
- Pending / Uploaded / Approved / Rejected per item
- Re-upload prompt for rejected items

**FR-6.3: Messages & Activity Feed**
- Timeline of all interactions: form submission, consultation, proposal, payments, document uploads, team notes
- WhatsApp messages synced (via 360dialog webhook)
- Internal team notes visible to team only

**FR-6.4: Invoices & Payments**
- List of invoices with status
- Download PDF invoices
- Pay outstanding balances (Stripe link)

### 3.7 Kanban Board (Team View)

**FR-7.1: Board Stages**
1. New Lead
2. Contacted
3. Consultation Booked
4. Consultation Done
5. Proposal Sent
6. Proposal Accepted
7. Payment Received
8. Documents Under Review
9. Filing in Progress
10. Incorporation Complete
11. Lost (separate column)

**FR-7.2: Card Details**
- Client name, jurisdiction, tier, revenue potential
- Last activity timestamp
- Assigned team member
- Next action + due date
- Color-coded by days-in-stage (green < 3 days, yellow 3-7, red > 7)

**FR-7.3: Actions**
- Drag-and-drop between stages
- Quick actions: send message, generate proposal, request documents, add note
- Bulk actions: send follow-up to all Stage X cards

**FR-7.4: Views**
- All deals
- My deals (filtered by assigned team member)
- By jurisdiction
- By tier
- By date range
- Lost deals (with reason analysis)

### 3.8 Communication Integration

**FR-8.1: WhatsApp (Primary)**
- 360dialog Business API
- Send: auto-responses, proposal notifications, document reminders, status updates
- Receive: client messages sync to deal timeline
- Templates: pre-approved message templates for each trigger

**FR-8.2: Email (Transactional)**
- Resend (recommended) or Postmark
- Send: confirmations, proposals, invoices, document reminders
- Track: opens, clicks, bounces
- Unsubscribe compliance (CAN-SPAM, GDPR)

**FR-8.3: Internal Notifications**
- Slack/WhatsApp group for team: new lead alerts, payment received, document uploaded
- Dashboard notifications for assigned deals

### 3.9 Analytics & Reporting

**FR-9.1: Funnel Analytics (PostHog)**
- Page views, form submissions, wizard completions, consultation bookings, proposal sends, proposal accepts, payments
- Drop-off at each stage
- Source attribution (Meta, organic, referral)

**FR-9.2: Revenue Reporting**
- Monthly recurring revenue (MRR)
- Average revenue per client
- Revenue by jurisdiction, tier, source
- Pipeline value (weighted by stage probability)

**FR-9.3: Team Performance**
- Deals per team member
- Average time-to-close
- Win/loss ratio

---

## 4. Non-Functional Requirements

### 4.1 Performance
| Metric | Target |
|--------|--------|
| Page load time | < 2 seconds (LCP) |
| Time to Interactive | < 3 seconds |
| API response time | < 500ms (p95) |
| Auto-response latency | < 60 seconds |

### 4.2 Security
- HTTPS everywhere (already active)
- Supabase Row Level Security (RLS) on all tables
- JWT-based auth with refresh tokens
- Rate limiting on API endpoints
- CSRF protection
- Input sanitization on all form fields
- Document encryption at rest (AES-256)
- Access logging for all document views

### 4.3 Accessibility
- WCAG 2.1 AA compliance
- Keyboard navigation on all interactive elements
- Screen reader support
- Color contrast ratios met

### 4.4 Internationalization
- English (primary) — full content
- Arabic (Phase 2) — RTL support for GCC clients
- Language switcher in header

### 4.5 Responsive Design
- Mobile-first (estimated 60%+ mobile traffic based on Meta Ads audience)
- Breakpoints: 320px, 768px, 1024px, 1440px
- Touch-friendly form inputs and CTAs

---

## 5. Technical Architecture

### 5.1 Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| Frontend | Next.js 14+ (App Router) | Existing site is Next.js, fast iteration, SSR for SEO |
| Backend | Next.js API Routes + Supabase | Serverless, fast to build, Supabase handles auth/DB/storage |
| Database | Supabase (PostgreSQL) | Realtime subscriptions, RLS, built-in auth, Storage |
| Auth | Supabase Auth | Email + Google OAuth, JWT, role-based access |
| Payments | Stripe Checkout + Connect | Industry standard, supports cards + bank transfer, webhooks |
| WhatsApp | 360dialog (via REST API) | Business API, template management, message syncing |
| Email | Resend (transactional) | Developer-friendly, reliable, reasonable cost |
| Calendar | Cal.com (embed) | Open-source, self-hostable, good API |
| Analytics | PostHog (self-hosted or cloud) | Product analytics, funnel tracking, session replay |
| Hosting | Vercel (or Railway) | Native Next.js support, easy deployment |
| CDN | Vercel Edge Network | Included with hosting |
| Monitoring | Vercel Analytics + Sentry | Performance + error tracking |

### 5.2 Monthly Cost Estimate

| Service | Cost |
|---------|------|
| Vercel Pro | $20/mo |
| Supabase Pro | $25/mo |
| 360dialog | ~$10-20/mo (per conversation) |
| Resend | $0-20/mo (first 3K emails free) |
| Cal.com | $0 (free tier) or $12/mo (team) |
| PostHog Cloud | $0 (first 1M events free) |
| Stripe | 2.9% + $0.30 per transaction |
| Domain/hosting | Already paid |
| **Total (before payment processing)** | **~$55-97/mo** |

### 5.3 Deployment
- Git-based CI/CD (GitHub → Vercel)
- Preview deployments on PRs
- Staging environment for testing
- Production deployment on merge to main

---

## 6. Data Model

### 6.1 Core Entities

```
Lead
├── id (uuid)
├── full_name
├── email
├── whatsapp_number
├── country_of_residence
├── business_type (enum)
├── jurisdiction_interest (enum)
├── referral_source
├── lead_score (int)
├── status (enum: new, contacted, qualified, unqualified)
├── assigned_to (FK → TeamMember)
├── created_at
└── updated_at

Client (extends Lead after payment)
├── id (uuid, FK → Lead)
├── account_status (enum: active, suspended, closed)
├── stripe_customer_id
├── total_revenue (decimal)
├── lifetime_value (decimal)
└── joined_at

Consultation
├── id (uuid)
├── client_id (FK → Client)
├── scheduled_at
├── duration_minutes
├── meeting_link
├── status (enum: booked, completed, no_show, cancelled)
├── notes (text)
├── intake_form_data (jsonb)
└── completed_by (FK → TeamMember)

Proposal
├── id (uuid)
├── client_id (FK → Client)
├── jurisdiction
├── tier (enum)
├── add_ons (jsonb)
├── total_amount (decimal)
├── currency
├── status (enum: draft, sent, viewed, accepted, declined, expired)
├── pdf_url
├── sent_at
├── viewed_at
├── accepted_at
├── declined_at
├── decline_reason
└── created_by (FK → TeamMember)

Payment
├── id (uuid)
├── proposal_id (FK → Proposal)
├── client_id (FK → Client)
├── stripe_payment_id
├── amount (decimal)
├── currency
├── status (enum: pending, completed, failed, refunded)
├── invoice_url
└── paid_at

Document
├── id (uuid)
├── client_id (FK → Client)
├── category (enum: identity, proof_of_address, business, bank_reference, additional)
├── name (text)
├── file_url
├── file_size (int)
├── mime_type
├── status (enum: pending, uploaded, approved, rejected, info_needed)
├── review_notes
├── reviewed_by (FK → TeamMember)
├── uploaded_at
└── reviewed_at

Deal (Kanban)
├── id (uuid)
├── client_id (FK → Client)
├── stage (enum: new_lead, contacted, consultation_booked, consultation_done, proposal_sent, proposal_accepted, payment_received, docs_under_review, filing_in_progress, incorporation_complete, lost)
├── assigned_to (FK → TeamMember)
├── jurisdiction
├── tier
├── estimated_value (decimal)
├── next_action (text)
├── next_action_due (timestamp)
├── days_in_stage (int, computed)
├── lost_reason
├── created_at
└── updated_at

TeamMember
├── id (uuid)
├── name
├── email
├── role (enum: admin, team_member)
├── avatar_url
└── is_active (boolean)

Activity
├── id (uuid)
├── deal_id (FK → Deal)
├── actor_type (enum: system, team, client)
├── actor_id (uuid)
├── action (enum: lead_created, whatsapp_sent, email_sent, consultation_booked, proposal_sent, payment_received, document_uploaded, document_reviewed, stage_changed, note_added)
├── details (jsonb)
└── created_at

Message
├── id (uuid)
├── deal_id (FK → Deal)
├── channel (enum: whatsapp, email)
├── direction (enum: inbound, outbound)
├── content (text)
├── template_id (text, nullable)
├── status (enum: sent, delivered, read, failed)
├── external_id (text)
└── sent_at
```

---

## 7. Integration Requirements

### 7.1 Stripe
- Create Stripe Customer on client signup
- Create Checkout Session for each payment
- Webhook handling: payment_intent.succeeded, payment_intent.payment_failed
- Invoice generation (PDF)
- Refund handling (admin only)

### 7.2 360dialog (WhatsApp)
- Send templated messages on triggers
- Receive incoming messages → sync to Message table
- Webhook for delivery/read status
- Template management (pre-approval workflow)

### 7.3 Resend (Email)
- Transactional emails: confirmations, proposals, invoices, reminders
- Open/click tracking
- Unsubscribe management
- Template system with variables

### 7.4 Cal.com
- Embed calendar widget
- Sync available slots
- Webhook on booking created/cancelled
- Auto-create Consultation record

### 7.5 PostHog
- Track: page views, form submissions, button clicks, funnel steps
- Session replay for debugging
- Custom events per business action
- UTM parameter capture

### 7.6 Supabase Realtime
- Live updates on Kanban board
- Document status changes
- New message notifications
- Dashboard data refresh

---

## 8. Phased Delivery Plan

### Phase 0: Foundation (Week 1-2)
- [ ] Set up Supabase project (database, auth, storage)
- [ ] Design and implement database schema
- [ ] Set up Next.js project with Supabase client
- [ ] Implement auth (email + Google OAuth)
- [ ] Set up Vercel deployment + CI/CD
- [ ] Install PostHog tracking

### Phase 1: Lead Capture & Auto-Response (Week 2-3)
- [ ] Build lead form component
- [ ] Implement lead record creation
- [ ] Set up 360dialog integration
- [ ] Build auto-response system (WhatsApp + email fallback)
- [ ] Set up Resend for transactional email
- [ ] PostHog funnel tracking

### Phase 2: Self-Serve Wizard (Week 3-4)
- [ ] Build jurisdiction selector UI
- [ ] Build tier selection with pricing display
- [ ] Implement qualification question engine
- [ ] Dynamic pricing calculation
- [ ] Stripe Checkout integration
- [ ] Post-payment client account creation

### Phase 3: Consultation Booking (Week 4-5)
- [ ] Cal.com embed + integration
- [ ] Intake form builder
- [ ] Booking confirmation flow (WhatsApp + email)
- [ ] Reminder automation (24h, 1h)
- [ ] No-show follow-up

### Phase 4: Proposal System (Week 5-6)
- [ ] Proposal template engine
- [ ] PDF generation (branded)
- [ ] Proposal delivery (email + dashboard)
- [ ] Proposal tracking (opens, views)
- [ ] Accept/decline flow with Stripe
- [ ] Follow-up cadence automation

### Phase 5: Document Collection (Week 6-7)
- [ ] Document checklist per jurisdiction × tier
- [ ] Upload portal with drag-and-drop
- [ ] Document review workflow
- [ ] Status tracking + notifications
- [ ] Secure storage (Supabase Storage)

### Phase 6: Kanban & Team Tools (Week 7-8)
- [ ] Kanban board UI (drag-and-drop)
- [ ] Stage management + auto-progression
- [ ] Card details + quick actions
- [ ] Filters and views
- [ ] Team performance metrics

### Phase 7: Client Dashboard (Week 8-9)
- [ ] Deal progress tracker
- [ ] Document status view
- [ ] Activity feed / timeline
- [ ] Invoice & payment history
- [ ] Mobile-optimized layout

### Phase 8: Analytics & Polish (Week 9-10)
- [ ] Full funnel analytics dashboard
- [ ] Revenue reporting
- [ ] Team performance reports
- [ ] SEO optimization
- [ ] Performance audit (Core Web Vitals)
- [ ] Security audit

**Estimated timeline: 10 weeks** (assumes 1 dedicated developer, full-time)
**⚠️ BLOCKER: Timeline assumes budget and dev are confirmed (see Risks section)**

---

## 9. Risks & Open Items

| # | Risk | Impact | Mitigation | Status |
|---|------|--------|------------|--------|
| 1 | No budget confirmed | Can't finalize scope/timeline | Need Abdullah's budget range | BLOCKING |
| 2 | No dev assigned | Can't start | Need hiring decision | BLOCKING |
| 3 | No launch deadline | Can't prioritize | Need target date | BLOCKING |
| 4 | Company registration unclear | Payment flow risk | Need Farooq's input | BLOCKING |
| 5 | Sender.net broken | Email dead on arrival | Switch to Resend (recommended) | BLOCKING |
| 6 | No GA4 | Can't measure baseline | Install immediately | BLOCKING |
| 7 | Pricing matrix incomplete | Checkout logic needs full data | Need Farooq's jurisdiction matrix | Important |
| 8 | 500+ existing clients | No migration path | Export from current system, import to Supabase | Important |
| 9 | WhatsApp templates | Need pre-approval from Meta | Start template submission early | Important |
| 10 | GDPR compliance | EU clients in scope | Privacy policy, data handling, DPO | Important |

---

## 10. Appendix

### 10.1 Jurisdiction × Tier Matrix (Partial)

| Jurisdiction | Tier 1 (Basic) | Tier 2 (Standard) | Tier 3 (Premium) |
|-------------|----------------|-------------------|-------------------|
| Hong Kong | From $1,500 | From $3,500 | $1,500–2,500 |
| UAE | TBD | TBD | TBD |
| Singapore | TBD | TBD | TBD |
| Ireland | TBD | TBD | TBD |
| Other (15+) | TBD | TBD | TBD |

**⚠️ BLOCKER: Full matrix needed from Farooq before checkout logic can be built**

### 10.2 Message Templates (Draft)

| Trigger | Channel | Template |
|---------|---------|----------|
| Lead form submit | WhatsApp | "Hi {name}, thanks for reaching out to GCCStartup. We help businesses like yours {jurisdiction_benefit}. Would you like to book a free consultation? {cal_link}" |
| Consultation booked | WhatsApp | "Hi {name}, your consultation is confirmed for {date} at {time}. Meeting link: {meeting_link}. See you there!" |
| Proposal sent | WhatsApp | "Hi {name}, your proposal for {jurisdiction} company formation is ready. View it here: {proposal_link}" |
| Document reminder | WhatsApp | "Hi {name}, we're still waiting on {doc_count} document(s) to proceed with your {jurisdiction} incorporation. Upload here: {upload_link}" |
| Payment received | WhatsApp | "Hi {name}, payment confirmed! We're now proceeding with your {jurisdiction} incorporation. Track progress here: {dashboard_link}" |

### 10.3 Kanban Stage → Probability Mapping

| Stage | Win Probability |
|-------|----------------|
| New Lead | 5% |
| Contacted | 10% |
| Consultation Booked | 20% |
| Consultation Done | 35% |
| Proposal Sent | 50% |
| Proposal Accepted | 75% |
| Payment Received | 95% |
| Documents Under Review | 97% |
| Filing in Progress | 99% |
| Incorporation Complete | 100% |
| Lost | 0% |

---

*This PRD is the single source of truth for the GCCStartup webapp. All development decisions should reference this document. Version control will be maintained as requirements evolve.*
