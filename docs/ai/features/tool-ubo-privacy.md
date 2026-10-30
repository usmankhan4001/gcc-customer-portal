# Feature: UBO Privacy & Registry Checker

**Slug**: tool-ubo-privacy   **Area**: [lead-gen-tools](../modules/lead-gen-tools.md)   **Status**: partial (works; citizenship input is ignored; content is static and unsourced)   **Last verified against code**: 2026-10-30

## What it does
A public page where a prospect picks their citizenship and a target formation jurisdiction (UAE Free Zone, BVI, UK, US) and gets a static "exposure" card: score, whether the registry is public, whether UBO data is protected, and a one-sentence recommendation. It nudges to `/services` ("Explore Nominee & Holding Tier"). Entirely client-side; nothing is stored or sent.

## Entry points
- UI: `/tools/ubo-privacy` (`src/app/tools/ubo-privacy/page.tsx`, client component `UBOPrivacyChecker`).
- Linked from tools index (`src/app/tools/page.tsx:21`, "UBO Privacy"). Not on dashboard tiles.
- API: none. Public path (`/tools/*` not in `PROTECTED_PREFIXES`, `src/middleware.ts:34-44`).

## Files
- `src/app/tools/ubo-privacy/page.tsx:9-16` - `PrivacyResult` type.
- `src/app/tools/ubo-privacy/page.tsx:18-55` - `checkExposure(jurisdiction)` lookup (not exported).
- `src/app/tools/ubo-privacy/page.tsx:57-172` - component.
- `src/lib/countries.ts` - `COUNTRIES` (112 entries) feeds the citizenship `<select>` (`:89-93`). See [reference-data-tax-rules-countries](reference-data-tax-rules-countries.md).
- `src/lib/db/schema.ts:315` - `leads.source_tool` has `ubo_privacy` (unused).

## Request / response contract
none.

## Step-by-step flow
1. State: `citizenship = "US"`, `jurisdiction = "uae"`, `result = null` (`:58-60`).
2. Citizenship `<select id="citizenship">` lists every `COUNTRIES` entry as `"<flag> <name>"` with value = ISO2 code (`:83-94`).
3. Jurisdiction `<select id="jurisdiction">` options: `uae`, `bvi`, `uk`, `us` (`:107-110`).
4. Submit (`:62-65`): `checkExposure(jurisdiction)` only; `citizenship` is never passed or read afterwards.
5. `checkExposure` (`:18-55`): returns `map[jurisdiction] || map.uae` (unknown key falls back to UAE).
6. Render (`:123-168`): shield icon green if `exposureScore < 40` else red warning; badge "Low Exposure (Private)" if `< 40` else "High Public Exposure"; two tiles (public registry YES/NO; UBO "Protected" or "Disclosed Online"); recommendation paragraph; CTA to `/services`.

## Data
Not stored. `crsReporting` is in the type and data but never rendered.

## Business rules and constants (`page.tsx:19-52`)
| key | label | exposureScore | publicRegistry | crsReporting | uboConfidential |
|---|---|---|---|---|---|
| uae | UAE Free Zone | 20 | false | true | true |
| bvi | British Virgin Islands (BVI) | 15 | false | true | true |
| uk | United Kingdom (Companies House) | 95 | true | true | false |
| us | United States (Delaware / Wyoming) | 40 | false | false | true |
- Threshold for "Low" is `< 40` (`:128`, `:136`, `:138`). Therefore US (exactly 40) is rendered as "High Public Exposure" with a red warning icon, even though its card says `publicRegistry: NO (Confidential)` and `UBO Protection: Protected` - an internal contradiction.
- Recommendation texts are static strings (`:26`, `:34`, `:42`, `:50`). Scores are editorial constants with no source.

## Auth, permissions, security
Public, no server. No protected zone. React escapes all output. Content is legal/regulatory claims presented without a disclaimer or "as of" date (compliance/reputation risk).

## Failure modes and edge cases
- Unknown jurisdiction key silently shows UAE (`:54`) - unreachable via UI.
- Result is not cleared when inputs change after a run, so the card can show a result that does not match the current select until re-submit.
- Selecting any citizenship gives identical output (input ignored). A US citizen forming in the UK sees the same card as an Indian citizen.
- BVI card text says "Complete public anonymity" (`:34`), an absolute claim; BVI has beneficial-ownership regimes (BOSS) accessible to authorities - factual accuracy unverified by code; review with the compliance owner.

## Tests
None. Worth writing (export `checkExposure`, or move to `src/lib/ubo-privacy.ts`):
1. `checkExposure('uk')` -> `exposureScore 95, publicRegistry true, uboConfidential false`.
2. `checkExposure('bvi').exposureScore < 40`.
3. `checkExposure('zz')` -> equals the `uae` entry (fallback).
4. `checkExposure('us')` classification: expect "Low Exposure" once the threshold bug is fixed (currently "High").
5. UI: submit with default values -> card title "UAE Free Zone", badge "Low Exposure (Private)".
6. Changing citizenship must change nothing today (document), or change output after the feature is implemented.

## Known bugs and gaps
- US exposure 40 vs `< 40` threshold gives "High Public Exposure" next to "Confidential/Protected" tiles (`page.tsx:44-50`, `:128`, `:136`). Evidence-based contradiction.
- `citizenship` collected but unused (`:58`, `:64`); `crsReporting` never displayed.
- Only 4 jurisdictions; the platform supports 6 (uae, hong-kong, singapore, bahrain, ireland, bvi - `src/lib/jurisdictions.ts:1`) so HK/SG/Bahrain/Ireland cannot be assessed.
- Stale result after changing selects; no lead capture (`ubo_privacy` enum unused).

## Change guide
- Add a jurisdiction: add `<option>` (`:107-110`) and a `map` entry (`:19-52`); keep `exposureScore` semantics (lower = more private) and decide the `< 40` boundary deliberately.
- To use citizenship, extend `checkExposure(jurisdiction, citizenship)` and add reporting-regime notes (CRS/FATCA) per country code.
- Do not link legal claims without a source and date; get sign-off from Farooq (domain owner named in `scripts/seed.ts`).
- Update `docs/ai/modules/lead-gen-tools.md` if behavior changes.

## Related features
[reference-data-tax-rules-countries](reference-data-tax-rules-countries.md), [tool-name-checker](tool-name-checker.md), [lead-capture-and-persona](lead-capture-and-persona.md), [service-catalog-and-checkout](service-catalog-and-checkout.md)
