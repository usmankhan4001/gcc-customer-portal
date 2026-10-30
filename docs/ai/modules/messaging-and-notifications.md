# Module: Messaging and Notifications
**Last verified against code**: 2026-10-30

## Purpose
Outbound WhatsApp (Meta Cloud API v20), transactional email (Resend) and browser Web Push, plus an inbound WhatsApp webhook that advances a company's KYC stage. In-app notifications live in the `notifications` table and are shown at `/notifications`. Web Push is built but is probably not functional end to end (see Gaps).

## Files
- `src/lib/whatsapp.ts` - Graph API calls: `getWhatsAppConfig`, `HSM_TEMPLATES`, `sendWhatsAppOtp`, `sendWhatsAppMessage` (template), `sendTextMessage`, `markMessageAsRead` (unused), `verifyWebhookSignature` (unused duplicate)
- `src/lib/email.ts` - Resend wrappers (lazy client, FROM `noreply@gccstartup.com`, line 14); each fn logs then rethrows
- `src/lib/push.ts` - `web-push` + VAPID: `sendPushNotification`, `sendPushToUser` (fan-out, prunes 404/410 subs)
- `src/app/api/webhooks/whatsapp/route.ts` - GET verify challenge, POST inbound handler (own copy of signature check, line 53)
- `src/app/api/push/subscribe/route.ts`, `unsubscribe/route.ts` - store/delete a subscription
- `src/app/api/notifications/read-all/route.ts`, `[id]/read/route.ts` - mark read
- `src/components/portal/PushNotificationToggle.tsx` - client subscribe UI (mounted only on `/profile`)
- `public/sw.js` - `push` and `notificationclick` handlers (lines 90-131)
- `src/components/layout/ServiceWorkerRegistration.tsx` - registers `/sw.js` but is NOT mounted anywhere
- `src/app/(authenticated)/notifications/page.tsx`, `src/components/portal/NotificationList.tsx` - feed UI (last 50)
- `src/app/api/admin/kyc/review/route.ts` - mock WhatsApp dispatch (see admin-operations.md)

## Routes and API
| Method | Path | Auth |
|---|---|---|
| GET | /api/webhooks/whatsapp | none; needs `hub.verify_token == WHATSAPP_VERIFY_TOKEN` else 403 |
| POST | /api/webhooks/whatsapp | HMAC `X-Hub-Signature-256` with `WHATSAPP_APP_SECRET` (skipped if secret unset) |
| POST | /api/push/subscribe | `gcc_session` cookie (verifyToken) |
| POST | /api/push/unsubscribe | NONE (deletes by endpoint) |
| PATCH | /api/notifications/read-all | cookie; marks all of caller's rows read |
| PATCH | /api/notifications/[id]/read | cookie; scoped `id AND user_id` |
All `/api/*` is public to `src/middleware.ts` (PUBLIC_PATHS `/api/`), so each handler must self-check.

## Data
- `notifications`: id, user_id FK, title, message, type (info|success|warning|action_required), category (kyc|payment|document|renewal|promo|system), link_url, is_read, whatsapp_status/email_status/push_status (not_sent|sent|failed, default not_sent), created_at.
- `push_subscriptions`: id, user_id FK, endpoint UNIQUE, p256dh_key, auth_key, created_at.
- `users.whatsapp_number` (unique, used as WhatsApp recipient and KYC lookup key), `users.whatsapp_alerts_enabled` / `email_alerts_enabled` (exist, NEVER read anywhere in src).
- Only writers of `notifications`: stripe webhook (`webhooks/stripe/route.ts:82`) and WhatsApp webhook (`:124`). `email_status` and `push_status` are never written.

## External services and env vars
- Meta WhatsApp Cloud API `https://graph.facebook.com/v20.0` (`whatsapp.ts:3`): `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID` (value `xxx` counts as unconfigured), `WHATSAPP_APP_SECRET`, `WHATSAPP_VERIFY_TOKEN`.
- Resend: `RESEND_API_KEY`, `NEXT_PUBLIC_APP_URL` (links in email bodies).
- Web Push: `NEXT_PUBLIC_VAPID_PUBLIC_KEY` (also baked into client at build via Dockerfile ARG), `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` (default `mailto:it-team@gccstartup.com`).
- PostHog `kyc_advanced` event fired from the webhook (`captureServerEvent`).

## HSM templates (`HSM_TEMPLATES`, whatsapp.ts:12-43)
| Name | Lang | Used by |
|---|---|---|
| gcc_otp_code | en_US | `sendWhatsAppOtp` (hardcoded again in body, line 72): body param = OTP, URL-button param = OTP |
| order_confirmed | en | stripe webhook, params [name, company] |
| kyc_reminder, kyc_verified, milestone_complete, renewal_notice | en | nothing calls them |
`admin/kyc/review` references `kyc_approved`, `kyc_action_needed`, `kyc_rejected`: not in `HSM_TEMPLATES`, and the call is mocked. Whether any template is approved in Meta: unverified.

