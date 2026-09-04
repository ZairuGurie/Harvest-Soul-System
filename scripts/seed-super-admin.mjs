/**
 * Seeds the Harvest Souls Super Admin account into Supabase Auth + profiles.
 *
 * Default credentials (change after first login):
 *   Email:    superadmin@harvestsoulschurch.org
 *   Password: HarvestSouls!SuperAdmin2026
 *
 * Override with env:
 *   SUPER_ADMIN_EMAIL / SUPER_ADMIN_PASSWORD / SUPER_ADMIN_NAME
 */
import { createClient } from "@supabase/supabase-js";
import { loadEnvLocal, requireEnv } from "./lib/env.mjs";

loadEnvLocal();

const EMAIL = process.env.SUPER_ADMIN_EMAIL || "superadmin@harvestsoulschurch.org";
const PASSWORD = process.env.SUPER_ADMIN_PASSWORD || "HarvestSouls!SuperAdmin2026";
const NAME = process.env.SUPER_ADMIN_NAME || "Harvest Souls Super Admin";

function createAdmin() {
  return createClient(requireEnv("SUPABASE_URL"), requireEnv("SUPABASE_SERVICE_ROLE_KEY"), {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

async function ensureSuperAdminRole(sb) {
  const { data: existing } = await sb.from("roles").select("id,name").eq("name", "SUPER_ADMIN").maybeSingle();
  if (existing) return existing.id;

  const { data, error } = await sb
    .from("roles")
    .insert({ name: "SUPER_ADMIN", description: "Full system control" })
    .select("id")
    .single();
  if (error) throw error;
  return data.id;
}

async function findAuthUserByEmail(sb, email) {
  let page = 1;
  const perPage = 200;
  while (true) {
    const { data, error } = await sb.auth.admin.listUsers({ page, perPage });
    if (error) throw error;
    const found = data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
    if (found) return found;
    if (data.users.length < perPage) return null;
    page += 1;
  }
}

async function main() {
  const sb = createAdmin();
  const roleId = await ensureSuperAdminRole(sb);

  let user = await findAuthUserByEmail(sb, EMAIL);
  if (!user) {
    const { data, error } = await sb.auth.admin.createUser({
      email: EMAIL,
      password: PASSWORD,
      email_confirm: true,
      user_metadata: { full_name: NAME, role: "SUPER_ADMIN" },
    });
    if (error) throw error;
    user = data.user;
    console.log("Created auth user:", EMAIL);
  } else {
    await sb.auth.admin.updateUserById(user.id, {
      password: PASSWORD,
      email_confirm: true,
      user_metadata: { full_name: NAME, role: "SUPER_ADMIN" },
    });
    console.log("Updated existing auth user:", EMAIL);
  }

  const profilePayload = {
    id: user.id,
    email: EMAIL,
    display_name: NAME,
    role_id: roleId,
    is_active: true,
    updated_at: new Date().toISOString(),
  };

  const { error: upsertError } = await sb.from("profiles").upsert(profilePayload, { onConflict: "id" });
  if (upsertError) {
    // Fallback if is_active column not migrated yet
    if (/is_active|birthday|created_by/i.test(upsertError.message)) {
      const { error: basicError } = await sb.from("profiles").upsert(
        {
          id: user.id,
          email: EMAIL,
          display_name: NAME,
          role_id: roleId,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "id" }
      );
      if (basicError) throw basicError;
      console.warn(
        "Profile saved without is_active/birthday columns. Run supabase/migrations/20260302120000_auth_roles_audit.sql in the SQL Editor."
      );
    } else {
      throw upsertError;
    }
  } else {
    console.log("Upserted Super Admin profile.");
  }

  console.log("\n=== Super Admin credentials ===");
  console.log("Email:   ", EMAIL);
  console.log("Password:", PASSWORD);
  console.log("Login at: /login → /dashboard");
  console.log("Change this password after first login.");
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
