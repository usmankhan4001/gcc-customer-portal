# Feature: Stateful Compliance Calendar

**Slug**: stateful-compliance-calendar   **Spec**: docs/specs/016-stateful-compliance-calendar.md   **Last verified against code**: 2026-10-30

## What it does (3 sentences max)
Computes personalized, jurisdiction-specific statutory compliance deadlines dynamically across all 6 jurisdictions (UAE, Hong Kong, Singapore, Bahrain, Ireland, BVI/Cayman) based on company incorporation date and fiscal year end. Accurately determines countdown days, statuses (`upcoming`, `due_soon`, `overdue`), statutory penalty explanations, and official filing portals. Exposes an authenticated API route `/api/companies/[id]/compliance` and an elevated interactive client timeline component (`ComplianceTimeline`).

## Where it lives
- Pages / routes: Protected client portal dashboard, company detail views, `/api/companies/[id]/compliance`
- API routes (methods, auth required):
  - `GET /api/companies/[id]/compliance`: Requires valid user session cookie (`gcc_session`). Verifies company ownership (or admin/super_admin role). Returns JSON with company details, calculated deadline list, and overall compliance summary.
- Components: `src/components/portal/ComplianceTimeline.tsx`
- lib modules:
  - `src/lib/compliance/stateful-calendar.ts`
  - `src/lib/compliance/stateful-calendar.test.ts`
- DB tables / columns:
  - `companies`: `id`, `user_id`, `jurisdiction`, `incorporation_date`, `fiscal_year_end`, `created_at`
- Env vars / external services: None required for pure calculations; `DATABASE_URL` for API route lookup.

## Behavior and rules
- Deadlines calculated across 6 primary jurisdictions:
  - **UAE**: Trade License & Establishment Card renewal (12m post-inc), Corporate Tax return (9m post-FYE), ESR notification (6m post-FYE), ESR report (12m post-FYE), and quarterly VAT return (if registered).
  - **Hong Kong**: Companies Registry NAR1 return (within 42 days of incorporation anniversary), Business Registration Certificate BRC renewal (annual anniversary), Profits Tax return BIR51 (18m post-inc).
  - **Singapore**: Estimated Chargeable Income ECI (within 3m of FYE), ACRA Annual Return & AGM lodgement (within 7m of FYE), Corporate Income Tax Form C/C-S (Nov 30 of Year of Assessment), GST return (if registered).
  - **Bahrain**: Commercial Registration CR renewal (annual anniversary), ESR annual return (within 3m of FYE), Corporate Tax / Nil exemption filing (within 4m of FYE), VAT return (if registered).
  - **Ireland**: Companies Registration Office B1 return (first ARD 6m post-inc + 28 days, subsequent annually), Corporation Tax CT1 (23rd of the 9th month post-FYE), VAT3 bi-monthly return (if registered).
  - **BVI & Cayman**: Annual Government Registry fee & return (BVI H1 inc: May 31, H2 inc: Nov 30; Cayman: Jan 31), Economic Substance return (within 6m of FYE), Annual Financial return to Registered Agent (within 9m of FYE).
- Status resolution:
  - `daysRemaining < 0`: marked as `'overdue'` (highlighted in rose red with statutory penalty warning).
  - `0 <= daysRemaining <= 30`: marked as `'due_soon'` (highlighted in amber with countdown days / "Due today").
  - `daysRemaining > 30`: marked as `'upcoming'` (slate neutral with countdown).
- Cycle resolution: Overdue filings from the active cycle (within 365 days past) are prioritized and highlighted so clients are never unaware of missing statutory deadlines.
- Leap year handling: Pure UTC arithmetic safely clamps Feb 29 to Feb 28 on non-leap years and Feb 29 on leap years. Month-end dates (e.g. Jun 30 FYE + 9 months) properly map to target month-ends (e.g. Mar 31).

## Data flow
1. User or dashboard requests compliance calendar:
   - Component calls `GET /api/companies/[id]/compliance`.
2. API route verifies session via `getServerSession()`, loads company from database, and verifies identity.
3. API route invokes `calculateStatutoryDeadlines` passing `jurisdiction`, `incorporationDate`, and `fiscalYearEnd`.
4. Deadlines and `getComplianceSummary` output are packaged and returned as JSON.
5. `ComplianceTimeline` renders KPI metric summary cards, filter tabs (All / Action Required / Upcoming), category selectors, and individual deadline cards with statutory penalty alerts and direct links to official filing authorities (e.g. EmaraTax, BizFile, Core CRO, Sijilat).

## Tests
- `src/lib/compliance/stateful-calendar.test.ts`:
  - 28 unit tests covering:
    - Pure UTC date parsing, formatting, and days-between calculation.
    - Leap year additions (`2024-02-29` to `2025-02-28`, `2024-01-31` to `2024-02-29`).
    - Jurisdiction normalization across case and abbreviation variants.
    - All 6 jurisdictions (UAE, HK, Singapore, Bahrain, Ireland, BVI/Cayman).
    - Boundary conditions: 0 days (due today), 1 day, 30 days (due_soon upper limit), 31 days (upcoming), -1 day and -15 days (overdue).
    - Fiscal year alignments (calendar year end `12-31`, `03-31`, `06-30`).
    - VAT registration toggle on vs. off across UAE, Singapore, Bahrain, and Ireland.
    - Leap day incorporation handling (`2024-02-29`).
    - Missing inputs, unparseable dates, and empty deadline summary graceful handling.

## Protected-zone touchpoints
None. Zero protected files modified.

## Known gaps / extension points
- Automated push notification dispatching prior to upcoming and due_soon deadlines (planned for notification scheduler integration).
- Direct document upload linking from deadline cards to the Document Locker for archived filing receipts.
