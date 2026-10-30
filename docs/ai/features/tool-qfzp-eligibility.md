# Feature: QFZP (0% Corporate Tax) Eligibility Checker

**Slug**: tool-qfzp-eligibility   **Area**: [lead-gen-tools](../modules/lead-gen-tools.md)   **Status**: partial (works as coded; two of four inputs ignored; legal logic is oversimplified and needs tax review)   **Last verified against code**: 2026-10-30

## What it does
Public client-only form. The visitor selects a business activity and two checkboxes; on submit the page shows either "High Likelihood: Eligible for 0% UAE Corporate Tax" or "Standard 9% Rate Applies / Non-Qualifying Activity". The verdict is a single boolean expression; the staff-visa dropdown and the foreign-clients checkbox are collected but not used. Nothing is sent to a server or stored.

## Entry points
- UI: `/tools/qfzp-eligibility` (`src/app/tools/qfzp-eligibility/page.tsx`, client). Index card `tools/page.tsx:26`.
- API: none.

## Files
- `page.tsx:9-13` state; `:15-18` verdict expression; `:20-23` submit; `:41-52` activity options; `:59-68` visas options; `:72-94` checkboxes; `:106-143` result card.
- `src/lib/db/schema.ts:319` has enum value `qfzp_eligibility` (and `src/app/admin/leads/page.tsx:30` a label) but no code path writes it from this tool.

## Request / response contract
none.

## Step-by-step flow
1. Defaults: `activity="Tech"`, `visas="1-2"`, `hasSubstance=true`, `isForeignClients=true`, `submitted=false` (`:9-13`).
2. Each render recomputes `isLikelyEligible = activity !== "Excluded" && hasSubstance && (activity === "Tech" || "Trading" || "Consulting")` (`:15-18`).
3. Submit sets `submitted=true` (`:22`); the result card is shown and thereafter **updates live** as inputs change, with no resubmit (verdict is derived during render, not snapshotted).
4. Result: eligible -> emerald card, ShieldCheck, copy "meets the QFZP criteria: Qualifying activity with foreign/FZ counterparties and adequate UAE economic substance" (`:122,127`). Otherwise amber Warning card, copy "taxed at the standard 9% ... (first AED 375k profit still 0%)" (`:123,128`). CTA link `/services` ("Consult Tax Specialist").

## Data
None.

## Business rules and constants
Activity option value -> label (`:47-51`): Tech = "Software Development & Cloud Services"; Trading = "Qualifying Commodity & Goods Trading"; Consulting = "Headquarter & Holding Company Services" (value/label mismatch); Logistics = "Logistics & Freight Forwarding"; Excluded = "Direct Mainland UAE B2C Retail (Excluded)".
Truth table: eligible iff activity in {Tech, Trading, Consulting} AND `hasSubstance`. Logistics is always not eligible; Excluded is always not eligible (the `!== "Excluded"` clause is redundant). `visas` ("1-2","3-5","6+") and `isForeignClients` never read.
Hard-coded legal statements in copy: "Cabinet Decision No. 55/2023" (`:33`), 0% for qualifying income, 9% standard, "first AED 375k profit still 0%" (`:128`).

## Auth, permissions, security
Public, client-only, no data egress. No protected zone.

## Failure modes and edge cases
- Unchecking "foreign clients" does not change the verdict, yet the positive copy claims "foreign/FZ counterparties". Contradictory output for a user who unchecks it.
- Changing inputs after submit silently flips the verdict without any submit.
- Logistics returns "Standard 9% Rate Applies" with no explanation.
- The non-eligible message blames mainland B2C or missing substance but also fires for Logistics/any non-listed activity.

## Tests
None. Suggested (activity, substance, foreign -> verdict):
| Input | Expected |
|---|---|
| Tech, substance on, foreign on (defaults, submit) | Eligible card |
| Tech, substance off | Not eligible ("Standard 9%") |
| Trading, substance on, foreign off | Eligible (documents ignored input; change if foreign flag is wired in) |
| Consulting, substance on | Eligible |
| Logistics, substance on | Not eligible (decide if intended) |
| Excluded, substance on | Not eligible |
| Submit with defaults, then untick substance (no resubmit) | card flips live to Not eligible; before first submit no card shown |
| visas "6+" vs "1-2" | identical verdicts |

## Known bugs and gaps
1. Dead inputs `visas` and `isForeignClients` (`:10,12` set but absent from `:15-18`).
2. Live-updating result after submit (derived state, `:15` vs `:22`).
3. Value/label mismatch: `Consulting` value for "Headquarter & Holding Company Services".
4. No lead capture despite enum/admin label support.
5. CTA `/services` is login-gated (`middleware.ts:36`).

### Needs tax review (not asserted as law)
- The real regime involves more than activity + office: qualifying vs non-qualifying revenue, a de minimis limit on non-qualifying income, transfer-pricing/arm's-length conditions, audited financials, and not electing the standard rate. None are modelled; "High Likelihood" may overstate.
- Whether Logistics/freight and holding activities are on the official qualifying-activity list, and the mapping "Consulting = HQ/holding", are unverified against the current Ministerial list. Verify the cited decision number (55/2023) and the claim "first AED 375k profit still 0%" (the small-income band applies to taxable income under the standard regime; confirm wording, rate and any 2026 changes).
- Treat the output as marketing triage, add a disclaimer, and have a qualified UAE tax adviser sign off the rule set.

## Change guide
Extract `isLikelyEligible` to `src/lib/qfzp.ts` with tests; wire `isForeignClients` (and a mainland-revenue question) into it or delete the inputs. Keep copy and logic in sync (the card text promises counterparties). To capture leads use `source_tool: 'qfzp_eligibility'` via [lead-capture-and-persona](lead-capture-and-persona.md). Update the VAT/compliance tools if corporate-tax thresholds are centralised (see [reference-data-tax-rules-countries](reference-data-tax-rules-countries.md)).

## Related features
[tool-vat-scorer](tool-vat-scorer.md), [tool-compliance-calendar](tool-compliance-calendar.md), [tool-tax-calculator](tool-tax-calculator.md), [reference-data-tax-rules-countries](reference-data-tax-rules-countries.md), [lead-capture-and-persona](lead-capture-and-persona.md)
