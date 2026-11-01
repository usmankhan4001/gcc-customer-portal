# Feature: Admin pipeline page in the CMS admin style

**Slug**: 018-admin-pipeline-restyle   **Spec**: docs/specs/018-admin-pipeline-restyle.md   **Last verified against code**: 2026-11-02

## What it does (3 sentences max)
Restyles `/admin` (the operations pipeline) with the CMS admin classes and `PageHeader`; behavior and API calls are unchanged (see [admin-kanban-pipeline](admin-kanban-pipeline.md)). On desktop the four stages are a board; on phones `cl-chips` pick one stage and only its cases show as `card`s, so nothing scrolls sideways. Grouping, filtering and badge mapping are pure functions with unit tests.

## Where it lives
- Pages / routes: `src/app/admin/page.tsx` (client component; `CaseCard` replaces `KanbanCard`/`KanbanColumn`).
- API routes: unchanged, `GET/PATCH/POST /api/admin/pipeline` (admin only).
- Components: `src/components/admin/PageHeader.tsx`; page-specific CSS in `src/app/admin/pipeline.module.css` (board at >=900px, single selected column below).
- lib modules: `src/lib/admin-ui/pipeline.ts` (+ `pipeline.test.ts`).
- DB tables / columns: none changed.
- Env vars / external services: none.

## Behavior and rules
- Same requests: GET on mount and refresh, PATCH `{companyId, status}` for Advance and stage jump, POST for New Order.
- `groupByStage` is the single source for chip counts and column counts (columns: intake = lead/onboarding; kyc; filing = filing_in_progress/bank_opening; active = active/renewal_due/suspended/archived).
- The old "Move To Stage" popup menu is now a labelled `select` on each card (same six options; choosing the current stage does nothing).
- New UI-only state: a failed GET (non-ok or network error) shows the `cl-empty is-error` state instead of an empty board. PATCH/POST failures are still silent, as before.
- Search clear is a "Clear search" button shown while there is a query.

## Data flow
1. Mount -> GET -> `items`. 2. Search/jurisdiction -> `filterItems` -> `groupByStage`. 3. Chip (phone) selects the visible column. 4. Advance/jump -> PATCH -> optimistic status update.

## Tests
`src/lib/admin-ui/pipeline.test.ts`: grouping/counts (AC6), filtering, stage/badge mapping, formatting, plus source assertions for AC1-AC3. Not covered: visual layout at 375px/1280px (owner checks), component interactions.

## Protected-zone touchpoints
None directly (the admin gate in `middleware.ts` and `requireAdmin()` are unchanged).

## Known gaps / extension points
Mutation errors are not surfaced. The modal has no focus trap or Escape handling (as before).
