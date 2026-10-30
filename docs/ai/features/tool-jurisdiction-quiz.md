# Feature: Jurisdiction Fit Quiz

**Slug**: tool-jurisdiction-quiz   **Area**: [lead-gen-tools](../modules/lead-gen-tools.md)   **Status**: broken (API results render with blank score/rationale/tax/speed; some answers never score)   **Last verified against code**: 2026-10-30

## What it does
Public 4-question form (goal, revenue band, timeline, relocation checkbox). The page POSTs to `/api/quiz/evaluate`, which scores six jurisdictions and returns the top 3. The page then renders cards expecting different field names, so a successful call shows the jurisdiction name but empty rationale, blank tax/timeline boxes and "%" without a number. The hard-coded fallback cards (UAE 98%, Hong Kong 88%) appear only when `fetch`/`res.json()` throws. Nothing is stored.

## Entry points
- UI: `/tools/jurisdiction-quiz` (`src/app/tools/jurisdiction-quiz/page.tsx`, client). Listed `tools/page.tsx:18`.
- API: `POST /api/quiz/evaluate`, public (`middleware.ts:5`).

## Files
- `page.tsx:8-26` option lists; `:28-36` `Recommendation` interface; `:38-44` state; `:46-82` submit + fallback; `:151-205` results UI.
- `src/app/api/quiz/evaluate/route.ts:3-18` types; `:20-30` attribute table; `:32-91` handler.

## Request / response contract
`POST /api/quiz/evaluate` JSON. Page sends `{goal, budget_band, timeline, wants_relocation}` (`page.tsx:53`).
- Validation: none. Body is cast, only `goal`, `timeline`, `wants_relocation` are read (`route.ts:35`); `budget_band` is ignored. Unknown/missing values just earn no bonus. Empty `{}` -> 200.
- 200: `{recommendations: [{jurisdiction, name, score, rationale}] }`, length 3, sorted by `score` desc (`:84-86`). `score` is an integer 50..100, not a percent field.
- Errors: invalid JSON or any throw -> 500 `{error:"Internal server error"}` (`:87-90`). The page does `data.recommendations ?? []` (`page.tsx:56`), so a 500 shows an empty list under "Matched" (no fallback, since `fetch` did not throw).
No cookies/auth/rate limit.

## Step-by-step flow
1. Defaults: goal `tax_optimization`, budget `under_50k`, timeline `asap`, relocation false (`page.tsx:39-42`).
2. Submit -> POST. `setRecommendations(data.recommendations ?? [])` regardless of HTTP status (`:55-56`).
3. Server: for each of 6 jurisdictions start `score=50` and apply the rules below, build `rationale` from fired reasons or default `"<taxRate> tax, ~<setupDays> day setup"` (`route.ts:37-82`). Sort desc (stable, so ties keep table order uae, hong-kong, singapore, bahrain, ireland, bvi), slice 3.
4. Render each card: `rec.name`, `{rec.matchScore}%`, `rec.whyFit`, `rec.corporateTaxRate`, `rec.timelineDays`, `rec.serviceHref || '/services'` (`page.tsx:175-197`). The API supplies none of `matchScore/whyFit/corporateTaxRate/timelineDays/serviceHref`.
5. First card gets "Best Fit #1" badge (`:170`); header badge "Matched" is unconditional.

## Data
None read or written (no lead, though `leads.source_tool` has `jurisdiction_quiz`, `schema.ts:313`).

