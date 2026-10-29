# GCCStartup — Ground-Up UI Rebuild

## Context

The incremental patch-and-fix approach (Phases 0–1 of the prior plan) was stopped mid-flight by request: the user wants the UI rebuilt from a blank page, not patched — different component foundation, and a real rethink of what each screen should be, not just how it looks.

Before designing anything, three research passes grounded this in what already exists rather than inventing from nothing:

**The current app is a disconnected prototype.** The real database (Neon, `src/lib/db/schema.ts`) has 8 real tables — `users`, `companies`, `documents`, `milestones` (a formal 6-stage per-company pipeline), `orders`, `renewals`, `notifications`, `shareable_links` — and real, working API routes: magic-link auth, Stripe webhook, a document vault with real R2 presigned uploads, a self-contained tax calculator. But the entire customer-facing UI (`usePortalStore`) is 100% localStorage mock state, showing the same hardcoded "Alex" / "Horizon Digital FZE" regardless of who's logged in, with zero `fetch` calls anywhere. Two backend routes are stubbed with TODOs: the WhatsApp webhook (inbound messages only `console.log`, never persisted) and admin KYC review (DB update commented out).

**A real product spec already exists — the build has drifted from it.** The repo's `Discovery/` and `docs/` folders contain a drafted PRD/Functional Spec and several planning docs with concrete, developer-ready screen specs (roles matrix, full route map, component specs for the client dashboard/Kanban/document upload). Two competing product visions exist in those docs — a native-mobile "TrustGate" app (separate project, its own `TrustGate/` Expo folder) vs. a traditional responsive Next.js web dashboard — and **the code that's actually built follows the web-dashboard plan** (`execution_plan.txt` + `v1-master-plan` modules 01–07), not the mobile-native one. That's a real finding: the current UI's phone-width-column-on-every-screen-size shell is cosplaying as a native mobile app shell (borrowed from the *other* project's vision) while the thing actually being built is meant to be a real responsive web dashboard. That mismatch is a concrete contributor to the "doesn't feel like a real app" complaint, separate from the CSS fragmentation the first audit found.

**Business context that shapes scope:** two customer segments (a slower/aspirational "Gulf Relocator" and a fast/action-oriented "Offshore Optimizer"); stated differentiators are privacy/nominee handling, transparent human communication, and speed — not price; the portal is explicitly meant to be a **recurring-revenue retention surface** post-incorporation, not just a formation tracker. Real business process today is a simple human-mediated 4-stage WhatsApp/email flow — the wizard/portal are the intended *upgrade* on top of that, not documentation of something already validated with users. Per-jurisdiction tier pricing is mostly marked TBD in the PRD (only Hong Kong has confirmed numbers, and even those have a flagged inconsistency) — the prices currently shown on the live marketing pages are a separate, already-public data point and should be kept as-is, not treated as fake.

**Decisions made (this session):**
1. Component foundation: **shadcn/ui + Radix primitives + Tailwind v4** — own the source, no fighting a library's baked-in look. HeroUI is dropped (was never wired into more than 2 dead-code files anyway).
2. Visual identity: **keep the orange/navy brand**, rebuild the execution — the `@theme` tokens and full light/dark palette already built in the earlier session carry forward unchanged.
3. Scope: reconcile the IA against the real spec/data model, not just reskin existing screens.
4. **Wire to real data** — replace the mock store with real API routes against the existing Neon schema; finish the two stubbed backend TODOs the new admin screens depend on.

This is a multi-week-scale rebuild. It executes in reviewable phases with a check-in after each, same discipline as before — this plan covers the full arc, but implementation proceeds phase by phase, not in one blind pass.

## Reconciling the IA

Where planning docs conflict, real, already-implemented structures win over drafted docs:

- **Roles**: canonical vocabulary is the DB enum already in `schema.ts` / enforced in `middleware.ts` — `client | staff | operations | admin | super_admin`. (Other docs use different vocabularies for the same idea; ignore those.)
- **Pipeline/Kanban stages**: three docs disagree (7 vs. 10 vs. 11 stages). Canonical source is the real `companies.status` enum already in the DB: `lead → onboarding → official_kyc_pending → filing_in_progress → bank_opening → active`, plus `renewal_due / suspended / archived`. The admin Kanban gets rebuilt around these real values, not any doc's stage list — this also retires the two structurally-dead columns the first audit found in the current Kanban.
- **Milestone tracker**: use the real `milestones` table (6 stages, `stage_index` 1–6, dual `track_type` remote/gulf per company) instead of the mock store's ad hoc `advanceEntityStage`.

## Screen map (route → role → data source)

**Public** (redesigned visually, IA mostly kept — it already matches the PRD's lead-gen concept):
- `/` — home: jurisdiction catalog + lead-gen tool teasers.
- `/tools` — the 6 existing calculators (Tax Arbitrage, Banking Feasibility, Name Availability, QFZP, UBO Privacy, VAT Threshold) as the PRD's "lead-gen micro-tools."
- `/setup` — the 5-step onboarding wizard (Activity → Jurisdiction → Tier → Add-ons → Checkout) — already matches the PRD's own spec; redesign UX, and make submission **actually create** a `companies` + `orders` row via a new API route instead of a client-only store mutation.
- `/checkout` — finish real Stripe Checkout Session creation (`lib/stripe.ts` + the webhook already exist server-side; only the client call is currently fake/decorative).

**Client Portal** (`role=client`, prefix kept as `/portal`):
- `/portal/dashboard` — entity switcher (real `companies` for the logged-in user), live milestone tracker (real `milestones`, dual-track visual), next-action prompt.
- `/portal/vault` — real `documents` + the already-real R2 presign upload flow; shareable links via `shareable_links` (schema exists, needs CRUD routes).
- `/portal/renewals` — real `renewals`, countdown badges on the blueprint's -60/-30/-14/0 day cadence, pay action wired to Stripe.
- `/portal/invoices` — new screen, PRD-specified, derived from `orders`.
- `/portal/settings` — real `users` row.
- `/portal/tax-compliance` — kept; needs one small additive table (`tax_filings`) since nothing in the current schema backs it.
- `/portal/banking` — kept as an informational/checklist screen only — real banking integration is explicitly out of Phase-1 scope per the PRD.

**Admin/Ops** (`role ∈ {staff, operations, admin, super_admin}`, prefix kept as `/admin`):
- `/admin` — real counts (companies by status, revenue from paid orders, renewals due) replacing decorative stat cards.
- `/admin/clients` — Customer 360: real company + documents + milestones + order history per client.
- `/admin/kanban` — the reconciled 6-status board above, drag-and-drop PATCHes real `companies.status`.
- `/admin/filing-queue` — real query on `status IN ('official_kyc_pending','filing_in_progress')`; "mark reviewed" finishes the stubbed `/api/admin/kyc/review` route.
- `/admin/whatsapp` — finishes the stubbed webhook so inbound messages persist to `notifications`; outbound reuses the existing `lib/whatsapp.ts`.
- `/admin/settings` — kept, minor.

**Explicitly not building** (PRD Phase-1 exclusions + real constraints): native mobile app (that's TrustGate, a separate project), real banking integrations, nominee-management portal, internal accounting, multi-currency, white-label/PRO-firm portal, full row-level VA permission enforcement (stays at today's coarse client-vs-staff+ gate).

## Visual system

- Carry forward the existing `@theme` brand tokens and full light/dark palette from `src/styles/globals.css` (orange/navy, semantic status colors, dark-mode blocks) — this work is sound and reusable.
- Replace the HeroUI token bridge with shadcn's expected variable set (`--background`, `--card`, `--primary`, `--secondary`, `--muted`, `--accent`, `--destructive`, `--border`, `--input`, `--ring`, `--radius`, `--sidebar-*`) mapped onto the same brand tokens — same bridging technique as before, different target library.
- One shared dashboard shell (`AppChrome`) for both portal and admin, role-aware nav: sidebar + topbar on desktop, bottom tab bar + drawer on mobile — real breakpoints, not a phone-width column stretched to all sizes. Bottom-tab mobile nav itself is fine and stays; the bug was forcing it at every viewport width, not the pattern itself.
- Keep Inter + DM Sans; apply through shadcn's default type scale instead of ad hoc inline px values.

## Build sequence

1. **Foundation** — `npx shadcn init` on top of Tailwind v4, drop `@heroui/*`, install `zod` + `react-hook-form` + `@hookform/resolvers` (forms), `sonner` (toasts, replacing the hand-rolled `ToastProvider`), `recharts` (admin analytics), add shadcn primitives as needed (`button card dialog badge input select form dropdown-menu sheet tabs table avatar tooltip progress skeleton sonner`); rewrite the token bridge; build the new shared shell.
2. **Data layer** — new API routes for companies/documents/milestones/orders/renewals (list + detail + relevant mutations), `shareable_links` CRUD, small `tax_filings` table + routes, finish the two stubbed TODOs, wire real Stripe Checkout Session creation.
3. **Client portal screens**, rebuilt against real data on the new system: dashboard → vault → renewals → settings → invoices (new) → tax-compliance → banking (informational).
4. **Admin screens**: kanban → clients (Customer 360) → filing-queue → whatsapp inbox → admin home → admin settings.
5. **Public surfaces**: home, tools hub, onboarding wizard (writes real company+order on submit), checkout.
6. **Cleanup**: delete the mock store once nothing reads it, delete superseded dead code (`Input.tsx`/`Select.tsx`, remaining `styled-jsx` in the 5 tools calculators, admin's per-page inline `<style>` blocks), confirm `@heroui` fully removed.

Each numbered phase is a checkpoint — implementation pauses for review after each, as it did in the earlier session.

## Verification

- After each phase: `tsc --noEmit`, dev server smoke test via the browser tool (console + network check; screenshots aren't available in this session, so verification leans on computed-style/DOM checks as it did before).
- For data-wired screens: verify against the real Neon DB using a locally-minted dev JWT (the technique already validated this session) logged in as different roles/users to confirm screens actually reflect real per-user data, not shared mock state.
- End of rebuild: re-run the undefined-CSS-var sweep, confirm zero `@heroui` imports remain, confirm dark mode still resolves correctly on the new shadcn tokens, confirm middleware role gating still matches the reconciled role vocabulary.
