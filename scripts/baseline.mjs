#!/usr/bin/env node
// One-off, for a database created outside drizzle migrations (tables exist, no history):
// records the first N committed migrations as already applied WITHOUT running them, so migrate.mjs only runs the rest.
// Usage: DATABASE_URL=... node scripts/baseline.mjs <N>   (N = how many migrations the database already contains)
//        node scripts/baseline.mjs <N> --sql              (no connection: prints SQL to paste into psql / a DB terminal)
// Check first which migrations are really present (see docs/ops/DEPLOY.md), then run this once.
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import postgres from 'postgres';

const n = Number(process.argv[2]);
const printSql = process.argv.includes('--sql');
const url = process.env.DATABASE_URL;
const dir = process.env.MIGRATIONS_DIR || './drizzle';
if ((!url && !printSql) || !Number.isInteger(n) || n < 0) {
  console.error('usage: DATABASE_URL=... node scripts/baseline.mjs <N> [--sql]');
  process.exit(1);
}

const journal = JSON.parse(fs.readFileSync(path.join(dir, 'meta', '_journal.json'), 'utf8'));
if (n > journal.entries.length) {
  console.error(`baseline: N=${n} but only ${journal.entries.length} migrations exist`);
  process.exit(1);
}
const entries = journal.entries.slice(0, n);
const hashOf = (tag) => crypto.createHash('sha256').update(fs.readFileSync(path.join(dir, `${tag}.sql`), 'utf8')).digest('hex');

if (printSql) {
  const guard = "do $$ begin if (select count(*) from drizzle.__drizzle_migrations) > 0 then raise exception 'history already has rows; refusing to baseline'; end if; end $$;";
  const lines = [
    'begin;',
    'create schema if not exists drizzle;',
    'create table if not exists drizzle.__drizzle_migrations (id serial primary key, hash text not null, created_at bigint);',
    guard,
    ...entries.map((e) => `insert into drizzle.__drizzle_migrations (hash, created_at) values ('${hashOf(e.tag)}', ${e.when}); -- ${e.tag}`),
    'commit;',
  ];
  console.log(lines.join('\n'));
  process.exit(0);
}

const sql = postgres(url, { max: 1, onnotice: () => {} });
try {
  await sql`create schema if not exists drizzle`;
  await sql`create table if not exists drizzle.__drizzle_migrations (id serial primary key, hash text not null, created_at bigint)`;
  const [{ count }] = await sql`select count(*)::int as count from drizzle.__drizzle_migrations`;
  if (count > 0) throw new Error(`history already has ${count} rows; refusing to baseline`);
  for (const e of entries) {
    await sql`insert into drizzle.__drizzle_migrations (hash, created_at) values (${hashOf(e.tag)}, ${e.when})`;
    console.log(`baseline: marked ${e.tag} as applied`);
  }
} catch (err) {
  console.error(`baseline: FAILED: ${err.message}`);
  process.exitCode = 1;
} finally {
  await sql.end();
}
