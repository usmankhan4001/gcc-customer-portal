import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const script = path.resolve(__dirname, '..', 'scripts', 'baseline.mjs');
const run = (...args: string[]) => spawnSync(process.execPath, [script, ...args], { encoding: 'utf8' });

describe('baseline.mjs --sql', () => {
  it('prints a guarded transaction with one insert per baselined migration', () => {
    const r = run('3', '--sql');
    expect(r.status).toBe(0);
    expect(r.stdout.startsWith('begin;')).toBe(true);
    expect(r.stdout.trim().endsWith('commit;')).toBe(true);
    expect(r.stdout).toContain('refusing to baseline');
    expect(r.stdout.match(/insert into drizzle\.__drizzle_migrations/g)).toHaveLength(3);
  });

  it('is deterministic and needs no database connection', () => {
    expect(run('2', '--sql').stdout).toBe(run('2', '--sql').stdout);
  });

  it('rejects an N larger than the number of migrations and bad input', () => {
    expect(run('99', '--sql').status).toBe(1);
    expect(run('x', '--sql').status).toBe(1);
  });
});
