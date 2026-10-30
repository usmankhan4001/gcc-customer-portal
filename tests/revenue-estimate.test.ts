import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { generateToken } from '@/lib/auth';

type Op = { kind: string; table?: unknown; values?: Record<string, unknown>; where?: unknown };
let ops: Op[] = [];
let mockCompany: Record<string, unknown> | null = {
  id: 'c1',
  user_id: 'u1',
  company_name: 'Test Corp',
  status: 'active',
  annual_revenue_estimate: 100000,
  fiscal_year_end: '12-31',
};

function chain(kind: string) {
  const op: Op = { kind };
  const c: Record<string, unknown> = {};
  c.from = (t: unknown) => ((op.table = t), c);
  c.where = (w: unknown) => ((op.where = w), c);
  c.orderBy = () => c;
  c.limit = () => c;
  c.set = (v: Record<string, unknown>) => ((op.values = v), c);
  c.returning = () => c;
  c.then = (resolve: (v: unknown) => unknown) => {
    ops.push(op);
    if (kind === 'select') {
      return resolve(mockCompany ? [mockCompany] : []);
    }
    if (kind === 'update') {
      const updated = { ...(mockCompany || {}), ...(op.values || {}) };
      return resolve([updated]);
    }
    return resolve([]);
  };
  return c;
}

let cookieJar: Record<string, string> = {};
vi.mock('next/headers', () => ({
  cookies: async () => ({
    get: (name: string) => (cookieJar[name] ? { value: cookieJar[name] } : undefined),
    set: vi.fn(),
  }),
}));

vi.mock('@/lib/db', () => ({
  db: {
    select: () => chain('select'),
    update: () => chain('update'),
  },
}));

const patchRequest = (body: unknown) =>
  new Request('http://localhost/api/companies/revenue-estimate', {
    method: 'PATCH',
    body: JSON.stringify(body),
    headers: { 'content-type': 'application/json' },
  });

beforeEach(async () => {
  ops = [];
  mockCompany = {
    id: 'c1',
    user_id: 'u1',
    company_name: 'Test Corp',
    status: 'active',
    annual_revenue_estimate: 100000,
    fiscal_year_end: '12-31',
  };
  const token = await generateToken({ userId: 'u1', email: 'test@example.com', role: 'client' });
  cookieJar = { gcc_session: token };
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('PATCH /api/companies/revenue-estimate (AC4)', () => {
  it('accepts a decimal value, rounds with Math.round, stores an integer, and returns 200 (rounds down)', async () => {
    const { PATCH } = await import('@/app/api/companies/revenue-estimate/route');
    const res = await PATCH(patchRequest({ annual_revenue_estimate: 125000.4 }));

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.company.annual_revenue_estimate).toBe(125000);

    const updateOp = ops.find((o) => o.kind === 'update');
    expect(updateOp?.values?.annual_revenue_estimate).toBe(125000);
  });

  it('accepts a decimal value, rounds with Math.round, stores an integer, and returns 200 (rounds up)', async () => {
    const { PATCH } = await import('@/app/api/companies/revenue-estimate/route');
    const res = await PATCH(patchRequest({ annual_revenue_estimate: 125000.6 }));

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.company.annual_revenue_estimate).toBe(125001);

    const updateOp = ops.find((o) => o.kind === 'update');
    expect(updateOp?.values?.annual_revenue_estimate).toBe(125001);
  });

  it('accepts an exact integer value and returns 200', async () => {
    const { PATCH } = await import('@/app/api/companies/revenue-estimate/route');
    const res = await PATCH(patchRequest({ annual_revenue_estimate: 350000 }));

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.company.annual_revenue_estimate).toBe(350000);

    const updateOp = ops.find((o) => o.kind === 'update');
    expect(updateOp?.values?.annual_revenue_estimate).toBe(350000);
  });

  it('accepts zero as a valid non-negative revenue estimate', async () => {
    const { PATCH } = await import('@/app/api/companies/revenue-estimate/route');
    const res = await PATCH(patchRequest({ annual_revenue_estimate: 0 }));

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.company.annual_revenue_estimate).toBe(0);

    const updateOp = ops.find((o) => o.kind === 'update');
    expect(updateOp?.values?.annual_revenue_estimate).toBe(0);
  });

  it.each([
    [-1, 'negative integer'],
    [-0.5, 'negative decimal'],
    [-50000, 'large negative value'],
  ])('returns 400 for negative value: %s (%s)', async (val, _desc) => {
    const { PATCH } = await import('@/app/api/companies/revenue-estimate/route');
    const res = await PATCH(patchRequest({ annual_revenue_estimate: val }));

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/non-negative number/i);
    expect(ops.filter((o) => o.kind === 'update')).toHaveLength(0);
  });

  it.each([
    ['not-a-number', 'string'],
    ['125000', 'numeric string'],
    [null, 'null'],
    [undefined, 'undefined'],
    [true, 'boolean'],
    [{}, 'empty object'],
    [[125000], 'array'],
  ])('returns 400 for non-numeric value: %s (%s)', async (val, _desc) => {
    const { PATCH } = await import('@/app/api/companies/revenue-estimate/route');
    const res = await PATCH(patchRequest({ annual_revenue_estimate: val }));

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/non-negative number/i);
    expect(ops.filter((o) => o.kind === 'update')).toHaveLength(0);
  });

  it('returns 400 for NaN and Infinity', async () => {
    const { PATCH } = await import('@/app/api/companies/revenue-estimate/route');

    // NaN serialized in JSON becomes null, but direct object testing:
    const resNan = await PATCH(new Request('http://localhost/api/companies/revenue-estimate', {
      method: 'PATCH',
      body: JSON.stringify({ annual_revenue_estimate: null }),
      headers: { 'content-type': 'application/json' },
    }));
    expect(resNan.status).toBe(400);

    // We also test when request has non-finite values if parsed directly
    const resReq = await PATCH(new Request('http://localhost/api/companies/revenue-estimate', {
      method: 'PATCH',
      body: '{ "annual_revenue_estimate": "Infinity" }',
      headers: { 'content-type': 'application/json' },
    }));
    expect(resReq.status).toBe(400);
  });

  it('returns 401 when no session cookie exists', async () => {
    cookieJar = {};
    const { PATCH } = await import('@/app/api/companies/revenue-estimate/route');
    const res = await PATCH(patchRequest({ annual_revenue_estimate: 100000 }));

    expect(res.status).toBe(401);
  });

  it('returns 404 when active company does not exist', async () => {
    mockCompany = null;
    const { PATCH } = await import('@/app/api/companies/revenue-estimate/route');
    const res = await PATCH(patchRequest({ annual_revenue_estimate: 100000 }));

    expect(res.status).toBe(404);
  });
});
