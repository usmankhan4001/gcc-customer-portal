# Feature: Tax Savings Calculator

**Slug**: tool-tax-calculator   **Area**: [lead-gen-tools](../modules/lead-gen-tools.md)   **Status**: broken (API path renders $0 for 18 of 35 option combinations)   **Last verified against code**: 2026-10-30

## What it does
Public page where a prospect picks a home country, a target jurisdiction and an annual profit, and sees "Estimated Annual Tax Savings" = home tax minus target tax, plus both amounts. The page first POSTs to `/api/calculator/evaluate`; if that returns non-2xx or throws, it computes locally with its own (different) rate table. Nothing is stored, no lead is captured, no PDF/email is wired. Rates on both sides are mock/placeholder.

## Entry points
- UI: `/tools/tax-calculator` (`src/app/tools/tax-calculator/page.tsx`, client component). Listed in `/tools` index (`tools/page.tsx:17`) and dashboard tile (`(authenticated)/dashboard/page.tsx:510`).
- API: `POST /api/calculator/evaluate`. `/api/*` and `/tools/*` bypass auth (`middleware.ts:5-6`; `/tools` is not in `PROTECTED_PREFIXES`, `:34-44`).

## Files
- `src/app/tools/tax-calculator/page.tsx:8-24` - option tables with page rates; `:33-80` submit handler + local fallback; `:82-83` USD formatter; `:145-179` result UI.
- `src/app/api/calculator/evaluate/route.ts:28-49` home rates; `:51-64` jurisdiction rates; `:66-79` tier/package table; `:85-151` handler.
- `src/components/portal/BannerHeader` - page header (not analysed).

## Request / response contract
`POST /api/calculator/evaluate`, JSON.
Request (what the page sends, `page.tsx:42-46`): `{country_residence: string, target_jurisdiction: string, annual_profit: number}`. Route type also declares `business_model: string` (`route.ts:10`) but it is destructured (`:89`) and never used or required.
Validation actually enforced: `!country_residence || !annual_profit || !target_jurisdiction` -> 400 `{error:"Missing required fields: country_residence, annual_profit, target_jurisdiction"}` (`:91-96`; also triggers for `annual_profit: 0`). `annual_profit <= 0` -> 400 `{error:"annual_profit must be greater than zero"}` (`:98-103`). No type check: a string profit like `"1000"` passes `<= 0` and `Math.round("1000" * rate)` coerces; `"abc"` yields `NaN` fields (JSON `null`).
- Country: `country_residence.toUpperCase()` looked up in `HOME_TAX_RATES`; miss -> 400 `{error:"Unsupported country code: XX"}` (`:105-114`). Throws 500 if `country_residence` is not a string (e.g. number).
- Jurisdiction: exact-case lookup in `JURISDICTION_TAX_RATES`; miss -> 400 `{error:"Unsupported target jurisdiction: <value>"}` (`:116-122`).
- 200 body (`:133-141`): `{home_tax_rate, home_tax_amount, optimized_tax_rate, optimized_tax_amount, net_annual_savings, recommended_tier, recommended_package_usd}`. Amounts `Math.round(profit*rate)`; savings = home - optimized (no clamp, can be negative).
- Malformed JSON / any throw -> 500 `{error:"Internal server error"}` (`:144-150`), logged only.
No cookies. No auth. No rate limit.

## Step-by-step flow
1. User edits selects/number input; defaults US, `uae`, 250000 (`page.tsx:27-29`).
2. Submit -> `handleCalculate` (`:33`). If profit empty/0/negative: silent return (`:35`), button also disabled when `!annualProfit` (`:137`).
3. `fetch` POST (`:39-47`); `setLoading(true)`.
4. `res.ok` (`:49`): `setResult(data)` with the API body as-is. Page then reads `result.savings`, `result.current_tax`, `result.target_tax` (`:151,158,162`) - names the API does NOT return.
5. Non-ok (`:51-63`): local calc `homeRate = baseRate || 0.25`, `targetRate = targetRate || 0.05`, `current_tax = profit*homeRate`, `target_tax = profit*targetRate`, `savings = difference`, `effective_tax_rate` string (never rendered).
6. Network/parse error (`:65-76`): identical local calc (duplicated code).
7. Render: savings card, two tax cards, CTA `Link href="/services"` ("View Packages"). `/services` is a protected prefix (`middleware.ts:36`), so an anonymous visitor is redirected to `/auth?redirect=/services`.

## Data
Reads/writes no tables. No lead, no `tool_input`/`tool_result` persistence (although `leads.source_tool` enum has `tax_calculator`, `schema.ts:310`).

## Business rules and constants
Server (`route.ts`), marginal-looking personal-style rates used as "home tax":
- Home: NL .495, DE .475, FR .45, GB .45, US .37, CA .33, AU .325, AE 0, SG .17, HK .165, IE .33, ES .47, IT .43, PT .48, SE .52, BE .5, JP .45, IN .3, BR .34, MX .35 (`:28-49`).
- Targets (snake_case): hong_kong .0825, singapore .17, uae 0, delaware_usa 0, uk_limited .19, estonia_e_residency 0, georgia .01, cyprus .125, malta .05, bvi 0, cayman 0, labuan .03 (`:51-64`).
- Tier/package USD (`:66-79`): hong_kong tier_2_nominee 3000; singapore tier_2_nominee 3500; uae tier_1_fdi 2500; delaware_usa tier_3_corporate 4000; uk_limited tier_2_nominee 3000; estonia tier_1_fdi 2000; georgia tier_1_fdi 2200; cyprus tier_2_nominee 3200; malta tier_3_corporate 4500; bvi tier_3_corporate 5000; cayman tier_3_corporate 5500; labuan tier_2_nominee 2800; default tier_1_fdi 2000.
Page fallback (`page.tsx:8-24`): US .27, UK .25, DE .30, FR .25, CA .26, AU .30, IN .25; targets uae .045 (midpoint of 0-9%), hong-kong .0825, singapore .085, ireland .125, bvi 0.0.

