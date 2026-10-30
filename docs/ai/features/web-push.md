# Feature: Web Push

**Slug**: web-push   **Area**: [messaging-and-notifications](../modules/messaging-and-notifications.md)   **Status**: broken   **Last verified against code**: 2026-10-30

## What it does
A client can toggle browser/PWA push on the `/profile` page. The server then fans a push out to every subscribed device whenever a payment is confirmed or a KYC reference is received. Server side is complete and plausible; the client side cannot work because the service worker is never registered, so the toggle can never subscribe. Status is `broken` for that reason, not for lack of code.

## Entry points
- UI: `PushNotificationToggle` mounted only at `src/app/(authenticated)/profile/page.tsx:63`.
- API: `POST /api/push/subscribe`, `POST /api/push/unsubscribe`.
- Server API: `sendPushToUser(userId, payload)` called from two webhooks (below).
- Browser: `public/sw.js` `push` and `notificationclick` handlers (lines 90-131).

## Files
- `src/lib/push.ts:1-84` - VAPID setup (`ensureConfigured`), `sendPushNotification`, `sendPushToUser`.
- `src/app/api/push/subscribe/route.ts` (42 lines), `src/app/api/push/unsubscribe/route.ts` (13 lines).
- `src/components/portal/PushNotificationToggle.tsx:1-88` - permission, `pushManager.subscribe`, POSTs.
- `public/sw.js:90-131` - receiver. `src/components/layout/ServiceWorkerRegistration.tsx` - registers `/sw.js` but is imported nowhere (grep of `src/` finds only its own file); `Providers.tsx` mounts only `PostHogInit` and `Toaster`.
- `src/lib/db/schema.ts:279-286` - `push_subscriptions`.
- Callers: `src/app/api/webhooks/stripe/route.ts:92`, `src/app/api/webhooks/whatsapp/route.ts:133`.

## Request / response contract
`POST /api/push/subscribe` - body JSON `PushSubscription.toJSON()`: `{endpoint: string, keys:{p256dh:string, auth:string}, expirationTime?}`. Cookie `gcc_session`. Validation: only truthiness of `endpoint`, `keys.p256dh`, `keys.auth` (no URL/format check). 200 `{success:true}`; 400 `{error:'Invalid subscription payload'}`; 401 `{error:'Unauthorized'}`. Malformed JSON body or a DB error is not caught -> unhandled 500.
`POST /api/push/unsubscribe` - body `{endpoint:string}`. NO authentication. 200 `{success:true}` (even if no row matched); 400 `{error:'endpoint is required'}`. Unhandled 500 on bad JSON/DB error.
Push payload sent to browsers: `JSON.stringify({title, body, url, tag})` (`push.ts:49`); `url`/`tag` optional.

## Step-by-step flow
1. Subscribe: user opens `/profile`; toggle `useEffect` (`PushNotificationToggle.tsx:17-26`) checks `'serviceWorker' in navigator && 'PushManager' in window`, sets `supported`, then awaits `navigator.serviceWorker.ready` to read the current subscription.
2. Click (`:28-66`): needs `NEXT_PUBLIC_VAPID_PUBLIC_KEY` (inlined at build; returns silently if empty). `Notification.requestPermission()`; if not `granted` it returns with no message. `registration.pushManager.subscribe({userVisibleOnly:true, applicationServerKey: urlBase64ToUint8Array(key)})`; POST `sub.toJSON()` to `/api/push/subscribe`; set state.
3. Server subscribe (`subscribe/route.ts:21-41`): SELECT by `endpoint`; if found UPDATE `user_id`, `p256dh_key`, `auth_key` (re-assigns the device to the caller); else INSERT. Select-then-write is not atomic: two concurrent calls can hit the UNIQUE constraint and 500.
4. Send: webhook calls `sendPushToUser` (`push.ts:70`). It returns silently if either VAPID env var is missing; else SELECTs all rows for the user and loops sequentially (one await per device). `sendPushNotification` calls `ensureConfigured()` (throws if keys missing; sets `webpush.setVapidDetails` once), then `webpush.sendNotification`. On error: statusCode 404/410 -> `{success:false, expired:true}` and the row is DELETEd; any other error is `console.error`ed and ignored.
5. Receive: `sw.js` `push` handler parses `event.data.json()`, shows notification (`icon /icons/icon-192.png`, `badge /icons/icon-72.png`, `tag` default `gccstartup-notification`, `renotify:true`, `vibrate [100,50,100]`, `data` = url string, `actions` from payload but the server never sends any). `notificationclick` focuses any client under the origin and calls `client.navigate(url)`, else `clients.openWindow(url)`.
6. Unsubscribe (`:36-46`): POST endpoint to `/api/push/unsubscribe` first, then `sub.unsubscribe()`.

## Data
`push_subscriptions`: `id uuid pk`, `user_id uuid FK users NOT NULL`, `endpoint text NOT NULL UNIQUE`, `p256dh_key text NOT NULL`, `auth_key text NOT NULL`, `created_at timestamp default now`. No platform, user-agent, last-seen, or failure-count column. Not stored: permission state, notification delivery.

## Business rules and constants
- VAPID subject default `mailto:it-team@gccstartup.com` (`push.ts:11`).
- Env vars: `NEXT_PUBLIC_VAPID_PUBLIC_KEY` (read server `push.ts:9,71`, client `PushNotificationToggle.tsx:29`; build ARG in `Dockerfile:21`), `VAPID_PRIVATE_KEY` (`push.ts:10,71`), `VAPID_SUBJECT` (`push.ts:11`). Generate with `npx web-push generate-vapid-keys` (`.env.example`).
- web-push library defaults apply (TTL not set explicitly; unverified default 4 weeks).

