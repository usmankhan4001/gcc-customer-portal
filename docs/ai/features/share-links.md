# Feature: Share links

**Slug**: share-links   **Area**: [vault-and-documents](../modules/vault-and-documents.md)   **Status**: partial   **Last verified against code**: 2026-10-30

## What it does
A document owner clicks the link icon in the vault; the server creates a random token valid for 7 days and the URL `<APP_URL>/vault/shared/<token>` is copied to the clipboard. Anyone with that URL (no login) sees the file name and a Download button backed by a fresh presigned R2 URL. There is no password, revoke endpoint, per-link management or listing UI.

## Entry points
- UI: `ShareButton` on each vault row; public page `/vault/shared/[token]`.
- API: `POST /api/vault/share`.

## Files
- `src/app/api/vault/share/route.ts:11-41` - create link.
- `src/app/vault/shared/[token]/page.tsx:7-63` - public server component (resolves link, signs URL, logs, increments).
- `src/components/portal/ShareButton.tsx:6-46` - clipboard UX, tooltip "expires in 7 days".
- `src/middleware.ts` PUBLIC_PATHS contains `/vault/shared/` (line 15); `/vault` otherwise protected. Note the `/api/` prefix is also public so POST share checks auth itself.
- `src/lib/db/schema.ts:133-142` shareable_links, `:144-150` document_access_log.
- `src/lib/r2.ts:38` presign GET.

## Request / response contract
`POST /api/vault/share` (cookie `gcc_session`), body `{document_id: string}`.
- 200 `{url: "<NEXT_PUBLIC_APP_URL or http://localhost:3005>/vault/shared/<48 hex>", expires_at: <ISO date>}`.
- 401 `{error:'Unauthorized'}`; 400 `{error:'document_id is required'}`; 404 `{error:'Not found'}` (missing or not owner; admins get no override).
- No try/catch: malformed UUID, bad JSON or DB failure -> bare 500.
`GET /vault/shared/[token]` (HTML page, no cookie needed): always HTTP 200; invalid/expired/revoked shows "Link expired or invalid"; link ok but document row missing shows "Document no longer available".

## Step-by-step flow
Create:
1. share/route.ts:12-17 verify cookie. :19-22 require `document_id`.
2. :24-27 SELECT document; must exist and `user_id === session.userId`.
3. :29 token = `randomBytes(24).toString('hex')` (192 bits, 48 hex chars). :30 `expiresAt = now + 7 days`.
4. :32-37 INSERT `shareable_links` {document_id, token (RAW, unique), expires_at, created_by}; `access_count` default 0, `revoked` default false.
5. :39-40 build URL from `NEXT_PUBLIC_APP_URL` (fallback localhost:3005) and return it. Client copies to clipboard (`.catch(()=>{})`; if clipboard fails the URL is lost silently, still shows a check).
Open:
1. page.tsx:10-14 SELECT link WHERE token = ? AND revoked = false AND expires_at > now LIMIT 1.
2. :28 SELECT document by `link.document_id`. Document `status` is not checked (superseded/archived still served).
3. :40 `getPresignedDownloadUrl(document.r2_key)` (3600 s).
4. :42 INSERT `document_access_log` {document_id, action:'viewed'} with `accessed_by` NULL (the viewer is anonymous even if logged in).
5. :43-46 UPDATE `shareable_links SET access_count = link.access_count + 1` (read-modify-write; concurrent views lose counts).
6. Render title = `document.file_name`, anchor `href=downloadUrl`.

## Data
`shareable_links(id, document_id fk, token text unique not null, expires_at, created_by fk, access_count int default 0, revoked bool default false, created_at)`. Token is stored in plaintext (NOT hashed): a DB read leak (backup, SQL injection, support access) yields live links until expiry. Not stored: password hash, max-uses, IP/UA, recipient, label. `document_access_log` gets `viewed` rows per page render (not per click on Download).

## Business rules and constants
- `LINK_TTL_DAYS = 7` (route.ts:9). Token entropy 24 bytes. Presigned URL on the page: 3600 s.
- Each click on the icon creates a NEW link; old links stay valid until their own expiry. No limit on active links per document.
- Only the owner can create links (admins cannot).
- Revocation: `revoked` column is honoured on read but NO endpoint, UI or admin tool sets it. Password protection: not implemented (no column, no code). Both reported gaps are confirmed.

## Auth, permissions, security
Public page is authenticated solely by the token (in the path, so it can appear in server logs, Referer headers sent to R2 when the user clicks Download, browser history). Page has no `noindex`/`Referrer-Policy` handling seen. Every page view renders a signed URL into HTML, valid 1 h even after the link expires or is (hypothetically) revoked. Reading and writing the DB from a GET render (counter, access log) means prefetchers/link-preview bots (WhatsApp, Slack) inflate `access_count` and create `viewed` rows. No rate limiting on token guessing (192-bit space makes this impractical). PROTECTED ZONE: `src/app/api/vault/**`, `src/lib/r2.ts`; human approval needed. Raw R2 URL is never exposed, only presigned URLs.

## Failure modes and edge cases
- DB error on log insert/count update after URL generation: the server component throws -> Next error page, user never sees the Download button.
- Expired link: indistinguishable from invalid.
- Owner deletes nothing: there is no delete flow, so documents/links persist; superseding a document does not invalidate links (link still points at `document_id` and serves the superseded file's key).
- Clipboard API unavailable (http/non-secure): URL not copied, no fallback UI.
- `NEXT_PUBLIC_APP_URL` unset in prod -> links contain `http://localhost:3005`.

## Tests
None. Write: (1) POST without cookie -> 401; (2) other user's doc -> 404; (3) owner -> row with `expires_at` about now+7d, token matches `/^[0-9a-f]{48}$/`; (4) page with valid token -> Download href host is R2, one `viewed` log row with accessed_by null, access_count 1; (5) expired token -> "Link expired" and no log row; (6) `revoked=true` token -> invalid page; (7) two sequential views -> access_count 2.

## Known bugs and gaps
- No revoke path and no password (schema.ts:140 column unused by writers).
- Token stored raw (schema.ts:136, share/route.ts:32).
- Counter and log written on GET (page.tsx:42-46), non-atomic, inflated by bots.
- No try/catch in share route; admin cannot share on behalf of client.
- Superseded/archived documents shareable and viewable.
- `viewed` log has no actor or network info.

## Change guide
Add revoke: new `DELETE /api/vault/share/[id]` (owner) setting `revoked=true`, plus a UI list (needs a list endpoint). Hash tokens: store SHA-256 in `token_hash`, show raw token only once at creation, compare hash on read. Passwords: add `password_hash` column, interstitial form (POST action) before signing. Make counting atomic with `SET access_count = access_count + 1` (use `sql`). Move logging to a POST-triggered download action to avoid bot inflation. Add `<meta name="robots" content="noindex">` and `Referrer-Policy: no-referrer`. Keep `/vault/shared/` as the only public prefix under /vault. Protected zone approval required.

## Related features
[vault-upload](vault-upload.md), [vault-download](vault-download.md), [kyc-review](kyc-review.md), [session-and-route-guard](session-and-route-guard.md)
