# Feature: Vault upload

**Slug**: vault-upload   **Area**: [vault-and-documents](../modules/vault-and-documents.md)   **Status**: partial   **Last verified against code**: 2026-10-30

## What it does
A client picks a category and a file on `/vault`; the browser asks the server for a presigned R2 PUT URL, then uploads the file directly to Cloudflare R2. The server creates the `documents` row at presign time, and if an active document of the same company and category exists it archives it as a version and marks it `superseded`. The page refreshes to list the user's active documents.

## Entry points
- UI: `/vault` (`(authenticated)/vault/page.tsx`) with `VaultUploader` (client).
- API: `POST /api/vault/presign`. Then browser `PUT <upload_url>` directly to R2.

## Files
- `src/app/api/vault/presign/route.ts:31-140` - endpoint; own S3 client (18-25) separate from `lib/r2.ts`.
- `src/components/portal/VaultUploader.tsx:17-91` - category select + hidden file input; flow 24-63.
- `src/app/(authenticated)/vault/page.tsx:22-128` - list (status `active`, by user_id), folder counts, Share/Download buttons.
- `src/lib/db/schema.ts:94-131` documents, document_versions; `:52` companies.
- `src/lib/r2.ts:20-36` `getPresignedUploadUrl` exists (3600 s, no ContentLength) but presign route does not use it.

