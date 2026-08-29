# GCCStartup.com — V1.0 Meta WhatsApp Cloud API & Notifications
## Official Meta Graph API Integration, Webhooks & Automated Sequences

---

### 1. The Strategy: WhatsApp as the Primary Communication Nervous System

For international high-ticket clients, **WhatsApp is the #1 preferred communication channel**. Email is treated as a transactional backup for receipts and PDF contracts.

GCCStartup V1.0 integrates directly with the **Official Meta WhatsApp Cloud API (Graph API v20.0+)** via your verified Meta Business Manager.

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                              META WHATSAPP CLOUD API ARCHITECTURE                       │
├─────────────────────────┬─────────────────────────┬─────────────────────────────────────┤
│ 1. OUTBOUND AUTOMATION  │ 2. INBOUND 2-WAY SYNC   │ 3. INTERACTIVE BUTTONS & TEMPLATES  │
├─────────────────────────┼─────────────────────────┼─────────────────────────────────────┤
│ • Event-driven triggers │ • Meta Webhook endpoint │ • Quick Reply CTA buttons           │
│   (Payment, KYC, Status)│   syncs messages to     │ • URL buttons with direct 1-tap     │
│ • Pre-approved official │   Customer 360 Timeline │   magic login & official links      │
│   Meta HSM templates    │ • Real-time team inbox  │ • Interactive list messages         │
└─────────────────────────┴─────────────────────────┴─────────────────────────────────────┘
```

---

### 2. Official Pre-Approved Meta WhatsApp Templates (HSM)

Below are the key pre-approved templates configured in Meta Business Manager:

---

#### 📨 Template 1: Instant Lead Welcome & Tax Report (`lead_welcome_report`)
* **Category**: UTILITY / MARKETING
* **Header**: `Your GCCStartup Tax Optimization Summary 📄`
* **Body**:
  ```
  Hi {{1}}, thanks for exploring your global setup options with GCCStartup.

  Based on your calculation, your estimated annual tax savings in {{2}} is {{3}}! 💰

  Your customized structuring roadmap has been generated. Would you like to review the step-by-step formation checklist or speak with a specialist?
  ```
* **Interactive Buttons**:
  1. 🔗 `View Setup Roadmap` ➔ `https://gccstartup.com/portal/setup?token={{4}}`
  2. 📞 `Book Free Consultation` ➔ `https://cal.com/gccstartup/consultation`

---

#### 📨 Template 2: Payment Received & Official KYC Routing (`payment_received_onboarding`)
* **Category**: UTILITY
* **Header**: `Payment Confirmed — Welcome to GCCStartup! 🚀`
* **Body**:
  ```
  Hi {{1}}, we have successfully received your payment of {{2}} for your {{3}} setup (Order #{{4}}).

  Your company formation file is now officially open! Please complete your official verification on the government authority portal using the link below, and reply with your confirmation number once done.
  ```
* **Interactive Buttons**:
  1. 🔗 `Open Official KYC Portal` ➔ `https://gccstartup.com/portal/vault?order={{4}}&token={{5}}`

---

#### 📨 Template 3: Post-KYC Confirmation Received (`kyc_confirmation_received`)
* **Category**: UTILITY
* **Header**: `KYC Verified — Filing Underway! 🏛️`
* **Body**:
  ```
  Hi {{1}}, we received your official verification details (Reference #{{2}}).

  Our legal operations team is now filing your incorporation documents with the {{3}} registry. Estimated license issuance: {{4}} business days.
  ```
* **Interactive Buttons**:
  1. 🔗 `Track Live Progress` ➔ `https://gccstartup.com/portal/companies/{{5}}`

---

#### 📨 Template 4: Milestone Completed Alert (`milestone_stage_complete`)
* **Category**: UTILITY
* **Header**: `Exciting Update on Your Company! 🎉`
* **Body**:
  ```
  Hi {{1}}, great news! Your company {{2}} has reached a new milestone:

  ✅ Completed: {{3}}
  🔄 Next Step: {{4}}

  Your official government documents are now available for instant download in your portal.
  ```
* **Interactive Buttons**:
  1. 🔗 `Download Documents` ➔ `https://gccstartup.com/portal/companies/{{5}}`

---

#### 📨 Template 5: Annual Nominee & License Renewal Notice (`annual_renewal_notice`)
* **Category**: UTILITY
* **Header**: `Annual Corporate Renewal Notice ({{1}} Days Left) ⏳`
* **Body**:
  ```
  Hi {{1}}, this is an advance reminder that the annual renewal for {{2}} (Trade License #{{3}}) is due on {{4}}.

  To ensure continuous good standing and maintain your registered nominee and bank compliance, please review and pay your renewal invoice:
  ```
* **Interactive Buttons**:
  1. 🔗 `Pay Renewal Invoice` ➔ `https://gccstartup.com/portal/renewals?company={{5}}`

---

### 3. Technical Integration & Webhook Handler

```typescript
// /api/webhooks/meta-whatsapp/route.ts
export async function POST(req: Request) {
  const body = await req.json();
  
  // 1. Verify Meta Webhook Signature
  // 2. Extract Message / Status Update (Sent, Delivered, Read)
  // 3. Match sender phone number to Client/Lead in PostgreSQL
  // 4. Save incoming message to customer_timeline / chat_history
  // 5. If message contains KYC reference (e.g. "KYC Done", "Ref #"), trigger automated admin notification
  
  return Response.json({ status: "success" });
}
```

* **Webhook Endpoint**: `/api/webhooks/meta-whatsapp` (handles verification challenge `hub.challenge` and incoming JSON payloads).
* **Outgoing API Calls**: Uses `https://graph.facebook.com/v20.0/{PHONE_NUMBER_ID}/messages` with System User Permanent Bearer Token.
* **Fallback Routing**: If WhatsApp message fails to deliver within 5 minutes, the system automatically dispatches the message via **Transactional Email (Resend)**.
