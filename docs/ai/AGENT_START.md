# Start here (any AI agent, any machine)

**Base branch: `dev`.** Clone or fetch it (`git clone -b dev <repo>`), branch from `origin/dev`, and merge back into `dev`. **Never push to `main`:** pushing `main` deploys production. `dev` auto-deploys only the dev test app.

You are working on the GCCStartup client portal (Next.js 15, React 19, Drizzle/Postgres). These steps work with Claude Code, Codex, Cursor, Gemini CLI, Copilot agent or a human. `AGENTS.md` is the rulebook; this file is the quick path.

## 1. Set up (2 minutes)
```bash
npm ci                 # Node 22+; installs dependencies
npm run docs:ai        # generates docs/ai/CODEMAP.md and FEATURES.md (git-ignored)
npm run verify         # typecheck + unit tests + production build; must pass before you start
```
No secrets are needed. `verify` uses placeholder env values and mocks every external service. Real-database tests (optional locally, required in CI): `docker compose -f docker-compose.dev.yml up -d` then `npm run test:db`.

## 2. Pick work
Open `docs/specs/BACKLOG.md`. Take one spec whose **Status** is `approved` and whose **Depends on** are shipped. Do not start `draft` specs: they need the owner's approval first. If you run in parallel with other agents, your spec's **Touches** list must not overlap theirs and only one schema-changing spec may run at a time.

## 3. Read before coding
1. `AGENTS.md` (rules, protected files, commands)
2. `docs/ai/MODULES.md` (find the area; it lists which feature docs to load)
3. The feature docs named in your spec, then the code. Docs can be wrong: code wins, then fix the doc.

## 4. Build
- Work on your own branch in your own checkout or git worktree: `git worktree add ../work-<spec> -b feature/<spec> origin/dev`, then `npm ci` there. Never share a checkout between agents.
- Smallest change that meets every acceptance criterion. Every criterion gets a test; never weaken or delete a test.
- Do not edit protected files (AGENTS.md section 5) unless the spec lists them under **Protected files approved**. If you need one that is not approved, stop and report it.
- Schema changes only if the spec says **Schema change: yes**: edit `src/lib/db/schema.ts`, run `npm run db:generate`, keep it additive.
- Write or update `docs/ai/features/<spec-slug>.md` and any feature doc whose behavior changed. Do not edit generated files or `MODULES.md`.

## 5. Done means
`npm run verify:full` passes (needs the Docker Postgres from step 1; if you cannot run Docker, run `npm run verify` and say so in your report). Commit on your branch with a message that names the spec. **Do not push to `main`. Do not merge or push to `dev` yourself either: leave the branch for the owner to review.** Report: what changed, tests added, anything skipped, anything risky.

## Automated path (Claude Code only)
`npm run fde -- docs/specs/<spec>.md` does steps 4 and 5 automatically (implementer, verify loop, reviewer, local commit). `npm run fde:batch -- specA specB` runs several in parallel. Set `CLAUDE_BIN` if `claude` is not on PATH. Other agents follow the manual steps above; the rules are identical.
