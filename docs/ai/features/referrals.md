# Feature: Referrals

**Slug**: referrals   **Area**: [client-portal](../modules/client-portal.md)   **Status**: stub   **Last verified against code**: 2026-10-30

## What it does
The dashboard shows a "Referral Program" card: counts of referrals made and converted, a hard-coded "$0 Earned", and a copyable-looking link. The link carries `?ref=<first 8 chars of userId>`, but nothing reads that parameter and nothing ever inserts a `referrals` row, so counts are always 0 and no commission is tracked.

## Entry points
- UI only: dashboard block "SECTION 6" `src/app/(authenticated)/dashboard/page.tsx:414-455`.
- No API route, no admin page, no webhook mentions referrals.

## Files
- `src/lib/db/schema.ts:359-371` - `referrals` table; type `Referral` :423.
- `dashboard/page.tsx:139-155` (count queries), :177 (link), :423-436 (stat tiles), :438-454 (link + copy button).

## Request / response contract
none.

## Step-by-step flow
1. `referralCount` = rows of `referrals WHERE referrer_user_id = session.userId` (`SELECT *` then `.length`, :139-146).
2. `paidReferralCount` = same with `status = 'paid'` (:148-155).
3. `referralLink` = `${NEXT_PUBLIC_APP_URL || 'https://portal.gccstartup.com'}/?ref=${session.userId.slice(0,8)}` (:177); empty string if no session, in which case the link box is hidden (:438).
4. Tiles: Referred = count, Converted = paid count, Earned = literal `$0` (:433). Not computed from `commission_amount`.

## Data
`referrals`: `id uuid`, `referrer_user_id` FK users (not null), `referred_email`, `referred_name`, `status` enum `sent|signed_up|paid` default `sent`, `commission_amount int` (cents), `referred_user_id` FK users, `note`, `created_at`. Only reads: `referrer_user_id`, `status`. A grep of `src` for `referrals` hits dashboard + schema only; grep for `searchParams.get('ref')`, `'ref'`, `referred_by` in `src` finds nothing. `users` has no referral-code or referred-by column. `/?ref=` is not captured by onboarding (`src/app/onboarding/page.tsx` has no ref handling) or middleware.

## Business rules and constants
- Code = first 8 hex chars of the user UUID: not unique-guaranteed and not resolvable back to a user without a prefix scan (`id::text LIKE 'abcd1234%'`).
- Fallback domain `https://portal.gccstartup.com` (:177).
- Status vocabulary `sent` -> `signed_up` -> `paid` exists only in the enum; no transition code.
- No commission rate or payout rule in code (check [../../AGENTS.md](../../../AGENTS.md) / business docs for policy: unverified).

## Auth, permissions, security
Counts scoped by `session.userId` (header-based `getServerSession()`, see [client-dashboard](client-dashboard.md)). Public referral code leaks the first 8 chars of the user UUID (low impact, but it is a partial internal id). No endpoint exists to protect.

## Failure modes and edge cases
- Always zeros today; no error path other than DB error (unhandled).
- Loads all referral rows to count them; will not scale for heavy referrers.
- The Copy button handler is declared in a server component (`:446-449`), likely unusable (see [client-dashboard](client-dashboard.md)); users may have to select the read-only input manually.

## Tests
None. Worth writing for a real implementation:
1. Visit `/?ref=abcd1234` then complete onboarding -> `referrals` row `signed_up` with `referred_user_id` set, referrer resolved.
2. Self-referral (same user) is rejected.
3. Order paid via Stripe webhook for a referred user -> row `paid`, `commission_amount` set once (idempotent on webhook retry).
4. Dashboard with 2 rows (1 paid) -> tiles 2 / 1; Earned equals sum of `commission_amount`/100.
5. Unknown `ref` code ignored without error.

## Known bugs and gaps
- Table is write-never: no insert anywhere in `src` (grep evidence above), so the feature is non-functional end to end.
- "Earned" hard-coded `$0` (:433); `commission_amount` unused.
- `?ref=` never captured or persisted; no `ref` cookie.
- Two full-row queries instead of `count(*)` (imports `count` but does not use it, :3).
- Copy button likely broken (server component event handler).

## Change guide
To ship: (1) add a stable `referral_code` column on `users` (migration) instead of UUID prefix; (2) capture `ref` on landing/onboarding into a cookie, create `referrals(status='signed_up')` in the onboarding-complete route; (3) in the Stripe webhook set `paid` + commission; (4) replace dashboard queries with `count()`/`sum()` and move the copy button into a small client component; (5) add an admin view. Touching onboarding/webhook routes: check their protected-zone notes first.

## Related features
[client-dashboard](client-dashboard.md), [onboarding-wizard](onboarding-wizard.md), [lead-capture-and-persona](lead-capture-and-persona.md), [stripe-webhook](stripe-webhook.md), [database-and-migrations](database-and-migrations.md)
