import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { loadEnvLocal } from './lib/env.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export async function ensureBibleSchema() {
  loadEnvLocal()

  const migrationPath = path.resolve(__dirname, '../supabase/migrations/20260302000000_bible_schema.sql')
  const sql = fs.readFileSync(migrationPath, 'utf8')
  const databaseUrl = process.env.DATABASE_URL

  if (!databaseUrl) {
    throw new Error(
      'DATABASE_URL is not set. Add it to .env.local, run `npm run bible:setup`, or paste the SQL in Supabase SQL Editor.',
    )
  }

  const pg = await import('pg')
  const client = new pg.default.Client({ connectionString: databaseUrl, ssl: { rejectUnauthorized: false } })
  await client.connect()
  try {
    await client.query(sql)
    console.log('Bible schema is ready.')
  } finally {
    await client.end()
  }
}
