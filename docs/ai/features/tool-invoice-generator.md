# Feature: Invoice Generator

**Slug**: tool-invoice-generator   **Area**: [lead-gen-tools](../modules/lead-gen-tools.md)   **Status**: stub (UI only; "generation" is a fake 800 ms timeout, no PDF)   **Last verified against code**: 2026-10-30

## What it does
A public form (company name, jurisdiction, trade licence no., invoice number, client, dynamic line items) with a running dollar total and a "Generate Invoice PDF" button. Pressing it shows a spinner for 800 ms and then a success screen "Invoice INV-xxxxxx for <company> is ready" with "Download PDF" and "Copy Link" buttons. Those buttons have no handlers and no PDF is ever produced, uploaded or stored. Intended audience: existing/prospective customers who invoice their own clients.

## Entry points
- UI: `/tools/invoice-generator` (`src/app/tools/invoice-generator/page.tsx`, client component `InvoiceGenerator`).
- Linked ONLY from the dashboard Quick Services tile "Invoice Gen" (`src/app/(authenticated)/dashboard/page.tsx:517`). It is NOT in the `/tools` index grid (`src/app/tools/page.tsx:16-27` lists 10 tools, none is invoice-generator). The route itself is public (`/tools/*` not in `PROTECTED_PREFIXES`, `src/middleware.ts:34-44`).
- API: none.

## Files
- `src/app/tools/invoice-generator/page.tsx:7-156` - entire feature.
- `src/lib/pdf.tsx:64-69` - `generateToolPDF` exists but is not called here (comment at `page.tsx:35-36` says "in production this would call @react-pdf/renderer").
- `src/lib/db/schema.ts:308-321` - `leads.source_tool` enum has NO `invoice_generator` value; `schema.ts:52-88` `companies` has `company_name`, `jurisdiction`, `trade_license_number` that could prefill.

## Request / response contract
none.

## Step-by-step flow
1. State (`:8-15`): `companyName`, `jurisdiction` (default `"UAE Freezone"`), `tradeLicense`, `clientName`, `invoiceNumber` (initial `INV-${Date.now().toString().slice(-6)}`), `items = [{description:'', amount:''}]`, `generated`, `loading`.
2. Line items: `addItem` appends a blank row (`:17`); `removeItem` filters by index only when more than 1 row (`:19-21`, ✕ button shown only when `items.length > 1`, `:107`); `updateItem` (`:23-27`) shallow-copies the array then mutates the row object in place.
3. `subtotal = sum(parseFloat(item.amount) || 0)`; `total = subtotal` (`:29-30`). Displayed with `$` and `toFixed(2)` (`:118-120`).
4. Submit button disabled when `loading || !companyName` (`:124`). `handleGenerate` (`:32-41`) sets loading, then `setTimeout(800)` sets `generated=true`.
5. Success screen (`:129-148`): shows invoice number and company only. "Create Another Invoice" sets `generated=false` and resets `items` only (company, client, licence, jurisdiction and `invoiceNumber` persist).

## Data
Nothing read or written server-side. Nothing persisted client-side. Client/line-item data is lost on refresh.

## Business rules and constants
- Jurisdiction options (`:43`): `UAE Freezone, UAE Mainland, Hong Kong, Singapore, Bahrain, BVI, Cayman Islands`. These are free-text labels, not `JurisdictionId` values (`src/lib/jurisdictions.ts:1`); Cayman is here but not in the DB enum (`schema.ts:57`).
- Currency is hard-coded `$`. No VAT/tax line, discount, due date, issue date, quantity, unit price, or bank details. Footer copy promises "company name, jurisdiction, trade license, and a professional GCCStartup-branded layout" (`:152`) which does not exist.
- Default invoice number: `INV-` + last 6 digits of `Date.now()`.

## Auth, permissions, security
Public; no server calls. No protected zone. If wired to PDF, route `/api/pdf/generate` is unauthenticated and keyed on `lead_id` (see [tool-result-pdf-and-email](tool-result-pdf-and-email.md)); an authenticated route would be needed for per-user history.

## Failure modes and edge cases
- Download/Copy Link buttons are inert (`:137-144`); user believes an invoice exists. Highest-impact defect.
- Negative or non-numeric amounts accepted (`type="number"` only); `NaN` coerced to 0. Required field is only company name; client and items can be empty.
- `useState` initializer calls `Date.now()` (`:12`): server-rendered HTML and client hydration produce different values -> likely React hydration mismatch warning on the invoice-number input (unverified at runtime).
- Row key is index (`:104`): removing a middle row can mis-associate input focus.
- `updateItem` mutates state objects (`:25`); works but breaks under strict immutability/memo.

## Tests
None. Worth writing once logic is extracted to `src/lib/invoice.ts`:
1. Items `[{amount:'100.50'},{amount:'abc'},{amount:''}]` -> subtotal 100.5.
2. `removeItem` on a single-row list -> list unchanged.
3. Submit with empty `companyName` -> button disabled, `generated` false.
4. After "Create Another Invoice": items reset to one blank row (documents that `companyName` persists).
5. (After wiring) POST generate -> returns a URL; Download opens PDF containing every line item and the correct total.
6. (After wiring) invoice numbers increment per user and never repeat.

## Known bugs and gaps
- Fake generation; buttons inert (`:35-41`, `:137-144`).
- Missing from `/tools` grid (`tools/page.tsx:16-27`) while reachable from dashboard (`dashboard/page.tsx:517`); AGENTS.md "10 tools" count vs 11 pages.
- Not a lead tool: no `source_tool` enum value, no capture.

## Making it a stateful habit tool (assessment; nothing below exists today)
Today: zero persistence, zero server code, zero saved clients/history. Cheapest path, in order:
1. Add `invoices` + `invoice_clients` tables (user_id/company_id FK, client name/address/tax id, invoice number sequence per company, line items jsonb, currency, tax rate, status draft/sent/paid, issued/due dates, r2 key). Needs a Drizzle migration (see [database-and-migrations](database-and-migrations.md)).
2. Gate the page behind login (move under `(authenticated)` or add `/tools/invoice-generator` to `PROTECTED_PREFIXES`), prefill from `companies` (`company_name`, `trade_license_number`, `jurisdiction`) so setup is zero-typing.
3. Extend `src/lib/pdf.tsx` with an invoice layout (current `ToolResultDocument` only prints label/value rows), store the PDF in R2 and return a presigned URL; optionally reuse share links ([share-links](share-links.md)) for "Copy Link".
4. Habit hooks: saved clients autocomplete, auto-incrementing numbers, "duplicate last invoice", history list, overdue reminders via [in-app-notifications](in-app-notifications.md) / [whatsapp-outbound](whatsapp-outbound.md).

## Change guide
- Quick fix with no backend: remove the fake success and either disable the buttons with "coming soon" or implement client-side `window.print()` as in compliance-calendar.
- Add the tile to `TOOLS` in `src/app/tools/page.tsx` if it should be public-discoverable (or remove from the dashboard if not ready).
- Keep money as integer cents when persisting (project convention in `schema.ts`), not floats.
- Update `docs/ai/modules/lead-gen-tools.md` tool table (currently says "simulated").

## Related features
[tool-result-pdf-and-email](tool-result-pdf-and-email.md), [client-dashboard](client-dashboard.md), [tool-nda-generator](tool-nda-generator.md), [vault-upload](vault-upload.md)
