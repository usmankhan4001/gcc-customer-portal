import path from 'node:path';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

// Route handlers call cookies() from next/headers, which only exists inside a Next request.
vi.mock('next/headers', () => ({ cookies: async () => ({ get: () => undefined, set: () => {} }) }));

const adminUrl = process.env.DATABASE_URL_TEST!;
const dbName = `gcc_it_${Date.now()}`;
const testUrl = adminUrl.replace(/\/[^/]*$/, `/${dbName}`);
let admin: postgres.Sql;
let client: postgres.Sql;

beforeAll(async () => {
  admin = postgres(adminUrl, { max: 1 });
  await admin.unsafe(`CREATE DATABASE ${dbName}`);
  client = postgres(testUrl, { max: 5 });
  // The whole committed migration chain on an empty database: what a fresh deploy does.
  await migrate(drizzle(client), { migrationsFolder: path.resolve(__dirname, '../../drizzle') });
  process.env.DATABASE_URL = testUrl; // src/lib/db reads this when first imported
});

afterAll(async () => {
  await client?.end();
  await admin?.unsafe(`DROP DATABASE IF EXISTS ${dbName} WITH (FORCE)`);
  await admin?.end();
});

describe('migrations', () => {
  it('apply cleanly from scratch and create the tables the code relies on', async () => {
    const rows = await client`select table_name from information_schema.tables where table_schema = 'public'`;
    const names = rows.map((r) => r.table_name);
    for (const t of ['users', 'companies', 'orders', 'documents', 'leads', 'otp_codes', 'processed_webhook_events']) {
      expect(names).toContain(t);
    }
    const cols = await client`select column_name from information_schema.columns where table_name = 'otp_codes'`;
    expect(cols.map((c) => c.column_name)).toContain('attempts');
  });

  it('are idempotent: running the chain again changes nothing', async () => {
    await expect(migrate(drizzle(client), { migrationsFolder: path.resolve(__dirname, '../../drizzle') })).resolves.not.toThrow();
  });
});

describe('webhook dedupe against real Postgres', () => {
  it('lets exactly one of many concurrent deliveries claim an event', async () => {
    const { claimWebhookEvent, releaseWebhookEvent } = await import('@/lib/webhook-dedupe');
    const results = await Promise.all(Array.from({ length: 12 }, () => claimWebhookEvent('stripe', 'evt_race')));
    expect(results.filter(Boolean)).toHaveLength(1);
    await releaseWebhookEvent('stripe', 'evt_race');
    expect(await claimWebhookEvent('stripe', 'evt_race')).toBe(true); // released claim can be retried
  });
});

describe('verify-otp against real Postgres', () => {
  const phone = '+971500000777';
  const call = async (otp: string) => {
    const { POST } = await import('@/app/api/auth/verify-otp/route');
    return POST(new Request('http://localhost/api/auth/verify-otp', { method: 'POST', body: JSON.stringify({ phone, otp }), headers: { 'content-type': 'application/json' } }));
  };
  const seedCode = async (code: string) => {
    const { hashToken } = await import('@/lib/auth');
    await client`delete from otp_codes where whatsapp_number = ${phone}`;
    await client`insert into otp_codes (whatsapp_number, otp_hash, expires_at) values (${phone}, ${hashToken(code)}, now() + interval '10 minutes')`;
  };

  it('consumes a code exactly once under concurrent submissions', async () => {
    await seedCode('482913');
    const res = await Promise.all(Array.from({ length: 6 }, () => call('482913')));
    expect(res.filter((r) => r.status === 200)).toHaveLength(1);
    expect(res.filter((r) => r.status === 400)).toHaveLength(5);
  });

  it('locks a code after 5 wrong attempts, even for the right code', async () => {
    await seedCode('135790');
    for (let i = 0; i < 5; i++) expect((await call('000000')).status).toBe(400);
    expect((await call('135790')).status).toBe(429);
  });
});
