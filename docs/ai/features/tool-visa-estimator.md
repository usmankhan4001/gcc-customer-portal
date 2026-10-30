# Feature: UAE Residence Visa Estimator

**Slug**: tool-visa-estimator   **Area**: [lead-gen-tools](../modules/lead-gen-tools.md)   **Status**: partial (arithmetic works; fee table unverified; input range not enforced after first submit)   **Last verified against code**: 2026-10-30

## What it does
Public client-only page. The visitor picks Free Zone or Dubai Mainland and a number of visas (default 2); on submit it lists four fee lines multiplied by the count and a grand total in AED. The heading calls it an "Official Government & Medical Fee Schedule", but the fees are literals in the page. Nothing is sent to a server or stored.

## Entry points
- UI: `/tools/visa-estimator` (`src/app/tools/visa-estimator/page.tsx`, client). Index card `tools/page.tsx:24`; dashboard tile "Visa Costs" `(authenticated)/dashboard/page.tsx:516`.
- API: none.

## Files
- `page.tsx:9-11` state; `:13-16` submit; `:18-26` computation; `:28-29` AED formatter; `:41-70` inputs; `:81-125` result card.

## Request / response contract
none.

## Step-by-step flow
1. State: `employees="2"` (string), `jurisdiction="FreeZone"`, `showResults=false` (`:9-11`).
2. Every render: `count = parseInt(employees) || 1`; `isFreeZone = jurisdiction === 'FreeZone'`; compute fees; `perVisaTotal = entryPermit + medicalFitness + emiratesId + visaStamping`; `grandTotal = perVisaTotal * count` (`:18-26`).
3. Submit sets `showResults=true` (`:15`); browser validation (`required`, `min=1`, `max=50`, `:62-64,68`) applies only at submit time.
4. Result card: "{count} Visa(s)", four lines (`fee * count`), "Total Estimated Visa Government Cost" (`:89-111`). Values derived at render, so after the first submit they update live as inputs change (no resubmit, and no browser min/max check until the next submit click).
5. Format `Intl.NumberFormat('en-AE', {style:'currency', currency:'AED', maximumFractionDigits:0})`.

## Data
None.

## Business rules and constants (AED per visa, `:21-25`)
| Item | FreeZone | Mainland |
|---|---|---|
| Entry permit / change of status | 1100 | 1500 |
| Medical fitness (labelled VIP fast track) | 350 | 350 |
| Emirates ID (labelled 2 years) | 380 | 380 |
| Residency stamping / establishment issuance | 1650 | 2100 |
| Per-visa total | 3480 | 4330 |
Total = per-visa total x count. Count = `parseInt(employees) || 1` (so `0`, `NaN`, empty -> 1; `"2.9"` -> 2; `"1e2"` -> 1; negatives pass through). Declared range 1 to 50 is only HTML attributes. No tiers for 2-year vs 3-year visas, quotas, insurance, deposits, typing fees or Golden Visa.

## Auth, permissions, security
Public, client-only, no data egress. No protected zone.

## Failure modes and edge cases
- Live edit after submit can produce count 0->1 (silent), negative counts (negative totals, e.g. -3 FreeZone = -AED 10,440), or >50 (e.g. 51 FreeZone = AED 177,480).
- `parseInt` truncates decimals silently; the card shows the truncated count.
- Empty field after submit shows "1 Visa(s)" (fallback), contradicting the empty input.
- Copy mismatch: description says "Includes ... e-visa residency issuance" while line is "Residency Stamping & Establishment Issuance".
- Labelled "Official" without citing a source or date; fees change.

## Tests
None. Suggested (jurisdiction, employees -> grand total, line items):
| Input | Expected |
|---|---|
| FreeZone, 1 | AED 3,480 (1,100 / 350 / 380 / 1,650) |
| FreeZone, 2 (default) | AED 6,960 |
| Mainland, 1 | AED 4,330 (1,500 / 350 / 380 / 2,100) |
| Mainland, 3 | AED 12,990 |
| FreeZone, 50 | AED 174,000 |
| FreeZone, 0 (via live edit) | treated as 1: AED 3,480 and "1 Visa(s)" |
| FreeZone, -3 (live edit) | currently AED -10,440; should clamp/ reject |
| FreeZone, "2.9" | count 2: AED 6,960 |

## Known bugs and gaps
1. Range (1-50) not enforced in code; only HTML attributes at submit (`:63-64` vs `:18`). Live recompute then bypasses it.
2. `|| 1` hides invalid input as a valid count of 1 (`:18`).
3. Results live-update without resubmit (derived state).
4. Fee schedule unsourced and unversioned; "Official" claim. No lead capture; CTA `/services` is login-gated (`middleware.ts:36`).

### Needs fee review (not asserted)
Every number above (entry permit, medical, Emirates ID, stamping) must be checked against current ICP/GDRFA/free-zone tariffs and the company's own service pricing; free-zone fees vary by zone (the option text lists Dubai/RAK/IFZA/Meydan under one price). Mainland entry permit/stamping figures and the medical "VIP" tier especially unverified.

## Change guide
Move the fee table to a typed constant (or a DB/pricing table, see [admin-pricing-configurator](admin-pricing-configurator.md)) with a "last reviewed" date shown in the UI; extract `estimateVisaCost(entity, count)` to `src/lib` with tests that clamp count to 1..50. If adding zones or visa durations, extend the table above rather than adding conditionals. If capturing leads use `source_tool: 'visa_estimator'` ([lead-capture-and-persona](lead-capture-and-persona.md)).

## Related features
[service-catalog-and-checkout](service-catalog-and-checkout.md), [admin-pricing-configurator](admin-pricing-configurator.md), [lead-capture-and-persona](lead-capture-and-persona.md), [tool-compliance-calendar](tool-compliance-calendar.md)
