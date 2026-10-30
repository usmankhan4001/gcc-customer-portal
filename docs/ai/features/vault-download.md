# Feature: Vault download and list

**Slug**: vault-download   **Area**: [vault-and-documents](../modules/vault-and-documents.md)   **Status**: working   **Last verified against code**: 2026-10-30

## What it does
The `/vault` page lists the signed-in user's active documents; the download icon calls `GET /api/vault/[id]/download`, which checks ownership, returns a time-limited presigned R2 GET URL and records the access. The browser opens the URL in a new tab. Admins may download any user's document through the same API.

## Entry points
- UI: `/vault` list (`src/app/(authenticated)/vault/page.tsx`), `DownloadButton` per row.
- API: `GET /api/vault/[id]/download`.

## Files
- `src/app/api/vault/[id]/download/route.ts:9-32` - endpoint.
- `src/components/portal/DownloadButton.tsx:6-38` - fetch then `window.open(data.url,'_blank')`.
- `src/lib/r2.ts:38-52` - `getPresignedDownloadUrl(key, expiresIn=3600)`.
- `src/app/(authenticated)/vault/page.tsx:22-128` - list query and rendering.
- `src/lib/db/schema.ts:94` documents, `:144` document_access_log.
- Same helper is reused by `src/app/vault/shared/[token]/page.tsx` (see [share-links](share-links.md)).

## Request / response contract
`GET /api/vault/{id}/download` (cookie `gcc_session`; no body).
- 200 `{url: "<presigned R2 GET url>"}`.
- 401 `{error:'Unauthorized'}` (no/invalid cookie).
- 404 `{error:'Not found'}` when the id does not exist OR the caller is not owner and not admin/super_admin (404, not 403, avoids revealing existence).
- Non-UUID `id`: Postgres cast error is thrown; the handler has NO try/catch, so Next returns a bare 500. Likewise R2/DB failure -> 500 default page.
- The response never contains the raw bucket URL, only the presigned URL; the `r2_key` is not returned here (it IS returned by the presign route).

## Step-by-step flow
1. :10-16 resolve `id`, read cookie, `verifyToken`; 401 if none.
2. :18 SELECT `documents` WHERE id LIMIT 1.
3. :19-21 authorize: `document.user_id === session.userId` OR `session.role in {admin, super_admin}` (role comes from the JWT claim, no DB re-check); else 404.
4. :23 `getPresignedDownloadUrl(document.r2_key)` -> SigV4 GET URL, TTL 3600 s. No `ResponseContentDisposition` so the browser decides inline vs download; no HEAD check that the object exists.
5. :25-29 INSERT `document_access_log` {document_id, accessed_by: session.userId, action:'downloaded'}. If this insert throws, the client gets 500 even though a URL was generated (URL is never returned).
6. :31 return `{url}`.
7. Client: `window.open(url,'_blank')` (popup blockers may block, since it follows an async fetch).

List page: `getServerSession()` then `SELECT * FROM documents WHERE user_id = session.userId AND status = 'active' ORDER BY created_at DESC`; folder counts grouped by category; size shown as MB with one decimal; date via `toLocaleDateString()`. No pagination or search; admins see only their own documents here.

## Data
Read: `documents` (id, user_id, r2_key, status, ...). Written: `document_access_log(document_id, accessed_by, action 'downloaded', accessed_at default now)`. `action` enum: `viewed | downloaded` (`viewed` is used by the shared-link page). Not logged: IP, user agent, admin-vs-owner distinction (admin downloads are logged with the admin's user id, which is the only way to tell).

## Business rules and constants
- Download URL TTL 3600 s (r2.ts:40 default; route passes none).
- Role strings for override: `admin`, `super_admin` (not `staff`/`operations`).
- Download ignores `documents.status`: `superseded` and `archived` documents remain downloadable by id (only the list hides them).

## Raw URL / key leak inventory
- Raw (unsigned) R2 URL: never returned or stored anywhere in the repo for vault files. Only presigned URLs are returned: download route (1 h), shared page `<a href>` (1 h, in HTML), presign upload URL (15 min).
- A presigned URL itself exposes the R2 endpoint host, bucket name and object key, and is a bearer credential until expiry; it is returned in JSON and in the shared page HTML (cacheable by proxies/browser history/Referer). It is not logged by the app.
- `r2_key` is exposed to the client in the presign response (`vault/<userId>/...`, includes the user's UUID).
- `console.error('Failed to generate presigned download URL:', error)` logs the SDK error only, not the URL.
- Bucket public access setting: unverified (not visible in repo).

## Auth, permissions, security
PROTECTED ZONE (AGENTS.md section 5): `src/app/api/vault/**`, `src/lib/r2.ts`. Ownership check is correct and uses 404. Admin override relies on JWT claim (a demoted admin retains access until token expiry, 7 d). No rate limit. A URL obtained remains valid up to 1 h after the owner deletes/supersedes the doc or the admin role is removed.

## Failure modes and edge cases
- Object missing in R2 (see [vault-upload](vault-upload.md) ordering bug): API returns 200 with a URL that 404s at R2.
- Access log insert failure -> 500 and no download.
- Missing R2 env -> signing throws -> 500.
- Large downloads go straight from R2; app is not in the data path.

## Tests
None. Write: (1) no cookie -> 401; (2) other user's doc id -> 404 and no log row; (3) owner -> 200, `url` host contains bucket/endpoint and `X-Amz-Expires=3600`, one `downloaded` log row with accessed_by = owner; (4) admin on foreign doc -> 200; (5) role `staff` on foreign doc -> 404; (6) non-UUID id -> expect 404/400 (currently 500; defines fix); (7) response JSON has no `r2_key`.

## Known bugs and gaps
- Missing try/catch -> unhandled 500 for malformed id (route.ts:18).
- Superseded/archived documents downloadable by id (route.ts:18-23 has no status filter).
- No object-existence check.
- Access log written before the client actually fetches; no guarantee of real download.
- Vault list ignores company scope and admins cannot browse client vaults in the UI (admin-clients page not verified for this).

## Change guide
To force download behaviour, pass `ResponseContentDisposition` in `GetObjectCommand` (r2.ts). To shorten TTL pass `expiresIn`. Wrap the handler in try/catch and validate UUID. Any change needs human approval (protected zone). If adding admin vault browsing, add a separate admin route using `requireAdmin()` rather than loosening this one.

## Related features
[vault-upload](vault-upload.md), [share-links](share-links.md), [kyc-review](kyc-review.md), [session-and-route-guard](session-and-route-guard.md), [client-dashboard](client-dashboard.md)
