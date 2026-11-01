# Feature: Admin leads page in the CMS admin style

**Slug**: 020-admin-leads-restyle   **Spec**: docs/specs/020-admin-leads-restyle.md   **Last verified against code**: 2026-11-02

## What it does (3 sentences max)
Restyles `/admin/leads` with the CMS admin classes and `PageHeader`; the lead count moved into the page subtitle. Data and endpoint are unchanged. The table collapses to cards on phones.

## Where it lives
- Pages / routes: `src/app/admin/leads/page.tsx`
- API routes (methods, auth required): `GET /api/admin/leads` (unchanged, admin only)
- Components: `src/components/admin/PageHeader.tsx`
- lib modules: `src/lib/admin-ui/leads.ts` (badges, interest and date formatting, count label)
- DB tables / columns: none changed
- Env vars / external services: none

## Behavior and rules
- Columns: contact (card title), source tool and persona badges, interest (each word capitalized, as before) and track (`hide-phone`), captured.
- Source tool is an info badge (raw slug if unknown); track `consultation_led` is an accent badge, anything else info "Self-serve"; converted leads show a success badge.
- States: `admin-state` loading, `cl-empty is-error` when the request fails or is not ok (new: previously a 401/500 looked empty), `cl-empty` "No leads have been captured yet."

## Data flow
1. Mount: `fetch('/api/admin/leads')`; `data.leads ?? []`.
2. Rows render via the pure helpers in `leads.ts`.

## Tests
`src/lib/admin-ui/leads.test.ts`: table-driven helper tests plus source assertions for AC1 to AC3 and the empty copy. Not covered: visual layout at 375/1280px.

## Protected-zone touchpoints
None (admin gate stays in middleware and `requireAdmin()`).

## Known gaps / extension points
See [admin-leads](admin-leads.md) for the pre-restyle behavior; the "error invisible" gap is closed and that doc now reflects the restyled page.
