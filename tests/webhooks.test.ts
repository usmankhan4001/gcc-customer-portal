import { createHmac } from 'crypto';
import { PgDialect } from 'drizzle-orm/pg-core';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { companies, orders, processedWebhookEvents, users } from '@/lib/db/schema';
import { extractKYCReference, phoneVariants } from '@/lib/kyc-reference';

// Recording drizzle-style stub. Every query is logged in `ops`; `handler` decides what it returns.
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

vi.mock('@/lib/db', () => ({
  db: {
    select: () => chain('select'),
    insert: (t: unknown) => chain('insert', t),
    update: (t: unknown) => chain('update', t),
    delete: (t: unknown) => chain('delete', t),
  },
}));
vi.mock('stripe', () => ({
  default: class {
    webhooks = { constructEvent: (body: string) => JSON.parse(body) };
  },
}));
const sendWhatsAppMessage = vi.fn();
vi.mock('@/lib/whatsapp', () => ({ sendWhatsAppMessage: (...a: unknown[]) => sendWhatsAppMessage(...a) }));
vi.mock('@/lib/push', () => ({ sendPushToUser: vi.fn() }));
vi.mock('@/lib/posthog-server', () => ({ captureServerEvent: vi.fn() }));

const dialect = new PgDialect();
const render = (op?: Op) => dialect.sqlToQuery(op!.where as never);
const only = (kind: string, table: unknown) => ops.filter((o) => o.kind === kind && o.table === table);

beforeEach(() => {
  ops = [];
  handler = () => [];
  sendWhatsAppMessage.mockReset();
});
afterEach(() => vi.unstubAllEnvs());

