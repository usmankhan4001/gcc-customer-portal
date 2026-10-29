// Pure helpers for the FDE pipeline (unit-tested in tests/fde.test.ts).

// Files an agent may not change without --allow-protected (mirrors AGENTS.md "Human-approval zones").
export const PROTECTED = [
  /^src\/lib\/(auth|admin-auth|session|stripe|r2)\.ts$/,
  /^src\/middleware\.ts$/,
  /^src\/app\/api\/(checkout|vault|webhooks)\//,
  /^Dockerfile$/,
  /^docker-entrypoint\.sh$/,
  /^\.github\/workflows\//,
  /^\.claude\//,
  /^scripts\/fde\//,
];

export const parseStatus = (md) => /\*\*Status\*\*:\s*([a-z-]+)/i.exec(md)?.[1]?.toLowerCase();

export const protectedHits = (files) => files.filter((f) => PROTECTED.some((re) => re.test(f)));

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
