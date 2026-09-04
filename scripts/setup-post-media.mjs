/**
 * Ensures post-media storage bucket exists (service role).
 * For post_id column + storage policies, run:
 *   supabase/migrations/20260304120000_post_media.sql
 * in the Supabase SQL Editor when DATABASE_URL is unavailable.
 */
import { createClient } from "@supabase/supabase-js";
import { loadEnvLocal, requireEnv } from "./lib/env.mjs";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

loadEnvLocal();

const BUCKET = "post-media";
const ALLOWED = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "video/mp4",
  "video/webm",
  "video/quicktime",
];

async function ensureBucket() {
  const sb = createClient(requireEnv("SUPABASE_URL"), requireEnv("SUPABASE_SERVICE_ROLE_KEY"), {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: buckets, error: listError } = await sb.storage.listBuckets();
  if (listError) throw listError;

  const exists = (buckets ?? []).some((b) => b.id === BUCKET || b.name === BUCKET);
  if (!exists) {
    const { error } = await sb.storage.createBucket(BUCKET, {
      public: true,
      fileSizeLimit: 52428800,
      allowedMimeTypes: ALLOWED,
    });
    if (error) throw error;
    console.log("Created storage bucket:", BUCKET);
  } else {
    console.log("Storage bucket already exists:", BUCKET);
  }

  // Probe whether media.post_id exists
  const { error: colError } = await sb.from("media").select("post_id").limit(1);
  if (colError && /post_id|column/i.test(colError.message)) {
    console.warn(
      "\nmedia.post_id is missing. Run this SQL in Supabase SQL Editor:\n  supabase/migrations/20260304120000_post_media.sql\n"
    );
    return false;
  }
  console.log("media.post_id column is ready.");
  return true;
}

async function trySqlMigration() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl || databaseUrl.includes("[YOUR-PASSWORD]") || databaseUrl.includes("[region]")) {
    return false;
  }
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const sqlPath = path.resolve(__dirname, "../supabase/migrations/20260304120000_post_media.sql");
  const sql = fs.readFileSync(sqlPath, "utf8");
  const pg = await import("pg");
  const client = new pg.default.Client({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();
  try {
    await client.query(sql);
    console.log("Applied post media SQL migration via DATABASE_URL.");
  } finally {
    await client.end();
  }
  return true;
}

async function main() {
  await trySqlMigration().catch((err) => {
    console.warn("SQL via DATABASE_URL skipped/failed:", err.message || err);
    return false;
  });
  const ready = await ensureBucket();
  if (!ready) process.exitCode = 2;
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
