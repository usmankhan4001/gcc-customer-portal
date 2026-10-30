# Feature: Name checker whole-word matching

**Slug**: 009-name-checker-matching-fix   **Spec**: docs/specs/009-name-checker-matching-fix.md   **Last verified against code**: 2026-10-30

## What it does (3 sentences max)
The `/tools/name-checker` verdict now comes from a pure function in `src/lib/tools/name-checker.ts`. Restricted words match as whole words only (case-insensitive, punctuation ignored), so "Embankment" no longer trips "bank". Suggested alternatives never contain a restricted word.

## Where it lives
- Pages / routes: `src/app/tools/name-checker/page.tsx` (client; imports `checkAvailability`)
- API routes: none
- Components: none new
- lib modules: `src/lib/tools/name-checker.ts` (`checkAvailability`, `findRestrictedWord`, `RESTRICTED_WORDS`, `CheckResult`)
- DB tables / columns: none
- Env vars / external services: none

## Behavior and rules
- Words are `[\p{L}\p{N}]+` runs of the lowercased input; a hit is the first entry of `RESTRICTED_WORDS` (list order) present as a whole word.
- Restricted: score 35, alternatives = name with every restricted whole word removed (spaces collapsed) + `Holdings` / `Commercial Services` / `Tech Solutions`.
- Available: score 92, alternatives = name + `FZ-LLC` / `Holdings` / `Limited` ("Global FZCO" was replaced because "global" is restricted).
- Empty/whitespace input: `checkable:false`, no alternatives, no throw. The page still ignores it before calling.
- Restricted word list is unchanged.

## Data flow
1. User submits name -> page calls `checkAvailability(name)` -> result card renders.

## Tests
`src/lib/tools/name-checker.test.ts` covers AC1-AC5. Not covered: the page component (no UI test setup).

## Protected-zone touchpoints
None.

## Known gaps / extension points
Still a keyword filter, not a registry/trademark check. See [tool-name-checker](tool-name-checker.md).
