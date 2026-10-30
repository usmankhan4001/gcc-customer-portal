# Feature: In-app notifications

**Slug**: in-app-notifications   **Area**: [messaging-and-notifications](../modules/messaging-and-notifications.md)   **Status**: partial   **Last verified against code**: 2026-10-30

## What it does
Each client has a feed of notification rows shown at `/notifications` (latest 50), with a bell and unread badge in the top bar of every authenticated page. A client can mark one item or all items read. Rows are only ever created by two server code paths (Stripe payment confirmed, KYC reference received over WhatsApp), so the feed is mostly empty for most users. There is no admin tool, cron, or other producer.

## Entry points
- UI: `GET /notifications` (`src/app/(authenticated)/notifications/page.tsx`), gated by `src/middleware.ts` (`/notifications` in PROTECTED_PREFIXES).
- API: `PATCH /api/notifications/[id]/read`, `PATCH /api/notifications/read-all`. There is NO list/count API; the page and AppShell query the DB directly.

## Files
- `src/lib/db/schema.ts:250-277` - `notifications` table; `:418` type `Notification`.
- `src/app/(authenticated)/notifications/page.tsx:8-29` - server component, reads 50 newest rows for `session.userId`.
- `src/components/portal/NotificationList.tsx:25-98` - client list, optimistic read marking.
- `src/components/portal/AppShell.tsx:21-28` - unread count query; `TopBar.tsx:31-38` renders bell and badge.
- `src/app/api/notifications/[id]/read/route.ts`, `src/app/api/notifications/read-all/route.ts` - mark read.
- Producers: `src/app/api/webhooks/stripe/route.ts:82-90`, `src/app/api/webhooks/whatsapp/route.ts:124-131`.
- `src/lib/session.ts` - `getServerSession()` reads `x-user-id` header set by middleware.

## Request / response contract
`PATCH /api/notifications/{id}/read` - no body. Cookie `gcc_session` read via `verifyToken`. 200 `{success:true}`; 401 `{error:'Unauthorized'}`. Always 200 even if `id` matches no row or belongs to another user (the update is scoped `id AND user_id`, so it is a silent no-op). No try/catch: a non-UUID `id` makes Postgres reject the cast, which should surface as an unhandled 500 (unverified at runtime).
`PATCH /api/notifications/read-all` - no body. 200 `{success:true}`; 401 as above. Updates every row for the caller regardless of current state.
Neither route validates the HTTP method beyond Next's export (only PATCH is exported; other verbs get 405).

## Step-by-step flow
1. Producer inserts a row with `user_id,title,message,type,category,link_url` (defaults fill the rest); then calls `sendPushToUser` (see [web-push](web-push.md)).
2. Any `(authenticated)` page render runs `AppShell` (`AppShell.tsx:14`): `SELECT *` rows where `user_id = session.userId AND is_read = false`, takes `.length` (no `count(*)`), passes `unreadCount` to `TopBar`. Badge shows `9+` above 9 (`TopBar.tsx:35`).
3. `/notifications` selects `ORDER BY created_at DESC LIMIT 50`, serialises `created_at` with `toISOString()`, hands to `NotificationList`.
4. Click "Mark read" button (`NotificationList.tsx:73-81`): `markRead(id)` sets local `is_read=true` first, then `fetch PATCH`. The response is not checked, so a failure leaves UI and DB out of sync until reload.
5. Click an item that has `link_url`: `<Link onClick>` also calls `markRead` when unread (`:87`), then navigates.
6. "Mark all as read" (`:44-49`, shown only if some item unread) calls read-all.

## Data
`notifications`: `id uuid pk default random`; `user_id uuid FK users.id NOT NULL`; `title text NOT NULL`; `message text NOT NULL`; `type text enum info|success|warning|action_required default info NOT NULL`; `category text enum kyc|payment|document|renewal|promo|system default system NOT NULL`; `link_url text null`; `is_read bool default false NOT NULL`; `whatsapp_status|email_status|push_status text enum not_sent|sent|failed default not_sent` (nullable); `created_at timestamp default now NOT NULL`. Enums are TS-only (no DB CHECK). FK is `ON DELETE no action`. No secondary index (user_id, is_read, created_at are all scanned sequentially; fine at current scale, add `(user_id, is_read)` if volume grows). Not stored: delivery receipts, WhatsApp message id, which device received the push, read timestamp.

