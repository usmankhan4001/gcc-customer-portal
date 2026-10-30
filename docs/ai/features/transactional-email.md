# Feature: Transactional email (Resend)

**Slug**: transactional-email   **Area**: [messaging-and-notifications](../modules/messaging-and-notifications.md)   **Status**: partial   **Last verified against code**: 2026-10-30

## What it does
`src/lib/email.ts` wraps Resend and defines five HTML emails. Only one is ever sent: the tool-result email that links to a generated PDF (when a lead ticks "email it" on a free tool). Welcome, KYC reminder, order confirmation and renewal reminder are written but have zero callers. Whether the sending domain `gccstartup.com` is verified in Resend is unverified.

## Entry points
- `POST /api/pdf/generate` with `email_it:true` -> `sendToolResultEmail` (`src/app/api/pdf/generate/route.ts:46-48`). Triggered from `src/components/portal/PDFDownloadPanel.tsx:25`.
- Nothing else imports `@/lib/email` (grep of `src`, `tests`, `scripts`).

## Files
- `src/lib/email.ts:1-285` - lazy client `getResend()` (`:7-13`), `FROM_ADDRESS` (`:15`), five senders.
- `src/app/api/pdf/generate/route.ts` - sole caller.
- `package.json` - `resend ^6.25.0` (installed 6.25.0).

## Request / response contract
All senders are `Promise<void>`, call `getResend().emails.send({from, to, subject, html})`, and in `catch` `console.error(...)` then `throw error`.
- `sendWelcomeEmail(to, name, companyName)` - subject `Welcome to GCC Startup — {companyName}`; CTA `{NEXT_PUBLIC_APP_URL}/dashboard`. UNUSED.
- `sendKYCReminder(to, name)` - subject `Action Required — Complete Your Identity Verification`; CTA `{APP_URL}/kyc` (route does not exist). UNUSED.
- `sendOrderConfirmation(to, name, orderNumber, amount)` - subject `Order Confirmed — {orderNumber}`; amount formatted `Intl.NumberFormat('en-AE',{style:'currency',currency:'AED'}).format(amount/100)` although orders are USD cents (`schema.ts:184-185`); CTA `{APP_URL}/orders/{orderNumber}` (no such route). UNUSED.
- `sendRenewalReminder(to, name, entityName, daysLeft)` - subject `Renewal Reminder — {entityName} expires in {daysLeft} days`; CTA `{APP_URL}/renewals` (no such page route; renewals live under admin). UNUSED.
- `sendToolResultEmail(to, title, downloadUrl)` - subject `Your {title} — GCC Startup`; body "Your result is ready." + button "Download PDF" -> `downloadUrl`; footer "This link expires in 7 days." USED.
From address: `noreply@gccstartup.com` (bare address, no display name, no `reply-to`). Welcome copy says "reply to this email" but replies go to a no-reply address.

## Step-by-step flow (the one live path)
1. Client tool page -> `PDFDownloadPanel` POSTs `{lead_id, title, subtitle, rows, email_it}` to `/api/pdf/generate`.
2. Route loads the lead (`404 {error:'Lead not found'}` if missing), renders and uploads the PDF to R2, stores `leads.pdf_r2_key`, creates a presigned URL valid 7 days (`60*60*24*7`, `:44`).
3. If `email_it && lead.email`: `await sendToolResultEmail(lead.email, title, downloadUrl)`.
4. Returns `{url: downloadUrl}`; any thrown error returns 500 `{error:'Internal server error'}`.

## Data
No tables read or written by `email.ts`. `email_status` on `notifications` and `users.email_alerts_enabled` are never used. Sent mail is not logged anywhere except Resend's own dashboard; no bounce/complaint webhook exists.

