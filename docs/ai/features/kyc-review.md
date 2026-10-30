# Feature: KYC review

**Slug**: kyc-review   **Area**: [vault-and-documents](../modules/vault-and-documents.md)   **Status**: stub (admin document review); partial (reference-code advance via WhatsApp)   **Last verified against code**: 2026-10-30

## What it does
Intended: an admin reviews an uploaded KYC document (approve, action needed, reject), the status is persisted and the client is told over WhatsApp. Actual: `POST /api/admin/kyc/review` validates input, logs to the console and returns success; it writes nothing and sends nothing. KYC progress today advances by two other mechanisms: the client forwarding an official-portal reference ("KYC-XXXXXXXX") over WhatsApp, and staff dragging the company card in the admin kanban.

## Entry points
- API: `POST /api/admin/kyc/review` (no UI calls it; grep found no caller).
- WhatsApp inbound: `POST /api/webhooks/whatsapp` -> `handleKycReference`.
- Admin UI: `/admin` kanban column "3. KYC Review" (`official_kyc_pending`), `PATCH /api/admin/pipeline`.

## Files
- `src/app/api/admin/kyc/review/route.ts:112-209` - stub endpoint (auth helper 33-48, mock WhatsApp 54-106, commented-out DB SQL 151-169, 187-191).
- `src/app/api/webhooks/whatsapp/route.ts:73-138, 144-200` - reference extraction and company advance.
- `src/app/api/admin/pipeline/route.ts:~100-150` - PATCH status, uses `requireAdmin()`.
- `src/lib/whatsapp.ts:15-60` - `HSM_TEMPLATES` (`kyc_reminder`, `kyc_verified`, ...), `sendWhatsAppMessage` at 116.
- `src/lib/db/schema.ts:52-88` companies (`official_kyc_completed`, `official_kyc_reference`, `status`), `:94-121` documents.
- `src/app/admin/page.tsx:67-69,208-209,329-332,615-618` kanban column and "KYC Verified" badge; `src/app/admin/clients/page.tsx:90` KYC Status column; `src/app/(authenticated)/dashboard/page.tsx:42,310` client-side stage and KYC prompt.
- `src/lib/email.ts:73` `sendKYCReminder` (links to `/kyc`, a route not verified to exist).

## Request / response contract
`POST /api/admin/kyc/review`
- Auth: header `Authorization: Bearer <jwt>` (NOT the cookie; the same JWT value as `gcc_session` would work). Payload must have `role === 'admin'` exactly; `super_admin` is rejected.
- Body: `{document_id: string, status: 'approved'|'action_needed'|'rejected', rejection_reason?: string, notify_whatsapp: boolean}`.
- 200 `{success:true, document_status:<status>, whatsapp_dispatched:boolean, whatsapp_message_id?:'wamid.mock.<ts>'}`.
- 401 `{error:'Missing or invalid Authorization header'}` or the jose error text for bad/expired token (message passes through); 403 `{error:'Insufficient permissions'}`; 400 `{error:'Missing required fields: document_id, status'}`; 400 `{error:'Invalid status. Must be one of: approved, action_needed, rejected'}`; 400 `{error:'rejection_reason is required when status is not approved'}`; 500 `{error:'Internal server error'}`.
- Invalid JSON body -> 500.

## Step-by-step flow
Stub endpoint:
1. :117 verify Bearer token with `jwtVerify(token, getJwtSecret())`; role check. Note it reads `payload.sub` as admin id.
2. :125-148 parse and validate.
3. :171 console.log "Mock DB update". No document lookup (document_id is never checked to exist; 404 path is commented out).
4. :179-185 if `notify_whatsapp`: `sendWhatsAppNotification('971500000000', ...)` hard-coded number; builds template `kyc_approved` | `kyc_action_needed` (param = reason or 'Please resubmit your document.') | `kyc_rejected` (param = reason or 'Document rejected.'); real fetch to Graph API is commented out; returns `wamid.mock.<Date.now()>`.
5. :194-201 return success.
Reference-code advance (real):
1. whatsapp/route.ts:148-154 verify `X-Hub-Signature-256` HMAC, but ONLY `if (appSecret && ...)`: when `WHATSAPP_APP_SECRET` is unset the signature check is skipped entirely and anyone can POST.
2. :175-178 for each text message, regex `/KYC[- ]?([A-Z0-9]{6,12})/i` (:73) extracts the code (case-insensitive; code stored as typed).
3. :91-97 `normalizePhone(from)` strips non-digits/plus; SELECT user WHERE `whatsapp_number = normalized` (format must match stored format exactly; stored numbers may carry `+` or not: unverified).
4. :99-104 SELECT latest company for that user with `status='official_kyc_pending'`; if none, log and ignore.
5. :111-119 UPDATE companies SET `official_kyc_completed=true`, `official_kyc_reference=<code>`, `status='filing_in_progress'`, `updated_at`.
6. :124-135 INSERT `notifications` (category `kyc`, title 'KYC Verified'), `sendPushToUser`, PostHog `kyc_advanced`. No WhatsApp `kyc_verified` template is actually sent.
Kanban: admin drags card; `PATCH /api/admin/pipeline {companyId,status}`; status `active` also sets `official_kyc_completed=true` and `incorporation_date`. `lead/onboarding -> official_kyc_pending -> filing_in_progress` is the suggested next-step map (admin/page.tsx:67-69). Nothing moves a company INTO `official_kyc_pending` automatically (the Stripe webhook sets `onboarding`).

