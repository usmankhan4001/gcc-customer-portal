# Architectural Decisions Record (ADR)

> Every significant architectural decision is recorded here with context, options considered, and rationale.

---

## Format

```
### ADR-[NUMBER]: [TITLE]

**Date:** [date]
**Status:** [Proposed | Accepted | Deprecated | Superseded]
**Context:** [what is the issue]
**Decision:** [what was decided]
**Alternatives considered:** [what else was evaluated]
**Rationale:** [why this choice was made]
**Consequences:** [what this means for the project]
```

---

## Decisions

### ADR-001: Use Drizzle ORM over Prisma

**Date:** 2026-09-07
**Status:** Accepted
**Context:** Need an ORM for PostgreSQL. Two options: Drizzle (used in corehub) or Prisma (used in WayApp).
**Decision:** Use Drizzle ORM.
**Alternatives considered:**
- Prisma: More popular, easier onboarding, but heavier query engine, schema-first approach drifts from SQL
- Raw SQL: Maximum control, but no type safety, manual result mapping
- Kysely: Good SQL builder, but less ecosystem than Drizzle
**Rationale:** corehub's schema is already in Drizzle and is the most mature schema design. Drizzle is lighter, faster, and produces SQL closer to what you'd write by hand. The schema can be shared directly.
**Consequences:** Team needs to learn Drizzle. WayApp's Prisma schema will need to be ported. Migration tooling is Drizzle's.

---

### ADR-002: Monolith first, split later

**Date:** 2026-09-07
**Status:** Accepted
**Context:** Building CRM + CMS + API + Admin. Could be separate services or one monolith.
**Decision:** Start as a single Next.js app with module-based routing.
**Alternatives considered:**
- Microservices: Each module as a separate service. More complex deployment, but independent scaling.
- Monorepo with separate apps: Each module is its own Next.js app. Clean separation, but shared code is harder.
- Monolith: One app, module-based routing. Simple deployment, shared code is easy.
**Rationale:** The team is small (1-2 developers). Deployment simplicity matters more than independent scaling. The event bus means modules are decoupled in code even if they share a process. Split later when scale demands it.
**Consequences:** All modules share a process. A crash in one module affects all. But deployment is one `docker compose up`.

---

### ADR-003: Event-driven module communication

**Date:** 2026-09-07
**Status:** Accepted
**Context:** Modules need to react to each other's state changes (e.g., order.paid triggers CRM + email + WhatsApp).
**Decision:** Use an in-process event bus. Modules publish events, other modules subscribe.
**Alternatives considered:**
- Direct function calls: Simple but tight coupling. Module A knows about Module B.
- Message queue (Redis/RabbitMQ): More robust, but adds infrastructure and complexity.
- Database polling: Simple but slow and wasteful.
**Rationale:** In-process event bus is zero-infrastructure and fast. The outbox pattern already handles durable jobs (email, WhatsApp). Events are for real-time reactions, not guaranteed delivery. Upgrade to Redis pub/sub later if needed.
**Consequences:** Events are not persisted. If the process crashes mid-event, some reactions may not fire. But the outbox queue catches the important ones.

---

### ADR-004: Outbox pattern for email and WhatsApp

**Date:** 2026-09-07
**Status:** Accepted
**Context:** Email and WhatsApp sends need to be durable (survive crashes) and idempotent (no double-sends).
**Decision:** Use the outbox pattern from gccstartup-cms. Every send is an outbox row first, processed by a background worker.
**Alternatives considered:**
- Direct API calls on request path: Faster, but if the process crashes mid-send, the send may or may not have happened.
- Redis queue: Good for high throughput, but adds infrastructure.
- pg-boss: PostgreSQL-backed job queue. Good, but extra dependency.
**Rationale:** The outbox pattern is already battle-tested in gccstartup-cms. It's simple (just a PostgreSQL table), durable (survives crashes), and idempotent (optimistic locking prevents double-sends).
**Consequences:** Slight delay between request and send (worker polls every few seconds). But the tradeoff is worth it for reliability.

---

### ADR-005: Tailwind CSS v4 with CSS tokens

**Date:** 2026-09-07
**Status:** Accepted
**Context:** Styling approach for the platform. gccstartup-cms uses plain CSS tokens, WayApp uses Tailwind, Customer Portal uses Tailwind.
**Decision:** Use Tailwind CSS v4 with a shared token layer.
**Alternatives considered:**
- Plain CSS tokens (gccstartup-cms style): Maximum control, but verbose, no utility classes
- Tailwind only: Fast development, but no design system consistency
- Tailwind + CSS tokens: Tailwind utilities + token-based theming
**Rationale:** Tailwind v4's CSS-first approach means tokens can be defined as CSS custom properties and used in both Tailwind classes and plain CSS. This gives fast development with design system consistency.
**Consequences:** Need to define tokens in a way that works with Tailwind's theme system. No arbitrary values outside the token system.

---

### ADR-006: Start with Amazon SES, abstract the provider

**Date:** 2026-09-07
**Status:** Accepted
**Context:** Need an email sending provider. Current system uses Sender.net.
**Decision:** Build an email provider interface, implement Amazon SES first.
**Alternatives considered:**
- Sender.net (current): Works, but expensive at scale
- Resend: Modern API, but more expensive than SES
- Postmark: Best deliverability, but expensive for marketing
- Amazon SES: Cheapest at scale, full control, but requires DKIM/SPF setup
**Rationale:** SES is $0.10 per 1,000 emails. At 50,000 emails/month, that's $5 vs $49+ for Sender.net. The provider interface means switching later is one class change.
**Consequences:** Need to set up SES (DKIM, SPF, dedicated IP if volume justifies). Deliverability is your responsibility.

---

### ADR-007: Single auth system (JWT + scrypt)

**Date:** 2026-09-07
**Status:** Accepted
**Context:** Currently 4 separate auth systems across 4 codebases.
**Decision:** Use JWT (jose library) with scrypt password hashing. Single auth for all modules.
**Alternatives considered:**
- Better Auth: Full-featured, but adds complexity and dependencies
- NextAuth.js: Good for OAuth, but overkill for this use case
- Custom JWT: Simple, portable, no dependencies beyond jose
**Rationale:** JWT is stateless (no session store needed), portable (works across services), and the jose library is battle-tested. Scrypt is the same hashing used in gccstartup-cms and WayApp.
**Consequences:** Need to handle token refresh, password reset, and session management manually. But the code is simple and well-understood.

---

### ADR-008: Customer Portal connects via Platform API

**Date:** 2026-09-07
**Status:** Accepted
**Context:** Customer Portal is a separate codebase that needs to connect to the platform.
**Decision:** The Portal connects via the Platform API (REST + webhooks). No shared code.
**Alternatives considered:**
- Shared database: Portal reads/writes directly. Fast, but tight coupling.
- Shared library: Both apps import shared modules. Clean, but versioning is hard.
- Platform API: Portal connects via REST. Clean separation, but extra HTTP hop.
**Rationale:** The Portal is a separate product with different auth, different users, and different deployment. The Platform API means the Portal can be rebuilt in any framework without touching the platform. The HTTP hop is negligible for the Portal's use case (not high-frequency queries).
**Consequences:** Portal needs to handle its own caching. Some data may be stale by a few seconds. But the separation is worth it.

---

(Add new ADRs as decisions are made)
