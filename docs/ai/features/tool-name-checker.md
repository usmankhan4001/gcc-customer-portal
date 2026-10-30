# Feature: Company Name Availability Checker

**Slug**: tool-name-checker   **Area**: [lead-gen-tools](../modules/lead-gen-tools.md)   **Status**: partial (works, but is a keyword filter, not a registry check)   **Last verified against code**: 2026-10-30

## What it does
A public page where a prospect types a desired company name and gets an instant "Likely Available" or "Requires Approval / Restricted Words Found" verdict plus three suggested alternative names. The verdict is produced only by a hard-coded list of 8 restricted words checked as substrings. There is no registry, trademark or database lookup, nothing is sent to the server, and no lead is captured. It ends with a link to `/services` ("Reserve with Company Formation").

## Entry points
- UI: `/tools/name-checker` (`src/app/tools/name-checker/page.tsx`, client component).
- Linked from: tools index grid (`src/app/tools/page.tsx:25`) and dashboard Quick Services tile "Name Checker" (`src/app/(authenticated)/dashboard/page.tsx:511`).
- API: none. `/tools/*` is not in `PROTECTED_PREFIXES` (`src/middleware.ts:34-44`), so it is public.

> **Updated by spec 009** (see [009-name-checker-matching-fix](009-name-checker-matching-fix.md)): the check now lives in `src/lib/tools/name-checker.ts` with whole-word, case-insensitive, punctuation-tolerant matching and tests in `name-checker.test.ts`. The available-case alternatives are now `FZ-LLC` / `Holdings` / `Limited` (no "Global FZCO"). The substring false-positive, "Global FZCO" and double-space bugs listed below are fixed; line numbers below refer to the old inline version in `page.tsx`.

## Files
- `src/lib/tools/name-checker.ts` - `checkAvailability(name)` pure function (replaces the inline version formerly at `page.tsx:15-43`).
- `src/app/tools/name-checker/page.tsx:45-136` - `NameChecker` component: input, button, result card.
- `src/components/portal/BannerHeader` - page header (title "Company Name Availability Checker").
- `src/lib/db/schema.ts:318` - `leads.source_tool` enum already contains `name_checker` (unused by this page).

## Request / response contract
none (no network call).

## Step-by-step flow
1. User types in `#companyName` (`page.tsx:66-74`). Enter key calls `handleCheck` (`:71`); button is disabled when `name.trim()` is empty (`:77`).
2. `handleCheck` (`:49-52`) returns early on empty/whitespace, otherwise `setResult(checkAvailability(name))`.
3. `checkAvailability` (`:15`): `lower = name.toLowerCase().trim()`; `hit = restrictedWords.find(w => lower.includes(w))` (first match in list order, substring match, not word match).
4. If `hit`: returns `isAvailable:false, score:35`, reason text naming the hit word, alternatives = `<name with hit removed (regex, case-insensitive, all occurrences), trimmed> + " Holdings" | " Commercial Services" | " Tech Solutions"` (`:21-30`).
5. Else: `isAvailable:true, score:92`, generic "meets standard guidelines" reason, alternatives `<name> FZ-LLC`, `<name> Global FZCO`, `<name> Limited` (`:33-42`).
6. Render (`:85-132`): green card + CheckCircle if available, amber card + XCircle if not; alternatives as chips; CTA link to `/services`.

## Data
Reads/writes nothing. Not stored anywhere (no localStorage either). `score` is computed but never rendered.

## Business rules and constants
- Restricted words (`page.tsx:16`): `bank, insurance, government, emirates, royal, invest, crypto, global`. Order matters: only the first matching word is reported.
- Scores: 35 if restricted, 92 otherwise (`:23`, `:35`) - constants, not computed.
- Alternative suffixes: restricted -> Holdings / Commercial Services / Tech Solutions; available -> FZ-LLC / Global FZCO / Limited.
- Reason copy claims "does not conflict with major registered trademarks" (`:36`) - no such check exists.

## Auth, permissions, security
Public, no auth, no server interaction. No AGENTS.md protected zone touched. User input is rendered through React text nodes (auto-escaped), and used in `new RegExp(hit, 'gi')` where `hit` is one of the 8 constant words, so there is no regex-injection risk.

## Failure modes and edge cases
- Empty or whitespace input: ignored silently (button disabled).
- Substring false positives: "Embankment Ltd" (bank), "Investigations Co" (invest), "Royalty Foods" (royal), "Globalytics" (global) are all flagged restricted.
- Name equal to the hit word (e.g. "Bank"): alternatives become " Holdings" trimmed -> "Holdings", "Commercial Services", "Tech Solutions" (generic, no brand).
- Hit removal leaves double spaces/punctuation inside the name (e.g. "Alpha Global Tech" -> "Alpha  Tech Holdings").
- Mixed-case input is handled for detection; `name` is displayed as typed.
- Nothing is rate limited or persisted; there is no loading or error state because there is no I/O.

## Tests
None. Worth writing (export `checkAvailability` or move to `src/lib/name-check.ts` first):
1. `"Apex Frontier Solutions"` -> `isAvailable:true, score:92`, alternatives `["Apex Frontier Solutions FZ-LLC", "... Global FZCO", "... Limited"]`.
2. `"Gulf Crypto Labs"` -> `isAvailable:false, score:35`, reason contains `"crypto"`, alternatives start `"Gulf  Labs Holdings"`.
3. `"BANK of Dreams"` -> restricted (case-insensitive), `hit === "bank"`.
4. `"Embankment Ltd"` -> currently restricted (documents the substring false positive; flip when fixed to word-boundary).
5. `"   "` -> button disabled, `result` stays null.
6. Available-case alternatives must not themselves contain a restricted word (currently fails: "Global FZCO").

## Known bugs and gaps
- The tool's own suggested alternative `"<name> Global FZCO"` (`page.tsx:39`) contains the restricted word "global" (`:16`), so it would itself be flagged if re-entered. Impact: contradictory advice.
- Substring matching causes false positives (`:18`); should use word boundaries.
- "Likely Available" is not an availability check: no registry, no trademark data (copy at `:36` and header text at `:61-62` overstate this). Legal/reputational risk for a regulated-services brand.
- `score` unused in UI (`:23`, `:35`); dead data.
- No lead capture although `leads.source_tool` has `name_checker` (`schema.ts:318`); the CTA goes to `/services` with no name carried over.
- Restricted list is partial and UAE-only in tone while the text says "UAE & GCC registries".

## Change guide
- Add/remove restricted words: edit `restrictedWords` (`page.tsx:16`) only. Prefer moving the list and function to `src/lib/name-check.ts` with a `.test.ts` (project rule: logic in `src/lib`).
- To capture leads: POST `/api/leads/capture` with `source_tool: 'name_checker'` and keep `lead.id`; see [lead-capture-and-persona](lead-capture-and-persona.md).
- To make it a real check, add a server route and a registry data source; update copy at `:36`, `:61-62`.
- Update `docs/ai/modules/lead-gen-tools.md` tool table if behavior changes.

## Related features
[lead-capture-and-persona](lead-capture-and-persona.md), [tool-ubo-privacy](tool-ubo-privacy.md), [service-catalog-and-checkout](service-catalog-and-checkout.md)
