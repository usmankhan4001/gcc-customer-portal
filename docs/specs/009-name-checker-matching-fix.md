# Spec: Fix company name checker matching (F1.4 part 2b)

**Status**: approved
**Requested by**: owner (docs/ai/features/tool-name-checker.md known bugs)
**Roadmap ref**: docs/versions/v2.1-engage-retain-core.md
**Protected files approved**: none
**Schema change**: no
**Depends on**: none
**Touches (for parallel planning)**: src/app/tools/name-checker/, src/lib/tools/name-checker.ts, src/lib/tools/name-checker.test.ts
**Approval**: owner asked for an end-to-end agent-ready setup including a parallel shakedown run (chat, 2026-10-30); no protected files.

## Problem
`src/app/tools/name-checker/page.tsx` flags restricted words with substring matching ("Embankment" is flagged because it contains "bank"), and one of its own suggested alternatives (`${name} Global FZCO`) contains the restricted word "global". Read `docs/ai/features/tool-name-checker.md` for details and file:line.

## Scope
- In: move the check into a pure function in `src/lib/tools/name-checker.ts` (page imports it); match restricted words as whole words (case-insensitive); make sure no suggested alternative contains a restricted word; table-driven tests.
- Out: changing the restricted word list, real registry lookups, new UI.

## Acceptance criteria
- [ ] AC1: Whole-word restricted terms are flagged ("Royal Trading", "Crypto Labs", "ACME Bank").
- [ ] AC2: Words that merely contain a restricted term are not flagged ("Embankment Ltd", "Investigate Co" must be decided by whole-word rule; "Invest" alone is flagged).
- [ ] AC3: Matching is case-insensitive and ignores punctuation around words ("bank," and "BANK" both match).
- [ ] AC4: For every input, none of the returned alternatives contains a restricted word as a whole word (test over several inputs including ones that trigger and do not trigger a flag).
- [ ] AC5: Empty or whitespace-only input does not throw and returns a sensible not-checkable result without alternatives.

## Test plan
Vitest unit tests beside the new module. `npm run verify` passes.
