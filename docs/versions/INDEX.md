# Version Roadmap (v2.x)

Product direction after the V1 master plan (`docs/v1-master-plan/`): an **installable Android app first (Capacitor, iOS later)** where free, stateful tools drive **engagement, lead scoring, retention and customer serving**, and feed an **outbound funnel**.

```
Hook tool (free) -> Save/install (account + app + push opt-in) -> Habit tools (return) -> Score -> Convert / Outbound
```

Status of all items below: **planned**. Each feature becomes a spec in `docs/specs/` (copy `_TEMPLATE.md`) before building, then a feature doc in `docs/ai/features/`.

| Version | Theme | Goal metric | Doc |
| :--- | :--- | :--- | :--- |
| v2.0 | Foundation & Android shell | App installable from Play (internal track); no live auth risks | [v2.0](v2.0-foundation-android.md) |
| v2.1 | Engage & retain core | Week-4 return rate of users who saved something | [v2.1](v2.1-engage-retain-core.md) |
| v2.2 | Habit tools | Weekly active users per saved item | [v2.2](v2.2-habit-tools.md) |
| v2.3 | Serve & retain clients | Renewal on-time rate; staff time per client | [v2.3](v2.3-serve-retain-clients.md) |
| v2.4 | Outbound & growth | Qualified outbound contacts per month; cost per qualified lead | [v2.4](v2.4-outbound-growth.md) |

## Assumptions (override any, then update the version docs)
- Target users: freelancers, e-commerce sellers and SaaS founders, **plus businesses that want an offshore structure** (trading/import-export, holding and consulting companies, investors, high-net-worth owners). Offshore seekers are the highest-value segment.
- Offshore segment implications: scoring weights offshore intent (BVI/Cayman/HK/Singapore interest, nominee and UBO-privacy tool use); candidate habit tools are an economic-substance tracker, an offshore-vs-onshore structure planner, and CRS/FATCA reminders (add to v2.2 when specced); higher-risk industries (crypto, forex, gambling) route to consultation-led and are excluded from automated outbound; outbound must respect sanctions and restricted-country rules.
- Tools stay free without signup; an account is required only to save.
- Outbound channels in v1: WhatsApp and email, with recorded per-channel consent. No calls or LinkedIn automation.
- Android via Capacitor wrapper with real native features; Expo rewrite only if retention data justifies it.
- Work happens locally; nothing is pushed until the owner says so.

## Cross-cutting rules
- **Protected zones** (AGENTS.md) need explicit human approval: marked **[P]** on features below.
- Every feature: spec -> tests per acceptance criterion -> `docs/ai/features/<slug>.md` -> `npm run verify`.
- Mobile APIs are versioned (`/api/v1/...`) once v2.0 ships, because installed apps update slower than the site.
- PII/KYC: private by default, presigned access only, user-initiated full deletion (also a Play Store requirement).

## Deferred / cut (not in v2.x)
Arabic and other languages, crypto payments, e-signature, payment plans, satisfaction pulse, bulk actions, feature flags, team access, forward-to-email upload, auto-generated corporate documents, trusted contact.

## Cleanup candidates (verify before removing)
`referrals` table usage (planned for F4.4), `_archived/`, `ui-example/`, `TrustGate`/`Discovery` excludes in `tsconfig.json`, duplicate hardcoded secrets in `auth.ts` and `env.ts`, 11th tool `compliance-calendar` vs "10 tools" in docs.
