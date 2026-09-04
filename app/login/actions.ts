"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { writeAuditLog } from "@/lib/audit/log";

export type LoginState = { error?: string } | null;

export async function loginAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");
  const next = String(formData.get("next") || "/dashboard");

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error || !data.user) {
    return { error: "Invalid email or password." };
  }

  const { createAdminClient } = await import("@/lib/supabase/server");
  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("id, role:roles(name)")
    .eq("id", data.user.id)
    .maybeSingle();

  // is_active may be missing until auth migration is applied
  const { data: activeCheck } = await admin
    .from("profiles")
    .select("is_active")
    .eq("id", data.user.id)
    .maybeSingle();

  const roleRelation = profile?.role as { name?: string } | { name?: string }[] | null | undefined;
  const roleName = Array.isArray(roleRelation)
    ? roleRelation[0]?.name
    : roleRelation?.name;
  const inactive = activeCheck?.is_active === false;

  if (inactive) {
    await supabase.auth.signOut();
    return { error: "This account has been deactivated. Contact a Super Admin." };
  }

  await writeAuditLog({
    actorId: data.user.id,
    action: "login",
    entityType: "session",
    entityId: data.user.id,
    summary: `${email} signed in`,
    metadata: { role: roleName ?? null },
  });

  const staff = roleName === "SUPER_ADMIN" || roleName === "ADMIN" || roleName === "EDITOR";
  redirect(staff ? (next || "/dashboard") : "/");
}

export async function logoutAction() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    await writeAuditLog({
      actorId: user.id,
      action: "logout",
      entityType: "session",
      entityId: user.id,
      summary: "Signed out",
    });
  }
  await supabase.auth.signOut();
  redirect("/login");
}
