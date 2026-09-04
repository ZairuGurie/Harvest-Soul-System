import { loadEnvLocal, requireEnv } from "./lib/env.mjs";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

loadEnvLocal();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function runWithPg(sql) {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl || databaseUrl.includes("[YOUR-PASSWORD]") || databaseUrl.includes("[region]")) {
    throw new Error(
      "DATABASE_URL is missing or still a placeholder. Run the SQL file in Supabase SQL Editor, or set a real DATABASE_URL."
    );
  }
  const pg = await import("pg");
  const client = new pg.default.Client({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();
  try {
    await client.query(sql);
  } finally {
    await client.end();
  }
}

export async function ensureAuthSchema() {
  const sqlPath = path.resolve(
    __dirname,
    "../supabase/migrations/20260302120000_auth_roles_audit.sql"
  );
  const sql = fs.readFileSync(sqlPath, "utf8");
  await runWithPg(sql);
  console.log("Auth/roles/audit schema applied.");
}

if (import.meta.url === `file://${process.argv[1].replace(/\\/g, "/")}` || process.argv[1]?.endsWith("setup-auth-schema.mjs")) {
  ensureAuthSchema().catch((err) => {
    console.error(err.message || err);
    process.exit(1);
  });
}
