---
description: Write or refresh AI documentation for an existing feature (docs/ai/features/)
---
Document the existing feature: $ARGUMENTS

Read the real code (see docs/ai/CODEMAP.md), then create or update `docs/ai/features/<slug>.md` from `docs/ai/features/_TEMPLATE.md` and its row in `docs/ai/FEATURES.md`. Describe only what the code actually does; mark anything unverified as "unverified". Run `npm run docs:ai` at the end.
