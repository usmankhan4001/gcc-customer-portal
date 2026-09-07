# Agent Strategy

> Specialized agents for building the GCC Startup Platform.
> Each agent has a specific domain, runs independently, and logs everything.

---

## Agent Roles

### 1. Foundation Agent
**Domain:** Repository setup, database schema, shared infrastructure
**Responsibilities:**
- Initialize pnpm monorepo
- Set up Next.js app, TypeScript, ESLint
- Create Drizzle schema (all tables)
- Set up auth system (JWT + scrypt)
- Create shared utilities (R2, email adapter, WhatsApp client, event bus, queue)
- Set up Docker Compose for local dev
- Write CLAUDE.md

**Input:** BUILD-PLAN.md Phase 1
**Output:** Working skeleton with auth + database + shared infra
**Duration:** Days 1-3

---

### 2. CMS Agent
**Domain:** Content management, website, lead-gen tools, SEO
**Responsibilities:**
- Build content types (pages, posts, services, jurisdictions, pricing, etc.)
- Integrate Puck editor
- Build media library
- Build SEO engine (sitemap, robots, JSON-LD, redirects)
- Build 10 lead-gen tools
- Build public website routes
- Build content calendar

**Input:** Foundation Agent output + BUILD-PLAN.md Phase 2
**Output:** Working CMS with editor, media, SEO, and lead-gen tools
**Duration:** Days 4-7

---

### 3. CRM Agent
**Domain:** Contacts, leads, deals, pipeline, inbox, campaigns, automation
**Responsibilities:**
- Build contact management (list, Kanban, profile, import/export)
- Build lead intake and scoring
- Build deal pipeline (Kanban, stages, forecasting)
- Build unified inbox (WhatsApp + web chat + tickets)
- Build email engine (templates, campaigns, outbox, deliverability)
- Build WhatsApp engine (client, templates, campaigns, inbox, AI copilot)
- Build automation (visual flow builder, triggers, actions, enrollments)
- Build tasks and activities
- Build CRM analytics

**Input:** Foundation Agent output + BUILD-PLAN.md Phase 3
**Output:** Full CRM with pipeline, inbox, campaigns, and automation
**Duration:** Days 8-14

---

### 4. API + Admin Agent
**Domain:** Platform API, webhooks, admin panel, notifications
**Responsibilities:**
- Build REST API (v2) with API key auth
- Build webhook system (registration, dispatch, retry, logs)
- Build admin panel (users, health, settings, audit log, integrations)
- Build internal notification system
- Write OpenAPI documentation

**Input:** Foundation Agent output + CRM Agent output + BUILD-PLAN.md Phase 4
**Output:** Working API + admin panel
**Duration:** Days 15-18

---

### 5. Integration Agent
**Domain:** Testing, deployment, documentation, data migration
**Responsibilities:**
- Write unit tests (Vitest)
- Write API integration tests
- Create Dockerfile (multi-stage)
- Create production Docker Compose
- Write deployment guide
- Write API documentation
- Build data migration scripts (from gccstartup-cms)
- Final polish and bug fixes

**Input:** All other agents' output + BUILD-PLAN.md Phase 5
**Output:** Production-ready deployment with tests and docs
**Duration:** Days 19-21

---

## Agent Coordination

```
Day 1-3:   Foundation Agent (alone)
Day 4-7:   CMS Agent + CRM Agent (parallel, different modules)
Day 8-14:  CRM Agent continues (email, WhatsApp, automation)
Day 15-18: API + Admin Agent (needs CRM output for API endpoints)
Day 19-21: Integration Agent (needs everything done)
```

---

## Logging Protocol

Every agent writes to `docs/BUILD-LOG.md` with this format:

```markdown
### [DATE] — [PHASE] — [TASK]
**Agent:** [agent name]
**Files changed:** [list]
**What was done:** [description]
**Why:** [reasoning]
**Decisions:** [choices made]
**Tests:** [results]
**Blockers:** [issues]
```

Every significant decision is recorded in `docs/DECISIONS.md` as an ADR.

---

## Communication Between Agents

Agents don't call each other directly. They communicate through:

1. **The database** — shared schema, each agent writes to its own tables
2. **The event bus** — modules publish events, other modules subscribe
3. **The build log** — agents read previous agents' logs for context
4. **The build plan** — the source of truth for what needs to be built

---

## Quality Gates

Before marking a task complete, the agent must:

1. Run `pnpm typecheck` — must pass
2. Run `pnpm test` — must pass (if tests exist for the module)
3. Update `docs/BUILD-LOG.md` — must have entry
4. Verify the feature works in the browser (if UI)
5. Commit with a descriptive message

---

## Rollback Strategy

If an agent's work breaks something:

1. The build log shows exactly what was changed
2. Git history shows the commit
3. Revert the commit, not the whole agent's work
4. The next agent picks up from the last known-good state
