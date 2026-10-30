# Spec: Fix compliance calendar month-overflow dates (F1.4 part 2a)

**Status**: shipped
**Requested by**: owner (docs/ai/features/tool-compliance-calendar.md known bugs)
**Roadmap ref**: docs/versions/v2.1-engage-retain-core.md
**Protected files approved**: none
**Schema change**: no
**Depends on**: none
**Touches (for parallel planning)**: src/app/tools/compliance-calendar/, src/lib/tools/compliance-calendar.ts, src/lib/tools/compliance-calendar.test.ts
**Approval**: owner asked for an end-to-end agent-ready setup including a parallel shakedown run (chat, 2026-10-30); no protected files.

## Problem
`src/app/tools/compliance-calendar/page.tsx` computes deadlines with `setMonth(getMonth() + m)`, which overflows for days 29 to 31 (Jan 31 + 1 month becomes March 3). Read `docs/ai/features/tool-compliance-calendar.md` for details and file:line.

## Scope
- In: move the deadline computation into a pure function in `src/lib/tools/compliance-calendar.ts` (page imports it), clamp to the last day of the target month, handle year rollover, add table-driven tests.
- Out: new jurisdictions, persistence, reminders, changing which deadlines exist or their month offsets.

## Acceptance criteria
- [ ] AC1: Adding N months to a date whose day does not exist in the target month returns the last day of that month (Jan 31 + 1 month = Feb 28 or 29; Aug 31 + 1 month = Sep 30).
- [ ] AC2: Year rollover and leap years are correct (Dec 15 + 3 months = Mar 15 next year; Feb 29 2028 + 12 months = Feb 28 2029).
- [ ] AC3: The page output for a formation date with day 1 to 28 is unchanged from before (same deadlines, same offsets).
- [ ] AC4: At least 8 table-driven test cases cover the above, plus an invalid-date input that does not throw.

## Test plan
Vitest unit tests beside the new module. `npm run verify` passes.
