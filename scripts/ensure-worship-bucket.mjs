import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

for (const line of readFileSync(".env.local", "utf8").split(/\r?\n/)) {
  const m = line.match(/^([^#=]+)=(.*)$/);
  if (!m) continue;
  process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, "");
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const s = createClient(url, key);

const listed = await s.storage.listBuckets();
console.log(
  "existing:",
  (listed.data || []).map((b) => b.name).join(", ") || "(none)"
);

const create = await s.storage.createBucket("worship-media", {
  public: true,
  fileSizeLimit: 50 * 1024 * 1024,
});
console.log("create worship-media:", create.error?.message || "ok");

const listed2 = await s.storage.listBuckets();
console.log(
  "after:",
  (listed2.data || []).map((b) => b.name).join(", ")
);
