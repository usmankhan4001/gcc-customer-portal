# Feature: Mutual NDA Generator

**Slug**: tool-nda-generator   **Area**: [lead-gen-tools](../modules/lead-gen-tools.md)   **Status**: working (static template; no PDF, no storage)   **Last verified against code**: 2026-10-30

## What it does
A public, fully client-side page that fills a fixed 5-clause mutual NDA template with two party names and a chosen governing law, then shows it in a scrollable monospace box. The user can copy the text to the clipboard or print the page (`window.print()`). Nothing is sent to the server or stored, and no lead is created.

## Entry points
- UI: `/tools/generate-nda` (`src/app/tools/generate-nda/page.tsx`, client component, default export `GenerateNDAPage`).
- Linked from tools index (`src/app/tools/page.tsx:20`, title "Generate NDA"). Not on the dashboard quick tiles.
- API: none. `/tools/*` is public (not in `PROTECTED_PREFIXES`, `src/middleware.ts:34-44`).

## Files
- `src/app/tools/generate-nda/page.tsx:7-167` - the entire feature (state, form, template, copy, print).
- `src/app/tools/generate-nda/page.tsx:20-52` - `getNDAText()` template builder (closure over state; not exported).
- `src/lib/db/schema.ts:312` - `leads.source_tool` enum includes `nda_generator` (unused).

## Request / response contract
none.

## Step-by-step flow
1. State: `yourCompany`, `otherParty` (empty), `jurisdictionChoice` (default `"DIFC (Dubai International Financial Centre)"`), `generated`, `copied` (`:8-12`).
2. Inputs: `#yourCompany` (required), `#otherParty` (required), `#jurisdictionChoice` select with 6 options (`:107-119`). Submit button disabled unless both names non-empty (`:124`).
3. `handleGenerate` (`:14-18`): `preventDefault`, returns if either name empty, else `setGenerated(true)`.
4. While `generated` is true, the preview renders `getNDAText()` on every render (`:158`), so editing the inputs after generating live-updates the displayed NDA with no re-submit.
5. `getNDAText` (`:20`): `today = new Date().toLocaleDateString('en-GB', {day:'numeric', month:'long', year:'numeric'})` (e.g. "30 October 2026"), interpolated into the template with names and `jurisdictionChoice`.
6. Copy (`:54-58`): `navigator.clipboard.writeText(getNDAText())`, shows "Copied" for 2500 ms.
7. Print (`:148`): `window.print()` prints the whole page (no print stylesheet found in `src/app`; unverified for hidden chrome).

## Data
None stored. Not persisted to localStorage, DB or R2. No analytics event in the file.

## Business rules and constants
- Governing-law options (value = text injected into clause 5, label shown in UI) (`:113-118`):
  - `DIFC (Dubai International Financial Centre)` / "DIFC (English Common Law / Dubai)"
  - `ADGM (Abu Dhabi Global Market)` / "ADGM (English Common Law / Abu Dhabi)"
  - `United Arab Emirates (Mainland Law)` / "United Arab Emirates (Civil Code)"
  - `England & Wales`, `State of Delaware, USA`, `Singapore` / "Singapore Law"
- Template clauses (`:22-51`): 1 Purpose, 2 Confidential Information, 3 Obligations of Receiving Party (a-c), 4 Term & Survival ("two (2) years from the Effective Date", hard-coded), 5 Governing Law & Jurisdiction ("laws of ${jurisdictionChoice}" + exclusive jurisdiction of competent courts), signature block.
- Effective Date = today's date at render time, not user selectable.
- Fallbacks `'[YOUR COMPANY]'`/`'[OTHER PARTY]'` (`:26-27`, `:50`) are unreachable because generation requires both names.

## Auth, permissions, security
Public; no server interaction. Output is shown in `<pre>` via React text node (escaped). No AGENTS.md protected zone. Legal content risk: copy says "legally standard" (`:69`) but there is no disclaimer or advice to seek counsel on the page.

## Failure modes and edge cases
- `navigator.clipboard.writeText` is awaited without try/catch (`:55`): in insecure contexts or denied permission it rejects (unhandled promise) and "Copied" never shows.
- The Effective Date drifts if the page stays open past midnight (recomputed each render and on copy).
- Whitespace-only names pass the `!yourCompany` check (only empty string is blocked) and produce a blank party line.
- Very long names break the fixed-width signature alignment (cosmetic, monospace).
- Reset: there is no "start over"; to change documents the user edits inputs in place.

## Tests
None. Worth writing (extract `buildNdaText(yourCompany, otherParty, law, date)` to `src/lib/nda.ts`):
1. Names "Acme FZ-LLC" / "Beta Ltd", law "Singapore" -> text contains `PARTY A: Acme FZ-LLC`, `PARTY B: Beta Ltd`, `laws of Singapore`.
2. Fixed date 2026-10-30 -> contains `as of 30 October 2026`.
3. Default law -> clause 5 contains `laws of DIFC (Dubai International Financial Centre)`.
4. Submit with empty `otherParty` -> `generated` stays false, button disabled.
5. Edit `yourCompany` after generation -> preview text updates (documents current live-update behavior).
6. Clipboard rejection -> UI should not stay in a broken state (currently throws).

## Known bugs and gaps
- "Mutual" NDA is only mutual in wording; term is fixed at 2 years with no exclusions (e.g. public-domain carve-out), remedies, return/destruction of materials or signature date fields (`:29-51`). Not suitable as "legally standard" without lawyer review.
- Clause 5 grammar is awkward for some values: "laws of State of Delaware, USA", "laws of United Arab Emirates (Mainland Law)", "laws of England & Wales" (`:45`).
- No PDF/DOCX download although `@react-pdf/renderer` and `/api/pdf/generate` exist; print prints the whole page.
- No lead capture although enum `nda_generator` exists (`schema.ts:312`).
- Unhandled clipboard rejection (`:55`).

## Change guide
- Edit clause wording only inside `getNDAText` (`page.tsx:22-51`); keep user-controlled values through the template (never `dangerouslySetInnerHTML`).
- Add a governing law: add an `<option>` (`:113-118`); the `value` is spliced verbatim into clause 5.
- To add PDF: build rows/paragraph document in `src/lib/pdf.tsx` (current `ToolResultDocument` only supports label/value rows, see [tool-result-pdf-and-email](tool-result-pdf-and-email.md)); needs a `lead_id`.
- Move the template to `src/lib/nda.ts` + test before substantial edits.
- Update `docs/ai/modules/lead-gen-tools.md` if behavior changes.

## Related features
[tool-result-pdf-and-email](tool-result-pdf-and-email.md), [lead-capture-and-persona](lead-capture-and-persona.md), [tool-invoice-generator](tool-invoice-generator.md)
