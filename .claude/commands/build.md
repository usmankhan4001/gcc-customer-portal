---
description: Build an approved spec through the FDE pipeline (local branch + commit, never pushes)
---
Run the pipeline for the spec `$ARGUMENTS` (a path under docs/specs/):

`npm run fde -- $ARGUMENTS`

If `claude` is not on PATH, set CLAUDE_BIN to the full path of the claude executable first. Report the final result: branch, commit, tests added, and any protected-file stop. Do not push.
