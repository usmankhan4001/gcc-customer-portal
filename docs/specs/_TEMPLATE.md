# Spec: <feature name>

**Status**: draft | approved | in-progress | shipped
**Requested by**: <client / internal owner>
**Roadmap ref**: docs/versions/<file>.md
**Protected files approved**: none   <!-- or: src/lib/auth.ts, src/app/api/vault/  (owner sign-off; only these protected files may change) -->
**Schema change**: no   <!-- yes = takes the schema lock; at most one schema-changing run at a time -->
**Depends on**: none   <!-- spec numbers that must be merged first -->
**Touches (for parallel planning)**: <files/folders this spec edits>   <!-- two specs may run in parallel only if these do not overlap -->
**Approval**: <who approved, when; required if protected files are listed>

## Problem
One paragraph: who is blocked, and what they do today instead.

## Scope
- In: ...
- Out (explicitly): ...

## Acceptance criteria
Each must be checkable by a test or a named manual step.
- [ ] AC1: Given ..., when ..., then ...
- [ ] AC2: ...

## Touches
- Schema changes (`src/lib/db/schema.ts`): yes/no, summary
- Routes / API: ...
- Protected areas (see AGENTS.md "Human-approval zones"): none | list

## Test plan
- Unit (vitest): ...
- Manual / route check: ...

## Rollout & risk
Migration backward compatible? Feature flag? Rollback step?
