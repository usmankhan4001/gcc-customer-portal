# Module: Lead-gen Tools (calculators, quiz, reference data, PDF and email delivery)
**Last verified against code**: 2026-10-30

## Purpose
Public micro-tools under `/tools/*` that give a free estimate to prospects. Seven tools compute entirely client-side with hard-coded numbers; two call server evaluators (`/api/calculator`, `/api/quiz`); a shared PDF/email pipeline exists but no tool page currently wires into it or into lead capture.

## Files
- `src/app/tools/page.tsx` - index grid of 10 tools (invoice-generator is NOT listed)
- `src/app/tools/<tool>/page.tsx` - one client page per tool (see table)
- `src/app/api/calculator/evaluate/route.ts` - tax savings evaluator (in-file rate tables)
- `src/app/api/quiz/evaluate/route.ts` - jurisdiction scoring (in-file attribute table)
- `src/app/api/tax-rules/route.ts` - GET rows of `jurisdiction_tax_rules` by `?jurisdiction=`
- `src/app/api/countries/route.ts` - GET `COUNTRIES`, optional `?q=` filter (name, code, dialCode)
- `src/app/api/pdf/generate/route.ts` - build PDF, upload to R2, optionally email
- `src/lib/jurisdictions.ts` - `JURISDICTIONS` catalog (6) + `getJurisdiction()` (used by services pages, not by tools)
- `src/lib/countries.ts` - `COUNTRIES` (name, ISO code, dialCode, flag)
- `src/lib/pdf.tsx` - `generateToolPDF()` (@react-pdf/renderer, A4, `uploadBuffer` to R2)
- `src/lib/email.ts` - `sendToolResultEmail()` (Resend)
- `src/components/portal/PDFDownloadPanel.tsx` - client button pair calling `/api/pdf/generate` (no importer found besides a style-guide mention)
- `src/components/portal/ComplianceSnapshot.tsx` - only real consumer of `/api/tax-rules`

## Routes and API
All public (no auth; `/api/*` and `/tools/*` bypass middleware auth).
| Method Path | Input | Output |
|---|---|---|
| POST /api/calculator/evaluate | `{country_residence (ISO2), annual_profit>0, target_jurisdiction}` | `{home_tax_rate, home_tax_amount, optimized_tax_rate, optimized_tax_amount, net_annual_savings, recommended_tier, recommended_package_usd}`; 400 on unknown country/jurisdiction |
| POST /api/quiz/evaluate | `{goal, budget_band, timeline, wants_relocation}` | `{recommendations:[top 3 {jurisdiction,name,score,rationale}]}` |
| GET /api/tax-rules?jurisdiction= | jurisdiction id | `{rules: rows}`; 400 if missing; unvalidated value cast to enum |
| GET /api/countries[?q=] | optional q | `{countries}` (+`total` when no q) |
| POST /api/pdf/generate | `{lead_id,title,subtitle?,rows[{label,value}],email_it?}` | `{url}` (7-day presigned R2 URL); 400/404/500 |

## Data
- `jurisdiction_tax_rules` (`schema.ts:229`): jurisdiction enum(6), tax_type (`corporate|vat|other`), rate_percent int (percent x 100, 900 = 9.00%), threshold_amount int (nullable), currency, filing_frequency (`annual|quarterly|monthly`), filing_deadline_rule text, notes. Seeded by `scripts/seed.ts:35` with 4 rows (uae corporate 9%/uae vat 5% both threshold 37500000, hong-kong 8.25%, singapore 17%), all flagged "PLACEHOLDER - verify".
- `leads` read/updated by `/api/pdf/generate` (`pdf_r2_key`, `email`, `source_tool`).