## Request / response contract
`POST /api/vault/presign` (cookie `gcc_session`).
- Body: `category` (string, required, NOT validated against enum), `file_name` (required), `file_size` (number, required, truthy, > 0 implicitly, max 25 MB), `mime_type` (required, any string), `expiry_date` (optional, ISO string -> `new Date()`; invalid date string yields Invalid Date -> DB error 500).
- 200: `{document_id, upload_url, r2_key, expires_in_seconds: 900}`.
- 401 `{error:'Unauthorized'}`. 400 `{error:'Missing required fields: category, file_name, file_size, mime_type'}`. 400 `{error:'File size exceeds maximum of 25MB'}`. 500 `{error:'Internal server error'}` on any thrown error (DB, invalid `expiry_date`). An invalid `category` does NOT 500: schema columns are `text` with a TS-only enum, so any string is stored (the module doc's claim of a DB failure is wrong; inferred from schema.ts:100, no DB enum/check shown).
- R2 PUT response is outside this API (browser checks `putRes.ok` only).

## Step-by-step flow
1. VaultUploader `handleFileChange` (24): POST presign with `file.name`, `file.size`, `file.type || 'application/octet-stream'`, selected category (default `other`).
2. presign:33-38 verify cookie.
3. :43-55 required-field check and 25 MB check using the client-declared size.
4. :57-62 find company: latest by `created_at` for this user with `status <> 'lead'`; may be none.
5. :64-68 key = `vault/<userId>/<yyyy>/<mm>/<Date.now()>_<name with [^a-zA-Z0-9._-] -> _>` (local server time).
6. :72-84 if company found: SELECT first `documents` with same `company_id`, same `category`, `status='active'`. (No company -> skip versioning entirely.)
7. :86-103 if found: SELECT max `version_number` from `document_versions` for it; INSERT `document_versions` {document_id: existing.id, version_number: (latest ?? 1)+1, r2_key: existing.r2_key, file_name: existing.file_name, uploaded_by}; UPDATE existing `documents` SET status='superseded'. (First supersede therefore creates version 2 holding the old file; there is never a version 1 row.)
8. :105-119 INSERT new `documents` {user_id, company_id (maybe undefined), file_name (original, unsanitised), r2_key, category, mime_type, file_size_bytes, status 'active', expiry_date, uploaded_by} RETURNING.
9. :121-128 presign `PutObjectCommand` {Bucket, Key, ContentType: mime_type, ContentLength: file_size}, `expiresIn: 900`.
10. Browser PUTs the file with header `Content-Type: file.type || octet-stream` (must equal signed ContentType, else R2 rejects with SignatureDoesNotMatch). `router.refresh()` on success.

## Data
Writes: `documents` (all columns above), `document_versions` (only on replace). No `document_access_log` row on upload. Not stored: checksum, upload-complete flag, rejection/review fields. `document_versions` rows hold the OLD key under the OLD document id; the superseded document row itself keeps its own r2_key, so the key is duplicated in both tables.

## Business rules and constants
- Max size 25 MB (`MAX_FILE_SIZE = 25*1024*1024`, :29). Presign TTL 900 s (:28).
- Categories (UI and TS enum): trade_license, moa_aoa, share_certificate, tax_certificate, nominee_poa, bank_document, other (VaultUploader.tsx:7-15, schema.ts:100-109).
- Allowed file types: none enforced anywhere (no MIME or extension allow-list server or client; file input has no `accept`).
- Replacement rule: same company_id + category + status active. Documents without a company are never superseded.

## Auth, permissions, security
PROTECTED ZONE (AGENTS.md section 5): `src/lib/r2.ts`, `src/app/api/vault/**`. Any authenticated user (any role) may upload for themselves only; `user_id` comes from the JWT. Key path embeds userId so the signed URL can only write that key. Client-declared `file_size`/`mime_type` are signed into the URL (ContentLength/ContentType), so R2 enforces the declared size, but the declared size is not independently checked. Original `file_name` stored raw and later rendered on the shared page (React escapes it).

## Failure modes and edge cases
- **Ordering bug (confirmed)**: step 7 supersedes the previous active document and step 8 inserts the new row BEFORE any bytes reach R2. If the PUT fails, expires (15 min), the tab closes, or R2 is down, the old document is already `superseded` (vanishes from the vault list, which shows only `active`) and the new `active` row points to a non-existent object. Download of it returns a presigned URL that 404s at R2 (route does not HEAD the object). No cleanup job and no confirm endpoint exist.
- Supersede + version + insert are three separate statements, not a transaction: a crash between them can leave the old doc superseded with no new doc.
- Concurrent uploads in same category can both see the same `existing` and write duplicate version numbers.
- Failure of presign after supersede (e.g. `getSignedUrl` throws due to missing R2 env): 500 and the old doc is already superseded.
- R2 env missing: `new S3Client` is created at import with `process.env.R2_ENDPOINT!`; error surfaces at first request.
- UI shows only generic error text on failure; orphan rows remain.

## Tests
None. Write: (1) no cookie -> 401; (2) `file_size` 25MB+1 -> 400; (3) missing mime_type -> 400; (4) first upload for company with no prior doc -> 1 documents row, 0 versions; (5) second upload same category -> old doc status `superseded`, version_number 2 with old key (current behaviour) and, after the fix, still `active` until a confirm step; (6) upload_url contains the key prefix `vault/<userId>/` and `X-Amz-Expires=900`; (7) key sanitisation of `../a b.pdf`.

## Known bugs and gaps
- Supersede-before-upload ordering (presign/route.ts:86-119); no upload confirmation.
- No MIME/extension allow-list; any file type (including html/exe) accepted.
- `category` unvalidated (any string stored; vault page labels fall back to raw value).
- `file_size` trusted; version numbering starts at 2.
- Document not tied to company when user has only lead companies (company_id null).
- Vault page folder cards are not clickable despite `cursor-pointer`.
- Module doc says invalid category -> 500: incorrect (see contract).

## Change guide
To fix ordering: make presign create the new row with a pending state (add status or `uploaded_at`), add `POST /api/vault/confirm` that HEADs the object (S3 `HeadObjectCommand`) and then supersedes the old doc in one transaction. Add allow-list (pdf, png, jpeg, docx) in route AND `accept` attr in VaultUploader. Validate category against the enum array. Reuse `lib/r2.ts` client. New categories: schema, VaultUploader CATEGORIES, vault page CATEGORY_LABELS, `npm run db:generate`. Protected zone: human approval.

## Related features
[vault-download](vault-download.md), [share-links](share-links.md), [kyc-review](kyc-review.md), [client-dashboard](client-dashboard.md), [service-catalog-and-checkout](service-catalog-and-checkout.md)
