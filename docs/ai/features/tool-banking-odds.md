# Feature: Banking Odds Matcher

**Slug**: tool-banking-odds   **Area**: [lead-gen-tools](../modules/lead-gen-tools.md)   **Status**: working (as coded; heuristic numbers are unsourced)   **Last verified against code**: 2026-10-30

## What it does
Public, fully client-side page. The visitor picks a nationality, an industry and an annual turnover; the page shows an "approval odds" percentage and a label for four UAE business accounts (Wio, Emirates NBD, Mashreq NeoBiz, ADCB). Odds come from a 3x2 base table by industry risk tier plus a turnover adjustment. Nothing is sent to a server or stored. It is presented as an estimate but is a hard-coded heuristic.

## Entry points
- UI: `/tools/banking-odds` (`src/app/tools/banking-odds/page.tsx`, client). `tools/page.tsx:19` index card; dashboard tile `(authenticated)/dashboard/page.tsx:514`.
- API: none.

## Files
- `src/app/tools/banking-odds/page.tsx:14-29` `computeOdds`; `:31-41` state + `handleCalculate`; `:114-135` result cards; `:137-148` CTA.
- `src/lib/persona.ts:7-8,18-24` `industryRiskTier()` and keyword lists. Tested in `src/lib/persona.test.ts:29-38`.
- `src/lib/countries.ts:8-121` `COUNTRIES` (name, ISO code, dialCode, flag) feeds the nationality select.

## Request / response contract
none (no network call).

## Step-by-step flow
1. State: `nationality=""`, `industry=""`, `turnover=''` (`:32-34`). Button disabled while any is falsy (`:107`); `handleCalculate` re-checks `!nationality || !industry || !turnover` and returns (`:38`). Therefore turnover 0 can never be calculated; negative turnover can.
2. `risk = industryRiskTier(industry) ?? 'medium'` (`:39`). `industryRiskTier` lowercases and does substring match: contains `crypto|forex|gambling|trading` -> high; else contains `e-commerce|ecommerce|consulting|technology|tech|saas` -> low; else medium (`persona.ts:7-8,21-23`).
3. `computeOdds(risk, Number(turnover))` (`:40`): returns an array of 4 objects in fixed order.
4. Render each result: `odds` followed by `%`; colour/label `>80` "High Likelihood" (emerald), `>50` "Moderate Odds" (amber), else "Special Approval Needed" (rose) (`:129-130`). Boundaries: exactly 80 and exactly 50 fall into the lower label.
5. Results persist in state until recalculated; changing inputs does NOT clear or live-update them (stale results possible).

## Data
None read/written. `leads.source_tool` has `banking_odds` (`schema.ts:311`) but this page never creates a lead.

## Business rules and constants
Dropdown value -> tier (via `industryRiskTier`): Consulting -> low; Technology -> low; E-commerce -> low; Marketing -> medium; Crypto -> high; Real Estate -> medium; Other -> medium (`page.tsx:80-86`).
Base table (`:15-19`): low {wio 95, enbd 85}; medium {75, 60}; high {40, 20}.
Turnover bonus (`:20`): `>= 500000` -> +5; `< 50000` -> -10; otherwise 0 (50000 and 499999 are 0).
Clamp (`:21`): `max(5, min(99, n))`.
Banks (`:24-27`): Wio = wio+bonus; Emirates NBD = enbd+bonus; Mashreq NeoBiz = wio-5+bonus; ADCB = enbd-10+bonus.
Nationality is collected and required but never used in any computation. Currency label says "$", no conversion.

Full outcome grid (Wio / ENBD / Mashreq / ADCB):
- low: bonus 0 -> 95/85/90/75; +5 -> 99/90/95/80; -10 -> 85/75/80/65.
- medium: 0 -> 75/60/70/50; +5 -> 80/65/75/55; -10 -> 65/50/60/40.
- high: 0 -> 40/20/35/10; +5 -> 45/25/40/15; -10 -> 30/10/25/5 (ADCB 0 clamped to 5).

## Auth, permissions, security
Public, client-only; no data leaves the browser. No protected zone.

## Failure modes and edge cases
- Turnover non-numeric impossible (number input yields ''). Huge values fine. Negative values accepted and treated as `< 50000`.
- Stale results after editing inputs (see flow 5).
- Unknown `industry` string cannot occur from the select; if it did, falls to medium.
- Nationality never affects odds, so a sanctioned/high-risk nationality gets identical odds to a UAE national: misleading (and "Guaranteed Banking Support" CTA copy at `:138` over-promises).
- Odds >80 for Wio at 99% for low-risk/high-turnover imply near certainty; unsupported by any data.

## Tests
Only `industryRiskTier` is tested (`persona.test.ts`). `computeOdds` is a non-exported function in the page, hence untestable; extract it. Suggested cases (industry dropdown value, turnover -> Wio/ENBD/Mashreq/ADCB):
| Input | Expected |
|---|---|
| Consulting, 150000 | 95 / 85 / 90 / 75 |
| Technology, 500000 | 99 / 90 / 95 / 80 (Wio 100 clamped to 99) |
| Other, 49999 | 65 / 50 / 60 / 40 (ENBD 50 -> "Special Approval Needed") |
| Real Estate, 50000 | 75 / 60 / 70 / 50 (boundary: no penalty) |
| Crypto, 30000 | 30 / 10 / 25 / 5 (clamp floor on ADCB) |
| Crypto, 500000 | 45 / 25 / 40 / 15 |
| E-commerce, -100 | treated as <50000: 85 / 75 / 80 / 65 |
| any nationality empty / turnover 0 | button disabled; `handleCalculate` no-op |

## Known bugs and gaps
1. `nationality` required but unused (`:38` vs `computeOdds` signature `:14`); dead input that blocks submission.
2. Results not cleared when inputs change (`:37-41` only sets on click).
3. No lead capture/PDF/analytics despite `source_tool` enum value; persona signals (`industryRiskTier`) are computed here but not sent (see [lead-capture-and-persona](lead-capture-and-persona.md)).
4. Bank odds are invented; no sourcing or disclaimer text on the page.
5. Mashreq and ADCB are derived offsets of Wio/ENBD, not independent data.
6. CTA `/services` is login-gated (`middleware.ts:36`); anonymous users get bounced to `/auth`.

## Change guide
Move `computeOdds` + tables into `src/lib/banking-odds.ts` with a `.test.ts`; keep `industryRiskTier` as the single source for risk tiers. To use nationality, add a risk modifier table keyed by ISO code (needs compliance sign-off, not an engineering decision). If adding a bank, update the grid above and the layout (`grid-cols-2`). To record leads, follow [lead-capture-and-persona](lead-capture-and-persona.md) with `source_tool: 'banking_odds'`.

## Related features
[lead-capture-and-persona](lead-capture-and-persona.md), [tool-jurisdiction-quiz](tool-jurisdiction-quiz.md), [service-catalog-and-checkout](service-catalog-and-checkout.md), [tool-result-pdf-and-email](tool-result-pdf-and-email.md)
