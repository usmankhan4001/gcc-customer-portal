# Feature: Jurisdiction Fit Quiz

**Slug**: tool-jurisdiction-quiz   **Area**: [lead-gen-tools](../modules/lead-gen-tools.md)   **Status**: page/API plumbing fixed by spec 007 (see [007-tools-calculator-quiz-fix](007-tools-calculator-quiz-fix.md)); attribute table and scoring weights are unchanged and still need tax review   **Last verified against code**: 2026-10-30

## What it does
Public 4-question form (goal, revenue band, timeline, relocation checkbox). The page POSTs to `/api/quiz/evaluate`, which scores six jurisdictions and returns the top 3. The page maps the response with `mapQuizResponse`: `score` becomes the card's fit score, `rationale` the reason text, and tax rate and formation speed come from the shared attribute table by jurisdiction id. If the call fails, the body has the wrong shape, or the list is empty, the page shows a `role="alert"` error message instead of cards; there are no hard-coded fallback cards. Nothing is stored.

## Entry points
- UI: `/tools/jurisdiction-quiz` (`src/app/tools/jurisdiction-quiz/page.tsx`, client). Listed `tools/page.tsx:18`.
- API: `POST /api/quiz/evaluate`, public (`middleware.ts:5`).

## Files
- `src/lib/tools/jurisdiction-quiz.ts` - shared module: `Goal`/`Timeline`/`JurisdictionId` types, `JURISDICTION_ATTRIBUTES`, `QUIZ_GOALS`/`QUIZ_TIMELINES` (values the server scores), page options `QUIZ_GOAL_OPTIONS`/`QUIZ_TIMELINE_OPTIONS`, `mapQuizResponse`.
- `src/lib/tools/jurisdiction-quiz.test.ts` - vitest for the above.
- `src/app/tools/jurisdiction-quiz/page.tsx` - form (budget options stay local to the page), submit handler, error state, result cards.
- `src/app/api/quiz/evaluate/route.ts` - imports the attribute table from the shared module; holds the scoring and the handler.

## Request / response contract
`POST /api/quiz/evaluate` JSON. Contract unchanged by spec 007. Page sends `{goal, budget_band, timeline, wants_relocation}`.
- Validation: none. Body is cast, only `goal`, `timeline`, `wants_relocation` are read; `budget_band` is ignored. Unknown/missing values just earn no bonus. Empty `{}` -> 200.
- 200: `{recommendations: [{jurisdiction, name, score, rationale}] }`, length 3, sorted by `score` desc. `score` is an integer 50..100 (additive points, not a calibrated percentage).
- Errors: invalid JSON or any throw -> 500 `{error:"Internal server error"}`. The page treats any non-2xx as failure and shows the error message.
No cookies/auth/rate limit.

## Step-by-step flow
1. Defaults: goal `tax_optimization` (first option), budget `under_50k`, timeline `asap` (first option), relocation false.
2. Submit -> state reset (`error`, `recommendations` cleared), POST.
3. Server: for each of 6 jurisdictions start `score=50` and apply the rules below, build `rationale` from fired reasons or default `"<taxRate> tax, ~<setupDays> day setup"`. Sort desc (stable, so ties keep table order uae, hong-kong, singapore, bahrain, ireland, bvi), slice 3.
4. `res.ok` and `mapQuizResponse(body)` non-null -> cards. The mapper returns `null` if `recommendations` is not an array, any item has an unknown `jurisdiction`, a non-number `score` or non-string `rationale`, or the list is empty. Otherwise per card: `name` (server name, else table name), `matchScore` = `score`, `whyFit` = `rationale`, `corporateTaxRate` = table `taxRate`, `timelineDays` = `~<setupDays> days`, `serviceHref` = `/services`.
5. Any failure (non-2xx, throw, mapper `null`) -> error message "We could not match jurisdictions right now. Please try again."
6. First card gets "Best Fit #1" badge; the "Matched" badge and "{score}%" label render only on success.

## Data
None read or written (no lead, though `leads.source_tool` has `jurisdiction_quiz`, `schema.ts:313`).

