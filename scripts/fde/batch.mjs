#!/usr/bin/env node
// Run several approved specs in parallel, each in its own worktree (scripts/fde/run.mjs).
// Usage: npm run fde:batch -- docs/specs/008-x.md docs/specs/009-y.md   (extra --flags are passed to run.mjs)
// Refuses to start if the specs overlap in "Touches" or more than one changes the schema.
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { parallelConflicts, parseSchemaChange, parseStatus, parseTouches } from './lib.mjs';

const args = process.argv.slice(2);
const files = args.filter((a) => !a.startsWith('--'));
const flags = args.filter((a) => a.startsWith('--'));
if (files.length < 2) {
  console.error('fde:batch: give at least two spec files (use npm run fde for one)');
  process.exit(1);
}

const specs = files.map((f) => {
  const md = fs.readFileSync(f, 'utf8');
  return { file: f, id: path.basename(f, '.md'), status: parseStatus(md), touches: parseTouches(md), schema: parseSchemaChange(md) };
});
const notApproved = specs.filter((s) => s.status !== 'approved').map((s) => `${s.id} (status: ${s.status ?? 'none'})`);
if (notApproved.length) {
  console.error(`fde:batch: not approved: ${notApproved.join(', ')}`);
  process.exit(1);
}
const conflicts = parallelConflicts(specs);
if (conflicts.length) {
  console.error(`fde:batch: not parallel-safe:\n  ${conflicts.join('\n  ')}`);
  process.exit(1);
}

console.log(`fde:batch: running ${specs.length} specs in parallel`);
const results = await Promise.all(
  specs.map(
    (s) =>
      new Promise((resolve) => {
        const p = spawn(process.execPath, [path.join(import.meta.dirname, 'run.mjs'), s.file, ...flags], { stdio: ['ignore', 'pipe', 'pipe'] });
        let out = '';
        p.stdout.on('data', (d) => (out += d));
        p.stderr.on('data', (d) => (out += d));
        p.on('close', (code) => resolve({ id: s.id, code, out }));
      })
  )
);
for (const r of results) console.log(`\n=== ${r.id}: ${r.code === 0 ? 'COMMITTED' : `FAILED (exit ${r.code})`}\n${r.out.trim().split('\n').slice(-6).join('\n')}`);
process.exit(results.every((r) => r.code === 0) ? 0 : 1);
