# Feature: WhatsApp outbound (Meta Cloud API)

**Slug**: whatsapp-outbound   **Area**: [messaging-and-notifications](../modules/messaging-and-notifications.md)   **Status**: partial   **Last verified against code**: 2026-10-30

## What it does
`src/lib/whatsapp.ts` wraps the Meta WhatsApp Cloud API (Graph v20.0) with three live senders: an OTP template for login, a generic template sender, and a free-form text sender. In practice only two things use it: the login OTP and the "order confirmed" message after Stripe payment. Everything else (KYC reminders, renewal notices, admin KYC review) is declared but not wired. Which templates are approved in the Meta account is unverified.

## Entry points
- `POST /api/auth/send-otp` (`src/app/api/auth/send-otp/route.ts`) -> `sendWhatsAppOtp`, then fallback `sendTextMessage`.
- `POST /api/webhooks/stripe` (`src/app/api/webhooks/stripe/route.ts:74`) -> `sendWhatsAppMessage(.., 'order_confirmed', 'en', [name, company])`.
- No UI, no cron, no admin send.

## Files
- `src/lib/whatsapp.ts:1-264` - all senders, config, template list, unused helpers.
- `src/app/api/auth/send-otp/route.ts:7,49-98` - caller (imports `sendWhatsAppMessage` but never uses it).
- `src/app/api/webhooks/stripe/route.ts:6,74-77` - caller.
- `src/app/api/admin/kyc/review/route.ts:55-116` - separate MOCK sender (logs only; real `fetch` is commented out; returns `wamid.mock.<ts>`; uses template names `kyc_approved`, `kyc_action_needed`, `kyc_rejected`, lang `en`, none of which are in `HSM_TEMPLATES`).

## Request / response contract
All senders return `Promise<{success:boolean; messageId?:string; error?:any}>` and never throw (everything is in try/catch).
- `getWhatsAppConfig(): {phoneNumberId, accessToken, isConfigured}` (`:5-10`) - values `.trim()`med; `isConfigured` false if either is empty or literally `'xxx'`.
- `sendWhatsAppOtp(to: string, otpCode: string)` (`:45`) - POST `https://graph.facebook.com/v20.0/{phoneNumberId}/messages`, header `Authorization: Bearer {token}`. Body: `{messaging_product:'whatsapp', recipient_type:'individual', to, type:'template', template:{name:'gcc_otp_code', language:{code:'en_US'}, components:[{type:'body', parameters:[{type:'text', text:otp}]}, {type:'button', sub_type:'url', index:'0', parameters:[{type:'text', text:otp}]}]}}`. The template name/language are hardcoded here, not read from `HSM_TEMPLATES`.
- `sendWhatsAppMessage(to, templateName, languageCode, parameters?: {type:string; text:string}[])` (`:116`) - body components are `[{type:'body', parameters}]` if `parameters` given (note: `[]` is truthy, so an empty array sends an empty body component) else `[]`. No header, button, or named-parameter support.
- `sendTextMessage(to, text)` (`:170`) - `{messaging_product:'whatsapp', to, type:'text', text:{body}}`. Meta only delivers free-form text inside the 24-hour customer-service window, so for a cold OTP this fallback will usually be rejected (general Meta rule; not verified against this account).
- Recipient is always `to.replace(/\D/g,'')` (digits only, `+` dropped).
- Failure results: not configured -> `{success:false, error:'Credentials not configured'}` (warn log); HTTP non-2xx -> `{success:false, error: <Meta error JSON>}` (error log); network/parse exception -> `{success:false, error}`. Success -> `messageId = data.messages?.[0]?.id`.

## Step-by-step flow
1. OTP: `send-otp` normalises phone (`[^\d+]` stripped), inserts hashed OTP in `otp_codes` (10 min), checks its OWN configured test (`route.ts:49-53`, untrimmed, duplicates `getWhatsAppConfig`), calls `sendWhatsAppOtp`. If `!success` it calls `sendTextMessage` with `Your GCC Startup verification code is: {otp}. Valid for 10 minutes.`. If both fail: `whatsAppError` set but only a warning is logged.
2. Result: `!sentViaWhatsApp && !devOtpAllowed()` (production) -> 502 `{success:false,error:'Could not send the verification code. Please try again.'}`; non-production returns 200 with `devOtp`.
3. Stripe: after order+company update, `sendWhatsAppMessage(user.whatsapp_number, 'order_confirmed', 'en', [{type:'text',text:full_name||'there'},{type:'text',text:company_name}])`. Return value ignored; the notification row is inserted with `whatsapp_status:'sent'` regardless.

## Data
No table stores outbound messages. `notifications.whatsapp_status` exists (`not_sent|sent|failed`, default `not_sent`) but is only written as the literal `'sent'` by the Stripe path. Message ids are discarded, so delivery/read statuses received by [whatsapp-inbound-webhook](whatsapp-inbound-webhook.md) cannot be correlated. `users.whatsapp_alerts_enabled` is never consulted.

