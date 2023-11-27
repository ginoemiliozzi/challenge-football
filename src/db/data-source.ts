import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'

// Creates the DB connection pool and returns it
export default function () {
  const pool = new Pool({
    connectionString: process.env.DB_URL,
  })

  return drizzle(pool)
}
