import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { acquireLock, parseApproved, parseSchemaChange, parseStatus, parseVerdict, protectedHits, stripFrontmatter } from '../scripts/fde/lib.mjs';

describe('parseStatus', () => {
  it('reads the spec status', () => {
    expect(parseStatus('# S\n\n**Status**: approved\n')).toBe('approved');
    expect(parseStatus('**Status**: in-progress')).toBe('in-progress');
    expect(parseStatus('no status here')).toBeUndefined();
  });
});

describe('spec fields', () => {
  it('parses approved protected files, ignoring "none" and backticks', () => {
    expect(parseApproved('**Protected files approved**: `src/lib/auth.ts`, src/app/api/vault/')).toEqual(['src/lib/auth.ts', 'src/app/api/vault/']);
    expect(parseApproved('**Protected files approved**: none   <!-- note -->')).toEqual([]);
    expect(parseApproved('no field')).toEqual([]);
  });
  it('parses the schema flag', () => {
    expect(parseSchemaChange('**Schema change**: yes')).toBe(true);
    expect(parseSchemaChange('**Schema change**: no')).toBe(false);
    expect(parseSchemaChange('')).toBe(false);
  });
});

describe('protectedHits', () => {
  const files = [
    'src/lib/auth.ts',
    'src/lib/persona.ts',
    'src/lib/session.ts',
    'src/lib/webhook-dedupe.ts',
    'src/app/api/vault/upload/route.ts',
    'src/app/api/admin/leads/route.ts',
    'src/app/api/admin/seed-admin/route.ts',
    'src/lib/db/schema.ts',
    'drizzle/0005_x.sql',
    'docker-entrypoint.sh',
    '.github/workflows/ci.yml',
    'scripts/fde/run.mjs',
  ];
  it('flags auth, money, vault, webhooks, deploy and pipeline files only', () => {
    expect(protectedHits(files)).toEqual([
      'src/lib/auth.ts',
      'src/lib/session.ts',
      'src/lib/webhook-dedupe.ts',
      'src/app/api/vault/upload/route.ts',
      'src/app/api/admin/seed-admin/route.ts',
      'docker-entrypoint.sh',
      '.github/workflows/ci.yml',
      'scripts/fde/run.mjs',
    ]);
  });
  it('lets the spec approve exact files and whole folders', () => {
    const hits = protectedHits(files, ['src/lib/auth.ts', 'src/app/api/vault/', 'docker-entrypoint.sh']);
    expect(hits).not.toContain('src/lib/auth.ts');
    expect(hits).not.toContain('src/app/api/vault/upload/route.ts');
    expect(hits).not.toContain('docker-entrypoint.sh');
    expect(hits).toContain('src/lib/session.ts');
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

describe('acquireLock', () => {
  it('is exclusive until the file is removed', () => {
    const file = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'fde-lock-')), 'schema.lock');
    expect(acquireLock(file, 'a')).toBe(true);
    expect(acquireLock(file, 'b')).toBe(false);
    fs.rmSync(file);
    expect(acquireLock(file, 'c')).toBe(true);
  });
});
