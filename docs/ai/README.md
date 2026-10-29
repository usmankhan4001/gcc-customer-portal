# AI Documentation Hub

Docs written for AI agents (and humans reading over their shoulder). Keep them short, factual, and tied to code.

## Reading order for an agent
1. `AGENTS.md` (rules, protected zones, commands)
2. `docs/ai/CODEMAP.md` (generated: pages, API routes, DB tables, lib exports)
3. `docs/ai/FEATURES.md` (index of documented features) then the relevant `docs/ai/features/<slug>.md`
4. `docs/specs/<NNN-slug>.md` (the task)
5. `docs/versions/INDEX.md` for the v2.x roadmap (what is planned, by version and feature ID)
6. `docs/v1-master-plan/` only for product intent, not for current behavior

## Truth rules
- Code beats docs. If they disagree, fix the doc in the same change.
- `CODEMAP.md` is generated; run `npm run docs:ai`. Never hand-edit it.
- A feature is not done until `docs/ai/features/<slug>.md` exists and is listed in `FEATURES.md`.

## The FDE loop (local)
```
/new-spec <request>  ->  human sets Status: approved  ->  /build docs/specs/NNN-slug.md
   spec-writer            (the only manual gate)            implementer -> verify (self-heal) -> docs check
                                                            -> protected-file check -> reviewer -> local commit
```
`npm run fde -- <spec> --dry-run` shows the plan without calling any model. Run logs: `.fde/runs/` (git-ignored). Nothing is pushed.

Configuration: `CLAUDE_BIN` (full path to the claude executable if not on PATH), `FDE_BUDGET_USD` (per agent call, default 5), `FDE_MODEL`.
