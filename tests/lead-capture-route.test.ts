import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CONSENT_TEXT } from '@/lib/tools/lead-capture';

// Mock DB chain
let selectRows: unknown[] = [];
let insertedValues: Record<string, unknown> | null = null;
const insertedRow = {
  id: 'lead-test-uuid-1234',
  email: 'test@example.com',
  whatsapp_number: '+971501112233',
  source_tool: 'tax_calculator',
  tool_input: {},
  tool_result: {},
  persona_tag: 'Gulf Relocator',
  funnel_track: 'consultation_led',
};

const chain: Record<string, unknown> = {};
for (const m of ['from', 'where', 'orderBy', 'limit', 'returning']) {
  chain[m] = () => chain;
}
chain.values = (vals: Record<string, unknown>) => {
  insertedValues = vals;
  return chain;
};
chain.then = (resolve: (v: unknown) => unknown) => {
  if (insertedValues) {
    return resolve([{ ...insertedRow, ...insertedValues }]);
  }
  return resolve(selectRows);
};

const select = vi.fn(() => chain);
const insert = vi.fn(() => chain);
vi.mock('@/lib/db', () => ({
  db: {
    select,
    insert,
  },
}));

let mockSession: { userId: string; email: string; role: string } | null = null;
vi.mock('@/lib/session', () => ({
  getServerSession: async () => mockSession,
}));

vi.mock('@/lib/posthog-server', () => ({
  identifyServer: vi.fn(),
  captureServerEvent: vi.fn(),
}));

const post = (body: unknown) =>
  new Request('http://localhost/api/leads/capture', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'content-type': 'application/json' },
  });

beforeEach(() => {
  selectRows = [];
  insertedValues = null;
  mockSession = null;
  select.mockClear();
  insert.mockClear();
});

describe('POST /api/leads/capture route validation (AC1)', () => {
  it('rejects malformed non-JSON payload with 400', async () => {
    const { POST } = await import('@/app/api/leads/capture/route');
    const badRequest = new Request('http://localhost/api/leads/capture', {
      method: 'POST',
      body: 'this is not json {',
      headers: { 'content-type': 'application/json' },
    });
    const res = await POST(badRequest);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('JSON');
  });

  it('rejects missing source_tool with 400', async () => {
    const { POST } = await import('@/app/api/leads/capture/route');
    const res = await POST(post({ email: 'client@example.com' }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Invalid request payload');
  });

  it('rejects invalid source_tool enum with 400', async () => {
    const { POST } = await import('@/app/api/leads/capture/route');
    const res = await POST(
      post({
        source_tool: 'unregistered_calc',
        email: 'client@example.com',
      })
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Invalid request payload');
  });

  it('rejects missing both email and whatsapp_number with 400', async () => {
    const { POST } = await import('@/app/api/leads/capture/route');
    const res = await POST(
      post({
        source_tool: 'tax_calculator',
        tool_input: { annualProfit: 200000 },
      })
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Invalid request payload');
  });

  it('rejects invalid email format with 400', async () => {
    const { POST } = await import('@/app/api/leads/capture/route');
    const res = await POST(
      post({
        source_tool: 'tax_calculator',
        email: 'not-an-email-address',
      })
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Invalid request payload');
  });

  it('rejects oversized tool_input (> 50KB) with 400', async () => {
    const { POST } = await import('@/app/api/leads/capture/route');
    const res = await POST(
      post({
        source_tool: 'tax_calculator',
        email: 'founder@example.com',
        tool_input: {
          payload: 'x'.repeat(55 * 1024),
        },
      })
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Invalid request payload');
  });

  it('rejects oversized tool_result (> 50KB) with 400', async () => {
    const { POST } = await import('@/app/api/leads/capture/route');
    const res = await POST(
      post({
        source_tool: 'tax_calculator',
        email: 'founder@example.com',
        tool_result: {
          payload: 'y'.repeat(55 * 1024),
        },
      })
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Invalid request payload');
  });
});

describe('POST /api/leads/capture success response & consent (AC1, AC4)', () => {
  it('accepts valid input and returns only lead ID', async () => {
    const { POST } = await import('@/app/api/leads/capture/route');
    const res = await POST(
      post({
        source_tool: 'tax_calculator',
        email: 'founder@example.com',
        tool_input: { annualProfit: 250000 },
        tool_result: { savings: 45000 },
      })
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    // Must return ONLY { lead: { id: ... } }
    expect(body).toEqual({ lead: { id: expect.any(String) } });
    expect(body.lead.email).toBeUndefined();
    expect(body.lead.whatsapp_number).toBeUndefined();
    expect(body.lead.persona_tag).toBeUndefined();
  });

  it('accepts valid input with whatsapp_number only', async () => {
    const { POST } = await import('@/app/api/leads/capture/route');
    const res = await POST(
      post({
        source_tool: 'visa_estimator',
        whatsapp_number: '+971501234567',
        tool_input: { employees: 3 },
      })
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ lead: { id: expect.any(String) } });
  });

  it('stores consent flag and exact consent wording in tool_input (AC4)', async () => {
    const { POST } = await import('@/app/api/leads/capture/route');
    await POST(
      post({
        source_tool: 'vat_scorer',
        email: 'cfo@company.ae',
        tool_input: {
          revenue: 500000,
          consent: true,
        },
      })
    );

    expect(insertedValues).not.toBeNull();
    const storedInput = insertedValues?.tool_input as Record<string, unknown>;
    expect(storedInput.consent).toBe(true);
    expect(storedInput.consent_text).toBe(CONSENT_TEXT);
  });
});

describe('POST /api/leads/capture auth-aware linking (AC3)', () => {
  it('links converted_user_id when authenticated session exists', async () => {
    mockSession = {
      userId: 'user-auth-uuid-888',
      email: 'signedin@company.com',
      role: 'client',
    };

    const { POST } = await import('@/app/api/leads/capture/route');
    const res = await POST(
      post({
        source_tool: 'qfzp_eligibility',
        tool_input: { activity: 'Tech', hasSubstance: true, consent: true },
      })
    );

    expect(res.status).toBe(200);
    expect(insertedValues?.converted_user_id).toBe('user-auth-uuid-888');
    expect(insertedValues?.email).toBe('signedin@company.com');
  });
});