## Key flows
1. User requests OTP (`/api/auth/send-otp`) -> row in `otp_codes` (10 min TTL) -> template `gcc_otp_code`; on failure falls back to free-form `sendTextMessage`; if both fail the OTP is returned in the JSON as `devOtp`.
2. Stripe `checkout.session.completed` -> order paid, company `onboarding` -> `sendWhatsAppMessage(order_confirmed)` -> insert `notifications` (category payment, `whatsapp_status:'sent'` hardcoded) -> `sendPushToUser`.
3. Client texts "KYC-<6-12 alnum>" (regex `/KYC[- ]?([A-Z0-9]{6,12})/i`, route line 73) -> webhook finds user by `whatsapp_number`, newest company with status `official_kyc_pending` -> sets `official_kyc_completed=true`, `official_kyc_reference`, status `filing_in_progress` -> inserts notification (category kyc, link /dashboard) -> push -> PostHog.
4. Client opens `/profile`, toggles push -> permission prompt -> `pushManager.subscribe` with VAPID key -> POST `/api/push/subscribe` -> row upserted by endpoint.
5. Client opens `/notifications` or taps an item -> PATCH read endpoints set `is_read`.

## Business rules and invariants
- OTP TTL 10 min (`send-otp/route.ts:8`). WhatsApp recipient = `to.replace(/\D/g,'')`.
- Webhook acts on `message.type === 'text'` only; image/document types are parsed in the type but ignored. Status updates are only `console.log`ged (route lines 184-191 comment: not persisted).
- Push payload JSON `{title, body, url, tag}`; push is skipped silently if VAPID env vars are missing (`push.ts:71`) but `sendPushNotification` throws if called directly without them.
- Expired subscriptions (HTTP 404/410) are deleted by `sendPushToUser`; other errors are logged only.
- `sendPushToUser` sends sequentially, one `await` per subscription.

## Security notes
- Signature verification (`webhooks/whatsapp/route.ts:149-152`): `if (appSecret && !verify(...))` FAILS OPEN. If `WHATSAPP_APP_SECRET` is unset in production, anyone can POST forged webhooks and advance any user's KYC by guessing a phone number. The `!` non-null assertion hides this. Compare uses `timingSafeEqual` on equal-length buffers (try/catch handles length mismatch).
- `lib/whatsapp.ts:verifyWebhookSignature` is a second, correct fail-closed implementation that nothing imports.
- `/api/push/unsubscribe` has no auth: anyone knowing an endpoint URL can delete it (low impact, endpoints are secret-ish).
- `/api/push/subscribe` re-assigns an existing endpoint to the caller (`user_id` overwritten): a shared browser hands notifications to the latest logged-in user. By design?: unverified.
- Email templates interpolate `name`/`companyName` into HTML without escaping.
- OTP leakage: `send-otp` returns `devOtp` whenever WhatsApp send failed or env is non-production (`:86`); `verify-otp` accepts `123456` when WhatsApp is unconfigured or non-production. No rate limiting seen in send-otp. (Auth zone; report, do not edit without approval.)
- Stripe webhook is a protected money zone; it is NOT idempotent (re-delivery re-sends WhatsApp and inserts a duplicate notification; no `payment_status` check).

## Tests
none for this module (existing tests: `src/lib/auth.test.ts`, `jwt-secret.test.ts`, `persona.test.ts`, `tests/fde.test.ts`).

## Known gaps and suspicious things
- WhatsApp webhook idempotency: no dedupe on `message.id`. Replays are only harmless because the first run flips status away from `official_kyc_pending` (lookup then finds nothing). Not atomic: select-then-update without `status` in the UPDATE `where`, so two concurrent deliveries can both pass and double-insert the notification/push. Handler returns 500 on any exception, so Meta will retry; partially applied work (company updated, notification insert failed) is then skipped on retry.
- Phone mismatch risk: webhook `from` is digits without `+`; users are stored via `normalizePhone` which keeps a leading `+`. A lookup `eq(users.whatsapp_number, from)` would miss users stored as `+971...`. Unverified against real data.
- Web Push is likely dead: `ServiceWorkerRegistration` is never rendered (`Providers.tsx` only mounts PostHogInit/Toaster), so `/sw.js` is never registered and `navigator.serviceWorker.ready` in the toggle never resolves.
- `sw.js` references `/icons/icon-192.png`, `icon-72.png`; both exist.
- 4 of 5 email functions and 4 of 6 HSM templates are dead code. Email links point to `/kyc` and `/orders/<n>`, which are not routes.
- `whatsapp_status:'sent'` is written without checking `sendWhatsAppMessage` result.
- `admin/kyc/review` sends to hardcoded `971500000000` (mock).

## Change guide
- New notification: insert into `notifications`, then call `sendPushToUser`; also set the `*_status` columns honestly. Respect `users.*_alerts_enabled` (currently ignored).
- New WhatsApp template: add to `HSM_TEMPLATES`, send via `sendWhatsAppMessage(to, name, lang, params)`; template must be approved in Meta first.
- Harden webhook: make signature mandatory (reject when secret missing), dedupe on `message.id` (needs a new table or column; additive migration), add `status='official_kyc_pending'` to the UPDATE `where`.
- Android FCM plan: `push.ts` is web-push only and `push_subscriptions` has no platform/token column. Add additively e.g. `platform` ('web'|'android') and `fcm_token` (make p256dh/auth nullable), add a `/api/push/register-device` route, and branch inside `sendPushToUser` per row (web-push for web, `firebase-admin` messaging for android). Keep expiry pruning (FCM `registration-token-not-registered`). Keep the payload shape `{title, body, url, tag}`. Mount `ServiceWorkerRegistration` for web.
- Pitfalls: `/api/*` bypasses middleware; webhook route must read the raw `request.text()` before JSON parsing (signature is over raw body); protected zones in AGENTS.md section 5 (Stripe webhook, auth).
