# Module and Feature Index

Two levels, both written from the real code (2026-10-30):
- **Area docs** (`modules/<area>.md`): overview of a part of the system, 60-110 lines.
- **Feature docs** (`features/<slug>.md`): one deep doc per feature (contracts, numbered flow with file:line, constants, failure modes, suggested tests, bugs, change guide), template in `features/_REFERENCE_TEMPLATE.md`.

Load order for an agent: `AGENTS.md` -> `CODEMAP.md` (generated) -> this file -> the area doc -> only the feature docs your task touches. Delivered changes (specs shipped) are in `FEATURES.md`; planned work is in `docs/versions/INDEX.md`.

**Status** is the doc author's assessment of the code, not a test result: `working`, `partial`, `stub` (UI or route exists, no real behavior), `broken` (visibly wrong output). Totals: 10 working, 27 partial, 6 stub, 3 broken.

## Auth ([area](modules/auth.md)) **protected zone**
| Feature | Status |
| :--- | :--- |
| [whatsapp-otp-login](features/whatsapp-otp-login.md) | working |
| [password-login-logout](features/password-login-logout.md) | working |
| [session-and-route-guard](features/session-and-route-guard.md) | partial |

## Onboarding and leads ([area](modules/onboarding-and-leads.md))
| Feature | Status |
| :--- | :--- |
| [onboarding-wizard](features/onboarding-wizard.md) | partial |
| [lead-capture-and-persona](features/lead-capture-and-persona.md) | partial (no caller) |

## Lead-gen tools ([area](modules/lead-gen-tools.md))
| Feature | Status |
| :--- | :--- |
| [tool-tax-calculator](features/tool-tax-calculator.md) | **broken** |
| [tool-jurisdiction-quiz](features/tool-jurisdiction-quiz.md) | **broken** |
| [tool-banking-odds](features/tool-banking-odds.md) | working |
| [tool-qfzp-eligibility](features/tool-qfzp-eligibility.md) | partial |
| [tool-vat-scorer](features/tool-vat-scorer.md) | partial |
| [tool-visa-estimator](features/tool-visa-estimator.md) | partial |
| [tool-name-checker](features/tool-name-checker.md) | partial |
| [tool-nda-generator](features/tool-nda-generator.md) | working |
| [tool-invoice-generator](features/tool-invoice-generator.md) | stub |
| [tool-ubo-privacy](features/tool-ubo-privacy.md) | partial |
| [tool-compliance-calendar](features/tool-compliance-calendar.md) | partial |
| [tool-result-pdf-and-email](features/tool-result-pdf-and-email.md) | partial (unreachable) |
| [reference-data-tax-rules-countries](features/reference-data-tax-rules-countries.md) | partial |

## Checkout and orders ([area](modules/checkout-and-orders.md)) **protected zone (money)**
| Feature | Status |
| :--- | :--- |
| [service-catalog-and-checkout](features/service-catalog-and-checkout.md) | partial |
| [stripe-webhook](features/stripe-webhook.md) | partial (not idempotent) |
| [admin-pricing-configurator](features/admin-pricing-configurator.md) | working |

## Vault and documents ([area](modules/vault-and-documents.md)) **protected zone**
| Feature | Status |
| :--- | :--- |
| [vault-upload](features/vault-upload.md) | partial |
| [vault-download](features/vault-download.md) | working |
| [share-links](features/share-links.md) | partial |
| [kyc-review](features/kyc-review.md) | stub |

## Client portal ([area](modules/client-portal.md))
| Feature | Status |
| :--- | :--- |
| [client-dashboard](features/client-dashboard.md) | partial |
| [pipeline-tracker](features/pipeline-tracker.md) | partial |
| [good-standing-snapshot](features/good-standing-snapshot.md) | partial |
| [profile-and-support](features/profile-and-support.md) | stub |
| [renewals](features/renewals.md) | stub |
| [referrals](features/referrals.md) | stub |

## Messaging and notifications ([area](modules/messaging-and-notifications.md)) **protected zone (webhooks)**
| Feature | Status |
| :--- | :--- |
| [in-app-notifications](features/in-app-notifications.md) | partial |
| [web-push](features/web-push.md) | **broken** |
| [whatsapp-outbound](features/whatsapp-outbound.md) | partial |
| [whatsapp-inbound-webhook](features/whatsapp-inbound-webhook.md) | partial |
| [transactional-email](features/transactional-email.md) | partial |

## Admin operations ([area](modules/admin-operations.md))
| Feature | Status |
| :--- | :--- |
| [admin-kanban-pipeline](features/admin-kanban-pipeline.md) | working |
| [admin-leads](features/admin-leads.md) | working |
| [admin-clients](features/admin-clients.md) | stub |
| [admin-promo-banners](features/admin-promo-banners.md) | working |
| [admin-bootstrap-and-guard](features/admin-bootstrap-and-guard.md) | working |

