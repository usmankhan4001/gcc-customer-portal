# Spec: Dashboard defects: Pay Now link, copy button, duplicate PDF link

**Status**: approved
**Requested by**: owner (known bugs in docs/ai/features/client-dashboard.md)
**Roadmap ref**: docs/versions/v2.1-engage-retain-core.md (F1.4)
**Protected files approved**: none
**Schema change**: no
**Depends on**: none
**Touches (for parallel planning)**: src/app/(authenticated)/dashboard/, src/lib/dashboard/, src/app/api/companies/revenue-estimate/
**Approval**: owner asked for specs to make the repo ready for any agent (chat, 2026-10-30); no protected files, no schema.

## Problem
Read `docs/ai/features/client-dashboard.md` and `docs/ai/features/good-standing-snapshot.md`. "Pay Now" links to `/checkout/<orderId>` but the checkout page expects a jurisdiction id, so retrying a payment fails with a 400. The referral Copy button has an `onClick` inside a Server Component. Both PDF links on the dashboard are identical. Saving a decimal revenue estimate returns 500 because the column is an integer.

## Scope
- In: make "Pay Now" open a working checkout for the order's company jurisdiction (read `src/app/(authenticated)/checkout` and `/api/checkout` but do NOT edit them: `/api/checkout` is protected); move the Copy button into a small client component; give the two PDF links distinct, correct targets or remove the duplicate; round or validate the revenue estimate so decimals do not 500; tests for the pure parts.
- Out: referral earnings, query consolidation, currency symbol, anything under `src/app/api/checkout/`.

## Acceptance criteria
- [ ] AC1: A pure helper builds the Pay Now URL from the order/company; a test proves it uses the jurisdiction id and never an order id.
- [ ] AC2: The Copy button is a client component and the build passes with no Server Component event-handler error.
- [ ] AC3: The two PDF links point to different, documented targets, or one is removed.
- [ ] AC4: `PATCH /api/companies/revenue-estimate` with a decimal value returns 200 and stores an integer; negative and non-numeric values return 400 (route test).
- [ ] AC5: If the checkout page cannot work without editing protected files, say so in the report instead of editing them.

## Test plan
Vitest unit and route tests; `npm run verify` passes.
