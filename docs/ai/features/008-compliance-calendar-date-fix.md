# Feature: Compliance calendar date fix

**Slug**: 008-compliance-calendar-date-fix   **Spec**: docs/specs/008-compliance-calendar-date-fix.md   **Last verified against code**: 2026-10-30

## What it does (3 sentences max)
The compliance calendar deadline maths now lives in a pure module instead of the page. Adding months clamps to the last day of the target month, so Jan 31 + 1 month is Feb 28/29 rather than March 3. Deadlines, offsets and statuses are unchanged.

## Where it lives
- Pages / routes: `/tools/compliance-calendar` (`src/app/tools/compliance-calendar/page.tsx`, imports `computeDeadlines`)
- API routes (methods, auth required): none
- Components: none
- lib modules: `src/lib/tools/compliance-calendar.ts` (`addMonths`, `computeDeadlines`, `DeadlineRow`)
- DB tables / columns: none
- Env vars / external services: none

## Behavior and rules
- `addMonths(d, n)` uses UTC accessors, clamps the day to the target month's last day, handles year rollover and leap years (Feb 29 2028 + 12 = Feb 28 2029).
- Invalid dates do not throw: `addMonths` returns an Invalid Date.
- Offsets (VAT +1, CT registration +3, FYE +12, CT return FYE+9, ESR FYE+12, licence at FYE) and the fixed statuses are unchanged. Output for formation days 1 to 28 is identical to before.
- Labels are still formatted with the local zone (`toLocaleDateString('en-GB')`), as before.

## Data flow
1. User submits a date; the page calls `computeDeadlines(new Date(input))`.
2. `computeDeadlines` derives 5 dates via `addMonths` and returns 6 rows.

## Tests
`src/lib/tools/compliance-calendar.test.ts`: table-driven `addMonths` cases (clamping, leap years, rollover, invalid input) and `computeDeadlines` row structure. Not covered: formatted labels (depend on the runner's time zone).

## Protected-zone touchpoints
None.

## Known gaps / extension points
Statuses are still not date-aware; single jurisdiction; time-zone display issue west of UTC remains. See [tool-compliance-calendar](tool-compliance-calendar.md).