## Data
Intended status enum for documents (stub types): `approved | action_needed | rejected`. Actual `documents.status` enum is `active | archived | superseded` (schema.ts:115) and has NO review columns (no rejection_reason, reviewed_by, reviewed_at); the commented SQL references columns and tables that do not exist (`companies.whatsapp_number`, `owner_email`, `notifications.channel`, `template_name`). Company-level KYC state lives in `companies.official_kyc_completed`, `official_kyc_reference`, and `status`.

## Business rules and constants
WhatsApp templates in the stub: `kyc_approved`, `kyc_action_needed`, `kyc_rejected` (language `en`). Registered in `HSM_TEMPLATES` instead: `kyc_reminder`, `kyc_verified` (no `kyc_approved/action_needed/rejected`), so template names disagree. Reference regex 6-12 alphanumerics.

## Auth, permissions, security
The stub breaks the admin pattern in AGENTS.md section 3.4: it uses Bearer + `role !== 'admin'` instead of `requireAdmin()` (cookie; admin or super_admin). Document review should also enforce that the reviewer can see the client's file. WhatsApp inbound signature skip when secret unset is a spoofing risk: a forged message from any claimed phone number advances that user's company past KYC (steps 3-5). Reference codes are never validated against any official source. PROTECTED ZONE: `src/app/api/vault/**` and `src/lib/r2.ts` are protected; this route is not listed but sits in the vault module.

## Failure modes and edge cases
Stub: nothing persisted; UI/admin cannot tell it did nothing except the `wamid.mock.` id. Inbound: duplicate delivery of the same message re-runs; second run finds no `official_kyc_pending` company and is ignored (naturally idempotent for the same company), but a user with two pending companies advances the newest first. Unknown sender logged only. Errors thrown in `handleKycReference` return 500 for the whole batch, and Meta retries.

## Tests
None. Write: (1) stub: no Authorization -> 401; token with role client -> 403; super_admin -> 403 (document, then decide); (2) rejected without reason -> 400; (3) after implementation: approved updates `documents` and inserts notification; (4) webhook: message "KYC-AB12CD34" from the user's number with a pending company -> status `filing_in_progress`, reference stored; (5) webhook: no pending company -> no changes; (6) webhook with `WHATSAPP_APP_SECRET` set and wrong signature -> 401; unset secret -> should refuse in production (currently accepts).

## Known bugs and gaps
- Endpoint is a pure mock (kyc/review/route.ts:150-192) and no UI calls it.
- Hard-coded phone `971500000000` (:181).
- Auth mismatch with `requireAdmin()` and super_admin excluded (:43).
- Document status vocabulary and columns do not exist in the schema.
- Signature check is conditional on the secret being set (whatsapp/route.ts:151).
- Nothing sets `official_kyc_pending` automatically; `kyc_reminder` is not sent anywhere found here; `kyc_verified` template never sent.

## Change guide
Real implementation: add migration with `documents.review_status` (or reuse a KYC table), `rejection_reason`, `reviewed_by`, `reviewed_at`; replace auth with `requireAdmin()`; SELECT the document plus owner user; UPDATE in a transaction; use `sendWhatsAppMessage(user.whatsapp_number, template, 'en', params)` (src/lib/whatsapp.ts) with approved template names; INSERT `notifications` (category `kyc`) and push; optionally advance `companies.status` to `official_kyc_pending`/`filing_in_progress`; add admin UI in clients page. Keep the WhatsApp reference flow working and make the signature check mandatory in production. Update HSM_TEMPLATES and Meta template approvals together.

## Related features
[whatsapp-inbound-webhook](whatsapp-inbound-webhook.md), [whatsapp-outbound](whatsapp-outbound.md), [admin-kanban-pipeline](admin-kanban-pipeline.md), [admin-clients](admin-clients.md), [vault-upload](vault-upload.md), [in-app-notifications](in-app-notifications.md), [pipeline-tracker](pipeline-tracker.md)
