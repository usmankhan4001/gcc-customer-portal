# Feature: Document Locker v1

**Slug**: document-locker   **Spec**: docs/specs/017-document-locker-v1.md   **Last verified against code**: 2026-10-30

## What it does (3 sentences max)
Organizes client and corporate legal documents into structured corporate kit folders (`incorporation_kit`, `tax_records`, `kyc_identification`, `compliance_filings`) with status badges and date sorting. Checks completeness of essential corporate incorporation documents per jurisdiction (UAE, HK, SG, BH, IE, BVI) and displays actionable alerts when required records are missing. Provides bank-grade 1-click presigned downloads and sharing links within the authenticated client portal.

## Where it lives
- Pages / routes: `src/app/(authenticated)/vault/page.tsx`
- API routes (methods, auth required): `GET /api/vault/[id]/download` (session cookie required; 1-hour presigned URL), `POST /api/vault/share` (session cookie required; 7-day shareable token), `POST /api/vault/presign` (session cookie required; 15-minute S3 upload presign)
- Components: `src/components/portal/DocumentLocker.tsx`, `src/components/portal/DownloadButton.tsx`, `src/components/portal/ShareButton.tsx`, `src/components/portal/VaultUploader.tsx`
- lib modules: `src/lib/vault/locker.ts`
- DB tables / columns: `documents` (`id`, `user_id`, `company_id`, `file_name`, `category`, `status`, `expiry_date`, `created_at`, `file_size_bytes`), `companies` (`id`, `jurisdiction`, `official_kyc_completed`, `official_kyc_reference`)
- Env vars / external services: Cloudflare R2 (`R2_ENDPOINT`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`)

## Behavior and rules
- Four canonical corporate folders: `incorporation_kit` (trade license, certificate of incorporation, MOA/AOA, share certs, good standing), `tax_records` (TRN/TIN, VAT, corporate tax filings, bank confirmations), `kyc_identification` (passport copies, proof of address, UBO declarations), and `compliance_filings` (annual returns, ESR filings, audited financials).
- Status badges: `'verified'` (valid active document), `'pending_review'` (superseded, archived, or pending staff review), `'expired'` (expiry date in the past relative to current timestamp), and `'missing_essential'` (flagged missing requirement).
- Essential document requirements are enforced per jurisdiction (e.g. Trade License, MOA/AOA, and Share Certificate for UAE; CI, BRC, Articles, and Register of Directors for HK). Missing essential items produce a visible banner in the client portal.
- Zero raw R2 storage URLs are ever leaked; downloads generate short-lived presigned download URLs (1 hour).

## Data flow
1. User navigates to `/vault` where the server component loads their active documents from `documents` table and company jurisdiction from `companies`.
2. Pure logic in `src/lib/vault/locker.ts` classifies documents into folders, computes status badges, and checks essential documents for the company's jurisdiction.
3. If essential incorporation documents are missing, `DocumentLocker.tsx` renders a prominent amber alert banner listing the missing items.
4. Users filter documents by category tab or search keyword, and trigger 1-click downloads via `/api/vault/[id]/download` or create share links via `/api/vault/share`.
5. Clients can upload additional records using `VaultUploader`, triggering automatic re-categorization into the locker.

## Tests
- `src/lib/vault/locker.test.ts`: Proves document categorization across all folders, database category enum mappings, file_name keyword heuristics, status badge computation (expired, pending, verified), jurisdiction-specific essential document completeness checks, date sorting immutability, and file size formatting (29 unit tests).

## Protected-zone touchpoints
- `src/lib/r2.ts`: Used via `/api/vault/[id]/download` for secure 1-hour presigned URL generation (protected file unchanged).
- `src/app/api/vault/`: Protected vault API endpoints approved for Document Locker download and upload.

## Known gaps / extension points
- Direct multi-file ZIP archive bundle download for complete corporate kit export.
- Integration with external government registers for automated certificate validation.
