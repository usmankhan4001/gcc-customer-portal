import path from 'node:path';
import { defineConfig } from 'vitest/config';

// Real-Postgres tests. Needs DATABASE_URL_TEST (docker compose -f docker-compose.dev.yml up -d, then npm run test:db).
export default defineConfig({
  resolve: { alias: { '@': path.resolve(__dirname, 'src') } },
  test: {
    environment: 'node',
    include: ['tests/integration/**/*.test.ts'],
    fileParallelism: false,
    testTimeout: 30000,
    env: { JWT_SECRET: 'test-secret-not-for-production' },
  },
});
