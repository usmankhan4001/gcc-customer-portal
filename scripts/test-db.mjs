#!/usr/bin/env node
// Runs the real-Postgres tests. Uses DATABASE_URL_TEST, defaulting to the docker-compose.dev.yml database.
import { spawnSync } from 'node:child_process';

const url = process.env.DATABASE_URL_TEST || 'postgresql://gcc:gcc@localhost:55432/gccstartup';
const r = spawnSync('npx', ['vitest', 'run', '--config', 'vitest.integration.config.ts'], {
  stdio: 'inherit',
  shell: true,
  env: { ...process.env, DATABASE_URL_TEST: url, DATABASE_URL: url },
});
process.exit(r.status ?? 1);