## Auth, permissions, security
Public, unauthenticated, read-only computation; no secrets. No protected zone. Low risk; the only cost is unthrottled CPU.

## Failure modes and edge cases
- Reported page/API mismatch: CONFIRMED (three independent defects, see below).
- Which of the 35 combos (7 countries x 5 targets) hit which path: API succeeds for the 6 countries {US,DE,FR,CA,AU,IN} x 3 targets {uae,singapore,bvi} = 18 combos, all of which render **$0** savings/$0/$0. API 400 for `UK` (server key is `GB`) and for `hong-kong` (server `hong_kong`) and `ireland` (absent) = 17 combos, which use the fallback and look correct.
- `bvi` fallback bug: `0.0 || 0.05` is `0.05` (`page.tsx:54,67`), so e.g. UK->bvi charges 5% on the "0%" jurisdiction.
- Server and page tables disagree even when both work (US .37 vs .27; SG .17 vs .085); which one a user sees depends on the combo.
- Negative savings possible only by calling the API directly (e.g. AE -> uk_limited -> -19% of profit).
- Very large profit: no cap; `fmtUSD` handles it.

## Tests
None (`tests/` has only auth-routes and fde tests). Worth writing (route handler called directly; page via component test):
| Input | Expected |
|---|---|
| API `{country_residence:"US",target_jurisdiction:"uae",annual_profit:250000}` | 200, home_tax_amount 92500, optimized 0, net_annual_savings 92500, tier_1_fdi, 2500 |
| API `{country_residence:"gb",target_jurisdiction:"singapore",annual_profit:100000}` | 200, home 45000, optimized 17000, savings 28000, tier_2_nominee, 3500 (lowercase accepted) |
| API `{country_residence:"UK",...}` | 400 "Unsupported country code: UK" |
| API `{... target_jurisdiction:"hong-kong"}` | 400 "Unsupported target jurisdiction: hong-kong" |
| API `annual_profit:0` / `-5` | 400 Missing required fields / "annual_profit must be greater than zero" |
| API body not JSON | 500 "Internal server error" |
| Page US->uae 250000 after fix | shows $92,500 savings (today: $0) |
| Page UK->bvi 100000 after fix | savings = full home tax, target tax $0 (today fallback gives 5% = $5,000 target tax) |

## Known bugs and gaps
1. Response-field mismatch: API returns `net_annual_savings/home_tax_amount/optimized_tax_amount` (`route.ts:134-140`); page reads `savings/current_tax/target_tax` (`page.tsx:151,158,162`) -> `?? 0` -> "$0" for 18/35 combos. Highest impact.
2. Key mismatch: page `UK` vs server `GB` (`page.tsx:10` vs `route.ts:32`); page `hong-kong` vs server `hong_kong` (`page.tsx:20` vs `route.ts:52`); page `ireland` has no server entry. Always falls back (silently masks the error; `res.json()` of the 400 is discarded).
3. `0 ||` default clobbers BVI 0% (`page.tsx:54,67`).
4. Two diverging hard-coded tables, neither read from `jurisdiction_tax_rules` (seeded placeholder DB table, see [reference-data-tax-rules-countries](reference-data-tax-rules-countries.md)).
5. `business_model` declared, unused. Fallback block duplicated in `try` and `catch`.
6. CTA targets a login-gated route from a public page.

### Needs tax review (not asserted as law)
- Server "home" rates look like top personal income-tax brackets (US .37, GB .45, DE .475, NL .495), not corporate tax; page uses corporate-style numbers (US .27 "avg", UK .25). Pick one meaning and label it.
- UAE page rate .045 is a made-up midpoint; 0% depends on Qualifying Free Zone Person status, 9% otherwise (see [tool-qfzp-eligibility](tool-qfzp-eligibility.md)). Singapore .085 (half of 17%) and Ireland 12.5% ignore thresholds/large-group rules. Hong Kong 8.25%/16.5% two-tier is collapsed to 8.25%. No CFC/anti-avoidance, substance, or personal-tax modelling, so "savings" is an overstated headline.

## Change guide
Fix first: make the page read the API's field names (or change the API to return `savings/current_tax/target_tax`), unify keys (`GB`, `hong_kong`; add `ireland` or drop it), replace `||` with `??`. Best: extract a pure `computeTaxSavings()` in `src/lib`, used by both, with vitest tests, sourcing rates from one table (ideally `jurisdiction_tax_rules`). Update lead-gen-tools.md "Known gaps" afterwards. If wiring lead capture, see [lead-capture-and-persona](lead-capture-and-persona.md) and [tool-result-pdf-and-email](tool-result-pdf-and-email.md).

## Related features
[tool-jurisdiction-quiz](tool-jurisdiction-quiz.md), [reference-data-tax-rules-countries](reference-data-tax-rules-countries.md), [tool-qfzp-eligibility](tool-qfzp-eligibility.md), [lead-capture-and-persona](lead-capture-and-persona.md), [tool-result-pdf-and-email](tool-result-pdf-and-email.md), [service-catalog-and-checkout](service-catalog-and-checkout.md)
