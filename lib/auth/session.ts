import { redirect } from "next/navigation";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { canManageUsers, canViewAudit, isStaff, isSuperAdmin } from "@/lib/auth/roles";
import type { AuthUser, Profile, RoleName } from "@/lib/auth/types";

function resolveRoleName(profile: { role?: unknown }): RoleName {
  const roleRelation = profile.role as
    | { name?: string }
    | { name?: string }[]
    | null
    | undefined;
  const roleName = Array.isArray(roleRelation)
    ? roleRelation[0]?.name
    : roleRelation?.name;
  return (roleName ?? "MEMBER") as RoleName;
}

async function clearAuthSession() {
  try {
    const supabase = await createClient();
    await supabase.auth.signOut();
  } catch {
    // Best-effort; cookie refresh may be unavailable in some RSC contexts.
  }
}

/**
 * Verifies the Auth JWT via the cookie client, then loads the profile with the
 * service role to avoid recursive RLS issues on `profiles`.
 */
export async function getAuthUser(): Promise<AuthUser | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const admin = createAdminClient();
  const { data: profile, error } = await admin
    .from("profiles")
    .select("*, role:roles(id, name, description)")
    .eq("id", user.id)
    .maybeSingle();

  // Stale auth cookie without a usable profile causes /login ↔ /dashboard loops.
  if (error || !profile) {
    await clearAuthSession();
    return null;
  }
  if (profile.is_active === false) {
    await clearAuthSession();
    return null;
  }

  return {
    id: user.id,
    email: user.email ?? profile.email,
    profile: profile as Profile,
    role: resolveRoleName(profile),
  };
}

export async function requireAuth(): Promise<AuthUser> {
  const user = await getAuthUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireStaff(): Promise<AuthUser> {
  const user = await requireAuth();
  if (!isStaff(user.role)) redirect("/");
  return user;
}

export async function requireSuperAdmin(): Promise<AuthUser> {
  const user = await requireAuth();
  if (!isSuperAdmin(user.role)) redirect("/dashboard");
  return user;
}

export async function requireUserManager(): Promise<AuthUser> {
  const user = await requireAuth();
  if (!canManageUsers(user.role)) redirect("/dashboard");
  return user;
}

export async function requireAuditViewer(): Promise<AuthUser> {
  const user = await requireAuth();
  if (!canViewAudit(user.role)) redirect("/dashboard");
  return user;
}
