import { describe, expect, it } from 'vitest';
import { parseStatus, parseVerdict, protectedHits, stripFrontmatter } from '../scripts/fde/lib.mjs';

describe('parseStatus', () => {
  it('reads the spec status', () => {
    expect(parseStatus('# S\n\n**Status**: approved\n')).toBe('approved');
    expect(parseStatus('**Status**: in-progress')).toBe('in-progress');
    expect(parseStatus('no status here')).toBeUndefined();
  });
});

describe('protectedHits', () => {
  it('flags auth, money, vault, deploy and pipeline files only', () => {
    const files = [
      'src/lib/auth.ts',
      'src/lib/persona.ts',
      'src/app/api/vault/upload/route.ts',
      'src/app/api/admin/leads/route.ts',
      '.github/workflows/ci.yml',
      'scripts/fde/run.mjs',
    ];
    expect(protectedHits(files)).toEqual([
      'src/lib/auth.ts',
      'src/app/api/vault/upload/route.ts',
      '.github/workflows/ci.yml',
      'scripts/fde/run.mjs',
    ]);
  });
});

describe('parseVerdict', () => {
  it('takes the last verdict JSON line', () => {
    const out = 'looks fine\n{"verdict":"fail","issues":["x"]}\nactually\n{"verdict":"pass","issues":[]}';
    expect(parseVerdict(out)).toEqual({ verdict: 'pass', issues: [] });
  });
  it('returns null when absent or malformed', () => {
    expect(parseVerdict('all good')).toBeNull();
    expect(parseVerdict('{"verdict":"maybe"}')).toBeNull();
  });
});

describe('stripFrontmatter', () => {
  it('removes yaml frontmatter', () => {
    expect(stripFrontmatter('---\nname: x\n---\nbody\n')).toBe('body');
  });
});
