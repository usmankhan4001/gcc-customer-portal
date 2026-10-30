# Feature: WhatsApp inbound webhook (KYC reference)

**Slug**: whatsapp-inbound-webhook   **Area**: [messaging-and-notifications](../modules/messaging-and-notifications.md)   **Status**: partial   **Last verified against code**: 2026-10-30

## What it does
Meta calls `/api/webhooks/whatsapp` for inbound WhatsApp messages and delivery statuses. The only business behaviour: a client who finished identity verification on the external government/bank portal texts the reference code back; the handler finds the sender, finds their company waiting on KYC, stores the reference, moves the company to `filing_in_progress`, creates an in-app notification, fires a push and a PostHog event. Delivery/read statuses are only logged. As written, phone matching likely fails for most users and the reference regex over-matches (see Known bugs), so treat the feature as unreliable.

## Entry points
- `GET /api/webhooks/whatsapp` - Meta subscription verification.
- `POST /api/webhooks/whatsapp` - events. Configure in Meta app dashboard with callback URL `https://<host>/api/webhooks/whatsapp` and the same string as `WHATSAPP_VERIFY_TOKEN`.

## Files
- `src/app/api/webhooks/whatsapp/route.ts:1-218` - everything (types 13-47, signature 53-67, regex 73-78, `normalizePhone` 80, `handleKycReference` 91-138, POST 144-200, GET 206-218). Protected zone (`src/app/api/webhooks/**`).
- `src/lib/push.ts` `sendPushToUser`; `src/lib/posthog-server.ts` `captureServerEvent`.
- `src/lib/whatsapp.ts:244` - an unused fail-closed `verifyWebhookSignature` (the route has its own copy).

## Request / response contract
`GET` query: `hub.mode`, `hub.verify_token`, `hub.challenge`. If `mode==='subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN` -> 200 body = the challenge string (plain text; empty body if `hub.challenge` missing); else 403 `{error:'Forbidden'}`. If the env var is unset, `token` (string or null) never equals `undefined`, so it fails closed.
`POST` headers: `X-Hub-Signature-256: sha256=<hex>`. Body: Meta envelope `{object:'whatsapp_business_account', entry:[{id, changes:[{field:'messages', value:{messaging_product, metadata:{display_phone_number, phone_number_id}, messages?:[{from,id,timestamp,type,text?:{body},image?,document?}], statuses?:[{id,status,timestamp,recipient_id}]}}]}]}`.
Responses: 200 `{received:true}`; 401 `{error:'Invalid signature'}`; 400 `{error:'Invalid JSON'}`; 400 `{error:'Invalid object type'}`; 500 `{error:'Internal server error'}` on any thrown error (including a body missing `entry`/`changes`, which throws a TypeError in the `for..of`). Cookies: none.

## Step-by-step flow
1. `POST` reads the RAW body with `request.text()` (required: signature is over raw bytes) and header `X-Hub-Signature-256` (`:146-148`).
2. `appSecret = process.env.WHATSAPP_APP_SECRET!` (`:149`). If set, `verifyWebhookSignature` computes `sha256=` + HMAC-SHA256(body, secret) and `timingSafeEqual`s it with the header (missing header -> false; length mismatch is caught -> false). If the secret is unset/empty the whole check is SKIPPED (`:151`, fail-open).
3. Parse JSON (400 on failure); require `payload.object === 'whatsapp_business_account'`.
4. For each entry/change with `field === 'messages'`: for each message with `type==='text'` and `text.body`, run `extractKYCReference` = first match of `/KYC[- ]?([A-Z0-9]{6,12})/i`, capture group 1 (original casing kept). No match -> message ignored. Other types (image/document) ignored.
5. `handleKycReference(from, ref)`: `normalizePhone(from)` = strip everything except digits and `+`; `SELECT users WHERE whatsapp_number = <that>` LIMIT 1. Not found -> console.log, return (response still 200).
6. `SELECT companies WHERE user_id = user.id AND status = 'official_kyc_pending' ORDER BY created_at DESC LIMIT 1`. None -> log, return.
7. `UPDATE companies SET official_kyc_completed=true, official_kyc_reference=ref, status='filing_in_progress', updated_at=now WHERE id = company.id` (no status guard in the WHERE).
8. `INSERT notifications {user_id, title:'KYC Verified', message:"Your KYC reference (<ref>) for <company_name> has been received. We're now proceeding with government filing.", type:'success', category:'kyc', link_url:'/dashboard'}`.
9. `await sendPushToUser(user.id, {title, body, url:'/dashboard'})`, then `captureServerEvent(user.id,'kyc_advanced',{company_id})`.
10. For `statuses`, `console.log` only (`:187-191`); nothing persisted.

## Data
Reads `users.whatsapp_number` (unique), `companies.user_id/status/created_at`. Writes `companies.official_kyc_completed`, `official_kyc_reference`, `status`, `updated_at`; inserts `notifications`. Not stored: the raw message, `message.id`, sender, reference history, status receipts. `official_kyc_reference` is overwritten by later events.

