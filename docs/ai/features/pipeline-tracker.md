# Feature: Pipeline tracker

**Slug**: pipeline-tracker   **Area**: [client-portal](../modules/client-portal.md)   **Status**: partial   **Last verified against code**: 2026-10-30

## What it does
Shows the client a 5-node horizontal progress bar ("Application Progress") on `/dashboard`. The current node is derived purely from `companies.status`, which admins change from the kanban. The `milestones` table that the schema comment says "drives PipelineStepTracker" is not used at all.

## Entry points
- UI: `<PipelineStepTracker steps={STAGE_LABELS} currentStep={STATUS_TO_STEP[status] ?? 0} />` at `src/app/(authenticated)/dashboard/page.tsx:255`, rendered only when `activeCompany` exists (:252).
- Status writer: `PATCH /api/admin/pipeline` (`src/app/api/admin/pipeline/route.ts`).

## Files
- `src/components/portal/PipelineStepTracker.tsx:1-58` - presentational; props `steps: string[]`, `currentStep: number`.
- `src/app/(authenticated)/dashboard/page.tsx:38-49` - `STAGE_LABELS`, `STATUS_TO_STEP`.
- `src/lib/db/schema.ts:52-90` - `companies.status` enum; `:153-169` - unused `milestones`.
- `src/app/api/admin/pipeline/route.ts:111-147` - admin status writer; `src/app/admin/page.tsx:66-72, 198-225` - kanban maps.

## Request / response contract
none for the client UI. Admin writer: `PATCH /api/admin/pipeline` body `{companyId (required), status?, assignedTo?}`; 401 if `requireAdmin()` fails, 400 `companyId is required` / `Invalid status: x`, 404 `Company not found`, 200 `{success:true, company}`, 500 `{error}`.

## Step-by-step flow
1. Dashboard loads `activeCompany` = newest `companies` row of the user with `status <> 'lead'` (dashboard :87-94).
2. `STATUS_TO_STEP[activeCompany.status] ?? 0` -> `currentStep` (:255).
3. Tracker (`PipelineStepTracker.tsx:22-54`): for each index i: `isCompleted = i < currentStep` (green node + check icon), `isCurrent = i === currentStep` (white node, accent ring, shows number i+1), else future (grey). Label under node, 1-based number inside.
4. Progress line width = `clamp(currentStep, 0, n-1) / max(1, n-1) * 100` percent (:19).
5. Admin moves status; next dashboard load shows it. No client polling or push on stage change from this component.

## Data
Read: `companies.status` (text enum, default `'lead'`, schema :63-75). Not read: `milestones` (`stage_index` 1-6, `stage_name`, `status pending|in_progress|completed`, `official_portal_url`, `completed_at/by`); grep of `src` shows no query or insert against it. When admin sets `status='active'` the PATCH also sets `incorporation_date = now()` and `official_kyc_completed = true` (route :131-134).

## Business rules and constants
| companies.status | currentStep | node highlighted |
|---|---|---|
| (lead) | not shown (excluded; fallback 0) | - |
| onboarding | 0 | 1 Onboarding |
| official_kyc_pending | 1 | 2 Official KYC |
| filing_in_progress | 2 | 3 Government Filing |
| bank_opening | 3 | 4 Bank Setup |
| active | 4 | 5 Active (no check: `isCompleted` is false for the last node) |
| renewal_due / suspended / archived | 4 | 5 Active (misleading for suspended/archived) |

Admin kanban uses different groupings: 4 columns (New Leads = lead+onboarding; KYC Review; Filing In Progress = filing_in_progress+bank_opening; Active/Done = active, renewal_due, suspended, archived) (`admin/page.tsx:204-226`); `STAGE_ORDER` next-step map lead/onboarding -> official_kyc_pending -> filing_in_progress -> bank_opening -> active (:66-72); select labels "1. New Lead ... 5. Bank Setup" (:75-80). Admin `validStatuses` list = the 9 enum values (route :119-129).

## Stage names across docs vs code
- Code (client): 5 steps, labels above.
- `AGENTS.md:20`: "live 5-stage milestone tracker" (matches client UI).
- `docs/architecture/ARCHITECTURE.md:79`: "milestones: 5-6 stage operational timeline".
- `docs/GCCSTARTUP_MASTER_NON_TECHNICAL_BLUEPRINT.md:138,203`: 6 stages `Paid > Official KYC & Handshake > Registry Filing > License Issued > Bank Setup > Active`.
- Schema comment `stage_index // 1-6`. So docs say 5 or 6; code ships 5 derived from status; "License Issued" has no status or step.

## Auth, permissions, security
Client sees only their own company (user-scoped query). Identity via `getServerSession()` in the page (header dependency; see [client-dashboard](client-dashboard.md)). Admin writer uses `requireAdmin()`. Admin pipeline API is under `/api/`, a public path in middleware, so only the handler check protects it.

## Failure modes and edge cases
- Unknown status -> step 0. `currentStep` > n-1 clamps the line but nodes use raw index (all complete).
- Last-step/terminal states render identical to "Active".
- No company: block hidden.
- PATCH does not validate transitions: admin can jump any status, including backwards; no history is stored.

## Tests
None. Worth writing:
1. Render tracker `currentStep=2`, 5 steps -> nodes 0,1 completed, 2 current, 3,4 future; line width 50%.
2. `currentStep=99` -> width 100%.
3. Mapping test: every enum status except `lead` has a key in `STATUS_TO_STEP`.
4. Admin PATCH with `status:'bogus'` -> 400.
5. PATCH `active` sets `incorporation_date` and `official_kyc_completed`.

## Known bugs and gaps
- `milestones` is dead: no writer, no reader (grep `milestones` in src -> schema.ts only, plus a style-guide string). Schema comment "drives PipelineStepTracker" is false.
- `suspended` and `archived` show as step 5 "Active" (`dashboard/page.tsx:46-48`).
- Final node never shows a check mark when current (`isCompleted = index < currentStep`).
- No per-stage dates, descriptions or official portal URLs reach the client.
- Admin `active` transition overwrites `incorporation_date` every time it is set (route :132).

## Change guide
Add/rename a stage: edit `companies.status` enum (schema :63) + migration, `validStatuses` (pipeline route), `STAGE_LABELS`/`STATUS_TO_STEP` (dashboard), kanban `STAGE_ORDER`/columns/select options. To use real milestones: insert rows when a company is created, update them in the PATCH, query ordered by `stage_index` in the dashboard, pass names as `steps`. Update this doc and the module doc.

## Related features
[client-dashboard](client-dashboard.md), [admin-kanban-pipeline](admin-kanban-pipeline.md), [database-and-migrations](database-and-migrations.md), [kyc-review](kyc-review.md)
