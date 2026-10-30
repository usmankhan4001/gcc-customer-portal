# Feature: Tax Savings Calculator

**Slug**: tool-tax-calculator   **Area**: [lead-gen-tools](../modules/lead-gen-tools.md)   **Status**: page/API plumbing fixed by spec 007 (see [007-tools-calculator-quiz-fix](007-tools-calculator-quiz-fix.md)); rates are unchanged placeholders and still need tax review   **Last verified against code**: 2026-10-30

## What it does
Public page where a prospect picks a home country, a target jurisdiction and an annual profit, and sees "Estimated Annual Tax Savings" = home tax minus target tax, plus both amounts. The page POSTs to `/api/calculator/evaluate` and renders the API's numbers via `mapCalculatorResponse`. If the call fails (non-2xx, throw) or the body has the wrong shape, it shows a `role="alert"` error message and no numbers; the page has no rate table of its own. Nothing is stored, no lead is captured, no PDF/email is wired. Rates are mock/placeholder.

## Entry points
- UI: `/tools/tax-calculator` (`src/app/tools/tax-calculator/page.tsx`, client component). Listed in `/tools` index (`tools/page.tsx:17`) and dashboard tile (`(authenticated)/dashboard/page.tsx:510`).
- API: `POST /api/calculator/evaluate`. `/api/*` and `/tools/*` bypass auth (`middleware.ts:5-6`; `/tools` is not in `PROTECTED_PREFIXES`, `:34-44`).

## Files
- `src/lib/tools/tax-calculator.ts` - shared module: `HOME_TAX_RATES`, `JURISDICTION_TAX_RATES`, page options `CALCULATOR_COUNTRIES` / `CALCULATOR_TARGETS`, `mapCalculatorResponse`.
- `src/lib/tools/tax-calculator.test.ts` - vitest for the above.
- `src/app/tools/tax-calculator/page.tsx` - form, submit handler, error state, result UI.
- `src/app/api/calculator/evaluate/route.ts` - imports the two rate tables from the shared module; holds the tier/package table (`TIER_RECOMMENDATIONS`) and the handler.
- `src/components/portal/BannerHeader` - page header (not analysed).

## Request / response contract
`POST /api/calculator/evaluate`, JSON. Contract unchanged by spec 007.
Request (what the page sends): `{country_residence: string, target_jurisdiction: string, annual_profit: number}`. Route type also declares `business_model: string` but it is destructured and never used or required.
Validation actually enforced: `!country_residence || !annual_profit || !target_jurisdiction` -> 400 `{error:"Missing required fields: country_residence, annual_profit, target_jurisdiction"}` (also triggers for `annual_profit: 0`). `annual_profit <= 0` -> 400 `{error:"annual_profit must be greater than zero"}`. No type check: a string profit like `"1000"` passes `<= 0` and `Math.round("1000" * rate)` coerces; `"abc"` yields `NaN` fields (JSON `null`).
- Country: `country_residence.toUpperCase()` looked up in `HOME_TAX_RATES`; miss -> 400 `{error:"Unsupported country code: XX"}`. Throws 500 if `country_residence` is not a string (e.g. number).
- Jurisdiction: exact-case lookup in `JURISDICTION_TAX_RATES`; miss -> 400 `{error:"Unsupported target jurisdiction: <value>"}`.
- 200 body: `{home_tax_rate, home_tax_amount, optimized_tax_rate, optimized_tax_amount, net_annual_savings, recommended_tier, recommended_package_usd}`. Amounts `Math.round(profit*rate)`; savings = home - optimized (no clamp, can be negative).
- Malformed JSON / any throw -> 500 `{error:"Internal server error"}`, logged only.
No cookies. No auth. No rate limit.

## Step-by-step flow
1. User edits selects/number input; defaults US, `uae`, 250000.
2. Submit -> `handleCalculate`. If profit empty/0/negative: silent return; button also disabled when `!annualProfit`.
3. State reset (`error`, `result` cleared), `loading` true, `fetch` POST.
4. `res.ok` and `mapCalculatorResponse(body)` non-null -> `setResult` with `{savings, currentTax, targetTax}` taken from `net_annual_savings`, `home_tax_amount`, `optimized_tax_amount`. A 0% target shows $0 target tax (no `||` default).
5. Anything else (non-2xx, network/parse throw, a body where any of the three fields is not a finite number) -> error message "We could not calculate your savings right now. Please try again." No numbers are invented client-side.
6. Render: savings card, two tax cards, CTA `Link href="/services"` ("View Packages"). `/services` is a protected prefix (`middleware.ts:36`), so an anonymous visitor is redirected to `/auth?redirect=/services`.

## Data
Reads/writes no tables. No lead, no `tool_input`/`tool_result` persistence (although `leads.source_tool` enum has `tax_calculator`, `schema.ts:310`).

## Business rules and constants
Option values the page sends (all accepted by the server tables; the test enforces this):
- Countries: `US, GB, DE, FR, CA, AU, IN`.
- Targets: `uae, hong_kong, singapore, bvi`. Ireland was removed as a target because the server has no rate for it; adding one is a rate change needing tax review. Option labels carry no rates.

