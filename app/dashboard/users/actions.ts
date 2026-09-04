"use server";

import { revalidatePath } from "next/cache";
import { requireSuperAdmin } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/server";
import { writeAuditLog } from "@/lib/audit/log";

export type UserActionState = { error?: string; success?: string } | null;

const SCHEMA_HINT =
  "Run this SQL in Supabase → SQL Editor: supabase/migrations/20260304140000_profiles_birthday_columns.sql";

function isMissingProfileColumnError(message: string) {
  return /birthday|is_active|created_by|schema cache|column .* does not exist/i.test(message);
}

async function getRoleId(name: string) {
  const admin = createAdminClient();
  const { data, error } = await admin.from("roles").select("id").eq("name", name).single();
  if (error || !data) throw new Error(`Role ${name} not found`);
  return data.id;
}

/** Returns true when profiles.birthday exists. */
export async function profilesBirthdayReady(): Promise<boolean> {
  const admin = createAdminClient();
  const { error } = await admin.from("profiles").select("birthday").limit(1);
  return !error;
}

export async function createAdminUser(
  _prev: UserActionState,
  formData: FormData
): Promise<UserActionState> {
  const actor = await requireSuperAdmin();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");
  const displayName = String(formData.get("display_name") || "").trim();
  const birthday = String(formData.get("birthday") || "").trim() || null;
  const roleName = String(formData.get("role") || "ADMIN");

  if (!email || !password || !displayName) {
    return { error: "Name, email, and password are required." };
  }
  if (password.length < 10) {
    return { error: "Password must be at least 10 characters." };
  }
  if (!["ADMIN", "EDITOR", "MEMBER"].includes(roleName)) {
    return { error: "Invalid role. Super Admin can only create Admin, Editor, or Member." };
  }

  const admin = createAdminClient();
  const roleId = await getRoleId(roleName);

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: displayName, role: roleName },
  });

  if (createError || !created.user) {
    return { error: createError?.message || "Failed to create user." };
  }

  const baseProfile = {
    id: created.user.id,
    email,
    display_name: displayName,
    role_id: roleId,
    updated_at: new Date().toISOString(),
  };

  const fullProfile = {
    ...baseProfile,
    birthday,
    is_active: true,
    created_by: actor.id,
  };

  let { error: profileError } = await admin.from("profiles").upsert(fullProfile);

  if (profileError && isMissingProfileColumnError(profileError.message)) {
    const fallback = await admin.from("profiles").upsert(baseProfile);
    if (fallback.error) {
      return { error: fallback.error.message };
    }
    await writeAuditLog({
      actorId: actor.id,
      action: "create",
      entityType: "user",
      entityId: created.user.id,
      summary: `Created ${roleName} account for ${email} (birthday columns missing)`,
      metadata: { role: roleName, email },
    });
    revalidatePath("/dashboard/users");
    return {
      error: `Account was created, but birthday could not be saved. ${SCHEMA_HINT}`,
    };
  }

  if (profileError) {
    return { error: profileError.message };
  }

  await writeAuditLog({
    actorId: actor.id,
    action: "create",
    entityType: "user",
    entityId: created.user.id,
    summary: `Created ${roleName} account for ${email}`,
    metadata: { role: roleName, email },
  });

  revalidatePath("/dashboard/users");
  revalidatePath("/dashboard/stats");
  revalidatePath("/");
  return { success: `${roleName} account created for ${email}.` };
}

export async function updateUser(
  _prev: UserActionState,
  formData: FormData
): Promise<UserActionState> {
  const actor = await requireSuperAdmin();
  const userId = String(formData.get("user_id") || "");
  const displayName = String(formData.get("display_name") || "").trim();
  const roleName = String(formData.get("role") || "");
  const birthday = String(formData.get("birthday") || "").trim() || null;
  const isActive = formData.get("is_active") === "on" || formData.get("is_active") === "true";

  if (!userId || !displayName || !roleName) {
    return { error: "Missing required fields." };
  }
  if (!["SUPER_ADMIN", "ADMIN", "EDITOR", "MEMBER", "WORSHIP_LEADER"].includes(roleName)) {
    return { error: "Invalid role." };
  }

  const admin = createAdminClient();

  if (userId === actor.id && roleName !== "SUPER_ADMIN") {
    return { error: "You cannot remove your own Super Admin role." };
  }

  const roleId = await getRoleId(roleName);
  const fullUpdate = {
    display_name: displayName,
    role_id: roleId,
    birthday,
    is_active: isActive,
    updated_at: new Date().toISOString(),
  };

  let { error } = await admin.from("profiles").update(fullUpdate).eq("id", userId);

  if (error && isMissingProfileColumnError(error.message)) {
    const fallback = await admin
      .from("profiles")
      .update({
        display_name: displayName,
        role_id: roleId,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);

    if (fallback.error) return { error: fallback.error.message };

    revalidatePath("/dashboard/users");
    return {
      error: `Name/role saved, but birthday needs the database column. ${SCHEMA_HINT}`,
    };
  }

  if (error) return { error: error.message };

  await writeAuditLog({
    actorId: actor.id,
    action: "update",
    entityType: "user",
    entityId: userId,
    summary: `Updated user ${displayName} (${roleName})`,
    metadata: { role: roleName, is_active: isActive },
  });

  revalidatePath("/dashboard/users");
  revalidatePath("/");
  return { success: "User updated." };
}
