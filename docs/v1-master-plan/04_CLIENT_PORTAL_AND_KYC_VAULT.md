# GCCStartup.com — V1.0 Client Document & Official KYC Hub
## Pre-Flight Preparation, Official Portal KYC & Post-KYC Confirmation Submission

---

### 1. The Core Compliance & Handshake Principle

> [!IMPORTANT]
> **Official Portal KYC Handshake**:
> 1. GCCStartup does **not** perform internal KYC verification or store sensitive government biometric IDs.
> 2. The client completes official identity, passport, and biometric verification **directly on official government authority and banking partner portals** (e.g., UAE ICP / Freezone Authority portal, Hong Kong Companies Registry e-Services, ACRA Singapore, Airwallex, Wise, Emirates NBD).
> 3. Once the official portal approves/completes the verification, it generates **Confirmation Details** (Application Reference Number, Confirmation PDF/Email, or Transaction ID).
> 4. The client **notifies GCCStartup** through their preferred channel:
>    * 📱 **In-App 1-Tap Confirmation**: Taps *"Mark KYC as Completed"*, enters the Official Reference ID, and optionally attaches the confirmation PDF.
>    * 💬 **Official Meta WhatsApp Reply**: Simply replies to the GCCStartup WhatsApp thread with *"KYC Completed, Reference #ABC-12345"*.
>    * 📧 **Email Forwarding**: Forwards the official government confirmation email.
> 5. GCCStartup's operations team instantly receives the notification, cross-references the official government registry, and moves the company to **Stage 3: Government Registry Filing in Progress**.

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                             THE COMPLETE KYC HANDSHAKE WORKFLOW                         │
├─────────────────────────┬─────────────────────────┬─────────────────────────────────────┤
│ 1. PRE-FLIGHT PREP      │ 2. OFFICIAL PORTAL KYC  │ 3. NOTIFY & SUBMIT DETAILS          │
├─────────────────────────┼─────────────────────────┼─────────────────────────────────────┤
│ • App provides tailored │ • Client clicks direct  │ • Client marks completed in App,    │
│   checklist & format    │   official portal link  │   or WhatsApp / Email message       │
│   rules                 │ • Completes KYC with    │ • Provides Official Reference ID    │
│ • Client prepares files │   Gov Authority / Bank  │ • Ops team advances to Govt Filing  │
└─────────────────────────┴─────────────────────────┴─────────────────────────────────────┘
```

---

### 2. Pre-Flight Preparation Checklist (By Tier)

Before heading to the official government or banking portal, the app guides the client on what to have ready:

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                        PRE-FLIGHT DOCUMENT PREPARATION CHECKLIST                        │
├────────────────────────────────┬────────────────────────────────────────────────────────┤
│ SERVICE TIER                   │ REQUIRED FOR OFFICIAL GOVERNMENT / BANK VERIFICATION   │
├────────────────────────────────┼────────────────────────────────────────────────────────┤
│ TIER 1 (Self as UBO)           │ 1. Valid International Passport (min 6 months valid)   │
│                                │ 2. Proof of Residential Address (< 90 days utility/bank)│
│                                │ 3. Official Identity Portal Live Face Scan             │
│                                │ 4. Business Activity Summary                           │
├────────────────────────────────┼────────────────────────────────────────────────────────┤
│ TIER 2 (Nominee UBO & Director)│ 1. Beneficial Owner Declaration Form (In-App Signed)   │
│                                │ 2. Nominee Service & Power of Attorney Agreement       │
│                                │ 3. Official Bank Nominee Verification Pack             │
├────────────────────────────────┼────────────────────────────────────────────────────────┤
│ TIER 3 (Shelf Company)         │ 1. Share Transfer & Purchase Agreement Acceptance      │
│                                │ 2. Direct Bank Access Handover on Official Bank App    │
└────────────────────────────────┴────────────────────────────────────────────────────────┘
```

---

### 3. In-App Post-KYC Notification & Details Submission Screen

When the client completes their official verification, the app provides a seamless submission screen:

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                           POST-KYC CONFIRMATION SUBMISSION SCREEN                       │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│ 🏢 ENTITY: Horizon Digital FZE (UAE)                                                    │
│ 🏛️ AUTHORITY: Official Freezone Regulatory Portal                                      │
│                                                                                         │
│ 1. Did you complete your identity & passport verification on the official portal?       │
│    [ ✅ YES, VERIFICATION COMPLETED ]                                                   │
│                                                                                         │
│ 2. Enter Official Application / Reference Number provided by the government:            │
│    ┌──────────────────────────────────────────────────────────────────────────────┐     │
│    │ e.g., IFZA-KYC-2026-849201                                                   │     │
│    └──────────────────────────────────────────────────────────────────────────────┘     │
│                                                                                         │
│ 3. (Optional) Upload Confirmation Screenshot / Email PDF:                               │
│    [ 📄 Drop Confirmation PDF / Image Here ⬆️ ]                                         │
│                                                                                         │
│ ─────────────────────────────────────────────────────────────────────────────────────── │
│ [ 🚀 SUBMIT CONFIRMATION & START GOVERNMENT FILING ➔ ]                                  │
│ (Instantly alerts GCCStartup legal filing team to submit company registration)          │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

---

### 4. The Issued Corporate Kit Locker (Cloudflare R2)

Once the government authority approves and issues the company, the official corporate kit is delivered directly into the client's app locker:

* **Stored Deliverables**:
  * 📄 Official Certificate of Incorporation (PDF)
  * 📄 Commercial Trade License / Business Registration Certificate
  * 📄 Electronic Memorandum & Articles of Association (E-MoA)
  * 📄 Share Certificate & Register of Directors
  * 📄 Tax Registration Number (TRN) Certificate
* **Security & Access**:
  * Stored in private Cloudflare R2 bucket.
  * Temporary 1-hour presigned download links.
  * **1-Click Shareable Locker**: Generate temporary password-protected links to share with banks, suppliers, and payment processors.
