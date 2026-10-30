# Feature: UAE VAT Threshold Scorer

**Slug**: tool-vat-scorer   **Area**: [lead-gen-tools](../modules/lead-gen-tools.md)   **Status**: partial (threshold check works as coded; client-type input ignored; thresholds need tax review)   **Last verified against code**: 2026-10-30

## What it does
Public client-only page. The visitor enters annual taxable revenue in AED (default 400000) and a client type, presses "Evaluate VAT Status", and sees one of three verdicts: mandatory registration, eligible for voluntary registration, or below threshold, with the two thresholds and explanatory text. Nothing is sent to a server or stored.

## Entry points
- UI: `/tools/vat-scorer` (`src/app/tools/vat-scorer/page.tsx`, client). Index card `tools/page.tsx:22`.
- API: none. (Header comment in `/api/tax-rules` claims it is used here; it is not, thresholds are hard-coded.)

## Files
- `page.tsx:9-11` state; `:13-18` thresholds and classification; `:20-23` submit; `:25-26` AED formatter; `:44-52` revenue input; `:59-68` client-type select; `:80-132` result card.

## Request / response contract
none.

## Step-by-step flow
1. State: `revenue="400000"` (string), `businessType="B2B"` (`:9-10`), `submitted=false`.
2. Every render: `revAmount = parseFloat(revenue) || 0`; `isMandatory = revAmount >= 375000`; `isVoluntary = revAmount >= 187500 && revAmount < 375000` (`:16-18`). Else "below".
3. Submit only sets `submitted=true`; the HTML `required` attribute blocks an empty field on the first submit (`:51`).
4. Result (derived live, so editing revenue after submit changes the verdict without resubmitting):
   - Mandatory: amber WarningCircle, "Mandatory VAT Registration Required"; text "meets or exceeds AED 375,000 ... must register with the FTA within 30 days of reaching this threshold" (`:94-95,114-115`).
   - Voluntary: emerald, "Eligible for Voluntary VAT Registration"; text recommends it to recover input VAT (`:96-97,116-117`).
   - Below: emerald, "Below VAT Registration Threshold"; "No VAT registration is currently required" (`:98,118`).
5. Two cards show `fmtAED(375000)` and `fmtAED(187500)` via `Intl.NumberFormat('en-AE', {currency:'AED', maximumFractionDigits:0})` (output like "AED 375,000", locale-dependent). CTA `/services` ("Book VAT Service").

## Data
None.

## Business rules and constants
- `thresholdMandatory = 375000`, `thresholdVoluntary = 187500` (`:13-14`), both inclusive on the lower bound (>=).
- Classification: `>=375000` mandatory; `[187500, 375000)` voluntary; `<187500` below. Empty/NaN/negative -> `0` or negative -> below.
- Client type options (`:65-67`): `B2B_Foreign`, `B2B_Local`, `B2C`. **Default state `"B2B"` matches none**, so the select shows the first option while state holds an unmatched value. The value is never read.

## Auth, permissions, security
Public, client-only, no data egress. No protected zone.

## Failure modes and edge cases
- Non-numeric text is impossible (number input); `e` notation like `1e6` parses to 1,000,000. Negative numbers accepted (no `min`) -> below.
- Live recompute after submit (see flow 4).
- Mandatory copy says "UAE annual turnover" while the label says "Taxable Revenue"; client type (e.g. exports zero-rated) is not factored although the option labels imply it matters.
- The advice "within 30 days" is shown as a rule of thumb with no mention of the forward-looking 30-day test or the 12-month window.

## Tests
None. Suggested:
| revenue input | Expected verdict |
|---|---|
| 400000 (default) | Mandatory |
| 375000 | Mandatory (inclusive) |
| 374999.99 | Voluntary |
| 187500 | Voluntary (inclusive) |
| 187499 | Below threshold |
| 0 / -5 | Below threshold |
| 1e6 | Mandatory |
| change 400000 -> 100000 after submit | verdict flips live to Below (documents behaviour; decide if desired) |
| any client type | identical verdict (documents ignored input) |

## Known bugs and gaps
1. `businessType` initial `"B2B"` is not a valid option value (`:10` vs `:65-67`) and the state is never used in classification (`:16-18`).
2. Live-updating result after submit (derived at render).
3. No `min` on the input; negative accepted.
4. Thresholds duplicated as literals; `jurisdiction_tax_rules` seed has VAT threshold 37500000 (cents-style 375,000.00) that is not consumed here (see [reference-data-tax-rules-countries](reference-data-tax-rules-countries.md)); voluntary threshold has no DB twin.
5. No lead capture; CTA `/services` is login-gated (`middleware.ts:36`).

### Needs tax review (not asserted as law)
- Confirm current UAE mandatory (AED 375,000) and voluntary (AED 187,500) thresholds, whether they apply to taxable supplies including zero-rated exports (suggests client type does matter), the look-back (12 months) and look-forward (30 days) tests, the 30-day registration window, and any 2026 amendments. Also confirm the cited "Federal Decree-Law No. 8/2017" (`:36`) is the right instrument.
- Voluntary registration also depends on taxable expenses, not just revenue; the tool only uses revenue.

## Change guide
Extract `classifyVat(revenue)` to `src/lib` with tests and, if client type should matter, add an input-to-turnover rule (e.g. exclude non-taxable revenue) agreed with a tax adviser. Fix the default `businessType` to `"B2B_Foreign"` or drop the field. If centralising thresholds, read from `jurisdiction_tax_rules` (and update `/api/tax-rules`). Keep `tool-compliance-calendar` messaging consistent (it also references VAT registration timing).

## Related features
[tool-compliance-calendar](tool-compliance-calendar.md), [tool-qfzp-eligibility](tool-qfzp-eligibility.md), [reference-data-tax-rules-countries](reference-data-tax-rules-countries.md), [lead-capture-and-persona](lead-capture-and-persona.md)
