# Spec Backlog (hand-maintained by the owner / spec-writer, never by build agents)

How the automated cycle uses this: pick specs whose **Depends on** are merged, whose **Touches** do not overlap, and with at most one schema change at a time. Protected files need the owner's approval written into the spec.

| Spec | Title | Status | Protected | Schema | Depends on | Parallel-safe with |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| 001 | JWT secret hardening | shipped | yes | no | - | - |
| 002 | Auth route hardening | shipped | yes | no | - | - |
| 003 | Session, login, public endpoints | shipped | yes | yes (0004) | - | - |
| 004 | Webhook hardening | shipped | yes | yes (0003) | - | - |
| 005 | Documents hardening (vault upload, share links) | draft (AC6/AC7 shipped as 006) | yes (vault) | yes | - | 007 |
| 006 | Fail-fast migrations, KYC review auth | shipped | yes | no | - | - |
| 007 | Calculator and quiz plumbing (F1.4 part 1) | shipped (merged) | no | no | - | 005 |
| 008 | Compliance calendar date overflow fix (F1.4 2a) | shipped (merged) | no | no | - | 009, 005 |
| 009 | Name checker matching fix (F1.4 2b) | shipped (merged) | no | no | - | 008, 005 |
| 010 | UBO privacy checker fix | shipped (verified) | no | no | - | 011, 012, 013 |
| 011 | VAT scorer + visa estimator input fix | shipped (verified) | no | no | - | 010, 012, 013 |
| 012 | QFZP + banking odds dead inputs fix | shipped (verified) | no | no | - | 010, 011, 013 |
| 013 | Dashboard fixes (Pay Now, copy button, PDF link, revenue 500) | shipped (verified) | no | no | - | 010, 011, 012 |
| 014 | Wire tools to lead capture | shipped (verified) | no | no | 010, 011, 012 | - |
| 015 | Events and User Consent Schema (F0.6) | shipped (verified) | no | yes | 014 | 017 |
| 016 | Stateful Compliance Calendar (F1.2) | shipped (verified) | no | no | 015 | 017 |
| 017 | Document Locker v1 (F1.7) | shipped (verified) | yes (vault) | no | - | 015, 016 |

Sizing rule: one spec = one reviewable PR (about 300 changed lines of code at most). Split anything bigger before approving it.
