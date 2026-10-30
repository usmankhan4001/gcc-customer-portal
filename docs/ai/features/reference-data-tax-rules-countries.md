# Feature: Reference Data (tax rules, countries, jurisdiction catalog)

**Slug**: reference-data-tax-rules-countries   **Area**: [lead-gen-tools](../modules/lead-gen-tools.md)   **Status**: partial (APIs work; tax rules are 4 placeholder rows; catalog duplicates numbers held elsewhere)   **Last verified against code**: 2026-10-30

## What it does
Three pieces of shared reference data. (1) `GET /api/tax-rules` returns rows of the `jurisdiction_tax_rules` DB table for one jurisdiction; its only consumer is the dashboard `ComplianceSnapshot`. (2) `GET /api/countries` and `src/lib/countries.ts` expose a static list of 112 countries (name, ISO2, dial code, flag emoji) used by phone and country pickers. (3) `src/lib/jurisdictions.ts` is the static 6-jurisdiction marketing catalog used by the services pages. All are public read-only data.

## Entry points
- `GET /api/tax-rules?jurisdiction=<id>` (`src/app/api/tax-rules/route.ts:9`).
- `GET /api/countries[?q=]` (`src/app/api/countries/route.ts:4`).
- Library imports: `COUNTRIES` in `src/components/ui/PhoneInputWithCountry.tsx:5`, `src/components/ui/CountrySelect.tsx:4`, `src/app/tools/banking-odds/page.tsx:7`, `src/app/tools/ubo-privacy/page.tsx:7`; `JURISDICTIONS`/`getJurisdiction` in `src/app/(authenticated)/services/page.tsx:4` and `services/[id]/page.tsx:9`.
- Seed: `npx tsx scripts/seed.ts` (needs real `DATABASE_URL`).
- All `/api/*` paths are public (`src/middleware.ts:5-6`).

## Files
- `src/app/api/tax-rules/route.ts:1-21`, `src/app/api/countries/route.ts:1-22`.
- `src/lib/countries.ts:1-133` (`Country`, `COUNTRIES` at `:8-120`, `findCountryByDialCode` `:123-127`, `findCountryByName` `:129-132`).
- `src/lib/jurisdictions.ts:1-114`.
- `src/lib/db/schema.ts:229-244` table, `:417` type `JurisdictionTaxRule`; `drizzle/0000_wealthy_ezekiel.sql:64` creates it.
- `scripts/seed.ts:35-76` tax rules, `:17-30` pricing, `:78-117` upsert loop.
- `src/components/portal/ComplianceSnapshot.tsx:18-39,47-52,79,107` consumer.

## Request / response contract
`GET /api/tax-rules?jurisdiction=uae`
- 400 `{error:"jurisdiction query param is required"}` when missing/empty.
- 200 `{rules: JurisdictionTaxRule[]}` (all columns, see Data). Unknown jurisdiction value -> 200 `{rules: []}` (column is plain text; the enum is TypeScript-only; the value is cast `as any`, `route.ts:18`). No try/catch: a DB error becomes an unhandled 500 (Next default).
`GET /api/countries`
- no `q`: 200 `{countries: Country[112], total: 112}`.
- `q` (lowercased, trimmed): filter where `name.toLowerCase().includes(q) || code.toLowerCase().includes(q) || dialCode.includes(q)`; 200 `{countries: [...]}` (no `total`). Empty result is 200 with `[]`. `q` of only spaces is falsy after trim -> returns the full list.
No cookies, no auth, no pagination, no caching headers.

## Step-by-step flow
1. Dashboard mounts `ComplianceSnapshot` (`dashboard/page.tsx:459`) -> `fetch('/api/tax-rules?jurisdiction=<company jurisdiction>')` (`ComplianceSnapshot.tsx:48`) -> `setRules(data.rules ?? [])`; fetch error -> `[]`.
2. Snapshot picks the first `tax_type === 'corporate'` rule (`:79`), computes `revenue * rate_percent / 10000` (`:107`), and derives the next deadline by regexing `(\d+)\s*months?` from `filing_deadline_rule` (`:18-39`), else prints the raw rule text.
3. Countries: pickers import the array directly (no HTTP); `/api/countries` has no in-repo caller (grep for `api/countries` outside its route returns nothing).
4. Seed (`scripts/seed.ts:97-113`): for each rule, select by (jurisdiction, tax_type) `limit 1`; update (`{...row, updated_at: new Date()}`) or insert. Re-runnable.