## External services and env vars
Cloudflare R2 (`R2_ENDPOINT`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME` in `src/lib/r2.ts`), Resend (`RESEND_API_KEY`), `DATABASE_URL`. PDF key: `pdfs/<source_tool>/<Date.now()>-<4 random bytes hex>.pdf`.

## Key flows
1. Client-only tools: user fills form -> in-browser compute -> result shown (nothing stored, no lead).
2. Tax calculator: POST `/api/calculator/evaluate`; on non-OK or network error the page recomputes locally with its own rate table (see mismatches).
3. Quiz: POST `/api/quiz/evaluate` -> page renders top 3; fallback is two hard-coded cards (UAE 98%, Hong Kong 88%).
4. PDF (designed flow): `PDFDownloadPanel` -> POST pdf/generate with `lead_id` -> render -> R2 -> `leads.pdf_r2_key` -> presigned URL; `email_it` + `lead.email` -> `sendToolResultEmail` with a "Download PDF" link ("expires in 7 days").
5. Lead capture + persona (designed, see onboarding-and-leads.md): not triggered by any tool page today.

## Tool table (tool route | input | output | logic file | tested?)
| Route | Input | Output | Logic file | Tested? |
|---|---|---|---|---|
| /tools/tax-calculator | residence (US,UK,DE,FR,CA,AU,IN), target (uae,hong-kong,singapore,ireland,bvi), profit default 250000 | savings, current tax, target tax | page.tsx + api/calculator/evaluate | no |
| /tools/jurisdiction-quiz | goal, budget band, timeline, relocation | top 3 jurisdictions | api/quiz/evaluate | no |
| /tools/banking-odds | nationality (unused in math), industry, turnover | odds % for 4 banks | page.tsx `computeOdds` + `persona.industryRiskTier` | partial (persona only) |
| /tools/vat-scorer | revenue AED, client type (unused in math) | mandatory/voluntary/none | page.tsx | no |
| /tools/compliance-calendar | formation date | 6 UAE deadlines | page.tsx `computeDeadlines` | no |
| /tools/visa-estimator | entity type FreeZone/Mainland, visas 1-50 | AED total | page.tsx | no |
| /tools/name-checker | company name | available/restricted + alternatives | page.tsx `checkAvailability` | no |
| /tools/qfzp-eligibility | activity, visas (unused), substance, foreign clients (unused) | likely eligible Y/N | page.tsx | no |
| /tools/ubo-privacy | citizenship (unused), jurisdiction uae/bvi/uk/us | exposure score + flags | page.tsx `checkExposure` | no |
| /tools/generate-nda | two party names, governing law | NDA text, copy/print | page.tsx `getNDAText` | no |
| /tools/invoice-generator (not in index) | company, client, line items | simulated "generated" state | page.tsx (800 ms `setTimeout`, no PDF) | no |

## Business rules and invariants
- Server tax rates `calculator/evaluate:28-64`: home (ISO2) NL .495, DE .475, FR .45, GB .45, US .37, CA .33, AU .325, AE 0, SG .17, HK .165, IE .33, ES .47, IT .43, PT .48, SE .52, BE .5, JP .45, IN .3, BR .34, MX .35. Targets (snake_case keys): hong_kong .0825, singapore .17, uae 0, delaware_usa 0, uk_limited .19, estonia_e_residency 0, georgia .01, cyprus .125, malta .05, bvi 0, cayman 0, labuan .03. Tier/package USD per target at `:66-79` (e.g. uae tier_1_fdi 2500, bvi tier_3_corporate 5000). File comment: "mock - replace with live data".
- Page fallback rates (`tax-calculator/page.tsx:8-22`): US .27, UK .25, DE .30, FR .25, CA .26, AU .30, IN .25; targets uae .045, hong-kong .0825, singapore .085, ireland .125, bvi 0.
- Quiz scoring (`quiz/evaluate:188-233`): base 50; tax_optimization +20 if taxRate string starts with "0" (hong-kong, bahrain, bvi); banking_access +20 if bankingDifficulty easy (ireland); relocation +20 if residencyPathway; privacy +15 for bvi/uae; wants_relocation +15 with pathway; not wants_relocation +5 without pathway; timeline asap +15 if setupDays<=20 (hong-kong 18, singapore 18, ireland 3); no_rush +2.
- Banking odds (`banking-odds:14-29`): base low {wio 95, enbd 85}, medium {75, 60}, high {40, 20}; turnover >=500000 +5, <50000 -10; clamp 5..99; Mashreq = wio-5, ADCB = enbd-10.
- VAT: mandatory >= AED 375,000, voluntary >= 187,500 (`vat-scorer:14-15`, hard-coded).
- Visa fees AED (`visa-estimator:20-26`): entry permit 1100 FZ / 1500 mainland; medical 350; Emirates ID 380; stamping 1650 FZ / 2100 mainland; x count.
- Name checker restricted words: bank, insurance, government, emirates, royal, invest, crypto, global; hit -> score 35, else 92 (score is fixed, not computed).
- QFZP: eligible iff activity != Excluded AND hasSubstance AND activity in Tech/Trading/Consulting (`qfzp-eligibility:15-18`).
- Compliance calendar offsets from formation: VAT +1 mo, CT registration +3, FYE +12, CT return FYE+9, ESR FYE+12, license renewal at FYE (`compliance-calendar:19-23`).
- PDF disclaimer text fixed in `pdf/generate:302`.

## Security notes
- No protected zone is touched by tools, but `pdf/generate` writes to R2 (private bucket; only presigned URLs returned, consistent with AGENTS.md) and is unauthenticated: knowing any `lead_id` UUID lets a caller overwrite `pdf_r2_key`, upload arbitrary titled PDFs to R2, and trigger email to the lead (spam/cost). No size limit on `rows`.
- `email.ts` HTML interpolates `title` and `downloadUrl` unescaped (HTML injection in emails to the lead).
- `tax-rules` and `countries` are intentionally public read-only.
- No rate limiting on any tool API.

## Tests
No tests for any tool page or API route. Only `src/lib/persona.test.ts` (indirectly used by banking-odds). `jurisdictions.ts`, `countries.ts`, `pdf.tsx`, `email.ts`: none.

## Known gaps and suspicious things
- Tax calculator contract mismatch: page sends `UK` (server expects `GB`), `hong-kong` and `ireland` (server has `hong_kong`, no ireland) -> 400, so those combos always use the page's local rates. When the API succeeds (e.g. US->uae) the page reads `result.savings/current_tax/target_tax`, which the API does not return (fields are `net_annual_savings`, `home_tax_amount`...), so the card shows $0. Two diverging rate tables (server .37 US vs page .27).
- Quiz contract mismatch: page sends goal `global_banking` and timeline `1_3_months`/`3_6_months`; server expects `banking_access` and `few_months`; UI reads `matchScore/whyFit/corporateTaxRate/timelineDays/serviceHref` but API returns `score/rationale` (UI shows undefined). Server `budget_band` and page `Goal` types unused in scoring.
- `tax-rules` header comment says VAT scorer and compliance calendar use it; they do not (thresholds hard-coded). Table values are seed placeholders ("verify with Farooq").
- Several inputs collected but ignored (nationality, citizenship, client type, visas count, foreign-clients flag).
- Numbers are mixed currency/precision conventions: DB `rate_percent` x100, `threshold_amount` in cents-equivalent.
- `invoice-generator` is fake; `jurisdictions.ts` prices are display strings, separate from `jurisdiction_pricing` DB table.
- AGENTS.md says "10 tools"; 11 pages exist.

## Change guide
- New tool: add `src/app/tools/<slug>/page.tsx`, entry in `TOOLS` (`tools/page.tsx`), add enum value to `leads.source_tool` (schema.ts) if it captures leads, put pure logic in `src/lib/<slug>.ts` with a `.test.ts`, and update CODEMAP via `npm run docs:ai`.
- Change tax numbers: server table AND page fallback table (and DB seed for dashboard) must agree; prefer reading `jurisdiction_tax_rules`.
- Fix tax calculator: align country/jurisdiction keys and response field names between page and route before editing rates.
- Wire a tool to leads/PDF: POST `/api/leads/capture` first, keep returned `lead.id`, then render `PDFDownloadPanel` with it.
- Pitfall: `pdf.tsx` imports `@react-pdf/renderer`; keep it server-only (standalone build).
