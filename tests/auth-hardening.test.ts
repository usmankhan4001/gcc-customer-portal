import { PgDialect } from 'drizzle-orm/pg-core';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { generateToken, hashToken } from '@/lib/auth';
import { leads, otpCodes, pushSubscriptions, users } from '@/lib/db/schema';
import { rateLimit } from '@/lib/rate-limit';
import { safeRedirectPath } from '@/lib/safe-redirect';

// Recording drizzle-style stub: every query is logged in `ops`; `handler` decides what it returns.
type Op = { kind: string; table?: unknown; values?: Record<string, unknown>; where?: unknown };
let ops: Op[] = [];
let handler: (op: Op) => unknown[] = () => [];

function chain(kind: string, table?: unknown) {
  const op: Op = { kind, table };
  const c: Record<string, unknown> = {};
  c.from = (t: unknown) => ((op.table = t), c);
  c.values = (v: Record<string, unknown>) => ((op.values = v), c);
  c.set = (v: Record<string, unknown>) => ((op.values = v), c);
  c.where = (w: unknown) => ((op.where = w), c);
  for (const m of ['orderBy', 'limit', 'returning', 'onConflictDoNothing']) c[m] = () => c;
  c.then = (resolve: (v: unknown) => unknown, reject?: (e: unknown) => unknown) => {
    ops.push(op);
    try {
      return resolve(handler(op));
    } catch (e) {
      return reject?.(e);
    }
  };
  return c;
}

let cookieJar: Record<string, string> = {};
let requestHeaders: Record<string, string> = {};
const setCookie = vi.fn();
const generateToolPDF = vi.fn();
const sendToolResultEmail = vi.fn();

vi.mock('@/lib/db', () => ({
  db: {
    select: () => chain('select'),
    insert: (t: unknown) => chain('insert', t),
    update: (t: unknown) => chain('update', t),
    delete: (t: unknown) => chain('delete', t),
  },
}));
vi.mock('next/headers', () => ({
  cookies: async () => ({ get: (k: string) => (cookieJar[k] ? { value: cookieJar[k] } : undefined), set: setCookie }),
  headers: async () => new Headers(requestHeaders),
}));
vi.mock('@/lib/posthog-server', () => ({ captureServerEvent: vi.fn(), identifyServer: vi.fn() }));
vi.mock('@/lib/pdf', () => ({ generateToolPDF: (...a: unknown[]) => generateToolPDF(...a) }));
vi.mock('@/lib/r2', () => ({ getPresignedDownloadUrl: async () => 'https://download.example/x' }));
vi.mock('@/lib/email', () => ({ sendToolResultEmail: (...a: unknown[]) => sendToolResultEmail(...a) }));

const dialect = new PgDialect();
const only = (kind: string, table: unknown) => ops.filter((o) => o.kind === kind && o.table === table);
const post = (body: unknown, headers: Record<string, string> = {}) =>
  new Request('http://localhost/api', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'content-type': 'application/json', ...headers },
  }) as never;

beforeEach(() => {
  ops = [];
  handler = () => [];
  cookieJar = {};
  requestHeaders = {};
  setCookie.mockClear();
  generateToolPDF.mockReset().mockResolvedValue({ r2Key: 'pdfs/k.pdf' });
  sendToolResultEmail.mockReset();
});
afterEach(() => vi.unstubAllEnvs());

// ---------------------------------------------------------------------------
describe('getServerSession', () => {
  it('ignores a forged x-user-id header when there is no cookie', async () => {
    requestHeaders = { 'x-user-id': 'victim', 'x-user-role': 'admin' };
    const { getServerSession } = await import('@/lib/session');
    expect(await getServerSession()).toBeNull();
  });

  it('uses the verified cookie, not a conflicting header', async () => {
    cookieJar.gcc_session = await generateToken({ userId: 'u1', email: 'a@b.co', role: 'client' });
    requestHeaders = { 'x-user-id': 'victim', 'x-user-role': 'admin' };
    const { getServerSession } = await import('@/lib/session');
    expect(await getServerSession()).toEqual({ userId: 'u1', email: 'a@b.co', role: 'client' });
  });

  it('rejects a tampered cookie', async () => {
    cookieJar.gcc_session = (await generateToken({ userId: 'u1', email: '', role: 'client' })) + 'x';
    const { getServerSession } = await import('@/lib/session');
    expect(await getServerSession()).toBeNull();
  });
});

