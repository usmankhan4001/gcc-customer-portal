# Feature: Tax calculator and jurisdiction quiz plumbing fix

**Slug**: 007-tools-calculator-quiz-fix   **Spec**: docs/specs/007-tools-calculator-quiz-fix.md   **Last verified against code**: 2026-10-30

## What it does (3 sentences max)
Page and API of the tax calculator and the jurisdiction quiz now share one module for option values and response mapping. Successful API results are shown with their real numbers. A failed call shows an error message; the pages no longer invent fallback numbers.

## Where it lives
- Pages / routes: `src/app/tools/tax-calculator/page.tsx`, `src/app/tools/jurisdiction-quiz/page.tsx`
- API routes (methods, auth required): `POST /api/calculator/evaluate`, `POST /api/quiz/evaluate` (public, unchanged contract)
- Components: none new
- lib modules: `src/lib/tools/tax-calculator.ts` (rate tables, page options, `mapCalculatorResponse`), `src/lib/tools/jurisdiction-quiz.ts` (attribute table, goal/timeline values and page options, `mapQuizResponse`)
- DB tables / columns: none
- Env vars / external services: none

## Behavior and rules
- Calculator options sent: countries `US, GB, DE, FR, CA, AU, IN`; targets `uae, hong_kong, singapore, bvi`. Ireland was removed as a target because the server has no rate for it (adding one would be a rate change needing tax review). Option labels no longer carry made-up rates.
- Calculator page reads `net_annual_savings`, `home_tax_amount`, `optimized_tax_amount`. A 0% target stays $0 (the `||` fallback is gone).
- Quiz goals sent: `tax_optimization, banking_access, relocation, privacy`; timelines `asap, few_months, no_rush`. The page cards show `score` as the fit score and `rationale` as the reason; tax rate and speed come from the shared attribute table by jurisdiction id.
- No rate, threshold or scoring weight was changed.

## Data flow
1. User submits the form; page POSTs to the API.
2. `res.ok` and a valid body -> mapping function -> render. Anything else (non-2xx, throw, wrong shape, empty list) -> `role="alert"` error message and no result.

## Tests
`src/lib/tools/tax-calculator.test.ts` (all page options accepted by server tables, mapping incl. the former $0 case, 0% stays 0, bad shapes -> null) and `src/lib/tools/jurisdiction-quiz.test.ts` (page goal/timeline values understood by server, mapping, bad shapes -> null). Not covered: component rendering, route handlers.

## Protected-zone touchpoints
None.

## Known gaps / extension points
Needs tax review (not changed): calculator "home" rates look like top personal income-tax brackets (US .37, GB .45, DE .475), not corporate tax; UAE 0% depends on Qualifying Free Zone status; Hong Kong two-tier 8.25%/16.5% collapsed to 8.25%; quiz `taxRate` strings and setup days (Ireland 3, UAE 30 vs the "3-5 days" CTA copy on the calculator page) are unsourced, and the tax-optimization bonus keys off the string prefix "0". Quiz `budget_band` is still unused by the server. CTA links to `/services`, which is login-gated. Lead capture is not wired. Deep docs: [tool-tax-calculator](tool-tax-calculator.md), [tool-jurisdiction-quiz](tool-jurisdiction-quiz.md).
