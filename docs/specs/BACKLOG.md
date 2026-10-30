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
| 010 | UBO privacy checker fix | approved | no | no | - | 011, 012, 013 |
| 011 | VAT scorer + visa estimator input fix | approved | no | no | - | 010, 012, 013 |
| 012 | QFZP + banking odds dead inputs fix | approved | no | no | - | 010, 011, 013 |
| 013 | Dashboard fixes (Pay Now, copy button, PDF link, revenue 500) | approved | no | no | - | 010, 011, 012 |
| 014 | Wire tools to lead capture | draft (needs owner answers) | no | maybe | 010, 011, 012 | - |
| next | F0.6 events and consent tables | to write | no | yes | - | tools specs |
| next | F0.3 mobile token auth | to write | yes (auth) | yes | 005 | - |
| next | F0.4 FCM push + device tokens | to write | yes (push) | yes | F0.3 | - |
| next | F1.2 compliance calendar (stateful) | to write | no | yes | F0.6 | - |
| next | F1.7 document locker v1 | to write | yes (vault) | yes | 005, F1.2 | - |

Sizing rule: one spec = one reviewable PR (about 300 changed lines of code at most). Split anything bigger before approving it.