// ---------------------------------------------------------------------------
describe('POST /api/auth/verify-otp attempts and atomic consume', () => {
  const candidate = (attempts = 0) => ({ id: 'o1', otp_hash: hashToken('654321'), attempts });
  const run = async (otp: string) => {
    const { POST } = await import('@/app/api/auth/verify-otp/route');
    return POST(post({ phone: '+971500000001', otp }));
  };

  it('returns 429 once the code has 5 wrong attempts, even for the right code', async () => {
    handler = (op) => (op.kind === 'select' && op.table === otpCodes ? [candidate(5)] : []);
    const res = await run('654321');
    expect(res.status).toBe(429);
    expect(setCookie).not.toHaveBeenCalled();
    expect(ops.filter((o) => o.kind === 'update')).toHaveLength(0);
  });

  it('counts a wrong guess against the code', async () => {
    handler = (op) => (op.kind === 'select' && op.table === otpCodes ? [candidate(0)] : []);
    const res = await run('000000');
    expect(res.status).toBe(400);
    const [upd] = only('update', otpCodes);
    expect(upd.values).toHaveProperty('attempts');
  });

  it('succeeds once for the right code and sets the session cookie', async () => {
    handler = (op) => {
      if (op.kind === 'select' && op.table === otpCodes) return [candidate()];
      if (op.kind === 'update' && op.table === otpCodes) return [{ id: 'o1' }];
      if (op.kind === 'select' && op.table === users) return [{ id: 'u1', role: 'client', full_name: 'A' }];
      return [];
    };
    const res = await run('654321');
    expect(res.status).toBe(200);
    expect(setCookie).toHaveBeenCalledTimes(1);
    expect(dialect.sqlToQuery(only('update', otpCodes)[0].where as never).params).toContain(false); // consumed = false guard
  });

  it('loses the race: if another request already consumed the code, no session is issued', async () => {
    handler = (op) => {
      if (op.kind === 'select' && op.table === otpCodes) return [candidate()];
      return []; // conditional update matches no row
    };
    const res = await run('654321');
    expect(res.status).toBe(400);
    expect(setCookie).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
describe('rate limits', () => {
  it('send-otp: 4th code for the same number within the window is 429', async () => {
    const { POST } = await import('@/app/api/auth/send-otp/route');
    const send = () => POST(post({ phone: '+971500000002' }, { 'x-forwarded-for': '10.0.0.2' }));
    expect((await send()).status).toBe(200);
    expect((await send()).status).toBe(200);
    expect((await send()).status).toBe(200);
    expect((await send()).status).toBe(429);
  });

  it('login: 6th attempt for the same identifier and IP is 429', async () => {
    const { POST } = await import('@/app/api/auth/login/route');
    const attempt = () => POST(post({ identifier: 'victim@example.com', password: 'guess' }, { 'x-forwarded-for': '10.0.0.3' }));
    for (let i = 0; i < 5; i++) expect((await attempt()).status).toBe(401);
    expect((await attempt()).status).toBe(429);
  });

  it('rateLimit window slides', () => {
    vi.useFakeTimers();
    expect(rateLimit('k', 2, 1000)).toBe(true);
    expect(rateLimit('k', 2, 1000)).toBe(true);
    expect(rateLimit('k', 2, 1000)).toBe(false);
    vi.advanceTimersByTime(1001);
    expect(rateLimit('k', 2, 1000)).toBe(true);
    vi.useRealTimers();
  });
});

// ---------------------------------------------------------------------------
describe('safeRedirectPath', () => {
  it.each(['/dashboard', '/vault?x=1', '/a/b'])('keeps %s', (p) => expect(safeRedirectPath(p)).toBe(p));
  it.each(['//evil.com', 'https://evil.com', '/\\evil.com', 'javascript:alert(1)', '', '/ok\nbad'])(
    'replaces %j with the fallback',
    (p) => expect(safeRedirectPath(p)).toBe('/dashboard')
  );
  it('handles null and a custom fallback', () => {
    expect(safeRedirectPath(null)).toBe('/dashboard');
    expect(safeRedirectPath('//x', '/home')).toBe('/home');
  });
});

// ---------------------------------------------------------------------------
describe('POST /api/push/unsubscribe', () => {
  it('requires a session', async () => {
    const { POST } = await import('@/app/api/push/unsubscribe/route');
    const res = await POST(post({ endpoint: 'https://push.example/e1' }));
    expect(res.status).toBe(401);
    expect(ops).toHaveLength(0);
  });

  it('deletes only the caller\'s own subscription', async () => {
    cookieJar.gcc_session = await generateToken({ userId: 'u1', email: '', role: 'client' });
    const { POST } = await import('@/app/api/push/unsubscribe/route');
    const res = await POST(post({ endpoint: 'https://push.example/e1' }));
    expect(res.status).toBe(200);
    const [del] = only('delete', pushSubscriptions);
    expect(dialect.sqlToQuery(del.where as never).params).toEqual(['https://push.example/e1', 'u1']);
  });
});

// ---------------------------------------------------------------------------
describe('POST /api/leads/capture', () => {
  it('does not return another visitor\'s stored data', async () => {
    handler = (op) => {
      if (op.kind === 'select' && op.table === leads) return [{ id: 'old', email: 'old@secret.example', whatsapp_number: '+971500000009' }];
      if (op.kind === 'insert' && op.table === leads) return [{ id: 'new', email: 'old@secret.example', whatsapp_number: '+971500000009', source_tool: 'tax-calculator' }];
      return [];
    };
    const { POST } = await import('@/app/api/leads/capture/route');
    const res = await POST(post({ source_tool: 'tax-calculator', whatsapp_number: '+971500000009' }));
    expect(res.status).toBe(200);
    const text = JSON.stringify(await res.json());
    expect(text).toContain('"id":"new"');
    expect(text).not.toContain('old@secret.example');
  });
});

// ---------------------------------------------------------------------------
describe('POST /api/pdf/generate', () => {
  const body = { lead_id: 'l1', title: 'Result', rows: [{ label: 'a', value: 'b' }], email_it: true };
  const leadHandler = (op: Op) => (op.kind === 'select' && op.table === leads ? [{ id: 'l1', email: 'a@b.co', source_tool: 'tax-calculator' }] : []);

  it('is closed to anonymous callers', async () => {
    handler = leadHandler;
    const { POST } = await import('@/app/api/pdf/generate/route');
    const res = await POST(post(body));
    expect(res.status).toBe(401);
    expect(generateToolPDF).not.toHaveBeenCalled();
    expect(ops).toHaveLength(0);
  });

  it('is closed to non-admin sessions', async () => {
    cookieJar.gcc_session = await generateToken({ userId: 'u1', email: '', role: 'client' });
    const { POST } = await import('@/app/api/pdf/generate/route');
    expect((await POST(post(body))).status).toBe(401);
  });

  it('succeeds for an admin and survives an email failure', async () => {
    cookieJar.gcc_session = await generateToken({ userId: 'a1', email: 'a@x.co', role: 'admin' });
    handler = leadHandler;
    sendToolResultEmail.mockRejectedValue(new Error('resend down'));
    const { POST } = await import('@/app/api/pdf/generate/route');
    const res = await POST(post(body));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ url: 'https://download.example/x', emailed: false });
  });
});
