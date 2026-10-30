# Spec: VAT scorer and visa estimator input handling (F1.4 part 2d)

**Status**: approved
**Requested by**: owner (known bugs in docs/ai/features/tool-vat-scorer.md and tool-visa-estimator.md)
**Roadmap ref**: docs/versions/v2.1-engage-retain-core.md (F1.4)
**Protected files approved**: none
**Schema change**: no
**Depends on**: none
**Touches (for parallel planning)**: src/app/tools/vat-scorer/, src/app/tools/visa-estimator/, src/lib/tools/vat-scorer.ts, src/lib/tools/visa-estimator.ts, src/lib/tools/vat-scorer.test.ts, src/lib/tools/visa-estimator.test.ts
**Approval**: owner asked for specs to make the repo ready for any agent (chat, 2026-10-30); no protected files, no schema.

## Problem
Read `docs/ai/features/tool-vat-scorer.md` and `docs/ai/features/tool-visa-estimator.md`. VAT: the initial `businessType` is not a valid option value and is never used; negative revenue is accepted; the result live-updates after submit. Visa: the 1 to 50 range is not enforced in code, `|| 1` hides invalid input as a valid count of 1, and the result live-updates.

## Scope
- In: move each calculation into a pure function in `src/lib/tools/`; validate inputs in code (reject negatives and out-of-range counts with a visible message); show results only for the submitted inputs; remove or use the unused `businessType`; tests.
- Out: changing any threshold, fee or tariff (needs a human tax/fee review; keep every number identical), lead capture.

## Acceptance criteria
- [ ] AC1: VAT: negative or non-numeric revenue is rejected with a message; valid values classify exactly as before at every threshold boundary (one below, at, one above).
- [ ] AC2: Visa: counts outside 1 to 50 and non-integers are rejected with a message; valid counts give exactly the same totals as before.
- [ ] AC3: Both pages show a result only for the inputs that were submitted; editing an input hides the stale result until resubmitted.
- [ ] AC4: No fee, threshold or label text changes (a test pins the current numbers).
- [ ] AC5: At least 6 table-driven cases per module.

## Test plan
Vitest unit tests; `npm run verify` passes.