## Business rules and constants
- Feed limit 50, no pagination (`page.tsx:16`). Badge cap display `9+` (`TopBar.tsx:35`).
- Only categories ever written: `payment` (Stripe) and `kyc` (WhatsApp). `document`, `renewal`, `promo`, `system` are unused.
- Stripe path hardcodes `whatsapp_status:'sent'` without checking the send result (`stripe/route.ts:89`). `email_status` and `push_status` are never written anywhere.
- `users.whatsapp_alerts_enabled` / `email_alerts_enabled` exist but nothing reads them; in-app rows are created regardless.

## Auth, permissions, security
`/api/*` is public to middleware (`PUBLIC_PATHS` `'/api/'`), so each handler self-checks the cookie. Ownership is enforced in SQL (`user_id = session.userId`). Producers are server-only. Not an AGENTS.md protected file, but both producers live in protected webhook files (Stripe webhook = money zone; `src/app/api/webhooks/**` is in the FDE `PROTECTED` list, `scripts/fde/lib.mjs:7`).

## Failure modes and edge cases
- Insert failure in a webhook throws and returns 500 (Stripe retries; see duplicate bug below).
- Duplicate notifications: Stripe webhook is not idempotent; each re-delivery of `checkout.session.completed` inserts another "Payment Confirmed" row.
- `getServerSession()` returning null renders an empty feed instead of redirecting (middleware normally prevents this).
- Optimistic UI never rolls back; no toast on failure.
- Clicking the inner "Mark read" button inside a `<Link>` bubbles to Link's `onClick` while `n.is_read` is still false in the closure, so two identical PATCH calls fire (harmless, wasteful).
- Unread count is stale until the next server render (no polling or push-to-UI).

## Tests
None. Worth writing (vitest, mock `@/lib/db` like `tests/auth-routes.test.ts`):
1. `PATCH /api/notifications/read-all` without cookie -> 401, `update` not called.
2. `PATCH /[id]/read` with valid session -> `update` called with `where` containing both id and user id; response `{success:true}`.
3. `[id]/read` for an id owned by another user -> 200 and zero rows changed (assert where-clause includes `user_id`).
4. Non-UUID id -> decide expected status (currently 500); add try/catch returning 400 and test it.
5. Stripe webhook delivered twice -> one notification (will fail today; acceptance for an idempotency fix).

## Known bugs and gaps
- No idempotency on producers: `stripe/route.ts:82` and `whatsapp/route.ts:124` insert unconditionally.
- Unread count loads full rows (`AppShell.tsx:23-27`) on every authenticated navigation; replace with `count(*)`.
- Four of six categories and `email_status`/`push_status` are dead; per-channel flags in `users` are ignored.
- No list or unread-count API, so a non-browser client (Android) cannot read the feed.

## Change guide
- New producer: insert the row, then call `sendPushToUser(userId, {title, body, url})`; set `*_status` columns from real send results. Respect `users.*_alerts_enabled` before sending on those channels.
- New category/type: edit the two `text(..., {enum})` lists in `schema.ts`, run `npm run db:generate` (enum change produces no SQL since there is no CHECK), update `TYPE_DOT` in `NotificationList.tsx`.
- Keep `/notifications` in middleware PROTECTED_PREFIXES; keep routes self-authenticating.
- Android/FCM readiness: add `GET /api/notifications?cursor=` and `GET /api/notifications/unread-count` that accept a bearer token (cookie auth only today); the FCM payload should carry the notification `id` so the app can mark read via `PATCH /api/notifications/{id}/read`. Add a `read_at` column and keep `is_read` for compatibility. Consider an `events` table row per notification created for audit.

## Related features
[web-push](web-push.md), [whatsapp-inbound-webhook](whatsapp-inbound-webhook.md), [stripe-webhook](stripe-webhook.md), [whatsapp-outbound](whatsapp-outbound.md), [session-and-route-guard](session-and-route-guard.md), [client-dashboard](client-dashboard.md)
