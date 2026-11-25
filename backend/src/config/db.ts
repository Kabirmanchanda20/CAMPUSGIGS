import pg from 'pg'
import { env } from './env.js'

const { Pool } = pg

export const pool = new Pool({
  connectionString: env.DATABASE_URL,
  ssl: env.DATABASE_URL.includes('localhost') ? false : { rejectUnauthorized: false },
  max: 20,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 8_000,
})

// Handle idle client errors so unexpected connection drops (e.g. Supabase pooler resets) don't crash Node
pool.on('error', (err) => {
  console.error('[DB Pool] Unexpected error on idle client:', err.message)
})

export async function query<T extends pg.QueryResultRow = pg.QueryResultRow>(
  text: string,
  params?: unknown[],
) {
  return pool.query<T>(text, params)
}
