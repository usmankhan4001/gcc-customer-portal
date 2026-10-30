# Spec: Stateful Compliance Calendar (F1.2)

**Status**: approved
**Requested by**: owner
**Roadmap ref**: docs/versions/v2.1-engage-retain-core.md (F1.2)
**Protected files approved**: none
**Schema change**: no
**Depends on**: 015
**Touches (for parallel planning)**: src/lib/compliance/stateful-calendar.ts, src/lib/compliance/stateful-calendar.test.ts, src/app/api/companies/[id]/compliance/route.ts, src/components/portal/ComplianceTimeline.tsx
**Approval**: Approved by owner in session.

## Problem
The compliance calendar tool is currently a static calculator. Once a customer has incorporated, they need a personalized, stateful calendar that tracks their actual filing deadlines (Corporate Tax Return, VAT, Trade License Renewal, Economic Substance Regulations, Annual Return) computed dynamically from their incorporation date, jurisdiction, and fiscal year end.

## Scope
- In:
  - Pure calculation module in `src/lib/compliance/stateful-calendar.ts` calculating jurisdiction-specific statutory deadlines (UAE, Hong Kong, Singapore, Bahrain, Ireland, BVI).
  - Deadlines include: days remaining, status (`upcoming`, `due_soon`, `overdue`), statutory penalty explanations.
  - Sibling test suite `stateful-calendar.test.ts`.
  - API endpoint `GET /api/companies/[id]/compliance` returning the calculated schedule.
- Out:
  - Push notification dispatchers (covered in F0.4).

## Acceptance criteria
- [x] AC1: Pure logic accurately computes VAT, Corporate Tax, Annual Return, and License Renewal dates for all 6 jurisdictions based on entity incorporation date and fiscal year end.
- [x] AC2: Deadlines categorize status accurately (`overdue` if past, `due_soon` within 30 days, `upcoming` otherwise).
- [x] AC3: Sibling unit tests assert 100% calculation accuracy across leap years and fiscal year alignments.
- [x] AC4: Route returns 401/404 on unauthenticated or missing company access, and 200 with deadline array for valid requests.
- [x] AC5: `npm run verify` passes cleanly.
