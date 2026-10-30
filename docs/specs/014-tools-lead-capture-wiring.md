# Spec: Wire tools to lead capture (prerequisite of F1.1 and F1.3)

**Status**: draft
**Requested by**: owner (docs/ai/features/lead-capture-and-persona.md)
**Roadmap ref**: docs/versions/v2.1-engage-retain-core.md (F1.1, F1.3)
**Protected files approved**: none
**Schema change**: no   <!-- becomes yes if AC4 needs a consent column; split that out first -->
**Depends on**: 010, 011, 012 (same tool pages; do not run in parallel with them)
**Touches (for parallel planning)**: src/app/tools/, src/app/api/leads/capture/, src/components/portal/ContactCaptureGate.tsx, src/lib/tools/
**Approval**: NOT YET GIVEN. Owner must answer the open questions and set Status to approved.

## Problem
Nothing calls `POST /api/leads/capture`, so no tool creates a lead and lead scoring has no data. See `docs/ai/features/lead-capture-and-persona.md`. The route accepts unvalidated input.

## Scope
- In: zod validation on the route (source_tool enum, email/phone format, bounded `tool_input`/`tool_result` size); each tool offers an optional "save my result" capture after the result; the lead id is kept client-side for later steps; consent wording shown at capture.
- Out: PDF/email delivery, scoring, outbound sends (need the consent model from F0.6).

## Acceptance criteria
- [ ] AC1: Route rejects malformed input with 400 (tests), accepts valid input, and still returns only the lead id.
- [ ] AC2: Every tool page can submit a lead with the right `source_tool` and persona signals (one test per tool mapping).
- [ ] AC3: Capture is optional and never blocks seeing the result.
- [ ] AC4: Consent acceptance is stored with the lead (needs a schema change or F0.6; if so, STOP and split it into a schema spec first).

## Open questions for the owner
1. Which tools should ask for contact details?
2. What exact consent wording is acceptable for WhatsApp and email follow-up?
