import fs from "fs";

const text = fs.readFileSync(".env.local", "utf8");
function get(key) {
  const line = text.split(/\r?\n/).find((l) => l.startsWith(key + "="));
  if (!line) return null;
  let v = line.slice(key.length + 1).trim();
  if (
    (v.startsWith('"') && v.endsWith('"')) ||
    (v.startsWith("'") && v.endsWith("'"))
  ) {
    v = v.slice(1, -1);
  }
  return v;
}

const supabaseUrl = get("NEXT_PUBLIC_SUPABASE_URL");
const dbUrl = get("DATABASE_URL");
console.log("SUPABASE_URL:", supabaseUrl);
console.log("DATABASE_URL has [region] placeholder:", /\[region\]/i.test(dbUrl || ""));
console.log("DATABASE_URL host sample:", (dbUrl || "").replace(/:[^:@]+@/, ":***@").slice(0, 80));
