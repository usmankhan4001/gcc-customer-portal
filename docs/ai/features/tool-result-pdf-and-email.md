# Feature: Tool Result PDF and Email

**Slug**: tool-result-pdf-and-email   **Area**: [lead-gen-tools](../modules/lead-gen-tools.md)   **Status**: partial (backend + button component built; no page uses them, so unreachable from the UI today)   **Last verified against code**: 2026-10-30

## What it does
Turns a tool result (title, optional subtitle, list of label/value rows) into a one-page branded A4 PDF, stores it privately in Cloudflare R2, records the object key on the lead row, and returns a 7-day presigned download URL. Optionally emails the lead a "Download PDF" link via Resend. It is designed to be called by `PDFDownloadPanel` on lead-gen tool result screens, but no tool page renders that component.

## Entry points
- API: `POST /api/pdf/generate` (`src/app/api/pdf/generate/route.ts:20`). Public path (`/api/` prefix bypasses auth in `src/middleware.ts:5-6`).
- Client: `src/components/portal/PDFDownloadPanel.tsx` (buttons "Download PDF" and, if `hasEmail`, "Email me this").
- Which tools can reach it: none today. `grep` finds no importer of `PDFDownloadPanel` outside the dev style-guide text (`src/app/dev/style-guide/page.tsx:277`). Tool pages (tax-calculator, quiz, banking-odds, vat-scorer, visa-estimator, name-checker, qfzp, ubo-privacy, nda, compliance-calendar, invoice) never call `/api/leads/capture` or `/api/pdf/generate`. Any tool could reach it only by first creating a lead and passing its `lead.id`.

## Files
- `src/app/api/pdf/generate/route.ts:1-55` - handler.
- `src/lib/pdf.tsx:5-22` styles, `:24-35` types `PDFRow`/`GenerateToolPDFParams`, `:37-62` `ToolResultDocument`, `:64-69` `generateToolPDF`.
- `src/lib/r2.ts:38-52` `getPresignedDownloadUrl`, `:54-71` `uploadBuffer`.
- `src/lib/email.ts:247-285` `sendToolResultEmail`; `:15` `FROM_ADDRESS = 'noreply@gccstartup.com'`; lazy `getResend()` `:8-11`.
- `src/components/portal/PDFDownloadPanel.tsx:15-60`.
- `src/app/api/leads/capture/route.ts` - the only source of a valid `lead_id` (returns `{lead: row}` with id and email).
- `src/lib/db/schema.ts:304-324` `leads` (`source_tool` enum, `pdf_r2_key`).

## Request / response contract
`POST /api/pdf/generate`, JSON body:
| field | type | required | validation actually enforced |
|---|---|---|---|
| `lead_id` | string (uuid) | yes | truthy only |
| `title` | string | yes | truthy only |
| `subtitle` | string | no | none |
| `rows` | `{label:string, value:string}[]` | yes | `rows?.length` truthy (a non-empty string also passes) |
| `email_it` | boolean | no | none |
Responses:
- 200 `{ "url": "<presigned R2 GET URL, 604800 s>" }`.
- 400 `{ "error": "lead_id, title, and rows are required" }`.
- 404 `{ "error": "Lead not found" }` (valid uuid, no row).
- 500 `{ "error": "Internal server error" }` for everything else, including malformed JSON, a non-uuid `lead_id` (Postgres cast error, not 404), bad `rows` shape, R2 failure, DB failure, or Resend failure. Details are only in `console.error('[api/pdf/generate] Error:')` (`:52`).
No cookies read or set; no auth.

## Step-by-step flow
1. Parse body, validate presence (`route.ts:22-27`).
2. Load lead by id (`:29`); 404 if missing.
3. `generateToolPDF({title, subtitle, rows, disclaimer: DISCLAIMER, r2KeyPrefix: 'pdfs/' + lead.source_tool})` (`:34-40`). Inside: `renderToBuffer(<ToolResultDocument/>)` then key `pdfs/<source_tool>/<Date.now()>-<4 random bytes hex>.pdf` and `uploadBuffer(key, buffer, 'application/pdf')` (`pdf.tsx:64-69`).
4. `UPDATE leads SET pdf_r2_key = key WHERE id = lead.id` (`:42`). Previous key (if any) is overwritten; the old object stays orphaned in R2.
5. `getPresignedDownloadUrl(key, 604800)` (`:44`).
6. If `email_it && lead.email`: `sendToolResultEmail(lead.email, title, url)` (`:46-48`): subject `Your ${title} — GCC Startup`, HTML with header `${title}`, button "Download PDF" to the URL, text "This link expires in 7 days." If the lead has no email the flag is silently ignored.
7. Return `{url}` (`:50`).
Client (`PDFDownloadPanel.tsx:19-36`): posts the body; for download it does `window.open(data.url, '_blank')`; for email it sets `emailed=true` regardless of response status.

## Data
- Reads `leads` (by id). Writes `leads.pdf_r2_key`. Does not touch `tool_result`/`tool_input`; the PDF content is whatever the caller sends, not what was stored on the lead.
- R2 objects at `pdfs/<source_tool>/...pdf`; `source_tool` values: `tax_calculator, banking_odds, nda_generator, jurisdiction_quiz, vat_scorer, ubo_privacy, compliance_calendar, visa_estimator, name_checker, qfzp_eligibility` (`schema.ts:309-320`). No `invoice_generator` value.