## Data
`jurisdiction_tax_rules` (`schema.ts:229-244`): `id` uuid pk default random; `jurisdiction` text enum `uae|hong-kong|singapore|bahrain|ireland|bvi` NOT NULL; `tax_type` enum `corporate|vat|other` NOT NULL; `rate_percent` integer NOT NULL (percent x 100, 900 = 9.00%); `threshold_amount` integer nullable (minor units: 37500000 = AED 375,000); `currency` text default `'usd'` NOT NULL (seed uses lowercase `aed|hkd|sgd`); `filing_frequency` enum `annual|quarterly|monthly` NOT NULL; `filing_deadline_rule` text NOT NULL (free text); `notes` text; `updated_at` default now. No unique index on (jurisdiction, tax_type).

## Business rules and constants
Seeded rules (`scripts/seed.ts:35-76`), all notes say PLACEHOLDER, verify with Farooq:
| jurisdiction | type | rate | threshold | currency | frequency | deadline rule |
|---|---|---|---|---|---|---|
| uae | corporate | 900 (9.00%) | 37,500,000 (AED 375,000) | aed | annual | "9 months after fiscal year end" |
| uae | vat | 500 (5.00%) | 37,500,000 | aed | quarterly | "28 days after the end of the tax period" |
| hong-kong | corporate | 825 (8.25%, lower tier of 8.25/16.5) | null | hkd | annual | "within 1 month of the profits tax return issue date" |
| singapore | corporate | 1700 (17.00%) | null | sgd | annual | "by 30 November following the fiscal year end" |
bahrain, ireland, bvi: no rows (snapshot shows "No tax rules configured for this jurisdiction yet", `ComplianceSnapshot.tsx:116-118`).
Jurisdiction catalog (`jurisdictions.ts:18-110`, display strings): uae "$1,500", tax "9% / 0% Foreign", "~30 days", popular; hong-kong "$2,000", "0% on Foreign", "17-18 days"; bahrain "$1,500", "0% Corporate", "~30 days"; singapore "$2,000", "5% Corporate", "17-18 days"; ireland "$1,500", "12.5% Corporate", "2-3 days"; bvi (named "BVI & Cayman") "Custom quote", "0% Corporate", "Varies". Type `JurisdictionId` at `:1`.
Seeded pricing (`seed.ts:17-30`, cents): uae/bahrain/hong-kong/ireland tier_1 150000, tier_2 350000; singapore 200000/400000; bvi 250000/450000.
Countries: 112 entries; first 21 are priority (UAE, Saudi Arabia, Qatar, Kuwait, Bahrain, Oman, UK, US, Canada, Singapore, Hong Kong, India, Pakistan, Germany, France, Australia, Switzerland, Netherlands, Ireland, Italy, Spain), then alphabetical (Afghanistan ... Vietnam). US and Canada share `+1`; Caribbean codes are 4-digit (+1242 Bahamas, +1246 Barbados, +1284 BVI, +1345 Cayman, +1441 Bermuda, +1809 Dominican Rep.). `findCountryByDialCode` sorts by dial length descending then `startsWith` (US wins `+1` because sort is stable and US precedes Canada).

## Auth, permissions, security
Public, read-only, no secrets. No AGENTS.md protected zone. `/api/tax-rules` accepts arbitrary query values but uses a parameterized Drizzle `eq` (no injection). No rate limiting; `/api/countries` serves a static array (cheap).

