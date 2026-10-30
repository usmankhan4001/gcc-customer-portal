# Feature: Profile and support pages

**Slug**: profile-and-support   **Area**: [client-portal](../modules/client-portal.md)   **Status**: stub   **Last verified against code**: 2026-10-30

## What it does
`/profile` shows the user's initials, name and WhatsApp number, a working push-notification toggle, two inert settings rows, and a log-out button. `/support` is a static page with three contact links (email, phone, WhatsApp). Nothing on either page edits or persists profile data; there is no ticketing and no "concierge handoff" logic in either page (grep for "concierge" finds only marketing copy in tool pages).

## Entry points
- `GET /profile` -> `src/app/(authenticated)/profile/page.tsx` (async server component).
- `GET /support` -> `src/app/(authenticated)/support/page.tsx` (sync, static, no session use).
- Both in `PROTECTED_PREFIXES` (`src/middleware.ts:38-39`); also listed in `NavLinks.tsx:13,19` bottom-nav roots.
- Logout: `POST /api/auth/logout` from `LogoutButton`.

## Files
- `profile/page.tsx:1-82` - page. `initials()` :10-14.
- `support/page.tsx:1-51` - static links.
- `src/components/portal/LogoutButton.tsx:1-40` - client; POST `/api/auth/logout`, then `router.push('/auth')` and `router.refresh()` in `finally` (so redirect happens even if the call fails).
- `src/components/portal/PushNotificationToggle.tsx` - subscribe/unsubscribe (`/api/push/subscribe`, `/api/push/unsubscribe`); see [web-push](web-push.md).
- `src/components/portal/BannerHeader.tsx` - title bar.
- `src/lib/session.ts:15`, `src/lib/db/schema.ts:33` (`users`).

## Request / response contract
none owned by these pages. Calls made: `POST /api/auth/logout` (no body), `POST /api/push/subscribe`, `POST /api/push/unsubscribe` (owned by other features).

## Step-by-step flow
Profile: 1. `getServerSession()` (:17). 2. If session: `users WHERE id = session.userId LIMIT 1` (:18-20). 3. `displayName = full_name || 'Complete your profile'`; `displayPhone = whatsapp_number || ''` (:22-23). 4. Avatar text = `initials(full_name, phone || 'GC')`: first letters of first two name parts, else first two chars of fallback uppercased (:10-14, :33). 5. Renders three rows: "Personal Information" `<button>` (no handler, :43), Push Notifications row with live toggle (:53-64), "Security" `<button>` (no handler, :66). 6. `<LogoutButton/>`.
Support: renders three anchors only.

## Data
Reads `users.full_name`, `users.whatsapp_number`. Writes: none. Not shown or editable: `email`, `country_of_residence`, `avatar_url`, `whatsapp_alerts_enabled`, `email_alerts_enabled`, `password_hash` (schema :33-47). No API exists to update any of these (grep of `src/app/api` shows no user-update route; PATCH routes are admin, revenue-estimate, notifications).

## Business rules and constants
- Support contacts (hard-coded): `mailto:support@gccstartup.com` (:17), `tel:+97337728231` (:27), `https://wa.me/97337728231` (:37, opens new tab, `rel="noreferrer"`). Call row shows no number text, only "Speak directly with our team".
- Placeholder name text: "Complete your profile" (profile :22) is shown when `full_name` is empty (e.g. users created by admin with `temp_` phone numbers).

## Auth, permissions, security
Middleware JWT gate on both routes. Profile identity depends on `getServerSession()` headers (unverified-at-runtime risk, see [client-dashboard](client-dashboard.md)); without them the page renders "Complete your profile" with no error. Support exposes only public contact details. PROTECTED ZONE for any change to middleware/session.

## Failure modes and edge cases
- DB error on profile -> unhandled, `src/app/error.tsx`.
- Missing session -> blank-looking profile, Log Out still works.
- Logout API failure -> user still navigated to `/auth`, but cookie may remain; middleware would then bounce back only if token valid (the `/auth` page behaviour is out of scope).
- Admin-created users with `full_name` like "<Company> Representative" show that as name.

## Tests
None. Worth writing:
1. Profile with user `full_name='Ayesha Khan'` -> initials "AK", name shown.
2. User with null name and phone `+97337728231` -> initials "+9", heading "Complete your profile".
3. Support page contains the three hrefs exactly.
4. Clicking Log Out calls `POST /api/auth/logout` and navigates to `/auth`.
5. No session -> profile renders without throwing.

## Known bugs and gaps
- "Personal Information" and "Security" are dead buttons (`profile/page.tsx:43,66`), copy promises email/phone/address editing and passkeys/2FA that do not exist.
- `initials()` for a phone fallback yields `+9` style text (:12 slicing includes `+`).
- No way to set email or turn off WhatsApp/email alerts although `users.whatsapp_alerts_enabled` / `email_alerts_enabled` exist.
- Support has no ticket, form, hours, or concierge/account-manager handoff; the dashboard PDF copy says "contact your account manager" but no page identifies one. `companies.assigned_to` exists but is never shown to the client.

## Change guide
Editable profile: add `PATCH /api/profile` verifying `gcc_session` via `verifyToken` (as revenue-estimate does), whitelist fields (`full_name`, `email`, alert flags), and a client form; keep `whatsapp_number` unique and OTP-verified (see [whatsapp-otp-login](whatsapp-otp-login.md)). Concierge: read `companies.assigned_to` -> `users` for name/phone and render a WhatsApp deep link. Keep support numbers in one constant (currently duplicated across files, e.g. emails).

## Related features
[web-push](web-push.md), [password-login-logout](password-login-logout.md), [session-and-route-guard](session-and-route-guard.md), [whatsapp-outbound](whatsapp-outbound.md), [client-dashboard](client-dashboard.md)