## Platform and infra ([area](modules/platform-and-infra.md)) **protected zone (deploy)**
| Feature | Status |
| :--- | :--- |
| [database-and-migrations](features/database-and-migrations.md) | partial |
| [deploy-and-ci](features/deploy-and-ci.md) | partial |
| [pwa-and-service-worker](features/pwa-and-service-worker.md) | partial (inactive) |
| [analytics-posthog](features/analytics-posthog.md) | partial |
| [testing-and-fde-pipeline](features/testing-and-fde-pipeline.md) | partial |

## Which docs to load for a roadmap item

| Roadmap item | Feature docs |
| :--- | :--- |
| F0.3 mobile token auth | session-and-route-guard, password-login-logout, whatsapp-otp-login |
| F0.4 FCM push | web-push, in-app-notifications, whatsapp-outbound (each ends with Android/FCM notes) |
| F0.5 Capacitor shell | pwa-and-service-worker, deploy-and-ci, session-and-route-guard |
| F0.6 events and consent | analytics-posthog, lead-capture-and-persona |
| F1.1 light accounts | onboarding-wizard, whatsapp-otp-login, lead-capture-and-persona |
| F1.2 compliance calendar, F3.1 renewals | tool-compliance-calendar, renewals, client-dashboard, in-app-notifications, transactional-email |
| F1.3 scoring, F1.5 follow-up | lead-capture-and-persona, admin-leads, whatsapp-outbound, transactional-email |
| F1.4 tool fixes and tests | the six calculator/quiz docs, reference-data-tax-rules-countries |
| F1.6 quote link, booking | service-catalog-and-checkout, admin-pricing-configurator, admin-leads |
| F1.7 / F2.5 document locker | vault-upload, vault-download, share-links, kyc-review, client-dashboard |
| F2.1 invoice habit tool | tool-invoice-generator, tool-result-pdf-and-email |
| F3.2 multi-company | client-dashboard, pipeline-tracker, service-catalog-and-checkout |
| F3.3 Customer 360 | admin-clients, admin-kanban-pipeline, pipeline-tracker |
| F4.x outbound, attribution | lead-capture-and-persona, analytics-posthog, admin-leads |

## Open issues register
"Checked" = confirmed in code by me; "reported" = found by a doc-writing agent, not yet confirmed. Detail and evidence are in each feature doc.

**Fixed (local branches, not deployed)**: JWT secret fallbacks (spec 001); onboarding account takeover, OTP in send-otp response, fixed OTP 123456, open seed-admin (spec 002).

**Open, checked**
- Tax calculator page reads fields the API does not return (`savings`, `current_tax`, `target_tax` vs `net_annual_savings`, `home_tax_amount`, `optimized_tax_amount`), so a successful call shows $0.
- WhatsApp webhook skips signature check when `WHATSAPP_APP_SECRET` is unset; the KYC reference regex `KYC[- ]?([A-Z0-9]{6,12})` matches ordinary words.
- Stripe webhook is not idempotent.
- `/api/leads/capture` has no caller; `ServiceWorkerRegistration` is never mounted; `milestones` table unused.
- `docker-entrypoint.sh` continues after a failed migration (`|| echo`).
- `/api/companies/good-standing` trusts a client-supplied `x-user-id` (middleware skips `/api/`); portal pages are fine because Next copies middleware response headers onto the request (`next/dist/server/lib/router-utils/resolve-routes.js`), an accident of Next internals, not the documented API. Standalone-server behavior unverified.

**Open, reported**
- Quiz page/API field and value mismatches (blank results, banking never scores); tool tax figures need a tax review.
- UBO, name checker, compliance calendar logic errors; invoice generator buttons are dead and it is missing from the tools grid.
- `/api/pdf/generate` unauthenticated and unbounded; unescaped `title` in email HTML.
- Vault upload hides the old document before the new file reaches R2; no file-type allow-list; share links have no password or revoke, tokens stored raw.
- Dashboard "Pay Now" links to `/checkout/<orderId>` but the page expects a jurisdiction id; suspended/archived companies show as "Active"; decimal revenue estimate returns 500.
- No OTP or password-login attempt limits; new signup can claim an unverified phone; open redirect via `redirect` param; lead-capture returns an old lead's email for a matching phone.
- Resend errors ignored (`{data,error}` not checked); 4 of 5 email functions have no caller; `/api/push/unsubscribe` unauthenticated; `sw.js` would cache authenticated pages.
- Pipeline moves send no notification and keep no audit trail; a demoted admin keeps access up to 7 days (role is in the JWT).
- Hong Kong catalog price ($2,000) vs seeded price ($1,500, confirmed seed value only).
- Correction: one agent said drizzle-kit is a devDependency; it is in `dependencies` (package.json). Whether the binary reaches the standalone image is still unverified.

## Maintenance
Change a feature -> update its feature doc (and Status, "Last verified") in the same change. `CODEMAP.md` is generated by `npm run docs:ai`; everything else is hand-maintained.