## Failure modes and edge cases
- Missing/unknown jurisdiction behaviour differs: missing -> 400, unknown -> 200 empty.
- DB down -> `/api/tax-rules` 500 (no handler); snapshot catches fetch rejection but `res.json()` of an HTML 500 also rejects -> `[]`.
- Duplicate rows for the same (jurisdiction, tax_type) are possible (no unique constraint); snapshot uses the first returned (undefined order, no ORDER BY).
- `/api/countries?q=1` matches almost everything by dial code substring.
- Rates stored as integer x100: do not store 12.125%.

## Tests
None. Worth writing:
1. `GET /api/tax-rules` (no param) -> 400 with exact message.
2. After seed, `?jurisdiction=uae` -> 2 rules (corporate 900, vat 500); `?jurisdiction=bvi` -> `{rules: []}`.
3. `?jurisdiction=zzz` -> 200 `[]` (documents current behaviour; flip if validation is added).
4. `GET /api/countries` -> `total === 112`, first item `AE`, no duplicate `code`.
5. `GET /api/countries?q=+971` -> exactly `[AE]`; `?q=pak` -> `[PK]`; `?q=%20` -> full list.
6. Seed idempotency: run twice -> row count unchanged (4 rules, 12 pricing).
7. `findCountryByDialCode('+13455551234')` -> Cayman Islands; `'+14155550000'` -> United States.

## Known bugs and gaps
- `api/tax-rules/route.ts:6-8` comment says VAT scorer and compliance calendar use this table; they do not (hard-coded in their pages). Only `ComplianceSnapshot` consumes it.
- Duplicated, diverging numbers: catalog `tax` strings (`jurisdictions.ts:24,40,55,70,85,100`) vs seeded DB rates (Singapore catalog "5% Corporate" vs DB 17%; Hong Kong "0% on Foreign" vs 8.25%) vs calculator tables (see [tool-tax-calculator](tool-tax-calculator.md)). Hong Kong display price "$2,000" (`jurisdictions.ts:39`) vs seeded `150000` cents = $1,500 (`seed.ts:22`) although the seed comment claims HK is the only confirmed price.
- `ComplianceSnapshot` applies the corporate rate to total revenue and ignores `threshold_amount` and the UAE 0%-below-threshold note (`:107`); the HK rule "within 1 month of..." matches the regex `(\d+) months?` as 1 month after FYE (wrong), and the Singapore rule falls back to raw text.
- Seed comment "see convention note above" (`seed.ts:39`) refers to a note that does not exist; schema comment (`schema.ts:235`) is the only convention source.
- All tax data are unverified placeholders; the snapshot must not ship to real users without review (comment `seed.ts:32-34`).
- No unique index on (jurisdiction, tax_type); `JurisdictionId` `bvi` label says "BVI & Cayman" but Cayman is not a DB enum value.
- `/api/countries` appears to have no in-repo consumer (unverified).

## Change guide
- Change a rate/deadline: edit `TAX_RULES` in `scripts/seed.ts` and re-run seed (updates in place), or update rows via admin SQL. Keep `rate_percent` x100 and `threshold_amount` in minor units.
- Add a jurisdiction: extend the enum in `schema.ts` (tax rules, companies, pricing, leads all repeat it - grep `'uae', 'hong-kong'`), generate a migration ([database-and-migrations](database-and-migrations.md)), add to `JURISDICTIONS`, add seed rows, check `ComplianceSnapshot`.
- Add a country: append to `COUNTRIES` (keep ISO2 unique; priority block is the first 21). Dial-code collisions: keep longer codes resolvable by `findCountryByDialCode`.
- Prefer a single source: have tools read `/api/tax-rules` instead of in-page constants.
- Update `docs/ai/modules/lead-gen-tools.md` and CODEMAP after changes.

## Related features
[tool-tax-calculator](tool-tax-calculator.md), [tool-vat-scorer](tool-vat-scorer.md), [tool-compliance-calendar](tool-compliance-calendar.md), [service-catalog-and-checkout](service-catalog-and-checkout.md), [admin-pricing-configurator](admin-pricing-configurator.md), [client-dashboard](client-dashboard.md), [database-and-migrations](database-and-migrations.md)
