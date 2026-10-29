#!/usr/bin/env node
// FDE pipeline: approved spec -> branch -> implement -> verify (self-heal) -> docs check -> review -> LOCAL commit.
// Never pushes. Usage: npm run fde -- docs/specs/<NNN-slug>.md [--dry-run] [--max-fix=2] [--allow-protected]
// Env: CLAUDE_BIN (path to claude executable, default "claude"), FDE_BUDGET_USD (per agent call, default 5), FDE_MODEL.
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { parseStatus, parseVerdict, protectedHits, stripFrontmatter } from './lib.mjs';

const ROOT = process.cwd();
const args = process.argv.slice(2);
const specPath = args.find((a) => !a.startsWith('--'));
const has = (n) => args.includes(`--${n}`);
const maxFix = Number(args.find((a) => a.startsWith('--max-fix='))?.split('=')[1] ?? 2);
const CLAUDE = process.env.CLAUDE_BIN || 'claude';
const BUDGET = process.env.FDE_BUDGET_USD || '5';

const IMPL_TOOLS = 'Read,Edit,Write,Glob,Grep,Bash(npm run verify),Bash(npm run typecheck),Bash(npm test:*),Bash(npm run db:generate),Bash(npm run docs:ai),Bash(git status:*),Bash(git diff:*)';
const REVIEW_TOOLS = 'Read,Glob,Grep,Bash(git diff:*),Bash(git log:*),Bash(git status:*)';

const die = (m) => {
  console.error(`fde: ${m}`);
  process.exit(1);
};

if (!specPath || !fs.existsSync(specPath)) die('usage: npm run fde -- docs/specs/<NNN-slug>.md [--dry-run] [--max-fix=2] [--allow-protected]');
const spec = fs.readFileSync(specPath, 'utf8');
const status = parseStatus(spec);
if (status !== 'approved') die(`spec "**Status**" must be "approved" (got "${status ?? 'none'}")`);
const base = path.basename(specPath, '.md');
const branch = `feature/${base}`;

fs.mkdirSync('.fde/runs', { recursive: true });
const logFile = `.fde/runs/${new Date().toISOString().replace(/[:.]/g, '-')}-${base}.log`;
const log = (s) => fs.appendFileSync(logFile, s + '\n');
const say = (s) => {
  console.log(s);
  log(s);
};

function run(cmd, a, o = {}) {
  const r = spawnSync(cmd, a, { encoding: 'utf8', maxBuffer: 128 * 1024 * 1024, shell: o.shell ?? false, input: o.input, cwd: ROOT });
  return { code: r.status ?? 1, out: (r.stdout || '') + (r.stderr || '') };
}
const sh = (c) => run(c, [], { shell: true });
const tail = (s, n = 6000) => (s.length > n ? '...' + s.slice(-n) : s);

function agent(role, prompt, { tools, edit }) {
  const file = `.claude/agents/${role}.md`;
  const sys = stripFrontmatter(fs.readFileSync(file, 'utf8'));
  const a = ['-p', '--append-system-prompt', sys, '--permission-mode', edit ? 'acceptEdits' : 'default', '--allowedTools', tools, '--max-budget-usd', BUDGET];
  if (process.env.FDE_MODEL) a.push('--model', process.env.FDE_MODEL);
  say(`\n### agent:${role}`);
  const r = run(CLAUDE, a, { input: prompt });
  log(r.out);
  if (r.code !== 0) die(`agent:${role} exited ${r.code} (see ${logFile})`);
  return r.out;
}

const implement = (prompt) => agent('implementer', prompt, { tools: IMPL_TOOLS, edit: true });

if (has('dry-run')) {
  say(`DRY RUN  spec=${specPath}  branch=${branch}  max-fix=${maxFix}  claude=${CLAUDE}`);
  say('steps: clean-tree check -> branch -> implementer -> verify loop -> docs check -> protected-file check -> reviewer -> local commit');
  process.exit(0);
}

if (sh('git status --porcelain').out.split('\n').some((l) => l.trim() && !l.includes('.fde/'))) die('working tree not clean; commit or stash first');
const cur = run('git', ['branch', '--show-current']).out.trim();
if (cur !== branch) {
  const exists = run('git', ['rev-parse', '--verify', branch]).code === 0;
  const sw = run('git', exists ? ['switch', branch] : ['switch', '-c', branch]);
  if (sw.code !== 0) die(sw.out);
}
const baseSha = run('git', ['rev-parse', 'HEAD']).out.trim();
say(`branch ${branch} @ ${baseSha.slice(0, 8)}`);

implement(
  `Implement the spec below. Follow AGENTS.md and your role instructions. Slug for docs: ${base}.\n\n--- SPEC (${specPath}) ---\n${spec}`
);

function verifyLoop(label) {
  for (let i = 0; ; i++) {
    const v = sh('npm run verify');
    log(v.out);
    if (v.code === 0) return say(`verify OK (${label})`);
    if (i >= maxFix) die(`verify still failing after ${maxFix} fix rounds; tree left on ${branch} for inspection (${logFile})`);
    say(`verify FAILED (${label}), fix round ${i + 1}/${maxFix}`);
    implement(`\`npm run verify\` failed. Fix the root cause without weakening tests. Output tail:\n\n${tail(v.out)}`);
  }
}
verifyLoop('after implement');

const docsOk = () => fs.existsSync(`docs/ai/features/${base}.md`) && fs.readFileSync('docs/ai/FEATURES.md', 'utf8').includes(base);
if (!docsOk()) {
  implement(`Missing AI docs. Create docs/ai/features/${base}.md from docs/ai/features/_TEMPLATE.md and add a row for "${base}" to docs/ai/FEATURES.md. Run \`npm run docs:ai\`.`);
  if (!docsOk()) die('AI docs still missing');
}

const changed = sh(`git status --porcelain`).out.split('\n').map((l) => l.slice(3).trim()).filter(Boolean);
const hits = protectedHits(changed);
if (hits.length && !has('allow-protected')) die(`protected files changed (need human OK, rerun with --allow-protected after review):\n  ${hits.join('\n  ')}`);

const review = agent('reviewer', `Review the uncommitted changes (git diff plus new files via git status) against this spec.\n\n${spec}`, { tools: REVIEW_TOOLS, edit: false });
const verdict = parseVerdict(review);
if (!verdict) die(`reviewer gave no parsable verdict (see ${logFile})`);
if (verdict.verdict === 'fail') {
  say(`reviewer FAIL: ${verdict.issues.join(' | ')}`);
  implement(`The reviewer rejected the change. Fix these issues:\n- ${verdict.issues.join('\n- ')}`);
  verifyLoop('after review fix');
}

fs.writeFileSync(specPath, spec.replace(/(\*\*Status\*\*:\s*)approved/i, '$1shipped'));
run('git', ['add', '-A']);
const msg = `feat(${base}): implement spec\n\nSpec: ${specPath}\nBuilt by the FDE pipeline (scripts/fde/run.mjs). Not pushed.`;
const c = run('git', ['commit', '-m', msg]);
if (c.code !== 0) die(c.out);
say(`committed locally on ${branch}. Review with: git show --stat HEAD   (push is manual)`);