Server tables (`src/lib/tools/tax-calculator.ts`), marginal-looking personal-style rates used as "home tax":
- Home: NL .495, DE .475, FR .45, GB .45, US .37, CA .33, AU .325, AE 0, SG .17, HK .165, IE .33, ES .47, IT .43, PT .48, SE .52, BE .5, JP .45, IN .3, BR .34, MX .35.
- Targets (snake_case): hong_kong .0825, singapore .17, uae 0, delaware_usa 0, uk_limited .19, estonia_e_residency 0, georgia .01, cyprus .125, malta .05, bvi 0, cayman 0, labuan .03.
- Tier/package USD (`route.ts`): hong_kong tier_2_nominee 3000; singapore tier_2_nominee 3500; uae tier_1_fdi 2500; delaware_usa tier_3_corporate 4000; uk_limited tier_2_nominee 3000; estonia tier_1_fdi 2000; georgia tier_1_fdi 2200; cyprus tier_2_nominee 3200; malta tier_3_corporate 4500; bvi tier_3_corporate 5000; cayman tier_3_corporate 5500; labuan tier_2_nominee 2800; default tier_1_fdi 2000.
Spec 007 changed no rate, only where the tables live (one shared module instead of two diverging copies).

## Auth, permissions, security
Public, unauthenticated, read-only computation; no secrets. No protected zone. Low risk; the only cost is unthrottled CPU.

## Failure modes and edge cases
- API non-2xx, network error, or unexpected body shape: error alert, no result card.
- Every page option combination (7 countries x 4 targets) now resolves on the server (test-enforced), so the 400 "Unsupported ..." paths are reachable only by calling the API directly.
- Negative savings possible only by calling the API directly (e.g. AE -> uk_limited -> -19% of profit); the mapper accepts negative finite numbers.
- Very large profit: no cap; `fmtUSD` handles it.

## Tests
`src/lib/tools/tax-calculator.test.ts` (vitest, pure logic): every page country/target code exists in the server tables; `mapCalculatorResponse` maps the real API field names, including the former $0 case (US -> uae 250000 gives 92,500 savings); a 0% target stays 0; missing/non-numeric/non-finite fields and non-object bodies -> `null`.
Not covered: component rendering, route handler calls. Worth adding if the route gains logic:
| Input | Expected |
|---|---|
| API `{country_residence:"US",target_jurisdiction:"uae",annual_profit:250000}` | 200, home_tax_amount 92500, optimized 0, net_annual_savings 92500, tier_1_fdi, 2500 |
| API `{country_residence:"gb",target_jurisdiction:"singapore",annual_profit:100000}` | 200, home 45000, optimized 17000, savings 28000, tier_2_nominee, 3500 (lowercase accepted) |
| API `{country_residence:"UK",...}` | 400 "Unsupported country code: UK" |
| API `annual_profit:0` / `-5` | 400 Missing required fields / "annual_profit must be greater than zero" |
| API body not JSON | 500 "Internal server error" |

## Known gaps
1. Both tables are still hard-coded; neither reads `jurisdiction_tax_rules` (seeded placeholder DB table, see [reference-data-tax-rules-countries](reference-data-tax-rules-countries.md)).
2. `business_model` declared on the request type, unused.
3. CTA targets a login-gated route from a public page.
4. No input type validation on the route (string/NaN profit, non-string country -> 500).
5. No lead capture, no rate limit.

### Needs tax review (not asserted as law)
- Server "home" rates look like top personal income-tax brackets (US .37, GB .45, DE .475, NL .495), not corporate tax. Pick one meaning and label it.
- UAE 0% depends on Qualifying Free Zone Person status, 9% otherwise (see [tool-qfzp-eligibility](tool-qfzp-eligibility.md)). Singapore .17 ignores partial exemptions/thresholds. Hong Kong 8.25%/16.5% two-tier is collapsed to 8.25%. No CFC/anti-avoidance, substance, or personal-tax modelling, so "savings" is an overstated headline.
- The page CTA copy "3-5 working days" does not match the quiz's UAE setup of 30 days (unsourced either way).

## Change guide
Rates and option lists live only in `src/lib/tools/tax-calculator.ts`; add a new page option there and the test will fail until the server table has the same key. If the response shape changes, update `mapCalculatorResponse` and its test together. Best next step: source rates from `jurisdiction_tax_rules`. If wiring lead capture, see [lead-capture-and-persona](lead-capture-and-persona.md) and [tool-result-pdf-and-email](tool-result-pdf-and-email.md).

## Related features
[tool-jurisdiction-quiz](tool-jurisdiction-quiz.md), [reference-data-tax-rules-countries](reference-data-tax-rules-countries.md), [tool-qfzp-eligibility](tool-qfzp-eligibility.md), [lead-capture-and-persona](lead-capture-and-persona.md), [tool-result-pdf-and-email](tool-result-pdf-and-email.md), [service-catalog-and-checkout](service-catalog-and-checkout.md)
