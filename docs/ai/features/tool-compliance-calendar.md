# Feature: Compliance Calendar

**Slug**: tool-compliance-calendar   **Area**: [lead-gen-tools](../modules/lead-gen-tools.md)   **Status**: partial (UAE-only, static, no reminders, no persistence)   **Last verified against code**: 2026-10-30

## What it does
A public page where the user enters a company formation / licence date and receives a 6-row table of UAE statutory deadlines computed by adding fixed month offsets to that date. Each row has a hard-coded status badge. "Print / Save PDF" calls `window.print()`. There is no jurisdiction selector (UAE only), no reminders, no saved calendar, and no link to the user's real company record.

## Entry points
- UI: `/tools/compliance-calendar` (`src/app/tools/compliance-calendar/page.tsx`, client component `ComplianceCalendar`).
- Linked from tools index (`src/app/tools/page.tsx:23`) and dashboard tile "Compliance" (`src/app/(authenticated)/dashboard/page.tsx:515`).
- API: none. Public path (`/tools/*` not in `PROTECTED_PREFIXES`, `src/middleware.ts:34-44`).

## Files
- `src/app/tools/compliance-calendar/page.tsx:13-35` - `computeDeadlines(formation: Date)` (not exported).
- `src/app/tools/compliance-calendar/page.tsx:37-41` - `STATUS_STYLES` badge classes.
- `src/app/tools/compliance-calendar/page.tsx:43-135` - component.
- Related but NOT used by this page: `src/app/api/tax-rules/route.ts` and `src/components/portal/ComplianceSnapshot.tsx` (dashboard widget with its own deadline logic); `companies.incorporation_date`, `companies.fiscal_year_end` (`schema.ts:81`, `:85`).

## Request / response contract
none.

## Step-by-step flow
1. User picks a date in `#formationDate` (`type="date"`, `required`, `:70-77`).
2. Submit (`:47-51`): returns if empty; else `computeDeadlines(new Date(formationDate))` stored in `rows`.
3. `computeDeadlines` (`:13`): `addMonths` copies the date and does `setMonth(getMonth()+m)`; `fmt` = `toLocaleDateString('en-GB', {day:'numeric', month:'short', year:'numeric'})`.
4. Table rendered (`:103-126`) with caption "Based on license date: <raw input>" and footnote "Estimates based on UAE Federal Tax Authority (FTA) and Ministry of Economy timelines" (`:127-129`).
5. Print button -> `window.print()` (`:53-55`, `:95-101`).

## Data
None read or written. No DB, no localStorage, no cookies. Nothing survives a refresh.

## Business rules and constants: the deadline rules (UAE only)
Offsets from formation date `F` (`page.tsx:21-25`, rows `:28-33`):
| # | Requirement label | Computed as | Status badge (fixed) |
|---|---|---|---|
| 1 | Mandatory/Voluntary VAT Registration | F + 1 month | Upcoming |
| 2 | Corporate Tax (EmaraTax) Registration | F + 3 months | Action Required |
| 3 | First Financial Year End | F + 12 months (`finYearEnd`) | Pending |
| 4 | First Corporate Tax Return & Payment (9 Months Post-FYE) | finYearEnd + 9 months | Pending |
| 5 | Economic Substance Regulations (ESR) Annual Notification | finYearEnd + 12 months | Pending |
| 6 | Trade License & Establishment Card Annual Renewal | finYearEnd (= F + 12) | Upcoming |
- Status values never depend on today's date. A formation date years in the past still shows "Action Required" for row 2 and "Upcoming" for rows 1 and 6.
- Other jurisdictions (HK, Singapore, Bahrain, Ireland, BVI): no rules exist in this page. The DB table `jurisdiction_tax_rules` seeds a `filing_deadline_rule` text for uae/hong-kong/singapore (`scripts/seed.ts:35-76`) but the page does not read it.

## Reminders and persistence
None. No email, WhatsApp, push, cron, or `.ics` export is attached to this tool. The only deadline-related automation in the repo is `renewals` (see [renewals](renewals.md)) which is unrelated to this page's numbers. `leads.source_tool` has `compliance_calendar` (`schema.ts:316`) but nothing writes it.

## Auth, permissions, security
Public, client-only. No protected zone. React-escaped output.

## Failure modes and edge cases
- Month overflow: `setMonth` on day 29-31 rolls over. F = 2026-01-31: row 1 = 3 Mar 2026 (not 28 Feb). Chained dates (rows 4, 5 derive from a possibly rolled `finYearEnd`) compound the shift.
- Time zone: `new Date('YYYY-MM-DD')` is UTC midnight; `toLocaleDateString` uses local zone, so users west of UTC may see the previous day (UAE users are unaffected).
- Future/past dates are accepted without validation (no min/max).
- The caption echoes the raw ISO input string, not the formatted date.
- Row key is `row.requirement` (unique today; duplicates would warn).
- Real-world accuracy (not verifiable from code, review with domain owner): VAT registration is normally triggered by exceeding the AED 375,000 threshold (30 days), not by formation + 1 month; the first financial year end is not necessarily F + 12 months; ESR notification/report regime has been repealed for periods from 2023 per public sources, so row 5 may be obsolete. Treat the table as illustrative.

## Tests
None. Worth writing (extract `computeDeadlines` to `src/lib/compliance-calendar.ts`, inject dates, use UTC math):
1. F = 2026-03-15 -> VAT 15 Apr 2026, CT reg 15 Jun 2026, FYE 15 Mar 2027, CT return 15 Dec 2027, ESR 15 Mar 2028, licence 15 Mar 2027.
2. F = 2026-01-31 -> VAT row should be 28 Feb 2026 (currently 3 Mar 2026; documents the overflow bug).
3. F = 2024-02-29 -> FYE should be 28 Feb 2025 (currently 1 Mar 2025).
4. Empty date -> no table.
5. Rows count is always 6 and statuses are `Upcoming, Action Required, Pending, Pending, Pending, Upcoming` in order.
6. (After adding status logic) a deadline before "today" must render as overdue.

## Known bugs and gaps
- Month-overflow date bug (`page.tsx:14-18`) - wrong dates for formation days 29-31.
- Statuses are decorative and not date-aware (`:28-33`).
- Single jurisdiction; no personalization from `companies.incorporation_date`/`fiscal_year_end` even for logged-in users.
- `api/tax-rules` header claims the compliance calendar consumes it (`src/app/api/tax-rules/route.ts:6-8`); it does not.
- No reminders, no export (.ics), "Print / Save PDF" prints the whole page.

## Change guide
- Add a jurisdiction: add a selector and a rules map per jurisdiction (prefer reading `jurisdiction_tax_rules.filing_deadline_rule`, but note that column is free text parsed by regex in `ComplianceSnapshot.tsx:18-39`, so structured rules would be safer).
- Fix dates with a month-add helper that clamps to month end; use UTC accessors.
- To add reminders: persist the date (new table or `companies` fields), then use [in-app-notifications](in-app-notifications.md) and [whatsapp-outbound](whatsapp-outbound.md) from a scheduled job (none exists; see [deploy-and-ci](deploy-and-ci.md)).
- Update `docs/ai/modules/lead-gen-tools.md` (its offsets list matches this doc).

## Related features
[reference-data-tax-rules-countries](reference-data-tax-rules-countries.md), [renewals](renewals.md), [client-dashboard](client-dashboard.md), [tool-vat-scorer](tool-vat-scorer.md)