## Business rules and constants
Attribute table (`route.ts:24-29`): uae "0-9%", 30d, medium, pathway yes; hong-kong "0% on foreign income", 18d, hard, no; singapore "5-17%", 18d, medium, yes; bahrain "0%", 30d, medium, yes; ireland "12.5%", 3d, easy, yes; bvi (name "BVI & Cayman") "0%", 45d, hard, no.
Scoring (all additive from 50):
- goal `tax_optimization` and `taxRate.startsWith('0')` -> +20 (`:43`). That is **uae, hong-kong, bahrain, bvi** (uae's "0-9%" starts with "0"; lead-gen-tools.md omits uae).
- goal `banking_access` and banking `easy` -> +20 (ireland only) (`:47`).
- goal `relocation` and pathway -> +20 (uae, singapore, bahrain, ireland) (`:51`).
- goal `privacy` and id in {bvi, uae} -> +15 (`:55`).
- `wants_relocation` and pathway -> +15 (`:60`); `!wants_relocation` and no pathway -> +5 (hong-kong, bvi) (`:64`).
- timeline `asap` and setupDays<=20 -> +15 (hong-kong, singapore, ireland) (`:68`); else timeline `no_rush` -> +2 all (`:71`). `few_months` earns nothing.
- Goal `exploring` is typed but has no rule. Max possible 100.

## Auth, permissions, security
Public, no secrets, no protected zone. Unthrottled.

## Failure modes and edge cases
Reported mismatch: CONFIRMED.
- Goal: page option `global_banking` (`page.tsx:10`) vs server `banking_access` (`route.ts:3,47`) -> the banking goal never scores (ireland never boosted). Page has no `exploring` option.
- Timeline: page `1_3_months`/`3_6_months` (`:24-25`) vs server `few_months`/`no_rush` -> only `asap` has an effect; `no_rush +2` unreachable from UI.
- Response fields: server `score/rationale` vs page `matchScore/whyFit/corporateTaxRate/timelineDays/serviceHref` -> `undefined%`-style blanks (React renders nothing for undefined, so literally "%").
- Fallback copy claims "3 - 5 days" UAE and "5 - 7 days" HK, while server data says 30 and 18 days; fallback tax text also conflicts with server (HK "8.25% - 16.5%" vs "0% on foreign income").
- Budget band collected but unused by both sides; the label even says "revenue / profit" while the type calls it budget.
- 500 response shows an empty "Matched" list.

## Tests
None. Suggested (call `POST` handler directly; scores computed from the rules above):
| Input | Expected top 3 (score) |
|---|---|
| `{goal:"tax_optimization",timeline:"asap",wants_relocation:false}` (page default) | hong-kong 90, bvi 75, uae 70 (bahrain 70 dropped by tie order) |
| `{goal:"banking_access",timeline:"asap",wants_relocation:false}` | ireland 85, hong-kong 70, singapore 65 |
| `{goal:"global_banking",timeline:"asap",wants_relocation:false}` (page value) | hong-kong 70, singapore 65, ireland 65 - documents bug (no banking boost) |
| `{goal:"relocation",timeline:"asap",wants_relocation:true}` | singapore 100, ireland 100, uae 85 |
| `{goal:"privacy",timeline:"no_rush",wants_relocation:false}` | bvi 72, uae 67, hong-kong 57 |
| `{goal:"exploring",timeline:"few_months",wants_relocation:false}` | hong-kong 55, bvi 55, uae 50 |
| `{}` | 200, same as row above |
| invalid JSON | 500 `{error:"Internal server error"}` |
| Page with API success after fix | each card shows numeric score, rationale, tax rate, speed |

## Known bugs and gaps
1. Field-name mismatch makes every successful result display blank (`page.tsx:178,183,188,192` vs `route.ts:75-80`).
2. Enum mismatch on goal and timeline values (above).
3. Page ignores `res.ok`; 500 -> empty list, no error state.
4. Fallback data contradicts the server data; "Matched" badge and "% Fit Score" imply precision that is just additive points.
5. `serviceHref` never supplied -> always `/services`, a login-gated route (`middleware.ts:36`).
6. Zero tests; `budget_band` dead input.
Needs tax review: the attribute table's `taxRate` strings (HK "0% on foreign income", Bahrain "0%", Singapore "5-17%", Ireland "12.5%", BVI "0%") and setup days (Ireland 3) are unsourced marketing numbers; the tax-optimization bonus keys off string prefix "0", so editing the text changes scoring.

## Change guide
Choose one contract: easiest is to have the route return `matchScore` (= score), `whyFit` (= rationale), `corporateTaxRate` (= taxRate), `timelineDays`, `serviceHref` and align enums (`banking_access`, `few_months`/`no_rush` or map in the route). Extract scoring to a pure function in `src/lib` + vitest. Keep jurisdiction ids in sync with `Jurisdiction` in `src/lib/persona.ts:5` and `src/lib/jurisdictions.ts`.

## Related features
[tool-tax-calculator](tool-tax-calculator.md), [lead-capture-and-persona](lead-capture-and-persona.md), [reference-data-tax-rules-countries](reference-data-tax-rules-countries.md), [service-catalog-and-checkout](service-catalog-and-checkout.md)
