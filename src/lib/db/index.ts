import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

// This will crash if DATABASE_URL is not set, which is expected for prod, 
// but we handle it gracefully if missing during build time.
const sql = neon(process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/postgres');
export const db = drizzle(sql, { schema });