## Business rules and constants
Page option values (all understood by the server; the test enforces this):
- Goals: `tax_optimization`, `banking_access`, `relocation`, `privacy`. The server type also knows `exploring`, which the page does not offer and which has no scoring rule.
- Timelines: `asap`, `few_months`, `no_rush` (labels: immediately, next 1-3 months, 3-6 months or later).
Attribute table (`JURISDICTION_ATTRIBUTES`): uae "0-9%", 30d, medium, pathway yes; hong-kong "0% on foreign income", 18d, hard, no; singapore "5-17%", 18d, medium, yes; bahrain "0%", 30d, medium, yes; ireland "12.5%", 3d, easy, yes; bvi (name "BVI & Cayman") "0%", 45d, hard, no.
Scoring (route, unchanged by spec 007; all additive from 50):
- goal `tax_optimization` and `taxRate.startsWith('0')` -> +20. That is **uae, hong-kong, bahrain, bvi** (uae's "0-9%" starts with "0").
- goal `banking_access` and banking `easy` -> +20 (ireland only).
- goal `relocation` and pathway -> +20 (uae, singapore, bahrain, ireland).
- goal `privacy` and id in {bvi, uae} -> +15.
- `wants_relocation` and pathway -> +15; `!wants_relocation` and no pathway -> +5 (hong-kong, bvi).
- timeline `asap` and setupDays<=20 -> +15 (hong-kong, singapore, ireland); else timeline `no_rush` -> +2 all. `few_months` earns nothing.
- Max possible 100.

## Auth, permissions, security
Public, no secrets, no protected zone. Unthrottled.

## Failure modes and edge cases
- API failure or malformed body: error alert, no cards (an empty `recommendations` array also counts as failure).
- The banking goal now reaches the server as `banking_access`, so ireland gets its +20; `few_months` and `no_rush` are real timelines the server understands (only `no_rush` changes scores, +2 to all).
- Budget band is collected but unused by the server; the page label says "revenue / profit" while the type calls it budget.
- Tax-rate text and setup days shown on cards come from the same table the server scores with, so they cannot contradict each other.

## Tests
`src/lib/tools/jurisdiction-quiz.test.ts` (vitest, pure logic): every page goal/timeline value is in the lists the server scores; `mapQuizResponse` maps `score`/`rationale` to `matchScore`/`whyFit` and fills tax rate and speed from the table; wrong shapes (not an array, unknown jurisdiction, non-number score, non-string rationale, empty list, null) -> `null`.
Not covered: component rendering, route handler calls. Worth adding if scoring changes (call `POST` directly; scores follow the rules above):
| Input | Expected top 3 (score) |
|---|---|
| `{goal:"tax_optimization",timeline:"asap",wants_relocation:false}` (page default) | hong-kong 90, bvi 75, uae 70 (bahrain 70 dropped by tie order) |
| `{goal:"banking_access",timeline:"asap",wants_relocation:false}` | ireland 85, hong-kong 70, singapore 65 |
| `{goal:"relocation",timeline:"asap",wants_relocation:true}` | singapore 100, ireland 100, uae 85 |
| `{goal:"privacy",timeline:"no_rush",wants_relocation:false}` | bvi 72, uae 67, hong-kong 57 |
| `{goal:"exploring",timeline:"few_months",wants_relocation:false}` | hong-kong 55, bvi 55, uae 50 |
| `{}` | 200, same as row above |
| invalid JSON | 500 `{error:"Internal server error"}` |

## Known gaps
1. `budget_band` is dead input on the server.
2. `serviceHref` is always `/services`, a login-gated route (`middleware.ts:36`).
3. The "{score}%" / "Fit Score" label implies precision that is just additive points.
4. No route-level or component tests; no lead capture; no rate limit.
Needs tax review: the attribute table's `taxRate` strings (HK "0% on foreign income", Bahrain "0%", Singapore "5-17%", Ireland "12.5%", BVI "0%") and setup days (Ireland 3) are unsourced marketing numbers; the tax-optimization bonus keys off string prefix "0", so editing the text changes scoring.

## Change guide
Jurisdiction attributes and option values live only in `src/lib/tools/jurisdiction-quiz.ts`; the route imports them, so edit there. A new goal or timeline option needs a scoring rule in the route and a matching entry in the lists the test checks. If the response shape changes, update `mapQuizResponse` and its test together. Extracting the scoring into a pure function in `src/lib/tools` would make it testable without the route. Keep jurisdiction ids in sync with `Jurisdiction` in `src/lib/persona.ts:5` and `src/lib/jurisdictions.ts`.

## Related features
[tool-tax-calculator](tool-tax-calculator.md), [lead-capture-and-persona](lead-capture-and-persona.md), [reference-data-tax-rules-countries](reference-data-tax-rules-countries.md), [service-catalog-and-checkout](service-catalog-and-checkout.md)
