#!/usr/bin/env node
// FDE pipeline: approved spec -> isolated worktree + branch -> implement -> verify (self-heal) -> docs check
// -> schema/protected-file checks -> review -> LOCAL commit. Never pushes, never touches your working tree.
//
// Usage: npm run fde -- docs/specs/<NNN-slug>.md [--dry-run] [--max-fix=2] [--base=<ref>] [--in-place] [--allow-protected]
// Env:   CLAUDE_BIN (path to the claude executable, default "claude"), FDE_BUDGET_USD (per agent call, default 5), FDE_MODEL
//
// Spec fields read by the pipeline (see docs/specs/_TEMPLATE.md):
//   **Status**: approved                         required before a run
//   **Protected files approved**: a.ts, dir/     files/folders from AGENTS.md "Human-approval zones" the agent may edit; or "none"
//   **Schema change**: yes|no                    "yes" takes the schema lock so parallel runs never collide on migrations
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { acquireLock, parseApproved, parseSchemaChange, parseStatus, parseVerdict, protectedHits, stripFrontmatter } from './lib.mjs';

const MAIN = process.cwd();
const args = process.argv.slice(2);
const specArg = args.find((a) => !a.startsWith('--'));
const has = (n) => args.includes(`--${n}`);
const opt = (n, d) => args.find((a) => a.startsWith(`--${n}=`))?.split('=')[1] ?? d;
const maxFix = Number(opt('max-fix', 2));
const baseRef = opt('base', 'HEAD');
const CLAUDE = process.env.CLAUDE_BIN || 'claude';
const BUDGET = process.env.FDE_BUDGET_USD || '5';

const IMPL_TOOLS = 'Read,Edit,Write,Glob,Grep,Bash(npm run verify),Bash(npm run typecheck),Bash(npm test:*),Bash(npm run db:generate),Bash(npm run docs:ai),Bash(git status:*),Bash(git diff:*)';
const REVIEW_TOOLS = 'Read,Glob,Grep,Bash(git diff:*),Bash(git log:*),Bash(git status:*)';

const die = (m) => {
  console.error(`fde: ${m}`);
  process.exit(1);
};

if (!specArg || !fs.existsSync(specArg)) die('usage: npm run fde -- docs/specs/<NNN-slug>.md [--dry-run] [--max-fix=2] [--base=<ref>] [--in-place] [--allow-protected]');
const specAbs = path.resolve(specArg);
const specRel = path.relative(MAIN, specAbs);
const spec = fs.readFileSync(specAbs, 'utf8');
const status = parseStatus(spec);
if (status !== 'approved') die(`spec "**Status**" must be "approved" (got "${status ?? 'none'}")`);
const approved = parseApproved(spec);
const schemaChange = parseSchemaChange(spec);
const base = path.basename(specAbs, '.md');
const branch = `feature/${base}`;
const inPlace = has('in-place');
const WT = path.join(MAIN, '.fde', 'worktrees', base);
const ROOT = inPlace ? MAIN : WT;
const P = (...a) => path.join(ROOT, ...a);

fs.mkdirSync(path.join(MAIN, '.fde', 'runs'), { recursive: true });
const logFile = path.join(MAIN, '.fde', 'runs', `${new Date().toISOString().replace(/[:.]/g, '-')}-${base}.log`);
const log = (s) => fs.appendFileSync(logFile, s + '\n');
const say = (s) => {
  console.log(s);
  log(s);
};

function run(cmd, a, o = {}) {
  const r = spawnSync(cmd, a, {
    encoding: 'utf8',
    maxBuffer: 128 * 1024 * 1024,
    shell: o.shell ?? false,
    input: o.input,
    cwd: o.cwd ?? ROOT,
    env: o.env ?? process.env,
  });
  return { code: r.status ?? 1, out: (r.stdout || '') + (r.stderr || '') };
}
const sh = (c, o = {}) => run(c, [], { shell: true, ...o });
const tail = (s, n = 6000) => (s.length > n ? '...' + s.slice(-n) : s);
// Build/test needs a syntactically valid DATABASE_URL but never connects to it.
const verifyEnv = { ...process.env, DATABASE_URL: process.env.DATABASE_URL || 'postgres://ci:ci@localhost:5432/ci' };

