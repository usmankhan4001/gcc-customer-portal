# Module: Vault and Documents
**Last verified against code**: 2026-10-30

## Purpose
Private per-user document vault backed by Cloudflare R2: clients upload via presigned PUT URLs, download via presigned GET URLs, and share a document through a 7-day token link. Admin KYC review of documents exists only as a mock endpoint.

## Files
- src/app/(authenticated)/vault/page.tsx - server page; lists the user's `active` documents grouped by category
- src/app/vault/shared/[token]/page.tsx - public (token) shared-document page; NOT under the (authenticated) group
- src/app/api/vault/presign/route.ts - creates `documents` row + presigned upload URL
- src/app/api/vault/[id]/download/route.ts - returns presigned download URL, logs access
- src/app/api/vault/share/route.ts - creates `shareable_links` row, returns share URL
- src/app/api/admin/kyc/review/route.ts - admin KYC review (mock, no DB)
- src/lib/r2.ts - S3 client + `getPresignedUploadUrl`, `getPresignedDownloadUrl`, `uploadBuffer`, `deleteFile`
- src/components/portal/VaultUploader.tsx, DownloadButton.tsx, ShareButton.tsx - client UI for the three flows
- Other r2 callers: src/lib/pdf.tsx, src/app/api/pdf/generate/route.ts, src/app/api/companies/good-standing/route.tsx

## Routes and API
- GET /vault - session (middleware prefix /vault); `getServerSession()` filters by user
- GET /vault/shared/[token] - public by design (middleware PUBLIC_PATHS '/vault/shared/', src/middleware.ts:15); token is the only auth
- POST /api/vault/presign - `gcc_session` cookie verified in handler
- GET /api/vault/[id]/download - session; owner, or role admin/super_admin
- POST /api/vault/share - session; owner only (no admin override)
- POST /api/admin/kyc/review - `Authorization: Bearer <jwt>` header, role must be exactly `admin` (not super_admin); not the cookie / `requireAdmin()` pattern

## Data
- `documents`: user_id, company_id, file_name, r2_key, category (trade_license|moa_aoa|share_certificate|tax_certificate|nominee_poa|bank_document|other), mime_type, file_size_bytes, status (active|archived|superseded), expiry_date, uploaded_by.
- `document_versions`: document_id, version_number, r2_key, file_name, uploaded_by - written only by presign when replacing.
- `shareable_links`: document_id, token (unique), expires_at, created_by, access_count, revoked.
- `document_access_log`: document_id, accessed_by (nullable), action (viewed|downloaded), accessed_at.
- `companies`: read to attach latest non-`lead` company to the document.

## External services and env vars
- Cloudflare R2 (S3 API): R2_ENDPOINT, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME. AGENTS.md lists R2_ACCOUNT_ID but code never reads it; code needs R2_ENDPOINT/R2_BUCKET_NAME (in .env.example). NEXT_PUBLIC_APP_URL for share URL. WhatsApp vars appear only in the commented-out KYC dispatch.

## Key flows
1. Upload: VaultUploader picks category + file -> POST /api/vault/presign {category,file_name,file_size,mime_type,expiry_date?} -> server inserts `documents` (status active) and returns `{document_id, upload_url, r2_key, expires_in_seconds:900}` -> browser PUTs file straight to R2 -> `router.refresh()`.
2. Replace: if an `active` document of the same company+category exists, presign writes a `document_versions` row (old key, version = latest+1, default 2) and sets the old document `superseded`, BEFORE the new file is uploaded.
3. Download: DownloadButton -> GET /api/vault/[id]/download -> `{url}` (presigned GET, 3600 s) + `document_access_log` row 'downloaded' with accessed_by = user -> `window.open(url)`.
4. Share: ShareButton -> POST /api/vault/share {document_id} -> 48-hex-char token (`randomBytes(24)`), expires now+7 days -> returns `${NEXT_PUBLIC_APP_URL}/vault/shared/<token>`, copied to clipboard.
5. Open share link: page queries link by token AND not revoked AND `expires_at > now`; else "Link expired or invalid". Valid -> presigned GET (3600 s) rendered as a Download anchor, access log 'viewed' (accessed_by NULL), `access_count + 1`.
6. KYC review (mock): admin POST {document_id,status,rejection_reason,notify_whatsapp} -> validates, logs to console, returns success. Nothing is stored.

## Business rules and invariants
- Max upload 25 MB (presign/route.ts:29); presign TTL 900 s (line 28); download TTL default 3600 s (r2.ts:121); share TTL `LINK_TTL_DAYS = 7` (share/route.ts:9).
- r2 key format: `vault/<userId>/<yyyy>/<mm>/<Date.now()>_<sanitised name>` (name sanitised to `[a-zA-Z0-9._-]`).
- No password protection on share links (no column, no code). No MIME/extension allow-list: any `mime_type` string is accepted. Category is cast `as any` and not validated (invalid value would fail at DB insert -> 500).
- Link revocation: `revoked` is checked on read but no endpoint sets it.

## Security notes
- PROTECTED ZONE (AGENTS.md 5): src/lib/r2.ts and src/app/api/vault/** - human approval required before editing.
- Raw R2 URLs: never stored or returned as plain object URLs; the app only hands out SigV4-presigned URLs (upload 15 min, download 1 h). The presigned URL still reveals the R2 endpoint/bucket/key path (and `r2_key` is returned in the presign response), but is time-limited. No public bucket URL in code. Bucket-level public access is unverified.
- Shared page issues a fresh 1 h presigned URL on each view: a shared file stays fetchable up to 1 h after link expiry/revocation if the URL was already obtained.
- Download route returns 404 (not 403) for non-owners (good); admin override is role-string match.
- Download and share ignore `documents.status`, so `superseded`/`archived` files remain downloadable/shareable by id.
- Shared-link views log `accessed_by = NULL`, and no per-IP info is recorded. The shared page route does a DB write on GET (access_count is a non-atomic read-modify-write).
- Inconsistent admin auth: kyc/review uses a Bearer header and `role !== 'admin'` (super_admin rejected) instead of `requireAdmin()` required by AGENTS.md section 3.4.
- presign S3Client is re-created in the route instead of reusing r2.ts.

## Tests
none (no vault/r2 tests exist).

## Known gaps and suspicious things
- /api/admin/kyc/review is a stub: DB update and WhatsApp send are commented out, phone number hard-coded `971500000000`, returns fake `wamid.mock.*` id. It does not touch `documents.status` and `documents` has no rejection/review columns.
- Presign creates the `documents` row (and supersedes the old one) before the upload happens; a failed or abandoned PUT leaves a dangling active row pointing to a missing object, and the previous version is already superseded.
- No size verification after upload; `ContentLength` is signed but `file_size` is client-declared.
- Vault page lists only `status = active` and the folder cards are not clickable filters.
- Documents are not scoped by company on the vault page (by user_id only).
- Whether the shared page leaks `file_name` to anyone with the token: yes (rendered as title).

## Change guide
- Add a document category: schema enum (schema.ts:100), VaultUploader CATEGORIES, vault page CATEGORY_LABELS, then `npm run db:generate`.
- Add link revocation/passwords: add columns in schema.ts, a new route under api/vault, enforce in shared page query; needs human approval (protected zone).
- Implement real KYC review: replace mock with `requireAdmin()`, update `documents`/`companies.official_kyc_completed`, use `src/lib/whatsapp.ts` `sendWhatsAppMessage`, insert `notifications`.
- Pitfall: never log or return a plain `https://<bucket>.r2...` URL; keep TTLs short; keep `/vault/shared/` in middleware PUBLIC_PATHS but nothing else under /vault.
