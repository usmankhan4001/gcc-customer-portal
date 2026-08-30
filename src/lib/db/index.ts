import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from './schema';

// This will crash if DATABASE_URL is not set, which is expected for prod,
// but we handle it gracefully if missing during build time.
const client = postgres(process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/postgres');
export const db = drizzle(client, { schema });