## Business rules and constants
- Presigned URL TTL: `60*60*24*7` (`route.ts:44`); email copy says "expires in 7 days" (`email.ts:274`). Default `getPresignedDownloadUrl` TTL is 3600 (`r2.ts:40`).
- Disclaimer text constant at `route.ts:17-18` (the module doc's `:302` reference is wrong).
- PDF layout (`pdf.tsx`): A4, padding 40, Helvetica 11 pt; header band `#0A2540` with brand "GCCStartup" in `#C9A84C`, title 20 pt, subtitle 11 pt; rows are label (grey `#5A6178`) left and bold value right with 1 px bottom border; disclaimer 9 pt; footer "Generated by GCCStartup — <toLocaleDateString()>" absolutely positioned at bottom 30. Single `<Page>` with no pagination guard: many rows overflow to additional automatic pages but the absolute footer repeats per page (react-pdf behavior, unverified).
- `generateToolPDF` is the shared function; key prefix is caller-supplied, so other routes could reuse it.

## Auth, permissions, security
- No authentication or authorization. Anyone who knows or obtains a lead UUID can: generate arbitrary-titled PDFs under `GCCStartup` branding (phishing-grade), overwrite `leads.pdf_r2_key`, write unlimited objects to R2 (no row/size cap on `rows`), and trigger emails to that lead. `/api/leads/capture` returns the full lead row (including id and email) to any caller, so ids are obtainable for leads you create yourself; for others they are unguessable v4 UUIDs.
- `title` is interpolated unescaped into email HTML and the subject (`email.ts:256`, `:264`), and `downloadUrl` into an href (`:269`). HTML injection into mail sent from `noreply@gccstartup.com` to the lead.
- Bucket stays private; only presigned URLs are returned (consistent with AGENTS.md). R2 files are not routed through the vault zone.

## Failure modes and edge cases
- If email fails after PDF/DB success, the route returns 500 although the PDF exists and `pdf_r2_key` is updated; `sendToolResultEmail` rethrows (`email.ts:281-284`). `RESEND_API_KEY` missing -> the Resend constructor throws at first call (lazy `getResend()`, `email.ts:8-11`), which lands in the same catch and also becomes a 500 after the PDF and DB update succeeded.
- `PDFDownloadPanel` does not check `res.ok`; on 4xx/5xx the email button still turns to "Emailed", and download does nothing (no error UI). `window.open` after an `await` can be blocked by popup blockers.
- Non-Latin text (Arabic, CJK) with built-in Helvetica will likely not render (unverified; no font registration in `pdf.tsx`).
- Large `rows`, non-string label/value: react-pdf render error -> 500.
- `Date.now()` + 4 random bytes makes key collisions practically impossible.

## Tests
None. Worth writing:
1. Body without `lead_id` -> 400 with the exact message.
2. Valid uuid not in DB -> 404 `Lead not found`.
3. Valid lead, `email_it:false` (mock R2 `uploadBuffer`, `getPresignedDownloadUrl`) -> 200 `{url}`; `leads.pdf_r2_key` matches `^pdfs/<source_tool>/\d+-[0-9a-f]{8}\.pdf$`.
4. `email_it:true` with lead.email set -> `sendToolResultEmail` called once with (email, title, url); with email null -> not called, still 200.
5. `sendToolResultEmail` throws -> expect 200 with url once fixed (currently 500).
6. `lead_id:"not-a-uuid"` -> expect 400/404 once validated (currently 500).

## Known bugs and gaps
- Feature unreachable: `PDFDownloadPanel` has no importer; tools never create leads (see module doc).
- Unauthenticated, unbounded endpoint (`route.ts:20-55`); HTML injection in email (`email.ts:256-269`); email failure causes 500 after side effects (`route.ts:46-48`).
- PDF content is client-supplied, not derived from the stored lead result.
- No Arabic font support evidence; single-page template only; no invoice/NDA layout.

## Change guide
- To wire a tool: POST `/api/leads/capture` (see [lead-capture-and-persona](lead-capture-and-persona.md)) with a `source_tool` from the enum, keep `lead.id`, then render `<PDFDownloadPanel leadId title rows hasEmail />` on the result screen.
- Harden: validate uuid + `rows` shape/size (e.g. zod), escape HTML in `email.ts`, wrap email in its own try/catch, add rate limiting, or derive rows server-side from `lead.tool_result`.
- New `source_tool` (e.g. invoice) requires a schema enum change and migration ([database-and-migrations](database-and-migrations.md)).
- `pdf.tsx` imports `@react-pdf/renderer`; keep it server-only (`output: 'standalone'` in `next.config.mjs`).

## Related features
[lead-capture-and-persona](lead-capture-and-persona.md), [transactional-email](transactional-email.md), [tool-tax-calculator](tool-tax-calculator.md), [tool-invoice-generator](tool-invoice-generator.md), [vault-download](vault-download.md)
