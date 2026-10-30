# Feature: UBO Privacy & Registry Checker

**Slug**: tool-ubo-privacy   **Area**: [lead-gen-tools](../modules/lead-gen-tools.md)   **Status**: complete   **Spec**: docs/specs/010-ubo-privacy-fix.md   **Last verified against code**: 2026-10-30

## What it does
A public page where a prospect picks a target formation jurisdiction (UAE Free Zone, BVI, UK, US) and gets an exposure card: score, whether the registry is public, whether UBO data is protected, and a one-sentence recommendation. It nudges to `/services` ("Explore Nominee & Holding Tier"). Entirely client-side; nothing is stored or sent.

## Entry points
- UI: `/tools/ubo-privacy` (`src/app/tools/ubo-privacy/page.tsx`, client component `UBOPrivacyChecker`).
- Linked from tools index (`src/app/tools/page.tsx:21`, "UBO Privacy"). Not on dashboard tiles.
- API: none. Public path (`/tools/*` not in `PROTECTED_PREFIXES`, `src/middleware.ts:34-44`).

## Files
- `src/lib/tools/ubo-privacy.ts` - pure calculation and lookup module (`PrivacyResult`, `checkExposure`, `classifyExposure`, `UBO_JURISDICTION_PROFILES`, `UBO_JURISDICTION_OPTIONS`).
- `src/lib/tools/ubo-privacy.test.ts` - Vitest unit tests verifying non-contradiction invariant, US score 40 classification, and score boundaries.
- `src/app/tools/ubo-privacy/page.tsx` - client component `UBOPrivacyChecker`.
- `src/lib/db/schema.ts:315` - `leads.source_tool` has `ubo_privacy` (unused).

## Request / response contract
none.

## Step-by-step flow
1. State: `jurisdiction = "uae"`, `result = null`.
2. Target formation `<select id="jurisdiction">` options rendered from `UBO_JURISDICTION_OPTIONS`: `uae`, `bvi`, `uk`, `us`. Changing selection resets `result` to null (`setResult(null)`).
3. Submit: calls `checkExposure(jurisdiction)` from pure logic module.
4. `checkExposure`: retrieves profile from `UBO_JURISDICTION_PROFILES` (fallback to `uae`), evaluates `exposureScore <= 40`, and returns `PrivacyResult` with formatted labels and classification level.
5. Render: shield icon emerald if `exposureLevel === 'low'` (score <= 40) else rose warning; badge "Low Exposure (Private)" if low else "High Public Exposure"; two tiles (public registry YES/NO; UBO "Protected" or "Disclosed Online"); recommendation paragraph; CTA to `/services`.

## Data
Not stored. `crsReporting` is in the type and data but never rendered.

## Business rules and constants (`src/lib/tools/ubo-privacy.ts`)
| key | label | exposureScore | publicRegistry | crsReporting | uboConfidential |
|---|---|---|---|---|---|
| uae | UAE Free Zone | 20 | false | true | true |
| bvi | British Virgin Islands (BVI) | 15 | false | true | true |
| uk | United Kingdom (Companies House) | 95 | true | true | false |
| us | United States (Delaware / Wyoming) | 40 | false | false | true |
- Threshold for "Low" is `<= 40` (`isLowExposure`). US (Delaware/Wyoming, score 40) is classified as "Low Exposure (Private)" with emerald shield, matching `publicRegistry: NO (Confidential)` and `UBO Protection: Protected`.
- Recommendation texts are static strings.

## Auth, permissions, security
Public, no server. No protected zone. React escapes all output.

## Failure modes and edge cases
- Unknown jurisdiction key falls back to UAE.
- Changing jurisdiction immediately resets result (`setResult(null)`), preventing stale cards from being displayed.

## Tests
Vitest unit tests in `src/lib/tools/ubo-privacy.test.ts`:
1. Programmatic iteration across all jurisdictions ensuring non-contradiction invariant (`isConsistent`).
2. US case (score 40) classified as Low Exposure (Private) matching confidential tiles.
3. Table-driven boundary tests (0, 15, 20, 39, 40, 41, 50, 95, 100).
4. Fallback and case-insensitivity tests.
5. Statutory fact and score pinning.

## Known bugs and gaps
- Only 4 jurisdictions; the platform supports 6 (uae, hong-kong, singapore, bahrain, ireland, bvi - `src/lib/jurisdictions.ts:1`) so HK/SG/Bahrain/Ireland cannot be assessed.
- No lead capture (`ubo_privacy` enum unused).

## Change guide
- Add a jurisdiction: add an entry to `UBO_JURISDICTION_PROFILES` and update `UBO_JURISDICTION_OPTIONS`; keep `exposureScore` semantics (lower = more private).
- Do not link legal claims without a source and date; get sign-off from Farooq (domain owner named in `scripts/seed.ts`).
- Update `docs/ai/modules/lead-gen-tools.md` if behavior changes.

## Related features
[tool-name-checker](tool-name-checker.md), [lead-capture-and-persona](lead-capture-and-persona.md), [service-catalog-and-checkout](service-catalog-and-checkout.md)
