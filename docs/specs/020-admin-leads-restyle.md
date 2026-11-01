# Spec: Admin leads page in the CMS admin style

**Status**: shipped
**Requested by**: owner (replicate the revamped gccstartup-cms admin UI in the customer portal admin)
**Roadmap ref**: docs/versions/v2.1-engage-retain-core.md (UI parity); docs/ai/features/admin-shell-cms-port.md
**Protected files approved**: none
**Schema change**: no
**Depends on**: admin shell port (commit 7935779), docs/ai/CMS_ADMIN_UI.md
**Touches (for parallel planning)**: src/app/admin/leads/page.tsx, src/lib/admin-ui/leads.ts, src/lib/admin-ui/leads.test.ts
**Approval**: owner said "Continue" in chat on 2026-11-02 to run the admin page restyles; no protected files, no schema.

## Problem
The admin shell now matches the CMS admin, but this page's content still uses the old Tailwind layout (fixed-width tables, hard-coded colours), which overflows on a phone and does not look like the CMS admin. Read docs/ai/CMS_ADMIN_UI.md first: it lists the classes, the page skeleton and the table-to-card behaviour. Read the matching docs/ai/features/ doc for this page's current behaviour.

## Scope
- In: rebuild the page markup with the CMS classes and `PageHeader` (`src/components/admin/PageHeader.tsx`); keep behaviour identical; move pure logic into `src/lib/admin-ui/leads.ts` with unit tests.
  - Page: `src/app/admin/leads/page.tsx` (GET `/api/admin/leads`; columns contact, source tool, persona, interest, track, captured).
  - Use an `admin-table`: contact is the card title on a phone, source tool and persona are `badge`s, interest and track are `hide-phone`. Show the count in the page subtitle.
  - Extra criterion AC6: date formatting and the source-tool and persona to badge mapping are pure functions with tests; the empty state says no leads have been captured yet.
- Out: new features, API or schema changes, changes to other pages or to the shell, new dependencies, new global CSS.

## Common acceptance criteria
- [ ] AC1: The page renders inside `<div className="wrap admin-page">` with a `PageHeader` carrying the page title and subtitle; there is exactly one `<h1`.
- [ ] AC2: No hard-coded hex colours and no Tailwind colour or layout utilities (`bg-gray-`, `text-gray-`, `h-screen`, `overflow-hidden`, `#` hex) remain in the page file (a test reads the source and asserts it); colours come from the CMS classes or CSS variables.
- [ ] AC3: Loading, error and empty states use the CMS patterns (`admin-state`, `cl-empty is-error`, `cl-empty`).
- [ ] AC4: All pure logic you move (formatting, filtering, status to badge tone, grouping) lives in `src/lib/admin-ui/leads.ts` with at least 8 table-driven test cases, and the page behaves exactly as before (same endpoints, same requests, same actions).
- [ ] AC5: Every control that existed before still exists and is a real `button`, `a` or form control with an accessible name.

## Test plan
Vitest unit tests next to the new lib module plus one source-assertion test for AC1 to AC3. `npm run verify` passes. The owner checks the result visually at 375px and 1280px after the merge (the pipeline cannot see the page).
