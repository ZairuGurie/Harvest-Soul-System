import fs from "fs";
import pg from "pg";

function loadEnv(path) {
  const text = fs.readFileSync(path, "utf8");
  for (const line of text.split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)\s*=\s*(.*)$/);
    if (!m) continue;
    let v = m[2].trim();
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    ) {
      v = v.slice(1, -1);
    }
    v = v.replace(/^\uFEFF/, "").trim();
    if (!process.env[m[1]]) process.env[m[1]] = v;
  }
}

/** Parse postgres URL without using WHATWG URL (passwords often break it). */
function parseDatabaseUrl(raw) {
  const url = raw.trim();
  const m = url.match(
    /^(postgres(?:ql)?):\/\/([^:/?#]+):([^@]*)@([^:/?#]+)(?::(\d+))?\/([^?#]*)/i
  );
  if (!m) {
    throw new Error("Could not parse DATABASE_URL into connection parts");
  }
  return {
    user: decodeURIComponent(m[2]),
    password: decodeURIComponent(m[3]),
    host: m[4],
    port: Number(m[5] || 5432),
    database: decodeURIComponent((m[6] || "postgres").replace(/^\//, "")),
    ssl: { rejectUnauthorized: false },
  };
}

loadEnv(".env.local");
const raw = (process.env.DATABASE_URL || "").trim();
if (!raw) {
  console.error("Missing DATABASE_URL");
  process.exit(1);
}

const config = parseDatabaseUrl(raw);
console.log("Connecting to", config.host, "db:", config.database, "as", config.user);

const files = [
  "supabase/migrations/20260910121000_stand_firm_game.sql",
  "supabase/migrations/20260911120000_stand_firm_expansion.sql",
];

const client = new pg.Client(config);
await client.connect();
console.log("Connected to database");

for (const file of files) {
  const sql = fs.readFileSync(file, "utf8");
  console.log(`Applying ${file}...`);
  try {
    await client.query(sql);
    console.log(`OK ${file}`);
  } catch (err) {
    console.error(`FAILED ${file}:`, err.message);
    await client.end();
    process.exit(1);
  }
}

const check = await client.query(`
  select
    to_regclass('public.game_progress') as game_progress,
    to_regclass('public.game_profiles') as game_profiles,
    (select count(*)::int from public.game_scenarios) as scenarios,
    (select count(*)::int from public.game_choices) as choices
`);
console.log("Verify:", check.rows[0]);
await client.end();
console.log("Done");
