# Feature: Admin clients page in the CMS admin style

**Slug**: 019-admin-clients-restyle   **Spec**: docs/specs/019-admin-clients-restyle.md   **Last verified against code**: 2026-11-02

## What it does (3 sentences max)
`/admin/clients` is rebuilt with the CMS admin classes and `PageHeader`: toolbar (search + KYC status select), `admin-table` that stacks into cards on phones, badge-based status, and row actions in a `cl-cell-menu` cell. Behaviour is unchanged: still the page's 5 sample clients, Verify/Reject only mutate React state, no API calls. Pure logic lives in `src/lib/admin-ui/clients.ts`.

## Where it lives
- Pages / routes: `src/app/admin/clients/page.tsx` (client component)
- API routes: none
- Components: `src/components/admin/PageHeader.tsx`
- lib modules: `src/lib/admin-ui/clients.ts` (`filterClients`, `statusBadgeClass`, `formatClientId`, `STATUS_FILTERS`)
- DB tables / columns: none
- Env vars / external services: none

## Behavior and rules
- Search is case-insensitive over name, company and phone; status filter is `All | Pending | Verified | Rejected`; both apply together.
- Badge mapping: Verified -> `badge-success`, Pending -> `badge-accent`, Rejected -> `badge-danger`.
- Pending rows show Verify and Reject buttons; other rows show an inert "More actions" icon button (as before).
- Company and phone columns are `hide-phone`; the name and ID stay as the card title on phones.
- No match shows the `cl-empty` state. No loading or error state exists because there is no fetch.
- The disabled Previous/Next footer is kept (still a mock).

## Data flow
1. `initialClients` -> React state. 2. Search/select state -> `filterClients`. 3. Verify/Reject -> `setStatus` updates state only.

## Tests
`src/lib/admin-ui/clients.test.ts`: filtering table (8 cases), badge mapping, ID format, and source assertions for the page (skeleton, one PageHeader/h1, no hard-coded colours or Tailwind colour utilities, CMS classes, named controls). Not covered: visual layout at 375px/1280px (owner checks after merge).

## Protected-zone touchpoints
None (admin route gate in middleware unchanged).

## Known gaps / extension points
Data is still mock; see [admin-clients](admin-clients.md) for the real-data plan.