## Business rules and constants
- Env: `RESEND_API_KEY` (`email.ts:10`, read lazily; Resend's constructor throws when the key is undefined), `NEXT_PUBLIC_APP_URL` (`:50,104,174,227`; interpolated raw, so unset renders `undefined/dashboard`).
- Brand colours inline: navy `#0A2540`, gold `#C9A84C` (not the AGENTS.md `#14204A`/`#C5A572` tokens).
- Download link TTL 7 days (route), matches the email text.

## Auth, permissions, security
The route that triggers the only email is public (no session; `lead_id` is the only credential, a UUID). Anyone who knows or obtains a lead UUID can make the system email that lead's address a PDF link, and can supply an arbitrary `title` (rendered unescaped into HTML and the subject: `email.ts:256,264`) and arbitrary `rows`. All templates interpolate `name`, `companyName`, `entityName`, `title`, `downloadUrl` into HTML without escaping (HTML injection / phishing text risk via the public route). Not a protected file, but the Resend key is a secret.

## Failure modes and edge cases
- Resend SDK v6 returns `{data, error}` instead of throwing on API errors (response type has `data: null` on error, `Response<T>` at `node_modules/resend/dist/index.d.mts:122-130`, used by `CreateEmailResponse` at `:620`; constructor throws "Missing API key" at `dist/index.mjs:1270`). `email.ts` ignores the return value, so unverified domain, invalid API key, rate limit, invalid recipient all pass silently as success. Only network failure or a missing `RESEND_API_KEY` (constructor throw) reaches the `catch`.
- If `RESEND_API_KEY` is unset and `email_it` is true: `getResend()` throws inside the try -> logged and rethrown -> `/api/pdf/generate` returns 500 AFTER the PDF was generated and `pdf_r2_key` saved, so the user sees an error although the PDF exists and `url` was never returned.
- No retry, queue, idempotency key: double-clicking sends two emails.
- `lead.email` is not validated beyond truthiness at send time.
- Email links `/kyc` and `/orders/<n>` would 404 if those functions were ever enabled.

## Tests
None. Worth writing (mock `resend` module, spy on `emails.send`):
1. `sendToolResultEmail('a@b.co','Tax Report','https://x/y')` -> `send` called once with `from:'noreply@gccstartup.com'`, subject `Your Tax Report — GCC Startup`, html contains the URL.
2. `send` resolves `{data:null,error:{message:'domain not verified'}}` -> expect function to throw (fails today; acceptance for the fix).
3. `send` rejects -> function rethrows after `console.error`.
4. `/api/pdf/generate` with `email_it:true` and no `lead.email` -> no email call, 200 with `url`.
5. `/api/pdf/generate` when email throws -> decide desired behavior (return `url` with `emailed:false`) and test it.
6. HTML escaping: title `<script>` is escaped (after fix).

## Known bugs and gaps
- Silent failure: `email.ts` never inspects `result.error` from Resend (e.g. `:23`, `:136`, `:253`).
- 4 of 5 functions dead; links in 3 of them point to non-existent routes; `sendOrderConfirmation` formats USD cents as AED.
- Unescaped interpolation in every template; public caller allows attacker-controlled `title`.
- A failed email turns the whole PDF request into a 500 after side effects.

## Change guide
- Check the result: `const { error } = await getResend().emails.send(...); if (error) throw new Error(error.message)`. Update tests accordingly.
- Escape user strings with a small `escapeHtml` helper before interpolation; consider moving shared layout into one `renderEmail()` to stop copy-paste.
- Wiring a dead email: call from the producer (e.g. Stripe webhook is a protected zone, human OK needed), respect `users.email_alerts_enabled`, set `notifications.email_status`.
- Use `from: 'GCC Startup <noreply@gccstartup.com>'` and add `replyTo` of a monitored inbox if replies are expected. Domain SPF/DKIM must be set up in Resend.
- Android/FCM readiness: email stays the fallback channel for the app; add a consent flag and an `events` row per send. Once mobile users exist, route "result ready" through push first and email only if no device token exists.

## Related features
[tool-result-pdf-and-email](tool-result-pdf-and-email.md), [lead-capture-and-persona](lead-capture-and-persona.md), [renewals](renewals.md), [in-app-notifications](in-app-notifications.md), [service-catalog-and-checkout](service-catalog-and-checkout.md), [deploy-and-ci](deploy-and-ci.md)
