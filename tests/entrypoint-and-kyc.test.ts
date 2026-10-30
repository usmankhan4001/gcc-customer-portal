import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { generateToken } from '@/lib/auth';

const hasSh = !spawnSync('sh', ['-c', 'true']).error;
const entrypoint = path.resolve(__dirname, '..', 'docker-entrypoint.sh');
const run = (env: Record<string, string>) =>
  spawnSync('sh', [entrypoint], { encoding: 'utf8', env: { ...process.env, START_CMD: 'echo SERVER_STARTED', ...env } });

describe.skipIf(!hasSh)('docker-entrypoint.sh', () => {
  it('does not start the server when the migration fails', () => {
    const r = run({ MIGRATE_CMD: 'exit 3' });
    expect(r.status).toBe(1);
    expect(r.stdout).not.toContain('SERVER_STARTED');
    expect(r.stderr).toContain('FATAL');
  });

  it('starts the server when the migration succeeds', () => {
    const r = run({ MIGRATE_CMD: 'true' });
    expect(r.status).toBe(0);
    expect(r.stdout).toContain('SERVER_STARTED');
  });

  it('starts anyway only with the explicit escape hatch', () => {
    const r = run({ MIGRATE_CMD: 'exit 3', ALLOW_MIGRATION_FAILURE: '1' });
    expect(r.status).toBe(0);
    expect(r.stdout).toContain('SERVER_STARTED');
    expect(r.stderr).toContain('WARNING');
  });
});

let cookieJar: Record<string, string> = {};
vi.mock('next/headers', () => ({
  cookies: async () => ({ get: (k: string) => (cookieJar[k] ? { value: cookieJar[k] } : undefined) }),
}));

describe('POST /api/admin/kyc/review auth', () => {
  afterEach(() => (cookieJar = {}));
  const call = async () => {
    const { POST } = await import('@/app/api/admin/kyc/review/route');
    const req = new Request('http://localhost/api/admin/kyc/review', {
      method: 'POST',
      body: JSON.stringify({ document_id: 'd1', status: 'approved', notify_whatsapp: false }),
      headers: { 'content-type': 'application/json' },
    });
    return POST(req as never);
  };

  it('rejects anonymous callers and plain clients', async () => {
    expect((await call()).status).toBe(401);
    cookieJar.gcc_session = await generateToken({ userId: 'u1', email: '', role: 'client' });
    expect((await call()).status).toBe(401);
  });

  it('accepts admin and super_admin cookie sessions', async () => {
    for (const role of ['admin', 'super_admin']) {
      cookieJar.gcc_session = await generateToken({ userId: 'a1', email: '', role });
      expect((await call()).status).toBe(200);
    }
  });
});
