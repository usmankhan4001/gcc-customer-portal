# GCCStartup.com — V1.0 New Client Onboarding Wizard
## 5-Step Guided Intake, Jurisdiction Matrix & Checkout Engine

---

### 1. Onboarding Strategy (Path C: The Hybrid Experience)

The onboarding flow caters to two types of users:
1. **Self-Directed / Experienced Clients**: Can bypass the quiz and go straight to the catalog to choose their jurisdiction, tier, and add-ons.
2. **First-Time / Advisory Clients**: Go through a **5-step guided recommender** that matches their exact business model, income level, and relocation preference to the optimal legal structure.

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                              THE 5-STEP GUIDED ONBOARDING FLOW                          │
├───────────────────┬───────────────────┬───────────────────┬─────────────────────────────┤
│ STEP 1: ACTIVITY  │ STEP 2: COUNTRY   │ STEP 3: TIER      │ STEP 4: ADD-ONS & CHECKOUT  │
├───────────────────┼───────────────────┼───────────────────┼─────────────────────────────┤
│ • Business Type   │ • Visual card with│ • Tier 1 (Self)   │ • Extra bank accounts       │
│ • Revenue bracket │   timeline, tax %,│ • Tier 2 (Nominee)│ • UAE Tax Residency / Visa  │
│ • Relocation vs.  │   banking & remote│ • Tier 3 (Shelf)  │ • 1-Page Stripe Checkout    │
│   100% remote     │   badge           │   fast-track      │ • Passwordless auto-account │
└───────────────────┴───────────────────┴───────────────────┴─────────────────────────────┘
```

---

### 2. Step-by-Step Wizard Specification

#### Step 1: Business Activity & Goals Intake
* **Question 1: What is your primary business activity?**
  * Options: E-commerce / Amazon FBA / Shopify, Digital Consulting / Agency, Software / SaaS / IT Services, Crypto / Web3, Investment Holding, Relocation / Family Office.
* **Question 2: What is your estimated annual revenue?**
  * Options: < €100k, €100k–€250k, €250k–€500k, €500k–€1M, €1M+.
* **Question 3: What is your primary operational objective?**
  * Options:
    * ✈️ *100% Remote Operation* (No travel, purely digital banking).
    * 🏝️ *Personal Tax Residency & Relocation* (Emirates ID, 0% personal tax, physical living).
    * 🛡️ *Maximum Corporate Privacy* (Nominee UBO, no public registry record).
    * 🏛️ *Highest Banking Credibility* (Physical Tier-1 UAE Banks).

---

#### Step 2: Interactive Jurisdiction Recommender
Based on Step 1 answers, the engine ranks and presents the optimal jurisdiction:

| Jurisdiction | Tax Rate | Banking Type | In-Person Required? | Timeline | Best For / Use Case |
|---|---|---|---|---|---|
| **Hong Kong** 🇭🇰 | 0% on foreign income | Fintech (Airwallex, Wise, PayPal) | **No** (100% Remote) | 17–18 days | Digital commerce, dropshipping, SaaS (Fastest remote setup). |
| **UAE Freezone** 🇦🇪 | 9% (0% on foreign income / QFZP) | Local Tier-1 Banks (Emirates NBD, FAB, Wio) | Yes (for ID & Bank) or Remote option | ~30 days | Tax residency, lifestyle, and credible corporate banking. |
| **Bahrain** 🇧🇭 | **0% Corporate Tax** | Local Banks (Emirates NBD, RAK Bank) | Yes (for bank/residency) | ~30 days | Maximum tax savings with GCC local banking. |
| **Singapore** 🇸🇬 | 5% (with startup exemptions) | Fintech + Nominee Director | **No** (100% Remote) | 17–18 days | ASEAN regional headquarters and high corporate prestige. |
| **Ireland** 🇮🇪 | 12.5% Corporate Tax | Local European Banking | **No** (100% Remote) | 2–3 days | European jurisdiction with lower tax for UK/EU businesses. |
| **Oman** 🇴🇲 | 15% Corporate Tax | Local Banks + Family Visa | Yes | ~30 days | Muslim families seeking a culturally and religiously aligned setting. |

---

#### Step 3: Service Tier & Privacy Selection

Clients choose between three clear, distinct tiers:

```
┌─────────────────────────┬─────────────────────────┬─────────────────────────┐
│ TIER 1: SELF AS UBO     │ TIER 2: NOMINEE UBO 🛡️ │ TIER 3: SHELF COMPANY ⚡│
│ (Standard Direct Setup) │ (Ultimate Privacy)      │ (Fast-Track 24-48h)     │
├─────────────────────────┼─────────────────────────┼─────────────────────────┤
│ • Client is registered  │ • GCCStartup provides   │ • Pre-existing active   │
│   owner & director      │   Nominee Director & UBO│   company entity        │
│ • Full personal KYC     │ • Client protected      │ • Active fintech bank   │
│ • Direct verification   │   behind corporate veil │   (1-3 yr track record) │
├─────────────────────────┼─────────────────────────┼─────────────────────────┤
│ • Company Reg: $1,500   │ • Company Reg: $1,500   │ • Total Package:        │
│ • Bank Setup: $500      │ • Bank Setup: $500      │   $1,500 – $2,500       │
│                         │ • Nominee Fee: $1,000   │                         │
├─────────────────────────┼─────────────────────────┼─────────────────────────┤
│ TOTAL: $2,000           │ TOTAL: $3,000           │ TOTAL: $2,000 (Average) │
└─────────────────────────┴─────────────────────────┴─────────────────────────┘
```

---

#### Step 4: Add-On Configurator

Clients can customize their package with optional services:

* 💳 **Additional Fintech / Local Bank Account**: +$500 per account (e.g. adding both Airwallex & Wise).
* 🛂 **UAE Investor Residency Visa & Emirates ID VIP Concierge**: +$1,250 (Includes medical VIP typing, biometrics escort, Emirates ID issuance).
* 📑 **UAE Corporate Tax & TRN Registration**: +$350 (Includes Federal Tax Authority registration and TRN issuance).
* 📊 **Monthly Bookkeeping & Financial Reporting Retainer**: +$250 / month.
* 🛡️ **Priority Express Processing (Filing within 24h)**: +$300.

---

#### Step 5: Transparent 1-Page Checkout & Auth

* **Real-time Order Summary**: Itemized breakdown with zero hidden fees.
* **Payment Processing**:
  * **Stripe Checkout / Elements**: Cards (Visa, Mastercard, Amex), Apple Pay, Google Pay.
  * **Wire Transfer / USDT Option**: For high-ticket corporate payments > $5,000.
* **Split Regional Billing Rules**:
  * *Asia/Europe (HK, SG, Ireland)*: 100% advance charge (covers all government + service charges).
  * *Gulf (UAE, Bahrain, Oman)*: Service fee charged at checkout; government license/visa fees paid via guided direct schedule.
* **Instant Account Provisioning**:
  * Upon checkout, client account is automatically provisioned via **Passwordless Magic Link** sent to Email + **Meta WhatsApp Welcome Message** with their secure portal login token.
  * Client lands immediately in their new **KYC Document Vault (Module 04)**.
