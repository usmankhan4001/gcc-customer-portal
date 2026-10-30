// Pure helpers for the FDE pipeline (unit-tested in tests/fde.test.ts).
import fs from 'node:fs';
import path from 'node:path';

// Files an agent may not change unless the spec lists them under "Protected files approved"
// (mirrors AGENTS.md "Human-approval zones"). Schema and migrations are not here: they are
// serialized by the schema lock instead.
export const PROTECTED = [
  /^src\/lib\/(auth|auth-policy|admin-auth|session|jwt-secret|rate-limit|stripe|r2|webhook-dedupe|kyc-reference|whatsapp|push)\.ts$/,
  /^src\/middleware\.ts$/,
  /^src\/app\/api\/(auth|checkout|vault|webhooks|onboarding)\//,
  /^src\/app\/api\/admin\/(seed-admin|kyc)\//,
  /^src\/app\/vault\/shared\//,
  /^Dockerfile$/,
  /^docker-entrypoint\.sh$/,
  /^next\.config\.mjs$/,
  /^\.github\/workflows\//,
  /^\.claude\//,
  /^scripts\/fde\//,
];

export const parseStatus = (md) => /\*\*Status\*\*:\s*([a-z-]+)/i.exec(md)?.[1]?.toLowerCase();

// "**Protected files approved**: src/lib/auth.ts, src/app/api/vault/"  (trailing "/" = whole folder; "none" = nothing)
export function parseApproved(md) {
  const raw = /\*\*Protected files approved\*\*:\s*(.+)/i.exec(md)?.[1] ?? '';
  return raw
    .replace(/<!--.*?-->/g, '')
    .split(',')
    .map((s) => s.replace(/[`\s]/g, ''))
    .filter((s) => s && s.toLowerCase() !== 'none');
}

// "**Schema change**: yes|no" - a yes takes the schema lock so two runs never generate colliding migrations.
export const parseSchemaChange = (md) => /\*\*Schema change\*\*:\s*yes/i.test(md);

const isApproved = (file, approved) => approved.some((a) => (a.endsWith('/') ? file.startsWith(a) : file === a));

export const protectedHits = (files, approved = []) =>
  files.filter((f) => PROTECTED.some((re) => re.test(f)) && !isApproved(f, approved));

export const stripFrontmatter = (md) => md.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, '').trim();

// The reviewer must end its reply with one JSON line: {"verdict":"pass|fail","issues":[...]}
export function parseVerdict(out) {
  for (const line of out.trim().split(/\r?\n/).reverse()) {
    const t = line.trim();
    if (!t.startsWith('{') || !t.includes('"verdict"')) continue;
    try {
      const v = JSON.parse(t);
      if (v.verdict === 'pass' || v.verdict === 'fail') return { verdict: v.verdict, issues: v.issues ?? [] };
    } catch {}
  }
  return null;
}

// Exclusive lock file: returns false if another run already holds it.
export function acquireLock(file, info) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  try {
    const fd = fs.openSync(file, 'wx');
    fs.writeSync(fd, info);
    fs.closeSync(fd);
    return true;
  } catch (e) {
    if (e.code === 'EEXIST') return false;
    throw e;
  }
}
