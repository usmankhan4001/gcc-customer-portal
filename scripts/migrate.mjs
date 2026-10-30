#!/usr/bin/env node
// Runs the committed drizzle migrations at container start (see docker-entrypoint.sh).
// Runtime-only deps (drizzle-orm, postgres), so it works in the slim standalone image without drizzle-kit.
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('migrate: DATABASE_URL is not set');
  process.exit(1);
}

const sql = postgres(url, { max: 1 });
try {
  await migrate(drizzle(sql), { migrationsFolder: process.env.MIGRATIONS_DIR || './drizzle' });
  console.log('migrate: all migrations applied');
} catch (err) {
  console.error(`migrate: FAILED: ${err?.message ?? err}`);
  const code = err?.cause?.code ?? err?.code; // postgres-js puts the SQLSTATE on cause
  if (code === '42P07' || code === '42710' || /already exists/i.test(String(err?.message))) {
    console.error('migrate: tables already exist but the migration history is missing or behind. The database was created outside drizzle migrations and must be baselined (node scripts/baseline.mjs <N>, see docs/ops/DEPLOY.md) before this image can start.');
  }
  process.exitCode = 1;
} finally {
  await sql.end();
}
