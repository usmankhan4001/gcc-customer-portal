# Spec: QFZP eligibility and banking odds dead inputs (F1.4 part 2e)

**Status**: approved
**Requested by**: owner (known bugs in docs/ai/features/tool-qfzp-eligibility.md and tool-banking-odds.md)
**Roadmap ref**: docs/versions/v2.1-engage-retain-core.md (F1.4)
**Protected files approved**: none
**Schema change**: no
**Depends on**: none
**Touches (for parallel planning)**: src/app/tools/qfzp-eligibility/, src/app/tools/banking-odds/, src/lib/tools/qfzp-eligibility.ts, src/lib/tools/banking-odds.ts, src/lib/tools/qfzp-eligibility.test.ts, src/lib/tools/banking-odds.test.ts
**Approval**: owner asked for specs to make the repo ready for any agent (chat, 2026-10-30); no protected files, no schema.

## Problem
Read `docs/ai/features/tool-qfzp-eligibility.md` and `docs/ai/features/tool-banking-odds.md`. QFZP: the `visas` and `isForeignClients` inputs are set but never used, the result live-updates after submit, and one option's value does not match its label. Banking odds: `nationality` is required but unused (it blocks submission for nothing) and results are not cleared when inputs change.

## Scope
- In: move each computation into a pure function in `src/lib/tools/`; remove inputs that do not affect the result (or wire them in only if the feature doc shows an intended rule, and document it); fix the option value/label mismatch; show a result only for submitted inputs; tests.
- Out: changing eligibility rules, odds or bank data (needs human review; keep outputs identical for the same effective inputs), lead capture.

## Acceptance criteria
- [ ] AC1: No form field remains that is required but ignored by the computation.
- [ ] AC2: For every combination of the remaining inputs, outputs are identical to the current behavior (test enumerates the full input space of each tool).
- [ ] AC3: The QFZP option value matches its label meaning, and the mapping is covered by a test.
- [ ] AC4: Both pages hide a stale result when an input changes.
- [ ] AC5: At least 6 table-driven cases per module.

## Test plan
Vitest unit tests; `npm run verify` passes.
