import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

const connectionString = process.env.DATABASE_URL!

// Singleton pattern — one connection for the entire app
let client: ReturnType<typeof postgres> | null = null
let db: ReturnType<typeof drizzle<typeof schema>> | null = null

export function getDb() {
  if (!db) {
    client = postgres(connectionString)
    db = drizzle(client, { schema })
  }
  return db
}

export { schema }
export type Database = ReturnType<typeof getDb>