// ---------------------------------------------------------------------------
describe('Stripe webhook', () => {
  const event = (type: string, session = {}) => ({
    id: 'evt_1',
    type,
    data: { object: { id: 'cs_1', payment_intent: 'pi_1', metadata: { order_id: 'o1', company_id: 'c1' }, ...session } },
  });
  const post = async (e: unknown) => {
    const { POST } = await import('@/app/api/webhooks/stripe/route');
    const req = new Request('http://localhost/api/webhooks/stripe', {
      method: 'POST',
      body: JSON.stringify(e),
      headers: { 'Stripe-Signature': 'sig' },
    });
    return POST(req as never);
  };
  // claim: first delivery -> row returned; duplicate -> none
  const claimed = (op: Op) => op.kind === 'insert' && op.table === processedWebhookEvents;

  it('ignores a duplicate event id: no writes, no messages', async () => {
    handler = (op) => (claimed(op) ? [] : [{}]);
    const res = await post(event('checkout.session.completed'));
    expect(res.status).toBe(200);
    expect((await res.json()).duplicate).toBe(true);
    expect(ops.filter((o) => o.kind === 'update')).toHaveLength(0);
    expect(sendWhatsAppMessage).not.toHaveBeenCalled();
  });

  it('does nothing further when the order is already paid', async () => {
    handler = (op) => (claimed(op) ? [{ id: 'stripe:evt_1' }] : []);
    const res = await post(event('checkout.session.completed'));
    expect(res.status).toBe(200);
    expect(only('update', companies)).toHaveLength(0);
    expect(sendWhatsAppMessage).not.toHaveBeenCalled();
  });

  it('on first payment moves only a lead-status company to onboarding and notifies once', async () => {
    handler = (op) => {
      if (claimed(op)) return [{ id: 'stripe:evt_1' }];
      if (op.kind === 'update' && op.table === orders) return [{ id: 'o1', amount_total: 10000 }];
      if (op.kind === 'select' && op.table === companies) return [{ id: 'c1', user_id: 'u1', company_name: 'Acme', jurisdiction: 'uae' }];
      if (op.kind === 'select' && op.table === users) return [{ id: 'u1', whatsapp_number: '+971500000000', full_name: 'Ann' }];
      return [];
    };
    const res = await post(event('checkout.session.completed'));
    expect(res.status).toBe(200);
    const [companyUpdate] = only('update', companies);
    expect(companyUpdate.values?.status).toBe('onboarding');
    expect(render(companyUpdate).params).toContain('lead'); // guard: never move a case backwards
    const [orderUpdate] = only('update', orders);
    expect(render(orderUpdate).params).toContain('paid'); // guard: ne(payment_status, 'paid')
    expect(sendWhatsAppMessage).toHaveBeenCalledTimes(1);
  });

  it('releases the claim and returns 500 when processing fails, so Stripe can retry', async () => {
    handler = (op) => {
      if (claimed(op)) return [{ id: 'stripe:evt_1' }];
      if (op.kind === 'update' && op.table === orders) return [{ id: 'o1', amount_total: 100 }];
      if (op.kind === 'select' && op.table === companies) return [{ id: 'c1', user_id: 'u1', company_name: 'Acme' }];
      if (op.kind === 'select' && op.table === users) return [{ id: 'u1', whatsapp_number: '+1', full_name: 'A' }];
      return [];
    };
    sendWhatsAppMessage.mockRejectedValue(new Error('meta down'));
    const res = await post(event('checkout.session.completed'));
    expect(res.status).toBe(500);
    expect(only('delete', processedWebhookEvents)).toHaveLength(1);
  });

  it('marks an expired checkout as failed without notifying', async () => {
    handler = (op) => (claimed(op) ? [{ id: 'x' }] : []);
    const res = await post(event('checkout.session.expired'));
    expect(res.status).toBe(200);
    const [orderUpdate] = only('update', orders);
    expect(orderUpdate.values?.payment_status).toBe('failed');
    expect(render(orderUpdate).params).toContain('paid'); // never overwrites a paid order
    expect(sendWhatsAppMessage).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
describe('WhatsApp webhook', () => {
  const SECRET = 'app-secret';
  const body = (text: string, id = 'wamid.1') =>
    JSON.stringify({
      object: 'whatsapp_business_account',
      entry: [{ id: 'e', changes: [{ field: 'messages', value: { messages: [{ from: '971500000000', id, timestamp: '1', type: 'text', text: { body: text } }] } }] }],
    });
  const post = async (payload: string, signature?: string) => {
    const { POST } = await import('@/app/api/webhooks/whatsapp/route');
    const headers: Record<string, string> = {};
    if (signature) headers['X-Hub-Signature-256'] = signature;
    return POST(new Request('http://localhost/api/webhooks/whatsapp', { method: 'POST', body: payload, headers }) as never);
  };
  const sign = (payload: string) => `sha256=${createHmac('sha256', SECRET).update(payload).digest('hex')}`;
  const claimed = (op: Op) => op.kind === 'insert' && op.table === processedWebhookEvents;
  const happyPath = (op: Op) => {
    if (claimed(op)) return [{ id: 'whatsapp:wamid.1' }];
    if (op.kind === 'select' && op.table === users) return [{ id: 'u1' }];
    if (op.kind === 'select' && op.table === companies) return [{ id: 'c1', company_name: 'Acme' }];
    return [];
  };

  it('rejects in production when the app secret is not configured', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('WHATSAPP_APP_SECRET', '');
    const res = await post(body('KYC-AB12CD34'));
    expect(res.status).toBe(401);
    expect(ops).toHaveLength(0);
  });

  it('rejects an invalid signature', async () => {
    vi.stubEnv('WHATSAPP_APP_SECRET', SECRET);
    const res = await post(body('KYC-AB12CD34'), 'sha256=deadbeef');
    expect(res.status).toBe(401);
    expect(ops).toHaveLength(0);
  });

  it('advances KYC from a valid signed message and stores only the reference', async () => {
    vi.stubEnv('WHATSAPP_APP_SECRET', SECRET);
    handler = happyPath;
    const payload = body('KYC-AB12CD34');
    const res = await post(payload, sign(payload));
    expect(res.status).toBe(200);
    const [upd] = only('update', companies);
    expect(upd.values).toMatchObject({ official_kyc_reference: 'AB12CD34', status: 'filing_in_progress' });
  });

  it('ignores a message id it has already processed', async () => {
    vi.stubEnv('WHATSAPP_APP_SECRET', SECRET);
    handler = (op) => (claimed(op) ? [] : happyPath(op));
    const payload = body('KYC-AB12CD34');
    const res = await post(payload, sign(payload));
    expect(res.status).toBe(200);
    expect(only('update', companies)).toHaveLength(0);
  });

  it('does not treat ordinary text as a KYC reference', async () => {
    vi.stubEnv('WHATSAPP_APP_SECRET', SECRET);
    handler = happyPath;
    const payload = body('KYC verification is complete');
    const res = await post(payload, sign(payload));
    expect(res.status).toBe(200);
    expect(ops).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
describe('extractKYCReference', () => {
  it.each([
    ['KYC-AB12CD34', 'AB12CD34'],
    ['kyc 123456', '123456'],
    ['My KYC: REF2026XY done', 'REF2026XY'],
    ['KYC#ABC123', 'ABC123'],
  ])('matches %s', (text, ref) => expect(extractKYCReference(text)).toBe(ref));

  it.each(['KYC verification', 'kyc completed', 'KYC', 'hello', 'KYC-ABC', 'KYC-ABCDEFGH'])(
    'does not match %s',
    (text) => expect(extractKYCReference(text)).toBeNull()
  );
});

describe('phoneVariants', () => {
  it('returns digits-only and plus-prefixed forms from any input', () => {
    expect(phoneVariants('971500000000')).toEqual(['971500000000', '+971500000000']);
    expect(phoneVariants('+971 50 000 0000')).toEqual(['971500000000', '+971500000000']);
  });
});
