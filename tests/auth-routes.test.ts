import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Chainable drizzle-style stub: every builder method returns the chain, awaiting it yields `rows`.
let rows: unknown[] = [];
const chain: Record<string, unknown> = {};
for (const m of ['from', 'where', 'orderBy', 'limit', 'values', 'set', 'returning']) chain[m] = () => chain;
chain.then = (resolve: (v: unknown) => unknown) => resolve(rows);

const update = vi.fn(() => chain);
const insert = vi.fn(() => chain);
vi.mock('@/lib/db', () => ({ db: { select: () => chain, update, insert } }));

const setCookie = vi.fn();
vi.mock('next/headers', () => ({ cookies: async () => ({ get: () => undefined, set: setCookie }) }));
vi.mock('@/lib/posthog-server', () => ({ captureServerEvent: vi.fn(), identifyServer: vi.fn() }));

const post = (body: unknown) =>
  new Request('http://localhost/api', { method: 'POST', body: JSON.stringify(body), headers: { 'content-type': 'application/json' } });

beforeEach(() => {
  rows = [];
  update.mockClear();
  insert.mockClear();
  setCookie.mockClear();
});
afterEach(() => vi.unstubAllEnvs());

describe('POST /api/onboarding/complete', () => {
  it('refuses to touch an existing account without a session (takeover)', async () => {
    rows = [{ id: 'victim' }];
    const { POST } = await import('@/app/api/onboarding/complete/route');
    const res = await POST(post({ fullName: 'Mallory', email: 'victim@example.com', password: 'attacker-pass' }));
    expect(res.status).toBe(409);
    expect(update).not.toHaveBeenCalled();
    expect(setCookie).not.toHaveBeenCalled();
  });
});

describe('POST /api/auth/send-otp in production', () => {
  it('never returns the OTP and errors when WhatsApp is unavailable', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('WHATSAPP_ACCESS_TOKEN', '');
    const { POST } = await import('@/app/api/auth/send-otp/route');
    const res = await POST(post({ phone: '+971500000000' }));
    expect(res.status).toBe(502);
    expect(JSON.stringify(await res.json())).not.toMatch(/devOtp|\d{6}/);
  });
});

describe('POST /api/auth/verify-otp in production', () => {
  it('rejects the fixed 123456 code', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('WHATSAPP_ACCESS_TOKEN', '');
    const { POST } = await import('@/app/api/auth/verify-otp/route');
    const res = await POST(post({ phone: '+971500000000', otp: '123456' }));
    expect(res.status).toBe(400);
  });
});

describe('POST /api/admin/seed-admin in production', () => {
  it('returns 404 without the seed token', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('ADMIN_SEED_TOKEN', 'tok');
    const { POST } = await import('@/app/api/admin/seed-admin/route');
    const res = await POST(post({}));
    expect(res.status).toBe(404);
    expect(insert).not.toHaveBeenCalled();
  });
});
