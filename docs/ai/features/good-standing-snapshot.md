# Feature: Good-standing PDF and compliance snapshot

**Slug**: good-standing-snapshot   **Area**: [client-portal](../modules/client-portal.md)   **Status**: partial   **Last verified against code**: 2026-10-30

## What it does
Two dashboard add-ons for the active company. (1) A "Good Standing" PDF generated on demand. (2) A "Compliance Snapshot" card where the client enters an annual revenue estimate and sees an estimated corporate tax and next filing deadline from `jurisdiction_tax_rules`. "Good standing" here is only `companies.status === 'active'`; it is not verified against any registry.

## Entry points
- `GET /api/companies/good-standing?companyId=<uuid>` (`src/app/api/companies/good-standing/route.tsx`), linked twice from dashboard :239,:243.
- `PATCH /api/companies/revenue-estimate` (`src/app/api/companies/revenue-estimate/route.ts`), called by `ComplianceSnapshot.tsx:60`.
- `GET /api/tax-rules?jurisdiction=` (`src/app/api/tax-rules/route.ts`), called by `ComplianceSnapshot.tsx:48`.
- UI: `<ComplianceSnapshot>` at dashboard :459.

## Files
- `good-standing/route.tsx:10-89` PDF styles + `GoodStandingDocument`; `:91-125` handler. Uses `@react-pdf/renderer`, `uploadBuffer` from `src/lib/r2`.
- `revenue-estimate/route.ts:8-39`.
- `src/app/api/tax-rules/route.ts:1-24` - public read of `jurisdiction_tax_rules`.
- `src/components/portal/ComplianceSnapshot.tsx:1-134` - client component.
- `src/lib/session.ts:15` (good-standing only); `src/lib/auth.ts` `verifyToken` (revenue-estimate only).

## Request / response contract
**GET /api/companies/good-standing** query `companyId` (optional, not validated as uuid). Success 200 `application/pdf`, `Content-Disposition: attachment; filename="good-standing-<name-with-dashes-lowercase>.pdf"`. Errors: 401 `{error:'Unauthorized'}` (no session header), 404 `No company found`, 403 `Forbidden` (company belongs to someone else). A non-uuid `companyId` makes Postgres throw -> unhandled 500.
**PATCH /api/companies/revenue-estimate** body `{annual_revenue_estimate: number (required, >=0), fiscal_year_end?: string}`. 200 `{company: <full companies row>}`; 401 `Unauthorized` (cookie `gcc_session` missing/invalid); 400 `annual_revenue_estimate must be a non-negative number`; 404 `No active company found`. `request.json()` failure and non-integer numbers are unhandled (500). `fiscal_year_end` is not format-validated.
**GET /api/tax-rules?jurisdiction=x** -> 200 `{rules: JurisdictionTaxRule[]}`; 400 `jurisdiction query param is required`. No auth.

## Step-by-step flow
Good standing: 1. `getServerSession()` (:92) -> 401 if null. 2. If `companyId`: `companies WHERE id = companyId` (:98); else the user's **oldest** company (`ORDER BY created_at ASC LIMIT 1`, :99). 3. Ownership check after load (:102). 4. `renderToBuffer(GoodStandingDocument)` (:104): fields company name, title-cased jurisdiction/tier, trade license no. (only if set), incorporation date (`toLocaleDateString()` or "In Progress"), license expiry or "—". 5. Upload copy to R2 key `pdfs/good-standing/<userId>/<companyId>-<Date.now()>.pdf` (:116-117). 6. Return bytes.
Snapshot: 1. mount -> fetch tax rules for `jurisdiction` prop (:47-52); errors -> `[]`. 2. While `rules === null` show spinner. 3. If `savedRevenue == null`: show revenue form (input type number, submit -> PATCH; `value` NaN or <0 ignored silently; on `res.ok` set `savedRevenue`). 4. Else with a `corporate` rule: est. tax = `round(revenue * rate_percent / 10000)` (:107; rate stored percent*100). Deadline via `nextDeadlineFromRule`. 5. No corporate rule: "No tax rules configured for this jurisdiction yet." Disclaimer always shown.