## Business rules and constants
- Regex `/KYC[- ]?([A-Z0-9]{6,12})/i` (`:73`): 6-12 alphanumerics after "KYC", optional single hyphen or space.
- Only companies in `official_kyc_pending` advance; target status `filing_in_progress` (enum in `schema.ts:63-75`). Who sets `official_kyc_pending`: admin kanban (`src/app/api/admin/pipeline/route.ts`, `src/app/admin/page.tsx`); Stripe sets `onboarding`.
- Env: `WHATSAPP_APP_SECRET` (`:149`), `WHATSAPP_VERIFY_TOKEN` (`:212`).

## Auth, permissions, security
Public endpoint (`/api/` is public in middleware). Authenticity relies solely on the HMAC. If `WHATSAPP_APP_SECRET` is unset in production, anyone can POST a forged body and advance any user's KYC by knowing a phone number (`.env.example` ships `xxx`, so a copy-paste deploy has a non-empty but wrong secret and would reject real Meta calls instead). The sender identity is the `from` phone only; there is no check that the reference is genuine. Protected zone (webhooks): do not edit without human OK.

## Failure modes and edge cases
- No dedupe: `message.id` is never read. Replays are mostly harmless only because the first run moves the company out of `official_kyc_pending`. Two concurrent deliveries can both pass the select, double-update, double-notify and double-push (UPDATE has no `status` guard).
- Partial failure: if `sendPushToUser` or the notification insert throws after the company UPDATE, the handler returns 500, Meta retries, and the retry finds no pending company so the notification/push is never produced.
- Multi-message/multi-entry batches are processed sequentially; one failure aborts the rest and returns 500 (earlier messages already committed).
- Unknown sender, no pending company, no reference: silently 200 (only console.log).
- Handler does all work inline before responding; slow DB/push delays the 200 to Meta (Meta retries on timeouts/non-200).

## Tests
None. Worth writing (mock `@/lib/db`, `@/lib/push`, set `WHATSAPP_APP_SECRET`, sign the body with `crypto.createHmac`):
1. Valid signature + text "KYC-ABC12345" from a known number -> company update with `status:'filing_in_progress'`, one notification insert, 200.
2. Bad/missing signature with secret set -> 401, no DB calls.
3. Secret unset -> (current) processed without signature; after hardening expect 401/500.
4. Text "My KYC verification is done" -> expect NO advance (fails today: captures `verification`).
5. User stored as `+971501234567`, webhook `from:'971501234567'` -> expect match (fails today).
6. Same `message.id` delivered twice -> one notification (needs dedupe).
7. GET with right token returns the challenge; wrong token -> 403; env unset -> 403.

## Known bugs and gaps
- Fail-open signature: `route.ts:151` (`if (appSecret && ...)`), with a `!` assertion that hides it. A duplicate correct implementation sits unused in `whatsapp.ts:244`.
- Phone-format mismatch: webhook `from` is digits only (Meta format) but users are stored with a leading `+` (`verify-otp/route.ts:9` and `onboarding/complete/route.ts:40` keep `+`; the phone picker emits `+971...`, `countries.ts:9`). The `eq(users.whatsapp_number, ...)` lookup at `:93` therefore misses `+`-prefixed users. Users created by admin with `temp_<ts>` numbers (`admin/pipeline/route.ts:194,205`) can never match.
- Regex false positives: "KYC verification" / "kyc completed" / "KYC approved" match because ordinary words are 6-12 letters; the word becomes the stored `official_kyc_reference` and the company advances. Require a digit, a fixed prefix, or an issued per-company code.
- No idempotency or atomic guard (see above); status updates not persisted.
- Reference is not uppercased or validated against anything.

## Change guide
- Harden: reject when `WHATSAPP_APP_SECRET` is missing (return 500/401), use `verifyWebhookSignature` from `whatsapp.ts`, add `AND status='official_kyc_pending'` to the UPDATE and check the returned row count, wrap push/PostHog in try/catch so they cannot cause a retry after commit.
- Dedupe: additive table `whatsapp_inbound_messages(message_id pk, received_at)` or store processed ids; insert first, skip on conflict.
- Phone match: compare on digits only for both sides (e.g. normalise stored numbers in a migration or query `replace(whatsapp_number,'+','')`); do not edit the auth routes without human OK.
- Always keep reading `request.text()` before JSON parse; keep returning 200 quickly.
- Android/FCM readiness: not directly affected (server-to-server). Add an `events` row for each accepted KYC reference and consent record that the user agreed to WhatsApp contact; the resulting push should include `notification_id` once FCM exists.

## Related features
[whatsapp-outbound](whatsapp-outbound.md), [in-app-notifications](in-app-notifications.md), [web-push](web-push.md), [kyc-review](kyc-review.md), [admin-kanban-pipeline](admin-kanban-pipeline.md), [pipeline-tracker](pipeline-tracker.md), [analytics-posthog](analytics-posthog.md)