## Business rules and constants
- Graph base `https://graph.facebook.com/v20.0` (`:3`).
- `HSM_TEMPLATES` (`:12-43`): `gcc_otp_code` (en_US, no params in the list but code sends OTP as body param 1 AND URL-button param), `order_confirmed` (en; `{name}`, `{company}`), `kyc_reminder` (en; no params), `kyc_verified` (en; `{ref}`, `{company}`), `milestone_complete` (en; `{stage}`, `{company}`), `renewal_notice` (en; `{entity}`, `{days}`). The `description` strings are documentation only, never sent. Placeholders in descriptions are named but Meta body params are positional; order must match the approved template (unverified).
- Callers: `gcc_otp_code` and `order_confirmed` only. `kyc_reminder`, `kyc_verified`, `milestone_complete`, `renewal_notice` have no callers.
- Language codes differ per template (`en_US` vs `en`); Meta requires an exact match with the approved template language.
- Env: `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID` (`whatsapp.ts:6-7`; `send-otp/route.ts:50-53`; `admin/kyc/review/route.ts:59-60` non-null asserted but unused). Missing/`xxx` -> everything degrades to "not configured".

## Auth, permissions, security
Server-only; the token is a bearer secret in env, never sent to the client. The OTP is in the Meta request body and, in non-production, in the HTTP response as `devOtp`. Protected zone: `send-otp` is auth (AGENTS.md section 5 "Auth & sessions" adjacent); the Stripe webhook is a money zone. `src/lib/whatsapp.ts` itself is not listed as protected.

## Failure modes and edge cases
- No timeout/AbortController on `fetch`; a hung Graph call blocks the OTP request or the Stripe webhook until the platform times out.
- No retry, no queue; a failed order-confirmed message is lost silently (only `console.error`).
- Template not approved/paused or wrong language -> Meta 4xx -> error logged, `{success:false}`.
- Rate limits/quality tier limits from Meta are not handled specially.
- `markMessageAsRead` (`:214`) and `verifyWebhookSignature` (`:244`, fail-closed duplicate of the route's check) are exported and unused.
- Phone number format: `users.whatsapp_number` may contain `+`; stripped on send, fine.

## Tests
None for the module (`tests/auth-routes.test.ts` covers only the production-502 path of send-otp with WhatsApp unconfigured). Worth writing (stub `global.fetch`, set env):
1. Config unset or `'xxx'` -> `{success:false,error:'Credentials not configured'}` and `fetch` not called.
2. `sendWhatsAppOtp('+971 50 123 4567','123456')` -> fetch URL ends `/{id}/messages`, body `to:'971501234567'`, template `gcc_otp_code`, body+button params both `'123456'`.
3. Meta responds 400 -> `{success:false, error:<json>}` and no throw.
4. `sendWhatsAppMessage(..., undefined)` -> `components: []`; with 2 params -> one body component with 2 params.
5. send-otp: template fails, text succeeds -> 200 `OTP sent via WhatsApp`; both fail in production -> 502 and no `devOtp`.
6. Stripe path: send fails -> notification still inserted (documents current behavior; then fix to write `whatsapp_status:'failed'`).

## Known bugs and gaps
- `whatsapp_status:'sent'` written without checking the result (`stripe/route.ts:89`).
- 4 of 6 templates and `markMessageAsRead` are dead; admin KYC review is mocked with template names absent from `HSM_TEMPLATES`.
- `send-otp` duplicates the configured-check and imports an unused `sendWhatsAppMessage`.
- No timeouts/retries; no outbound message log.
- OTP leak in logs: `send-otp/route.ts:83` `console.log`s the plaintext OTP whenever WhatsApp is unconfigured, regardless of `NODE_ENV` (the production test in `tests/auth-routes.test.ts` prints it). Auth zone: report, do not edit without approval.

## Change guide
- New template: add to `HSM_TEMPLATES`, get it approved in Meta with the exact language code, call `sendWhatsAppMessage(to, name, lang, params)`. If it needs a header or button variable, extend the `components` builder (today body-only).
- Make callers record the result: write `whatsapp_status` from `result.success`, and store `messageId` (needs a new column) so status webhooks can be matched.
- Add `AbortSignal.timeout(10000)` to the three `fetch` calls; keep return shape.
- Reuse `getWhatsAppConfig()` in `send-otp` to remove the duplicate check (auth file: needs human OK).
- Android/FCM readiness: OTP delivery stays WhatsApp for the Capacitor app; no change to this file. Add a consent record (opt-in timestamp) before sending non-OTP utility/marketing templates and honour `users.whatsapp_alerts_enabled`. Log every outbound send to the planned `events` table (template, status, messageId).

## Related features
[whatsapp-otp-login](whatsapp-otp-login.md), [whatsapp-inbound-webhook](whatsapp-inbound-webhook.md), [stripe-webhook](stripe-webhook.md), [in-app-notifications](in-app-notifications.md), [kyc-review](kyc-review.md), [renewals](renewals.md)
