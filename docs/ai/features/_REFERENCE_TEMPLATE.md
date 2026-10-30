# Feature: <name>

**Slug**: <slug>   **Area**: [<module doc>](../modules/<module>.md)   **Status**: working | partial | stub | broken | unverified   **Last verified against code**: <YYYY-MM-DD>

## What it does
User-visible behavior in 3 to 5 sentences. Say who uses it and why.

## Entry points
UI route and component, API route and method, webhook, or script that starts this feature.

## Files
`path:lines` - role. Include every file that implements it, including shared helpers it depends on.

## Request / response contract
Per endpoint: input fields (name, type, required, validation actually enforced), success body, every error status and message, cookies set or read. Write "none" if the feature has no API.

## Step-by-step flow
Numbered. Each step names the function and `file:line`, and says exactly what is read or written. Include branches (if X then Y).

## Data
Tables and columns read or written, with constraints, enums and defaults that matter. Note what is NOT stored.

## Business rules and constants
Exact numbers, thresholds, rates, lists, TTLs, limits, copied from the code with `file:line`.

## Auth, permissions, security
Who may call it, how that is checked, what is missing. Mark AGENTS.md protected zones.

## Failure modes and edge cases
What happens on bad input, DB errors, third-party failure, duplicates, concurrency. Note anything swallowed or logged only.

## Tests
Existing test files (or "none"). Then 3 to 6 concrete tests worth writing (input -> expected), to be used as acceptance criteria.

## Known bugs and gaps
Only observed defects, each with evidence (`file:line`) and impact.

## Change guide
How to extend or modify safely: which files to touch, pitfalls, what to update in docs, protected-zone flags.

## Related features
Links by slug, e.g. [whatsapp-otp-login](whatsapp-otp-login.md).