## Auth, permissions, security
Subscribe is session-checked; unsubscribe is not (anyone who knows an endpoint URL can delete it; endpoints are unguessable, low impact). Subscribe overwrites `user_id` for an existing endpoint, so on a shared browser notifications for user A can be delivered to user B after B logs in and toggles. No admin-triggered send exists.

## Failure modes and edge cases
- Service worker never registered -> `navigator.serviceWorker.ready` never resolves -> `handleToggle` hangs at line 34 and `loading` stays true, so the button stays disabled permanently. Initial `subscribed` state is also never read.
- Missing VAPID env: `sendPushToUser` returns silently (feature appears to work, nothing is sent).
- `sendPushToUser` is awaited inside webhook handlers; a DB error there throws and turns a KYC/Stripe webhook into a 500 AFTER the main work was already committed.
- Slow push services delay the webhook response (sequential loop, no timeout).
- Non-404/410 failures (401/403 bad VAPID key, 413 payload) are logged only and the row is kept forever.
- Permission denied -> silent return, no UI feedback.
- iOS Safari only supports Web Push for an installed (Add to Home Screen) PWA (general platform behavior).

## Tests
None. Worth writing (mock `web-push` and `@/lib/db`):
1. `sendPushToUser` with VAPID env unset -> no DB query, no throw.
2. A 410 from `webpush.sendNotification` -> `db.delete` called once for that row; a 500 -> not deleted.
3. Two subscriptions, first fails with 410 -> second still sent.
4. `POST /api/push/subscribe` no cookie -> 401; missing `keys.auth` -> 400; existing endpoint -> update path with new `user_id`.
5. `POST /api/push/unsubscribe` `{}` -> 400; valid -> `delete` called (documents that no auth is needed; flip once auth added).
6. Component test: toggle shows when `ServiceWorkerRegistration` is mounted in `Providers` (regression for the dead registration).

## Known bugs and gaps
- Dead registration: `ServiceWorkerRegistration` never rendered (`Providers.tsx`), so the whole client half is inert.
- `unsubscribe/route.ts` has no auth and no error handling.
- Non-atomic upsert in `subscribe/route.ts:21-41`; use `insert ... onConflictDoUpdate({target: endpoint})`.
- `sendPushToUser` can fail webhooks (see above); wrap calls in try/catch at the call site or inside the helper.
- `users.*_alerts_enabled` ignored; `notifications.push_status` never set.

## Change guide
- Activate: import and render `<ServiceWorkerRegistration />` inside `Providers.tsx` (see [pwa-and-service-worker](pwa-and-service-worker.md), which also lists the authenticated-page caching risk to fix first).
- Make `sendPushToUser` non-throwing (try/catch around the select) and run it after the HTTP response is decided, or parallelise with `Promise.allSettled`.
- Changing payload shape requires editing `sw.js` (`data.title/body/url/tag/actions`) in lockstep; keep `{title, body, url, tag}`.
- Android/FCM readiness: browser Web Push already works on Chrome-for-Android, but a Capacitor app needs native FCM. Additive migration on `push_subscriptions`: `platform text enum('web','android') default 'web'`, `fcm_token text unique null`, make `p256dh_key`/`auth_key`/`endpoint` nullable (or move to a `devices` table), plus `last_seen_at`, `failure_count`. New `POST /api/push/register-device {platform, token}` authenticated by bearer token (cookie auth is browser-only). Branch per row in `sendPushToUser`: web-push for `web`, `firebase-admin` `messaging().send` for `android` (data payload `{title,body,url,tag,notification_id}`; prune on `messaging/registration-token-not-registered`). Env additions: `FIREBASE_SERVICE_ACCOUNT_JSON` (or `GOOGLE_APPLICATION_CREDENTIALS`). Add a consent record before the first registration and an event row per send for audit. Do not touch protected webhook files without human OK.

## Related features
[in-app-notifications](in-app-notifications.md), [pwa-and-service-worker](pwa-and-service-worker.md), [stripe-webhook](stripe-webhook.md), [whatsapp-inbound-webhook](whatsapp-inbound-webhook.md), [profile-and-support](profile-and-support.md), [database-and-migrations](database-and-migrations.md)

## Update (specs 003 and 004, 2026-10-30)
Changed after this doc was written, see docs/specs/003-session-login-public-endpoints.md: `getServerSession()` now verifies the `gcc_session` cookie (no `x-user-*` header trust); `verify-otp` kills a code after 5 wrong attempts (`otp_codes.attempts`) and consumes it atomically; `send-otp` is limited to 3 per number per 15 min and 10 per IP per hour; `login` to 5 attempts per identifier+IP per 15 min (in-memory limiter, `src/lib/rate-limit.ts`); OTPs and hashes are no longer logged; post-login/onboarding `redirect` goes through `safeRedirectPath`; `push/unsubscribe` needs a session and is scoped to the user; `leads/capture` returns only `{ lead: { id } }`; `pdf/generate` is admin-only, escapes the email title and no longer 500s on an email failure. Tests: `tests/auth-hardening.test.ts`, `tests/email-escape.test.ts`. Statements above that contradict this are superseded.
