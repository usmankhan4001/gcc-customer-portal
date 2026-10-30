# Spec: Fix tax calculator and jurisdiction quiz plumbing (F1.4, part 1)

**Status**: shipped
**Requested by**: owner (v2.1 F1.4; docs/ai/MODULES.md open issues)
**Roadmap ref**: docs/versions/v2.1-engage-retain-core.md
**Protected files approved**: none
**Schema change**: no
**Depends on**: none
**Touches (for parallel planning)**: src/app/tools/tax-calculator/, src/app/tools/jurisdiction-quiz/, src/app/api/calculator/, src/app/api/quiz/, src/lib/tools/
**Approval**: owner approved running the pipeline on this spec (no protected files) in chat on 2026-10-30.

## Problem
Read `docs/ai/features/tool-tax-calculator.md` and `docs/ai/features/tool-jurisdiction-quiz.md` first; they list the evidence with file:line.
1. Tax calculator: the page reads `savings`, `current_tax`, `target_tax` but `/api/calculator/evaluate` returns `net_annual_savings`, `home_tax_amount`, `optimized_tax_amount`, so a successful call shows $0. Country and target values sent by the page (`UK`, `hong-kong`, `ireland`) do not all exist on the server (`GB`, `hong_kong`, no ireland), so 17 of 35 combinations get a 400 and silently use the page's own fallback rates. The page fallback also turns BVI's 0% into 5% (`0.0 || 0.05`).
2. Quiz: the page renders `matchScore`, `whyFit`, `corporateTaxRate`, `timelineDays` but `/api/quiz/evaluate` returns `score` and `rationale`; goal `global_banking` and timelines `1_3_months`, `3_6_months` are not values the server scores, so banking never scores.

## Scope
- In: make page and API agree on field names and option values for both tools; fix the `0 || 0.05` bug; show the real API result; keep an explicit, visible message if the API call fails instead of silently inventing numbers.
- Out: changing any tax rate, threshold or scoring weight (needs a human tax review; list suspicious numbers in the feature doc instead); lead capture wiring; new tools.

## Acceptance criteria
- [ ] AC1: For every country/target option offered by the calculator page, the value sent is accepted by the server (test iterates all page options against the server's supported keys).
- [ ] AC2: A successful calculator response is displayed with its real numbers (a pure mapping function in `src/lib/tools/` is unit-tested, including a case that previously produced $0).
- [ ] AC3: A 0% rate stays 0% (no `||` fallback turning it into 5%).
- [ ] AC4: Every goal and timeline option offered by the quiz page is a value the server understands; the quiz result renders `score` and `rationale` from the real response shape (pure mapping function, unit-tested).
- [ ] AC5: If either API call fails, the page shows a clear error state and does not display made-up numbers.

## Test plan
Vitest unit tests next to the new `src/lib/tools/*.ts` mapping/option modules, importing the server's supported keys from a shared module so page and API cannot drift. `npm run verify` passes.

## Rollout and risk
User-visible numbers change from $0/blank to the API's numbers; the API's rates still need a tax review before this tool is promoted (see the feature docs).