const approvedNote = approved.length
  ? `Protected files approved by the owner for this spec (the only protected files you may edit): ${approved.join(', ')}.`
  : 'No protected files are approved for this spec: do not edit any Human-approval zone from AGENTS.md.';
const schemaNote = schemaChange
  ? 'This spec may change src/lib/db/schema.ts; run `npm run db:generate` and keep the migration additive.'
  : 'This spec must NOT change the schema or add migrations.';

function agent(role, prompt, { tools, edit }) {
  const sys = stripFrontmatter(fs.readFileSync(path.join(MAIN, '.claude', 'agents', `${role}.md`), 'utf8'));
  const a = ['-p', '--append-system-prompt', sys, '--permission-mode', edit ? 'acceptEdits' : 'default', '--allowedTools', tools, '--max-budget-usd', BUDGET];
  if (process.env.FDE_MODEL) a.push('--model', process.env.FDE_MODEL);
  say(`\n### agent:${role}`);
  const r = run(CLAUDE, a, { input: prompt });
  log(r.out);
  if (r.code !== 0) die(`agent:${role} exited ${r.code} (see ${logFile})`);
  return r.out;
}
const implement = (prompt) => agent('implementer', `${approvedNote}\n${schemaNote}\n\n${prompt}`, { tools: IMPL_TOOLS, edit: true });

if (has('dry-run')) {
  say(`DRY RUN  spec=${specRel}  branch=${branch}  base=${baseRef}  max-fix=${maxFix}  claude=${CLAUDE}`);
  say(`workspace: ${inPlace ? 'in place (clean tree required)' : `isolated worktree ${path.relative(MAIN, WT)}`}`);
  say(`schema lock: ${schemaChange ? 'required' : 'not needed'}   protected files approved: ${approved.join(', ') || 'none'}`);
  say('steps: workspace -> implementer -> verify loop -> docs check -> schema/protected checks -> reviewer -> local commit');
  process.exit(0);
}

// --- schema lock: one schema-changing run at a time
if (schemaChange) {
  const lock = path.join(MAIN, '.fde', 'schema.lock');
  if (!acquireLock(lock, `${base} pid=${process.pid}`)) die(`another schema-changing run holds ${lock}; wait for it or delete the file if stale`);
  process.on('exit', () => fs.rmSync(lock, { force: true }));
}

// --- workspace
if (inPlace) {
  if (sh('git status --porcelain', { cwd: MAIN }).out.split('\n').some((l) => l.trim() && !l.includes('.fde/'))) die('working tree not clean; commit or stash first');
  const cur = run('git', ['branch', '--show-current'], { cwd: MAIN }).out.trim();
  if (cur !== branch) {
    const exists = run('git', ['rev-parse', '--verify', branch], { cwd: MAIN }).code === 0;
    const sw = run('git', exists ? ['switch', branch] : ['switch', '-c', branch], { cwd: MAIN });
    if (sw.code !== 0) die(sw.out);
  }
} else if (!fs.existsSync(WT)) {
  const exists = run('git', ['rev-parse', '--verify', branch], { cwd: MAIN }).code === 0;
  const wa = run('git', exists ? ['worktree', 'add', WT, branch] : ['worktree', 'add', '-b', branch, WT, baseRef], { cwd: MAIN });
  if (wa.code !== 0) die(wa.out);
  // Share installed dependencies with the main checkout (junction works without admin rights on Windows).
  fs.symlinkSync(path.join(MAIN, 'node_modules'), P('node_modules'), 'junction');
  // The spec may be uncommitted in the main checkout: make sure the worktree has the approved copy.
  fs.mkdirSync(path.dirname(P(specRel)), { recursive: true });
  fs.copyFileSync(specAbs, P(specRel));
}
const baseSha = run('git', ['rev-parse', 'HEAD']).out.trim();
say(`workspace ${ROOT}  branch ${branch} @ ${baseSha.slice(0, 8)}`);

