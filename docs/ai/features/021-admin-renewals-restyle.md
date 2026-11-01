# Feature: Admin renewals page restyle

**Slug**: 021-admin-renewals-restyle   **Spec**: docs/specs/021-admin-renewals-restyle.md   **Last verified against code**: 2026-11-02

## What it does (3 sentences max)
`/admin/renewals` is rebuilt with the CMS admin classes and `PageHeader`. Behaviour is unchanged: it still shows static sample data and its two action buttons still have no handlers. Pure helpers live in `src/lib/admin-ui/renewals.ts`.

## Where it lives
- Pages / routes: `src/app/admin/renewals/page.tsx`
- API routes (methods, auth required): none
- Components: `src/components/admin/PageHeader.tsx`
- lib modules: `src/lib/admin-ui/renewals.ts` (sample data, `renewalBadgeClass`, `formatAmount`, `summarizeRenewals`)
- DB tables / columns: none
- Env vars / external services: none

## Behavior and rules
- Summary cards (`admin-metrics-grid`) show the same static figures as before (12, 3, $45,000); `summarizeRenewals` computes totals from rows but is not wired to the display, to keep behaviour identical.
- Status to badge: Upcoming -> `badge-info`, anything else (Overdue) -> `badge-danger`.
- Plan and Amount columns are `hide-phone`; the table becomes stacked cards on phones.
- "Send Bulk Reminders" is in the `PageHeader` actions.

## Data flow
Static array -> table rows. No requests.

## Tests
`src/lib/admin-ui/renewals.test.ts`: helpers (table-driven) and source assertions for AC1 to AC3. Visual check at 375px and 1280px is manual.

## Protected-zone touchpoints
None.

## Known gaps / extension points
Data and buttons remain mock; see [renewals](renewals.md) for the real-engine plan.
