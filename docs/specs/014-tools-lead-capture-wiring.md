# Spec: Wire tools to lead capture (prerequisite of F1.1 and F1.3)

**Status**: approved
**Requested by**: owner (docs/ai/features/lead-capture-and-persona.md)
**Roadmap ref**: docs/versions/v2.1-engage-retain-core.md (F1.1, F1.3)
**Protected files approved**: none
**Schema change**: no
**Depends on**: 010, 011, 012 (shipped)
**Touches (for parallel planning)**: src/app/tools/, src/app/api/leads/capture/, src/components/portal/ContactCaptureGate.tsx, src/lib/tools/
**Approval**: Approved by owner with smart authentication awareness:
1. All 10 tools display the capture gate for **unauthenticated visitors** to capture lead details and prompt sign-up/onboarding.
2. For **already signed-in users**, the capture form is bypassed (no redundant contact form); their user id/email is automatically linked.
3. Consent copy for visitors: "I agree to receive my detailed report and consultation updates via WhatsApp and Email".

## Problem
Nothing calls `POST /api/leads/capture`, so no tool creates a lead and lead scoring has no data. See `docs/ai/features/lead-capture-and-persona.md`. The route accepts unvalidated input.

## Scope
- In:
  - Zod validation on the route (`source_tool` enum, email/phone format, bounded `tool_input`/`tool_result` size).
  - Auth check: If authenticated (`gcc_session`), link `converted_user_id` and skip the manual contact gate.
  - For guests: optional "Save my report / Send to email & WhatsApp" capture card with consent checkbox.
  - Consent stored in `tool_input.consent` and `tool_input.consent_text`.
- Out: PDF generation engine (F1.7), CRM notification dispatchers.

## Acceptance criteria
- [x] AC1: Route rejects malformed input with 400 (tests), accepts valid input, and still returns only the lead id.
- [x] AC2: Every tool page can submit a lead with the right `source_tool` and persona signals (one test per tool mapping).
- [x] AC3: For authenticated users, the contact form is not shown; for guests, capture is optional and never blocks calculating the result.
- [x] AC4: Consent acceptance is stored with the lead (`tool_input.consent` and `tool_input.consent_text`).

## Decisions from Owner
1. **Target Tools**: All 10 tools.
2. **Auth-Aware Behavior**: Signed-in users bypass the form completely; guests are prompted to provide contact info / sign up to receive the report in the app and via email.
3. **Consent Wording**: "I agree to receive my detailed report and consultation updates via WhatsApp and Email".
