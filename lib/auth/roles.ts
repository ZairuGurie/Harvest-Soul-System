import type { RoleName } from "./types";

export const STAFF_ROLES: RoleName[] = ["SUPER_ADMIN", "ADMIN", "EDITOR"];
export const DASHBOARD_ROLES: RoleName[] = ["SUPER_ADMIN", "ADMIN", "EDITOR"];

export function isSuperAdmin(role: RoleName | string | null | undefined) {
  return role === "SUPER_ADMIN";
}

export function isStaff(role: RoleName | string | null | undefined) {
  return role === "SUPER_ADMIN" || role === "ADMIN" || role === "EDITOR";
}

export function canManageUsers(role: RoleName | string | null | undefined) {
  return role === "SUPER_ADMIN";
}

export function canViewAudit(role: RoleName | string | null | undefined) {
  return role === "SUPER_ADMIN";
}

export function roleLabel(role: RoleName | string | null | undefined) {
  switch (role) {
    case "SUPER_ADMIN":
      return "Super Admin";
    case "ADMIN":
      return "Admin";
    case "EDITOR":
      return "Editor";
    case "WORSHIP_LEADER":
      return "Worship Leader";
    case "MEMBER":
      return "Member";
    case "GUEST":
      return "Guest";
    default:
      return "User";
  }
}