## Data
Reads/writes `companies` (`annual_revenue_estimate` **integer**, `fiscal_year_end` text "MM-DD", `updated_at`). Reads `jurisdiction_tax_rules` (`tax_type`, `rate_percent`, `filing_deadline_rule`, schema :229). Writes an R2 object per download. `fiscal_year_end` is never collected in the UI (form sends only revenue), so the deadline is the raw rule text unless another path set it.

## Business rules and constants
- Good standing = `status === 'active'` (route :44). Any other status prints "● <STATUS UPPERCASE>" in red with "contact your account manager". License expiry and renewals are ignored (an `active` company with an expired license still prints "IN GOOD STANDING").
- Deadline: rule text must match `/(\d+)\s*months?/i`; deadline = FY end (current year, `MM-DD`) + N months; if already past, same calc for next year (ComplianceSnapshot :18-39). Non-matching rule text or null FY end -> `null` -> raw rule string shown.
- PDF colours/brand `#0A2540`, `#C9A84C`; disclaimer says it is not an official certificate (:78-81).
- Revenue estimate target company = newest non-lead (revenue route :21-26); PDF default = oldest company. They can differ.

## Auth, permissions, security
- good-standing relies on `getServerSession()` (middleware headers). `/api/` is in `PUBLIC_PATHS` (`src/middleware.ts:6`) and middleware returns early (:49-50) without setting any `x-user-*` header. So either the route always 401s for browser users (feature dead), or it trusts client-supplied `x-user-id` (spoofable; attacker still needs a victim's company UUID because of the ownership check). Which holds is unverified at runtime; both are defects. Module doc raises the same point. PROTECTED ZONE: session.ts/middleware.ts.
- revenue-estimate verifies the JWT cookie itself (correct pattern) and only updates the caller's own company.
- tax-rules is public by design.

## Failure modes and edge cases
- R2 upload failure -> unhandled, request 500 even though the PDF was generated. Every click stores another object forever.
- No company -> 404 JSON, user sees raw JSON because link is a plain `<Link>` navigation to the attachment URL.
- Fractional revenue (e.g. `1234.5`) -> integer column error -> 500; the client ignores failure silently (`res.ok` false, no message).
- Revenue 0 is valid and shows $0 tax. Once saved, there is no UI to edit the revenue again (form shown only when null).
- Jurisdiction mismatch with enum in `/api/tax-rules` (cast `as any`) -> empty list.

## Tests
None. Worth writing:
1. PDF GET with valid header for own company -> 200, content-type pdf, key uploaded (mock `uploadBuffer`).
2. GET with another user's `companyId` -> 403.
3. GET with no session header -> 401.
4. PATCH `{annual_revenue_estimate:-1}` -> 400; `{...:1000}` -> 200 and DB updated; no cookie -> 401.
5. `nextDeadlineFromRule('9 months after FY end','12-31')` -> a date 9 months after next 31 Dec if past.
6. Snapshot: revenue 100000, rate_percent 900 -> "$9,000/yr".

## Known bugs and gaps
- Header dependency of an `/api/` route (route.tsx:92 vs middleware.ts:6,49).
- "Good standing" ignores license expiry / overdue renewals (route :44).
- Integer column vs `parseFloat` input (ComplianceSnapshot :56; schema `annual_revenue_estimate integer`).
- No edit-after-save; no error display on failed save.
- PDF written to R2 on every download, never deleted.
- Unvalidated `companyId` -> 500.

## Change guide
To fix auth: verify `gcc_session` with `verifyToken` in the route like revenue-estimate does (do not change middleware without approval). To include renewals in "good standing", join `renewals` for the company and fail if any `overdue`. Add a currency/field for revenue if non-USD is needed. Keep `rate_percent` as percent*100 everywhere.

## Related features
[client-dashboard](client-dashboard.md), [reference-data-tax-rules-countries](reference-data-tax-rules-countries.md), [tool-compliance-calendar](tool-compliance-calendar.md), [session-and-route-guard](session-and-route-guard.md), [renewals](renewals.md)
