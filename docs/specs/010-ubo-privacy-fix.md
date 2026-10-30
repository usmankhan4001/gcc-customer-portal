# Spec: UBO privacy checker correctness (F1.4 part 2c)

**Status**: approved
**Requested by**: owner (known bugs in docs/ai/features/tool-ubo-privacy.md)
**Roadmap ref**: docs/versions/v2.1-engage-retain-core.md (F1.4)
**Protected files approved**: none
**Schema change**: no
**Depends on**: none
**Touches (for parallel planning)**: src/app/tools/ubo-privacy/, src/lib/tools/ubo-privacy.ts, src/lib/tools/ubo-privacy.test.ts
**Approval**: owner asked for specs to make the repo ready for any agent (chat, 2026-10-30); no protected files, no schema.

## Problem
Read `docs/ai/features/tool-ubo-privacy.md` (bugs with file:line). A US score of 40 fails the `< 40` check, so the page shows "High Public Exposure" next to "Confidential/Protected" tiles. `citizenship` is collected but never used. Results go stale when inputs change.

## Scope
- In: move scoring/classification into a pure function in `src/lib/tools/ubo-privacy.ts`; make the exposure label consistent with the tiles at every score boundary; either use `citizenship` in the result or remove the input; clear the result when an input changes; table-driven tests.
- Out: adding jurisdictions, changing registry facts or scores, lead capture.

## Acceptance criteria
- [ ] AC1: For every jurisdiction option and every boundary score (one below, at and one above each threshold), the exposure label and the tile texts never contradict each other (test iterates all jurisdictions).
- [ ] AC2: The US case (score 40) is classified consistently with its tiles.
- [ ] AC3: `citizenship` either changes the output (documented in the feature doc) or is gone from the form.
- [ ] AC4: Changing any input clears a previously shown result.
- [ ] AC5: At least 8 table-driven test cases beside the new module.

## Test plan
Vitest unit tests; `npm run verify` passes.
