# Spec: <feature name>

**Status**: draft | approved | in-progress | shipped
**Requested by**: <client / internal owner>
**Roadmap ref**: docs/v1-master-plan/<file>.md

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