implement(`Implement the spec below. Follow AGENTS.md and your role instructions. Slug for docs: ${base}.\n\n--- SPEC (${specRel}) ---\n${spec}`);

function verifyLoop(label) {
  for (let i = 0; ; i++) {
    const v = sh('npm run verify', { env: verifyEnv });
    log(v.out);
    if (v.code === 0) return say(`verify OK (${label})`);
    if (i >= maxFix) die(`verify still failing after ${maxFix} fix rounds; work left in ${ROOT} on ${branch} (${logFile})`);
    say(`verify FAILED (${label}), fix round ${i + 1}/${maxFix}`);
    implement(`\`npm run verify\` failed. Fix the root cause without weakening tests. Output tail:\n\n${tail(v.out)}`);
  }
}
verifyLoop('after implement');

// FEATURES.md and CODEMAP.md are generated by `npm run docs:ai`; agents only write the feature doc.
const docsOk = () => fs.existsSync(P('docs', 'ai', 'features', `${base}.md`));
if (!docsOk()) {
  implement(`Missing AI docs. Create docs/ai/features/${base}.md from docs/ai/features/_TEMPLATE.md. Do not edit docs/ai/FEATURES.md, CODEMAP.md or MODULES.md (generated / shared). Update the affected deep feature docs in docs/ai/features/ if behavior changed.`);
  if (!docsOk()) die('AI docs still missing');
}

const changed = sh('git status --porcelain').out.split('\n').map((l) => l.slice(3).trim()).filter(Boolean);
const drizzleChanged = changed.filter((f) => f.startsWith('drizzle/'));
const schemaTouched = changed.includes('src/lib/db/schema.ts');
if (!schemaChange && (drizzleChanged.length || schemaTouched)) die(`spec says "Schema change: no" but schema/migrations changed:\n  ${[...drizzleChanged, ...(schemaTouched ? ['src/lib/db/schema.ts'] : [])].join('\n  ')}`);
if (schemaChange && schemaTouched && !drizzleChanged.some((f) => f.endsWith('.sql'))) die('schema.ts changed but no migration was generated (npm run db:generate)');
const hits = protectedHits(changed, approved);
if (hits.length && !has('allow-protected')) die(`protected files changed without approval in the spec (add them to "Protected files approved" or rerun with --allow-protected after reading the diff):\n  ${hits.join('\n  ')}`);

const review = agent('reviewer', `Review the uncommitted changes (git diff plus new files via git status) against this spec.\n${approvedNote}\n\n${spec}`, { tools: REVIEW_TOOLS, edit: false });
const verdict = parseVerdict(review);
if (!verdict) die(`reviewer gave no parsable verdict (see ${logFile})`);
if (verdict.verdict === 'fail') {
  say(`reviewer FAIL: ${verdict.issues.join(' | ')}`);
  implement(`The reviewer rejected the change. Fix these issues:\n- ${verdict.issues.join('\n- ')}`);
  verifyLoop('after review fix');
}

fs.writeFileSync(P(specRel), fs.readFileSync(P(specRel), 'utf8').replace(/(\*\*Status\*\*:\s*)approved/i, '$1shipped'));
run('git', ['add', '-A']);
const msg = `feat(${base}): implement spec\n\nSpec: ${specRel}\nBuilt by the FDE pipeline (scripts/fde/run.mjs). Not pushed.`;
const c = run('git', ['commit', '-m', msg]);
if (c.code !== 0) die(c.out);
say(`committed locally on ${branch}${inPlace ? '' : ` in worktree ${path.relative(MAIN, WT)}`}.`);
say(`review: git show --stat ${branch}   merge: git merge --no-ff ${branch}   cleanup: git worktree remove --force ${path.relative(MAIN, WT)}`);
